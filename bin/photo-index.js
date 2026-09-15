#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/*
  photo-index -- stage 1 of the wedding photo picker.

  Builds a manifest of every original across the img/wed* dirs: capture time, camera,
  photographer, dimensions, plus a small thumbnail cache so a browser can actually
  show 500+ frames that are 20-40MB each.

  The hard part is that the cameras disagree about what time it is.  One dir is
  trusted (the paid photographer's, corroborated against the post's own timeline
  notes); the others are corrected against it by cross-correlating how densely each
  camera was shooting.  A wedding has unmistakable bursts -- ceremony, cake, first
  dance -- so sliding one camera's shot-density curve against the reference until it
  lines up recovers the offset without anyone identifying a single photo by hand.

  One camera's clock is beyond saving (dead coin cell: it resets to ~17:00:00 on
  every power-on, so even the relative intervals are garbage).  That one is flagged
  `broken` and ordered by filename sequence alone, for the UI to anchor by hand.

  Writes .photo-cache/manifest.json.  Re-running is cheap: thumbnails already built
  are left alone, so it's safe to interrupt.

  Usage:  bin/photo-index [--src DIR] [--force-thumbs] [--quiet]

    --src DIR   where the wed* folders live (default: <repo>/img).  Point this at a
                NAS mirror after clearing the originals out of the repo.
*/

const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
// Originals normally live in the repo, but they are bulky and get cleared out once
// they're safely on archive.org + a NAS.  --src re-points the scan at wherever they
// ended up, without moving the manifest, thumb cache or your picks.
const src_arg = Deno.args.indexOf('--src')
const IMG = src_arg === -1
  ? `${REPO}/img`
  : (Deno.args[src_arg + 1] ?? '').replace(/\/$/, '')
const CACHE = `${REPO}/.photo-cache`
const THUMBS = `${CACHE}/thumbs`
const LARGE = `${CACHE}/large`
const MANIFEST = `${CACHE}/manifest.json`

// Two tiers.  The small one keeps a 500-frame grid scrollable; the large one is what
// you actually judge a photo on -- and the real job is choosing between two nearly
// identical frames, which needs enough resolution to see who blinked.  Serving the
// originals instead is not an option: they are 20-40MB each.
// This cache is disposable, so it is sized for the eye rather than for disk.
const THUMB_PX = 400
const LARGE_PX = 1800
const THUMB_JOBS = 8
const EXIF_BATCH = 200

// Who shot what, keyed by directory.  `reference` is the one camera whose clock we
// trust: the only person paid to be there for the whole event, and her stamps line
// up with the timeline notes in the post (cake cut ~9:19pm == DSC_0053 @ 21:19:33).
// Everyone else shot part of the day, so a short roll is expected, not suspicious.
const PHOTOGRAPHERS = {
  wed: {
    who: 'Reenie Raschke',
    note: 'paid professional -- full event, plus a few setup shots and one the day before',
    reference: true,
  },
  'wed-bokeh': {
    who: 'Russ',
    note: 'brother, professional A/V + photographer; Russian swirly-bokeh lens '
      + '(manual, optical -- not a digital effect), so likely out for only part of the day',
  },
  'wed-mom': { who: 'Mom', note: 'her parents were professional photographers' },
  'wed-nikon': { who: "Russ's spare (Nikon)", note: 'shot by Russ + two sisters' },
  'wed-canon': { who: "Russ's spare (Canon)", note: 'previews only so far -- 720x480' },
  'wed-misc': {
    who: 'Friends + selfies',
    note: 'two biker friends on phones (network-synced clocks, so trustworthy); '
      + 'three selfies with no EXIF at all, placed by hand',
  },
}

// The formal event ran roughly 5pm-10pm, with setup shots before and a few after.
// Widened generously: this only has to exclude the absurd, not police the edges --
// a camera can legitimately stop early (battery, or its owner just stopped).
const EVENT_HOURS = [17, 22]
const GRACE_BEFORE_H = 7
const GRACE_AFTER_H = 3
// below this share of a roll inside the window, the clock is taken to be wrong
const INSIDE_OK = 0.9

const quiet = Deno.args.includes('--quiet')
const force_thumbs = Deno.args.includes('--force-thumbs')
const say = (...a) => { if (!quiet) console.log(...a) }


/** @param {string[]} cmd @returns {Promise<{ok: boolean, out: string, err: string}>} */
async function run(cmd) {
  const p = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: 'piped',
    stderr: 'piped',
  })
  const { success, stdout, stderr } = await p.output()
  return {
    ok: success,
    out: new TextDecoder().decode(stdout),
    err: new TextDecoder().decode(stderr),
  }
}


