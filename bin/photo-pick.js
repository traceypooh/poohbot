#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-run --allow-env

/*
  photo-pick -- stage 2 of the wedding photo picker.

  Serves a local UI over the manifest that `photo-index.js` built.  Three jobs:

    align   fix the cameras whose clocks are wrong, by pointing at two photos of
            the same moment.  Automatic detection was tried and removed -- see the
            long note in photo-index.js for why it cannot work on wedding data.
    triage  roll through everything in corrected-time order, marking each frame
            keep / blog / discard.
    blog    put the blog picks in the order you want them to read.

  Nothing is destructive until you press Apply, and even then a discard is a move
  into img/.trash/, never an unlink.

  Decisions live in .photo-cache/state.json, separate from the manifest, so
  re-running photo-index (new files, replaced previews) never clobbers your picks.
  They are keyed by original filename, which is also why originals keep their names.

  Usage:  bin/photo-pick.js [--port 8777]
*/

const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const IMG = `${REPO}/img`
const CACHE = `${REPO}/.photo-cache`
const MANIFEST = `${CACHE}/manifest.json`
const STATE = `${CACHE}/state.json`
const TRASH = `${IMG}/.trash`
const UI = new URL('photo-pick.html', import.meta.url).pathname

const port = Number(Deno.args[Deno.args.indexOf('--port') + 1]) || 8777

const MIME = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  json: 'application/json',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  avif: 'image/avif',
  webp: 'image/webp',
}

/** @returns {object} */
function load_manifest() {
  try {
    return JSON.parse(Deno.readTextFileSync(MANIFEST))
  } catch {
    console.error(`no manifest at ${MANIFEST}\n  run bin/photo-index.js first`)
    Deno.exit(1)
  }
}

/**
 * Picks and clock corrections.  Deliberately a separate file from the manifest:
 * re-indexing is something you do often (new files arrive, the 70D previews get
 * replaced with real originals) and it must never cost you an afternoon of triage.
 */
function load_state() {
  try {
    return JSON.parse(Deno.readTextFileSync(STATE))
  } catch {
    return { offsets: {}, anchors: {}, times: {}, marks: {}, blog_order: [], saved: null }
  }
}

/** @param {object} state @returns {object} what was written */
function save_state(state) {
  const out = { ...state, saved: new Date().toISOString() }
  Deno.writeTextFileSync(STATE, `${JSON.stringify(out, null, 2)}\n`)
  return out
}


// ------------------------------------------------------------------- ordering

/**
 * Where a photo sits on the timeline, once corrections are applied.
 *
 * Three cases, in order of how much we know:
 *   - clock fine (or offset known): EXIF plus that camera's offset.
 *   - clock dead but anchored: the frame counter is the only monotonic thing left,
 *     so interpolate between anchors in *sequence* space.  Two anchors give a rate;
 *     outside them we extrapolate with the nearest segment's rate.
 *   - clock dead, not yet anchored: no honest answer, so it stays unplaced rather
 *     than being guessed into the middle of the evening.
 * @returns {number|null} epoch seconds
 */
function placed_time(photo, cameras, state) {
  // A hand-set time wins over everything.  Some files have no EXIF at all -- phone
  // screenshots, re-saves, the selfies here -- and no camera-wide offset can rescue a
  // frame that never had a timestamp to offset.
  const override = state.times?.[photo.id]
  if (Number.isFinite(override))
    return override

  const cam = cameras[photo.dir]
  const offset = state.offsets[photo.dir] ?? 0

  if (cam.clock !== 'broken')
    return photo.exif_time === null ? null : photo.exif_time + offset

  const anchors = (state.anchors[photo.dir] ?? [])
    .filter((a) => Number.isFinite(a.seq) && Number.isFinite(a.time))
    .sort((a, b) => a.seq - b.seq)
  if (!anchors.length || photo.seq === null)
    return null
  if (anchors.length === 1)
    return anchors[0].seq === photo.seq ? anchors[0].time : null

  // bracket the frame, then lerp; clamp to the end segments when outside
  let lo = anchors[0]
  let hi = anchors[anchors.length - 1]
  for (let i = 0; i < anchors.length - 1; i++) {
    if (photo.seq >= anchors[i].seq && photo.seq <= anchors[i + 1].seq) {
      lo = anchors[i]
      hi = anchors[i + 1]
      break
    }
  }
  if (hi.seq === lo.seq)
    return lo.time
  const rate = (hi.time - lo.time) / (hi.seq - lo.seq)
  return lo.time + (photo.seq - lo.seq) * rate
}


/**
 * Is this frame outside the range its camera's anchors actually pin down?
 *
 * Matters more than it sounds.  Interpolating *between* anchors is bounded by them,
 * but extrapolating past the outermost one multiplies that segment's frames-per-
 * minute rate by however many frames are left -- and shooting rate is nothing like
 * uniform at a wedding.  Two anchors in the middle of a roll flung its first frame
 * four hours before the ceremony.  So flag it and let the UI ask for more anchors,
 * rather than presenting a confident-looking guess.
 */
function is_extrapolated(photo, cameras, state) {
  if (Number.isFinite(state.times?.[photo.id]))
    return false
  if (cameras[photo.dir].clock !== 'broken' || photo.seq === null)
    return false
  const seqs = (state.anchors[photo.dir] ?? []).map((a) => a.seq).filter(Number.isFinite)
  if (seqs.length < 2)
    return false
  return photo.seq < Math.min(...seqs) || photo.seq > Math.max(...seqs)
}


