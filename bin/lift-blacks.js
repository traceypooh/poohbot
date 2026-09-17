#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-net --allow-env

/*
  lift-blacks -- restore a black point to images whose shadows never reach black.

  Written for a roll shot on an uncoated Soviet lens (Helios-style), where veiling
  flare lifts the whole shadow end: the darkest pixel in the frame sits around 30/255
  instead of near 0, so the image reads washed out and soft.  Nothing is clipped, so
  the contrast is recoverable -- it just has to be measured per frame, because a fixed
  lift crushes whichever frames start lower.  A flat 28% on this set put 10-23% of
  pixels at pure black, which is the original problem in reverse.

  For each image:
    - measure p1 (1st percentile) and the median from its own histogram
    - lift the black point to p1, so almost nothing clips
    - pick a gamma that puts the median back where it was, since lifting alone
      darkens the whole frame (one candlelit frame went median 64 -> 43)

  ICC profile and EXIF are preserved; the output is deliberately high-quality JPEG
  because it becomes the new source for the derivative pipeline.

  Usage:
    bin/lift-blacks.js OUTDIR file...                 # local files
    bin/lift-blacks.js OUTDIR --item ID --dir SUBDIR  # fetch from archive.org first
    bin/lift-blacks.js OUTDIR --dry-run file...       # just report what it would do
*/

const QUALITY = '96'
const CLIP_BUDGET = 0.01 // allow ~1% into pure black; beyond that, back the lift off

const raw = Deno.args
const flag = (n) => {
  const i = raw.indexOf(`--${n}`)
  return i === -1 ? null : raw[i + 1]
}
const dry = raw.includes('--dry-run')
const item = flag('item')
const subdir = flag('dir')
const VALUE_FLAGS = ['--item', '--dir']
const pos = raw.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(raw[i - 1]))
const outdir = pos[0]
let files = pos.slice(1)

if (!outdir) {
  console.error('usage: lift-blacks.js OUTDIR [--item ID --dir SUBDIR] [--dry-run] [file...]')
  Deno.exit(2)
}

async function sh(cmd) {
  const { success, stdout, stderr } = await new Deno.Command(cmd[0], {
    args: cmd.slice(1), stdout: 'piped', stderr: 'piped',
  }).output()
  return {
    ok: success,
    out: new TextDecoder().decode(stdout),
    err: new TextDecoder().decode(stderr),
  }
}

/** 256-bin luma histogram. */
async function histogram(path) {
  const { out } = await sh(['magick', path, '-colorspace', 'Gray', '-depth', '8',
                            '-format', '%c', 'histogram:info:-'])
  const h = new Array(256).fill(0)
  for (const m of out.matchAll(/\s*(\d+):\s*\(\s*(\d+)/g))
    h[Number(m[2])] += Number(m[1])
  return h
}

const percentile = (h, q) => {
  const total = h.reduce((a, b) => a + b, 0)
  let acc = 0
  for (let v = 0; v < 256; v++) {
    acc += h[v]
    if (acc >= total * q) return v
  }
  return 255
}
const share_at_or_below = (h, v) => {
  const total = h.reduce((a, b) => a + b, 0)
  return h.slice(0, v + 1).reduce((a, b) => a + b, 0) / total
}

/**
 * Pull an item's originals into a local cache, skipping any already there so an
 * interrupted run resumes.
 * @returns {Promise<string[]>} local paths
 */
async function fetch_originals(id, dir, cache) {
  const meta = await (await fetch(`https://archive.org/metadata/${id}`)).json()
  const names = meta.files
    .filter((f) => f.source === 'original' && f.name.startsWith(`${dir}/`))
    .map((f) => f.name)
  Deno.mkdirSync(cache, { recursive: true })
  console.error(`fetching ${names.length} originals from ${id}/${dir} ...`)
  const got = []
  for (const [i, n] of names.entries()) {
    const dest = `${cache}/${n.split('/').pop()}`
    try {
      if (Deno.statSync(dest).size > 0) {
        got.push(dest)
        continue
      }
    } catch { /* not cached yet */ }
    const res = await fetch(`https://archive.org/serve/${id}/${n}`)
    if (!res.ok) {
      console.error(`  ${n}: ${res.status}`)
      continue
    }
    Deno.writeFileSync(dest, new Uint8Array(await res.arrayBuffer()))
    got.push(dest)
    if ((i + 1) % 10 === 0) console.error(`  ${i + 1}/${names.length}`)
  }
  console.error(`  have ${got.length} locally\n`)
  return got
}

// ---- optionally pull the pristine originals from an archive.org item
if (item && subdir) files = await fetch_originals(item, subdir, `${outdir}/.src`)

if (!files.length) {
  console.error('no input files')
  Deno.exit(1)
}

Deno.mkdirSync(outdir, { recursive: true })
console.log(`  ${'file'.padEnd(20)}${'p1'.padStart(4)}${'med'.padStart(5)}`
  + `${'lift%'.padStart(7)}${'gamma'.padStart(7)}   ${'after: p1'.padStart(10)}${'med'.padStart(5)}${'clip%'.padStart(7)}`)

let done = 0
for (const f of files.toSorted()) {
  const name = f.split('/').pop()
  const h = await histogram(f)
  const p1 = percentile(h, 0.01)
  const med = percentile(h, 0.5)

  // Lift to p1, but never so far that more than CLIP_BUDGET goes to pure black.
  let black = p1
  while (black > 0 && share_at_or_below(h, black) > CLIP_BUDGET) black -= 1
  const lift = (black / 255) * 100

  // After a lift, the median lands lower; choose gamma to put it back.
  // magick applies output = ((in-b)/(w-b)) ** (1/gamma), so gamma>1 brightens.
  const med_after = Math.max(1, med - black) / (255 - black)
  const target = Math.max(1, med) / 255
  const gamma = Math.log(med_after) / Math.log(target)
  const g = Math.min(2, Math.max(0.5, gamma))

  const args = ['magick', f, '-colorspace', 'sRGB',
                '-level', `${lift.toFixed(2)}%,100%,${g.toFixed(3)}`,
                '-quality', QUALITY, '-sampling-factor', '4:4:4', `${outdir}/${name}`]
  if (dry) {
    console.log(`  ${name.padEnd(20)}${String(p1).padStart(4)}${String(med).padStart(5)}`
      + `${lift.toFixed(2).padStart(7)}${g.toFixed(3).padStart(7)}   (dry run)`)
    continue
  }
  const r = await sh(args)
  if (!r.ok) {
    console.error(`  ${name}: FAILED ${r.err.trim().slice(0, 120)}`)
    continue
  }
  const h2 = await histogram(`${outdir}/${name}`)
  console.log(`  ${name.padEnd(20)}${String(p1).padStart(4)}${String(med).padStart(5)}`
    + `${lift.toFixed(2).padStart(7)}${g.toFixed(3).padStart(7)}   `
    + `${String(percentile(h2, 0.01)).padStart(10)}${String(percentile(h2, 0.5)).padStart(5)}`
    + `${(share_at_or_below(h2, 4) * 100).toFixed(2).padStart(7)}`)
  done += 1
}
if (!dry) console.log(`\n  wrote ${done} corrected files to ${outdir}/`)