/** Run `fn` over `items` with at most `n` in flight. */
async function pool(items, n, fn) {
  const queue = [...items]
  let done = 0
  const worker = async () => {
    for (let it = queue.shift(); it !== undefined; it = queue.shift()) {
      await fn(it)
      done += 1
      if (!quiet && done % 25 === 0)
        console.log(`    ${done}/${items.length}`)
    }
  }
  await Promise.all(Array.from({ length: n }, worker))
}


// ------------------------------------------------------------------- discovery

/** @returns {{dir: string, file: string, path: string}[]} */
function find_originals() {
  const found = []
  for (const dir of Object.keys(PHOTOGRAPHERS)) {
    let entries
    try {
      entries = [...Deno.readDirSync(`${IMG}/${dir}`)]
    } catch {
      say(`  (no ${dir}/ -- skipping)`)
      continue
    }
    for (const e of entries) {
      // `._*` are macOS AppleDouble resource forks off an SD card, not photos
      if (!e.isFile || e.name.startsWith('.') || !/\.(?:jpe?g|heic|heif|png|tiff?)$/i.test(e.name))
        continue
      found.push({ dir, file: e.name, path: `${IMG}/${dir}/${e.name}` })
    }
  }
  return found
}


/**
 * EXIF for everything, in batches so the arg list stays sane.
 * @param {{path: string}[]} items
 * @returns {Promise<Map<string, object>>} keyed by absolute path
 */
async function read_exif(items) {
  const by_path = new Map()
  for (let i = 0; i < items.length; i += EXIF_BATCH) {
    const batch = items.slice(i, i + EXIF_BATCH)
    const { ok, out, err } = await run([
      'exiftool', '-json', '-q', '-m', '-n',
      '-FileName', '-DateTimeOriginal', '-Model', '-Make',
      '-ImageWidth', '-ImageHeight', '-FileSize', '-Orientation',
      ...batch.map((b) => b.path),
    ])
    if (!ok && !out.trim())
      throw new Error(`exiftool failed: ${err.slice(0, 300)}`)
    for (const rec of JSON.parse(out || '[]'))
      by_path.set(rec.SourceFile, rec)
    say(`    exif ${Math.min(i + EXIF_BATCH, items.length)}/${items.length}`)
  }
  return by_path
}


/**
 * EXIF stamps local wall-clock with no zone, so parse as naive seconds.  Comparing
 * cameras is all we do, and they were all in one room.
 * @param {string|undefined} s eg. '2026:08:08 21:19:33'
 * @returns {number|null} epoch seconds, UTC-naive
 */
function parse_exif_time(s) {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s ?? '')
  if (!m)
    return null
  const [, y, mo, d, h, mi, sec] = m.map(Number)
  return Date.UTC(y, mo - 1, d, h, mi, sec) / 1000
}


/** Trailing digits of a filename -- the camera's frame counter. */
function seq_of(file) {
  const m = /(\d+)(?!.*\d)/.exec(file.replace(/\.[^.]+$/, ''))
  return m ? Number(m[1]) : null
}


// --------------------------------------------------------------- clock repair

/**
 * A camera whose clock keeps resetting is worse than one that's merely wrong: the
 * intervals between frames are meaningless too, so nothing can be correlated.
 * Detect it by asking whether time advances with the frame counter.
 * @param {{t: number|null, seq: number|null}[]} shots
 */
function clock_is_broken(shots) {
  const timed = shots.filter((s) => s.t !== null)
  // nothing to judge: no stamps at all means every frame needs placing by hand
  if (!timed.length)
    return true
  const years = new Set(timed.map((s) => new Date(s.t * 1000).getUTCFullYear()))
  // a wedding does not span decades; a 2000-epoch stamp means the clock was never set
  if (!years.has(2026))
    return true

  // The monotonicity test needs a frame counter, and plenty of sources don't have one
  // -- phone filenames, renamed files, scans.  Absent a counter there is nothing to
  // contradict the timestamps, so take them at face value; the event-window check
  // downstream is what catches a clock that is merely wrong.
  const usable = timed.filter((s) => s.seq !== null)
  if (usable.length < 4)
    return false

  usable.sort((a, b) => a.seq - b.seq)
  let forward = 0
  for (let i = 1; i < usable.length; i++)
    if (usable[i].t >= usable[i - 1].t) forward += 1
  // monotonic-ish with the counter means the intervals can be trusted
  return forward / (usable.length - 1) < 0.9
}