/** Photos in timeline order, unplaced ones last (by camera then frame number). */
function ordered(manifest, state) {
  const rows = manifest.photos.map((p) => ({
    ...p,
    placed: placed_time(p, manifest.cameras, state),
    hand_placed: Number.isFinite(state.times?.[p.id]),
    extrapolated: is_extrapolated(p, manifest.cameras, state),
    mark: state.marks[p.id] ?? null,
  }))
  const placed = rows.filter((r) => r.placed !== null).sort((a, b) => a.placed - b.placed)
  const loose = rows.filter((r) => r.placed === null)
    .sort((a, b) => a.dir.localeCompare(b.dir) || (a.seq ?? 0) - (b.seq ?? 0))
  return [...placed, ...loose]
}


// --------------------------------------------------------------------- apply

/**
 * Write the two lists, move discards aside, and hand back the commands to run.
 * Kept deliberately inert: this touches nothing in the blog post itself, because
 * that file has hand-written prose in it that no generator should be editing.
 */
function apply(manifest, state) {
  const rows = ordered(manifest, state)
  const keep = rows.filter((r) => r.mark === 'keep' || r.mark === 'blog')
  const discard = rows.filter((r) => r.mark === 'discard')

  const blog_marked = rows.filter((r) => r.mark === 'blog')
  // honour the hand-tuned order, then anything marked since it was last touched
  const by_id = new Map(blog_marked.map((r) => [r.id, r]))
  const blog = []
  for (const id of state.blog_order) {
    if (by_id.has(id)) {
      blog.push(by_id.get(id))
      by_id.delete(id)
    }
  }
  blog.push(...by_id.values())

  Deno.mkdirSync(`${REPO}/misc`, { recursive: true })
  const keep_path = `${REPO}/misc/wedding-keep.txt`
  const blog_path = `${REPO}/misc/wedding-blog.txt`
  Deno.writeTextFileSync(keep_path, `${keep.map((r) => r.id).join('\n')}\n`)
  Deno.writeTextFileSync(blog_path, `${blog.map((r) => r.id).join('\n')}\n`)

  // discards move, never vanish
  const moved = []
  for (const r of discard) {
    const dest_dir = `${TRASH}/${r.dir}`
    Deno.mkdirSync(dest_dir, { recursive: true })
    const from = `${IMG}/${r.id}`
    const to = `${dest_dir}/${r.file}`
    try {
      Deno.statSync(from)
      Deno.renameSync(from, to)
      moved.push(r.id)
    } catch { /* already moved on an earlier apply */ }
  }

  const commands = [
    '# full-size keepers -> upload these originals to the archive.org item',
    `wc -l < ${keep_path.replace(REPO, '.')}   # ${keep.length} files`,
    '',
    '# ~1000px thumbs for the originals-viewing repo, names mirrored from the source',
    'cd img && ../bin/avif-blog-img -mirror ../misc/thumbs -width 1000'
    + ' $(sed "s|^|./|" ../misc/wedding-keep.txt)',
    '',
    `# blog derivatives, in the order you arranged (${blog.length} files)`,
    'cd img && ../bin/avif-blog-img 2026-08-wedding'
    + ' $(sed "s|^|./|" ../misc/wedding-blog.txt)',
    '#   ^ no -oldest: the list is already in the order you chose',
  ].join('\n')

  return {
    keep: keep.length,
    blog: blog.length,
    discarded: moved.length,
    keep_path,
    blog_path,
    commands,
    blog_ids: blog.map((r) => r.id),
  }
}


// -------------------------------------------------------------------- server

/** @param {string} p @returns {string} */
function mime_for(p) {
  return MIME[p.split('.').pop().toLowerCase()] ?? 'application/octet-stream'
}

/**
 * Serve a file, refusing anything that tries to climb out of `root`.
 * @param {string} root
 * @param {string} rel
 */
function serve_file(root, rel) {
  const path = `${root}/${decodeURIComponent(rel)}`
  const resolved = new URL(`file://${path}`).pathname
  if (!resolved.startsWith(`${root}/`))
    return new Response('nope', { status: 403 })
  try {
    const body = Deno.readFileSync(resolved)
    return new Response(body, { headers: { 'content-type': mime_for(resolved) } })
  } catch {
    return new Response('not found', { status: 404 })
  }
}

const json = (o, status = 200) =>
  new Response(`${JSON.stringify(o)}\n`, { status, headers: { 'content-type': MIME.json } })

const manifest = load_manifest()

console.log(`photo-pick: ${manifest.photos.length} photos, ${Object.keys(manifest.cameras).length} cameras`)
console.log(`  http://localhost:${port}/`)

Deno.serve({ port, onListen: () => {} }, async (req) => {
  const url = new URL(req.url)
  const path = url.pathname

  if (req.method === 'POST' && path === '/state') {
    const incoming = await req.json()
    const saved = save_state({ ...load_state(), ...incoming })
    return json({ ok: true, saved: saved.saved })
  }

  if (req.method === 'POST' && path === '/apply') {
    const state = load_state()
    try {
      return json(apply(manifest, state))
    } catch (err) {
      console.error('apply failed:', err)
      return json({ error: String(err?.message ?? err) }, 500)
    }
  }

  if (path === '/' || path === '/index.html')
    return new Response(Deno.readFileSync(UI), { headers: { 'content-type': MIME.html } })

  if (path === '/data.json') {
    const state = load_state()
    return json({
      cameras: manifest.cameras,
      reference_dir: manifest.reference_dir,
      photos: ordered(manifest, state),
      state,
    })
  }

  if (path.startsWith('/thumbs/'))
    return serve_file(`${CACHE}/thumbs`, path.slice('/thumbs/'.length))

  if (path.startsWith('/large/'))
    return serve_file(`${CACHE}/large`, path.slice('/large/'.length))

  if (path.startsWith('/orig/'))
    return serve_file(IMG, path.slice('/orig/'.length))

  return new Response('not found', { status: 404 })
})
