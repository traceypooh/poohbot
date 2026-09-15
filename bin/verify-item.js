#!/usr/bin/env -S deno run --allow-read --allow-run --allow-net --allow-env

/*
  verify-item -- three-way md5 check before deleting the only local copy of anything.

  Compares a local tree against an archive.org item.  The item's md5s come from its
  own metadata (`<id>_files.xml`), so the remote side costs one small HTTP request
  rather than re-downloading gigabytes.

  Derivative files the archive generates itself (thumbnails, _meta.xml, _files.xml)
  are ignored -- only `source="original"` entries are ours to compare.

  Usage:
    bin/verify-item.js pelican-wedding img            # repo copy
    bin/verify-item.js pelican-wedding /Volumes/NAS/pelican-wedding
    bin/verify-item.js pelican-wedding img --dirs wed,wed-mom

    --missing   print only the names of files not yet on the item, one per line, and
                skip hashing entirely.  Re-runnable mid-upload, which matters because
                `ia upload` re-sends a file rather than skipping one already present:
                    cd img && bin/../bin/verify-item.js pelican-wedding . --missing \\
                      | xargs ia upload --keep-directories pelican-wedding --retries 10

  Exit status is 0 only when every local file is present on the item with a matching
  md5, so it is safe to chain:  bin/verify-item.js ... && rm -rf img/wed*
*/

const [identifier, root, ...rest] = Deno.args
if (!identifier || !root) {
  console.error('usage: verify-item.js <identifier> <local-dir> [--dirs a,b,c]')
  Deno.exit(2)
}
const missing_only = rest.includes('--missing')
const dirs_arg = rest.indexOf('--dirs')
const only = dirs_arg === -1 ? null : new Set(rest[dirs_arg + 1].split(','))
const MD5_JOBS = 8

/** @returns {string[]} paths relative to `root` */
function walk(dir, prefix = '') {
  const out = []
  for (const e of Deno.readDirSync(dir)) {
    if (e.name.startsWith('.')) continue
    const rel = prefix ? `${prefix}/${e.name}` : e.name
    // --dirs must gate loose top-level files too, not just subdirectories, or every
    // stray image beside them gets swept in
    if (!prefix && only && !only.has(e.name)) continue
    if (e.isDirectory) out.push(...walk(`${dir}/${e.name}`, rel))
    else if (e.isFile) out.push(rel)
  }
  return out
}

/** @param {string} path @returns {Promise<string>} */
async function md5(path) {
  const { success, stdout } = await new Deno.Command('md5', {
    args: ['-q', path],
    stdout: 'piped',
    stderr: 'null',
  }).output()
  if (!success) throw new Error(`md5 failed for ${path}`)
  return new TextDecoder().decode(stdout).trim()
}

async function pool(items, n, fn) {
  const queue = [...items]
  let done = 0
  await Promise.all(Array.from({ length: n }, async () => {
    for (let it = queue.shift(); it !== undefined; it = queue.shift()) {
      await fn(it)
      done += 1
      if (done % 50 === 0) console.error(`  hashed ${done}/${items.length}`)
    }
  }))
}

console.error(`scanning ${root} ...`)
const files = walk(root)
if (!files.length) {
  console.error(`no files under ${root}`)
  Deno.exit(1)
}
/** @type {Map<string,string>} */
const local = new Map()
if (missing_only) {
  // names are all we need; hashing 500 originals would read gigabytes for nothing
  for (const f of files) local.set(f, '')
} else {
  console.error(`  ${files.length} files; hashing (this reads every byte) ...`)
  await pool(files, MD5_JOBS, async (f) => local.set(f, await md5(`${root}/${f}`)))
}

console.error(`fetching https://archive.org/download/${identifier}/${identifier}_files.xml ...`)
const res = await fetch(`https://archive.org/download/${identifier}/${identifier}_files.xml`)
if (!res.ok) {
  console.error(`  could not read item metadata: ${res.status} ${res.statusText}`)
  console.error('  (a brand-new item can take a few minutes to publish its file list)')
  Deno.exit(1)
}
const xml = await res.text()

/** @type {Map<string,string>} */
const remote = new Map()
for (const m of xml.matchAll(/<file name="([^"]+)" source="([^"]+)">([\s\S]*?)<\/file>/g)) {
  if (m[2] !== 'original') continue
  const md5m = /<md5>([0-9a-f]{32})<\/md5>/.exec(m[3])
  if (md5m) remote.set(m[1].replace(/&amp;/g, '&'), md5m[1])
}
console.error(`  item lists ${remote.size} original files\n`)

const missing = []
const mismatch = []
for (const [f, sum] of local) {
  const there = remote.get(f)
  if (there === undefined) missing.push(f)
  else if (!missing_only && there !== sum) mismatch.push(f)
}

if (missing_only) {
  // stdout stays machine-readable for xargs; commentary goes to stderr
  for (const f of missing) console.log(f)
  const bytes = missing.reduce((n, f) => n + Deno.statSync(`${root}/${f}`).size, 0)
  console.error(`\n${missing.length} of ${local.size} still to upload`
    + ` (${(bytes / 1073741824).toFixed(2)} GB)`)
  if (missing.length)
    console.error('NOTE: --missing does NOT checksum. Re-run without it before deleting.')
  // fail closed: no invocation of this tool should ever exit 0 while files are absent,
  // or `--missing && rm -rf` would read as a pass.  Piping to xargs is unaffected.
  Deno.exit(missing.length ? 1 : 0)
}
// archive.org marks its own housekeeping files source="original" too, so drop them
// -- otherwise every run reports them as unexplained extras
const IA_OWN = new RegExp(`^(?:__ia_thumb\\.jpg|${identifier}_(?:files\\.xml|meta\\.xml`
  + `|meta\\.sqlite|reviews\\.xml|archive\\.torrent|itemimage\\.jpg))$`)
const extra = [...remote.keys()].filter((f) => !local.has(f) && !IA_OWN.test(f))

const show = (label, list, cap = 20) => {
  console.log(`${label}: ${list.length}`)
  for (const f of list.slice(0, cap)) console.log(`    ${f}`)
  if (list.length > cap) console.log(`    ... and ${list.length - cap} more`)
}

console.log(`local files:   ${local.size}`)
console.log(`item originals: ${remote.size}`)
show('\nmissing from the item', missing)
show('md5 MISMATCH', mismatch)
show('on the item but not local', extra)

const ok = !missing.length && !mismatch.length
console.log(ok
  ? '\nevery local file is on the item with a matching md5 -- safe to clear locally'
  : '\nNOT verified -- do not delete anything yet')
Deno.exit(ok ? 0 : 1)