/**
 * How much of a camera's roll lands inside the plausible event window at a given
 * offset.  This is the one automatic signal on this data that is actually load
 * bearing -- see the note above `align_cameras`.
 * @param {number[]} times epoch seconds
 * @param {number} offset
 * @param {[number, number]} window epoch seconds, lo/hi
 * @returns {number} 0..1
 */
function inside_fraction(times, offset, [lo, hi]) {
  const n = times.filter((t) => t + offset >= lo && t + offset <= hi).length
  return times.length ? n / times.length : 0
}


/**
 * The plausible window for the event, derived from the reference camera's own day.
 * @param {number[]} ref_times
 * @returns {[number, number]}
 */
function plausible_window(ref_times) {
  const mid = new Date(((Math.min(...ref_times) + Math.max(...ref_times)) / 2) * 1000)
  const day = Date.UTC(mid.getUTCFullYear(), mid.getUTCMonth(), mid.getUTCDate()) / 1000
  return [
    day + (EVENT_HOURS[0] - GRACE_BEFORE_H) * 3600,
    day + (EVENT_HOURS[1] + GRACE_AFTER_H) * 3600,
  ]
}


/**
 * Best whole/half-hour shift by window fit alone -- a *starting point* for the UI
 * to anchor from, never applied on its own.  Clock errors come in whole hours
 * (wrong timezone, skipped DST), so the candidates are quantised.
 * @returns {{hours: number, inside: number}}
 */
function suggest_offset(times, window) {
  let best = { hours: 0, inside: inside_fraction(times, 0, window) }
  for (let h = -12; h <= 12; h += 0.5) {
    const inside = inside_fraction(times, h * 3600, window)
    // ties go to the smaller shift: most clocks are roughly right
    if (inside > best.inside + 1e-9
      || (Math.abs(inside - best.inside) < 1e-9 && Math.abs(h) < Math.abs(best.hours)))
      best = { hours: h, inside }
  }
  return best
}


// -------------------------------------------------------------------- thumbs

/**
 * @param {{path: string, out: string, px: number}} item
 */
async function make_thumb({ path, out, px }) {
  if (!force_thumbs) {
    try {
      if (Deno.statSync(out).size > 0) return
    } catch { /* not built yet */ }
  }
  const { ok, err } = await run([
    'magick',
    // decode hint: lets libjpeg skip most of the DCT work on a 25MB frame
    '-define', `jpeg:size=${px * 2}x${px * 2}`,
    path,
    '-auto-orient',
    '-thumbnail', `${px}x${px}`,
    '-quality', px > 600 ? '90' : '78',
    out,
  ])
  if (!ok)
    console.error(`  thumb failed at ${px}px: ${path}\n    ${err.trim().slice(0, 200)}`)
}


// ---------------------------------------------------------------------- main

Deno.mkdirSync(THUMBS, { recursive: true })

say('scanning img/wed* ...')
const originals = find_originals()
if (!originals.length) {
  console.error(`no originals found under ${IMG}/wed*`)
  console.error('  (if you have cleared them from the repo, pass --src /path/to/mirror)')
  Deno.exit(1)
}
say(`  ${originals.length} originals`)

say('reading exif ...')
const exif = await read_exif(originals)

/** @type {Record<string, any[]>} */
const by_dir = {}
const photos = originals.map((o) => {
  const e = exif.get(o.path) ?? {}
  const rec = {
    id: `${o.dir}/${o.file}`,
    dir: o.dir,
    file: o.file,
    seq: seq_of(o.file),
    model: e.Model ?? null,
    exif_time: parse_exif_time(e.DateTimeOriginal),
    width: e.ImageWidth ?? null,
    height: e.ImageHeight ?? null,
    bytes: e.FileSize ?? null,
    thumb: `thumbs/${o.dir}__${o.file.replace(/\.[^.]+$/, '')}.jpg`,
    large: `large/${o.dir}__${o.file.replace(/\.[^.]+$/, '')}.jpg`,
  }
  ;(by_dir[o.dir] ??= []).push(rec)
  return rec
})

// ---- clock alignment
const ref_dir = Object.entries(PHOTOGRAPHERS).find(([, v]) => v.reference)?.[0]
const ref_times = (by_dir[ref_dir] ?? []).map((p) => p.exif_time).filter((t) => t !== null)
if (!ref_times.length) {
  console.error(`reference dir ${ref_dir} has no usable EXIF times`)
  Deno.exit(1)
}

