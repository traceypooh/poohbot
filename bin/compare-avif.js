#!/usr/bin/env -S deno run --allow-read --allow-run --allow-env

/*
  compare-avif -- put two or more derivative trees side by side.

  For deciding whether a re-encode was actually worth it, rather than assuming.
  Reports per-variant size, dimensions and whether a colour profile survived; with
  --src it also measures PSNR against each original, which is the only way to tell
  "smaller" from "smaller because it threw detail away".

  Usage:
    bin/compare-avif.js img img/v2 img/v3
    bin/compare-avif.js img img/v2 --src /Volumes/poohpub/pelican-wedding
    bin/compare-avif.js img img/v2 --src ... --dirs wed,wed-canon

  PSNR needs the source readable, which on a network volume may be blocked by macOS
  TCC -- it degrades to size/dimension/profile reporting rather than failing.
*/

// Flags that consume the next argument -- their VALUES must not be mistaken for
// positional tree paths, or `--dirs wed-canon` silently adds a phantom third tree.
const VALUE_FLAGS = ['--src', '--dirs']
const flag = (name) => {
  const i = Deno.args.indexOf(`--${name}`)
  return i === -1 ? null : Deno.args[i + 1]
}
const args = Deno.args.filter((a, i) => !a.startsWith('--')
  && !VALUE_FLAGS.includes(Deno.args[i - 1]))
const src_root = flag('src')
const only = flag('dirs')?.split(',')
const SUBDIRS = only ?? ['wed', 'wed-bokeh', 'wed-canon', 'wed-misc', 'wed-mom', 'wed-nikon']

if (args.length < 2) {
  console.error('usage: compare-avif.js <treeA> <treeB> [treeC...] [--src DIR] [--dirs a,b]')
  Deno.exit(2)
}

/** @param {string[]} cmd */
async function sh(cmd) {
  const { success, stdout } = await new Deno.Command(cmd[0], {
    args: cmd.slice(1), stdout: 'piped', stderr: 'null',
  }).output()
  return success ? new TextDecoder().decode(stdout).trim() : ''
}

const dims = (p) => sh(['magick', 'identify', '-format', '%wx%h', p])
const icc = async (p) => {
  const v = await sh(['exiftool', '-q', '-m', '-T', '-ProfileDescription', p])
  return v && v !== '-' ? v : ''
}

/** Relative paths of every avif under a tree, restricted to the known subdirs. */
function walk(root) {
  const out = []
  for (const d of SUBDIRS) {
    let entries
    try {
      entries = [...Deno.readDirSync(`${root}/${d}`)]
    } catch {
      continue
    }
    for (const e of entries) {
      if (e.isFile && e.name.endsWith('.avif')) out.push(`${d}/${e.name}`)
    }
  }
  return out.sort()
}

/**
 * PSNR of a derivative against its original, both resampled to the derivative's own
 * size -- comparing a 2064px file to an 8256px original directly would measure the
 * downscale, not the encode.
 */
async function psnr(deriv, source) {
  const wh = await dims(deriv)
  if (!wh) return ''
  const tmp = await Deno.makeTempFile({ suffix: '.png' })
  try {
    const ok = await sh(['magick', source, '-auto-orient', '-resize', `${wh}!`, tmp])
    if (ok === '' && !Deno.statSync(tmp).size) return ''
    const out = await new Deno.Command('magick', {
      args: ['compare', '-metric', 'PSNR', tmp, deriv, 'null:'],
      stdout: 'piped', stderr: 'piped',
    }).output()
    const txt = new TextDecoder().decode(out.stderr) + new TextDecoder().decode(out.stdout)
    return (/^([\d.]+)/.exec(txt.trim()) ?? ['', ''])[1]
  } catch {
    return ''
  } finally {
    try { Deno.removeSync(tmp) } catch { /* already gone */ }
  }
}

// union of files across trees, so a file present in only one still shows up
const files = [...new Set(args.flatMap(walk))].sort()
if (!files.length) {
  console.error(`no .avif found under ${args.join(', ')} (subdirs: ${SUBDIRS.join(',')})`)
  Deno.exit(1)
}

/** @type {Map<string, string>} rel -> resolved source path */
const sources = new Map()
if (src_root) {
  for (const rel of files) {
    const stem = rel.replace(/\.avif$/, '')
    for (const ext of ['.JPG', '.jpg', '.heic.jpg', '.heic', '.png']) {
      try {
        Deno.statSync(`${src_root}/${stem}${ext}`)
        sources.set(rel, `${src_root}/${stem}${ext}`)
        break
      } catch { /* try the next extension */ }
    }
  }
  console.error(`  resolved ${sources.size}/${files.length} sources under ${src_root}`)
}

const totals = args.map(() => ({ bytes: 0, n: 0, icc: 0, psnr: 0, psnr_n: 0 }))
const head = args.map((a) => a.padEnd(18)).join('')
console.log(`file${' '.repeat(30)}${head}`)

for (const rel of files) {
  const cells = []
  for (const [i, root] of args.entries()) {
    const p = `${root}/${rel}`
    let size = null
    try { size = Deno.statSync(p).size } catch { /* absent in this tree */ }
    if (size === null) {
      cells.push('—'.padEnd(18))
      continue
    }
    const wh = await dims(p)
    const prof = await icc(p)
    totals[i].bytes += size
    totals[i].n += 1
    if (prof) totals[i].icc += 1
    let extra = ''
    const s = sources.get(rel)
    if (s) {
      const q = await psnr(p, s)
      if (q) {
        extra = ` ${Number(q).toFixed(1)}dB`
        totals[i].psnr += Number(q)
        totals[i].psnr_n += 1
      }
    }
    cells.push(`${String(Math.round(size / 1024)).padStart(5)}K ${wh}${prof ? '*' : ' '}${extra}`.padEnd(18))
  }
  console.log(`${rel.padEnd(34)}${cells.join('')}`)
}

console.log(`\n${'-'.repeat(34 + args.length * 18)}`)
for (const [i, root] of args.entries()) {
  const t = totals[i]
  const avg = t.psnr_n ? ` · mean PSNR ${(t.psnr / t.psnr_n).toFixed(2)}dB` : ''
  console.log(`  ${root.padEnd(16)} ${t.n} files · ${(t.bytes / 1048576).toFixed(1)} MB`
    + ` · ${t.icc}/${t.n} with a colour profile${avg}`)
}
console.log('\n  * = colour profile present.  PSNR is vs the original resampled to the')
console.log('    derivative\'s own size, so it measures the encode, not the downscale.')