/*
  Deciding each camera's clock.

  An earlier version tried to recover offsets automatically by cross-correlating
  each camera's shot-density curve against the reference.  It does not work here,
  and the reason is structural rather than a tuning problem: at a wedding every
  camera shoots more or less continuously through the same few hours, so each
  density curve is one broad plateau instead of a distinctive pattern.  Shifting a
  plateau by two hours still lands on the plateau and scores just as well, so the
  search returned confident-looking nonsense -- it proposed -2h for two cameras
  whose timestamps already fit the evening perfectly.

  What *is* reliable is asking whether a camera's roll lands inside the event
  window at all.  That cleanly separates "this clock is fine" from "this clock is
  hours out", which is the question worth answering automatically.  The actual
  offset then comes from the UI, where picking one photo-pair per camera is three
  clicks and exact.
*/
say(`\nchecking clocks against ${ref_dir} (${PHOTOGRAPHERS[ref_dir].who}) ...`)
const window = plausible_window(ref_times)
say(`  plausible window: ${new Date(window[0] * 1000).toISOString().slice(0, 16)}`
  + ` .. ${new Date(window[1] * 1000).toISOString().slice(0, 16)}`)

/** @type {Record<string, any>} */
const cameras = {}
for (const [dir, list] of Object.entries(by_dir)) {
  // `time` isn't assigned until offsets are known, so test the raw EXIF stamps
  const broken = clock_is_broken(list.map((p) => ({ t: p.exif_time, seq: p.seq })))
  const times = list.map((p) => p.exif_time).filter((t) => t !== null)
  const info = {
    dir,
    ...PHOTOGRAPHERS[dir],
    count: list.length,
    offset: 0,
    offset_source: 'none',
    span: times.length
      ? [
        new Date(Math.min(...times) * 1000).toISOString(),
        new Date(Math.max(...times) * 1000).toISOString(),
      ]
      : null,
  }

  if (dir === ref_dir) {
    info.clock = 'reference'
    info.offset_source = 'reference'
    info.inside = Number(inside_fraction(times, 0, window).toFixed(2))
  } else if (broken) {
    // clock resets on every power-on: not even the intervals survive
    info.clock = 'broken'
    info.order_by = 'seq'
  } else {
    const inside = inside_fraction(times, 0, window)
    info.inside = Number(inside.toFixed(2))
    if (inside >= INSIDE_OK) {
      // already sits in the evening -- treat as correct until told otherwise
      info.clock = 'looks-ok'
      info.offset_source = 'window-fit'
    } else {
      const hint = suggest_offset(times, window)
      info.clock = 'needs-anchor'
      info.suggest_hours = hint.hours
      info.suggest_inside = Number(hint.inside.toFixed(2))
    }
  }
  cameras[dir] = info

  const detail = info.clock === 'broken'
    ? 'clock resets constantly -- order by filename sequence, anchor by hand'
    : info.clock === 'needs-anchor'
      ? `only ${(info.inside * 100).toFixed(0)}% inside the window`
      + `  -- try ${info.suggest_hours >= 0 ? '+' : ''}${info.suggest_hours}h`
      + ` (${(info.suggest_inside * 100).toFixed(0)}% inside)`
      : `${(info.inside * 100).toFixed(0)}% inside the window`
  say(`  ${dir.padEnd(11)} n=${String(info.count).padEnd(4)} ${info.clock.padEnd(13)} ${detail}`)
}

// corrected time = exif + that camera's offset; broken clocks get none
for (const p of photos) {
  const cam = cameras[p.dir]
  p.time = (p.exif_time !== null && cam.clock !== 'broken') ? p.exif_time + cam.offset : null
}

Deno.mkdirSync(LARGE, { recursive: true })
say(`\nbuilding ${THUMB_PX}px grid thumbnails ...`)
await pool(
  photos.map((p) => ({ path: `${IMG}/${p.dir}/${p.file}`, out: `${CACHE}/${p.thumb}`, px: THUMB_PX })),
  THUMB_JOBS,
  make_thumb,
)
say(`\nbuilding ${LARGE_PX}px review images ...`)
await pool(
  photos.map((p) => ({ path: `${IMG}/${p.dir}/${p.file}`, out: `${CACHE}/${p.large}`, px: LARGE_PX })),
  THUMB_JOBS,
  make_thumb,
)

Deno.writeTextFileSync(MANIFEST, `${JSON.stringify({
  generated: new Date().toISOString(),
  repo: REPO,
  src: IMG,
  reference_dir: ref_dir,
  thumb_px: THUMB_PX,
  large_px: LARGE_PX,
  cameras,
  photos,
}, null, 2)}\n`)

say(`\nwrote ${MANIFEST}`)
say(`  ${photos.length} photos, ${Object.keys(cameras).length} cameras`)
