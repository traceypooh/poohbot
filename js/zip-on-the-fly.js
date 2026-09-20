/*
  ZOTF -- "zip on the fly"

  Drop this into any page with a `<script type=module src=/js/zip-on-the-fly.js>` tag.
  It adds a download button to the theme nav, next to `.search-toggle`.  Clicking it
  turns on "pick mode", which puts a semi-transparent download button on every file
  the page offers.  Clicking the nav button again zips whatever is picked, streaming
  straight to disk (so a multi-GB pick never lands in memory).

  Picks persist in a single path-scoped cookie, so a reload -- or a failed zip --
  doesn't lose someone's selection.

  Files are found two ways, and nothing here is specific to imagery: an <img> whose
  wrapping <a> points at a media file (a thumbnail linking its full-rez original), or
  a bare <img> big enough to be worth having.  A directory listing of, say, mp3s --
  plain <a> links with no <img> at all -- is a third shape that is NOT wired up yet;
  see `scan()` for what it would take.
*/

// ONLINE (normal).  To work offline -- on a plane, say -- comment this block out
// and uncomment the one below it.  See js/vendor/README.md to refresh the copies.
// /*
import { LitElement, html,
  css, unsafeCSS } from 'https://esm.ext.archive.org/lit'
import { downloadZip } from 'https://esm.ext.archive.org/client-zip@2/index.js'
import { log, warn } from 'https://av.archive.org/js/util/log.js'
// */

// OFFLINE -- vendored copies.  Relative paths, so this also travels to another repo.
/*
import { LitElement, html,
  css, unsafeCSS } from './vendor/lit.min.js'
import { downloadZip } from './vendor/client-zip.min.js'
import { log, warn } from './vendor/log.js'
*/

const COOKIE = 'zotf'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
// only gates bare <img>s: below this it's chrome (icon, avatar, thumbnail), not
// content worth downloading.  Linked files skip this test entirely.
const MIN_WIDTH = 300
// what counts as a downloadable file when it shows up in an href
const MEDIA_RE = new RegExp(`\\.(?:${[
  'avif|gif|heic|jfif|jpe?g|png|tiff?|webp', // images
  'aac|aiff?|flac|m4a|mp3|oga|ogg|opus|wav',  // audio
  'avi|m4v|mkv|mov|mp4|mpe?g|ogv|webm',       // video
  'epub|pdf|txt',                             // documents
].join('|')})(?:[?#]|$)`, 'i')
// browsers with no showSaveFilePicker() buffer the whole zip in RAM before saving
const BLOB_LIMIT = 1.5e9
const HEAD_CONCURRENCY = 8
// a CSSResult, not a string: lit's `css` tag rejects plain interpolations outright.
// It still stringifies to '#4CAF50' for the light-DOM <style> in `#install_nav()`.
const ACCENT = unsafeCSS('#4CAF50')

const DOWNLOAD_SVG = html`
<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 3v10.5m0 0 4-4m-4 4-4-4M4 17.5v1.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5"/>
</svg>`


// ---------------------------------------------------------------- cookie state

/**
 * Collapse sorted indices into ranges, so "select all" of 600 files costs 9 bytes
 * instead of ~2,300 -- which matters, since a cookie caps out around 4KB.
 * @param {Iterable<number>} indices
 * @returns {string} eg. '0-12,15,19-23'
 */
function encode_ranges(indices) {
  const sorted = [...indices].sort((a, b) => a - b)
  const parts = []
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i]
    while (i + 1 < sorted.length && sorted[i + 1] === sorted[i] + 1)
      i += 1
    parts.push(start === sorted[i] ? `${start}` : `${start}-${sorted[i]}`)
  }
  return parts.join(',')
}


/**
 * @param {string} str eg. '0-12,15,19-23'
 * @param {number} max one past the highest index this page has; anything beyond is
 *   dropped, so a hand-mangled cookie like '1-999999999' can't spin for a billion
 *   iterations.  The default is just a backstop -- no page has 100k files.
 * @returns {Set<number>}
 */
function decode_ranges(str, max = 1e5) {
  const set = new Set()
  for (const part of str.split(',')) {
    // be strict -- `Number('')` is 0, so a sloppy parse turns '' into a picked index 0
    const match = /^(\d+)(?:-(\d+))?$/.exec(part)
    if (!match)
      continue
    const lo = Number(match[1])
    const hi = Math.min(match[2] === undefined ? lo : Number(match[2]), max - 1)
    for (let n = lo; n <= hi; n++)
      set.add(n)
  }
  return set
}


/**
 * Read this page's picks.  The leading count is a sanity check -- if the post gained
 * or lost files since the cookie was written, the saved indices point at the wrong
 * ones, so we throw the whole thing away rather than restore a scrambled list.
 * @param {number} total files found on the page right now
 * @returns {Set<number>}
 */
function cookie_read(total) {
  const raw = document.cookie
    .split('; ')
    .find((kv) => kv.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1)
  if (!raw)
    return new Set()

  // decode defensively: values are written raw now, but tolerate a percent-encoded
  // one left over from an earlier visit, and a hand-mangled '%' that would throw
  let value = raw
  try {
    value = decodeURIComponent(raw)
  } catch {
    warn(`ZOTF: undecodable cookie ${raw} -- reading it as-is`)
  }

  const [count, ranges] = value.split(':')
  if (Number(count) !== total) {
    warn(`ZOTF: page has ${total} files but cookie says ${count} -- discarding stale picks`)
    return new Set()
  }
  return decode_ranges(ranges ?? '', total)
}


/**
 * `path` scopes the cookie to this post, so each gallery keeps its own picks and the
 * browser only ever sends back the one for the page you're actually on.
 * @param {Set<number>} picked
 * @param {number} total
 */
function cookie_write(picked, total) {
  const path = location.pathname
  const opts = `path=${path}; SameSite=Lax`
  // written raw, so it stays readable in devtools: `zotf=38:0-12,15,19-23`.  We only
  // ever emit digits, ':', ',' and '-'; RFC 6265 allows ':' and '-' outright, and
  // every browser accepts ',' in a cookie value.
  document.cookie = picked.size
    ? `${COOKIE}=${total}:${encode_ranges(picked)}; ${opts}; max-age=${COOKIE_MAX_AGE}`
    : `${COOKIE}=; ${opts}; max-age=0`
}


// -------------------------------------------------------------- file discovery

/**
 * The URL to actually put in the zip.  A page typically shows a cheap preview but
 * links the real file -- a web-sized image linking its full-rez original, or a
 * waveform thumbnail linking its mp3 -- so prefer the link.  The link is also a
 * stronger "this is content" signal than size is: nobody links an icon to a 23MB
 * file.
 * @param {HTMLImageElement} el
 * @returns {string|null}
 */
/**
 * The URL to *fetch*, which is not always the URL to *link*.
 *
 * archive.org/serve/ is the right thing to put in an href: it is the durable form and
 * it serves recognised image types inline with `access-control-allow-origin: *`.  But
 * for a type it doesn't recognise -- .heic, say -- it 302s to the storage node, and
 * that response carries no CORS header at all, so fetch() fails.  And it fails as an
 * opaque CORS error rather than a status, which is a miserable thing to debug.
 *
 * cors.archive.org/cors/ answers every type with a CORS header, at the cost of
 * `application/octet-stream` (which is exactly why it's wrong for the href -- the
 * browser downloads instead of displaying).  So: link one, fetch the other.
 * @param {string} url
 * @returns {string}
 */
function fetchable(url) {
  return url.replace(
    /^https?:\/\/(?:www\.)?archive\.org\/(?:serve|download)\//,
    'https://cors.archive.org/cors/',
  )
}


function linked_url(el) {
  const href = el.closest('a')?.href
  return href && MEDIA_RE.test(href) ? href : null
}


/**
 * Indices are positions in *every* in-scope element, not just the eligible ones, so
 * they stay stable no matter what order previews finish loading in.
 *
 * Only <img>-anchored files are found today.  A bare directory listing -- <a> links
 * with no <img>, as archive.org item pages render -- would mean also collecting
 * `scope.querySelectorAll('a[href]')` that pass MEDIA_RE and hold no <img>, and
 * giving ZotfPick an inline layout, since there's no picture to float a button over.
 * @returns {{els: HTMLImageElement[], scope: Element}}
 */
function scan() {
  const content = document.querySelector('.post.single .content')
  // a plain page (or another repo's listing) has no post wrapper -- scan the lot
  const scope = content?.querySelector('img') ? content : document.body
  const els = [...scope.querySelectorAll('img')]
    // the theme repeats the post's `featured:` image at the top of .content, in a
    // different format -- zipping it would hand you the same file twice
    .filter((el) => !el.closest('a.image.featured'))
  return { els, scope }
}


/**
 * @param {HTMLImageElement} el
 * @returns {boolean} whether this file is worth offering for download
 */
function eligible(el) {
  if (linked_url(el))
    return true
  // naturalWidth is 0 until decoded, so undecided previews get re-checked on load
  return el.naturalWidth > MIN_WIDTH
}


/**
 * @param {HTMLImageElement} el
 * @returns {string} zip entry name
 */
function entry_name(el) {
  const url = linked_url(el) ?? el.currentSrc ?? el.src
  const base = new URL(url, location.href).pathname.split('/').pop()
  return decodeURIComponent(base || 'file')
}


/**
 * Sum the sizes of what's about to be zipped, for the browsers that have to buffer
 * it all in memory.  HEADs are cheap, but 600 at once is not, so trickle them.
 * @param {string[]} urls
 * @returns {Promise<number>} bytes, or 0 if any server declined to say
 */
async function total_bytes(urls) {
  const queue = [...urls]
  let bytes = 0
  let known = true

  const worker = async () => {
    for (let url = queue.pop(); url; url = queue.pop()) {
      try {
        const res = await fetch(url, { method: 'HEAD' })
        const len = Number(res.headers.get('content-length'))
        if (len > 0)
          bytes += len
        else
          known = false
      } catch {
        known = false
      }
    }
  }
  await Promise.all(Array.from({ length: HEAD_CONCURRENCY }, worker))
  return known ? bytes : 0
}


/**
 * @param {number} bytes
 * @returns {string}
 */
function human(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i += 1
  }
  return `${n < 10 && i ? n.toFixed(1) : Math.round(n)}${units[i]}`
}


// ---------------------------------------------------------- per-file overlay

/**
 * Wraps one file's preview in the light DOM.  A real wrapper element means the overlay
 * positions itself with plain CSS -- no getBoundingClientRect bookkeeping on every
 * scroll and resize.
 */
class ZotfPick extends LitElement {
  static properties = {
    idx: { type: Number },
    picked: { type: Boolean, reflect: true },
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
    }
    button {
      background: rgba(0, 0, 0, 0.45);
      border: 0;
      border-radius: 50%;
      cursor: pointer;
      height: 5.5rem;
      opacity: 0.55;
      padding: 1.1rem;
      position: absolute;
      right: 0.75rem;
      top: 0.75rem;
      transition: opacity 0.15s ease, background-color 0.15s ease;
      width: 5.5rem;
    }
    button:hover,
    button:focus-visible {
      opacity: 1;
    }
    :host([picked]) button {
      background: ${ACCENT};
      opacity: 1;
    }
    svg {
      display: block;
      fill: none;
      stroke: #fff;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
      width: 100%;
    }
  `

  render() {
    return html`
      <slot></slot>
      <button
        @click=${this.#toggle}
        aria-pressed=${this.picked ? 'true' : 'false'}
        title=${this.picked ? 'Remove from zip' : 'Add to zip'}
      >${DOWNLOAD_SVG}</button>
    `
  }

  /** @param {MouseEvent} ev */
  #toggle(ev) {
    // the preview is often wrapped in a link to the real file; don't navigate
    ev.preventDefault()
    ev.stopPropagation()
    this.dispatchEvent(new CustomEvent('zotf-toggle', {
      bubbles: true,
      composed: true,
      detail: { idx: this.idx },
    }))
  }
}
customElements.define('zotf-pick', ZotfPick)


// ------------------------------------------------------------ the controller

/**
 * One per page.  Owns the nav button, the picks, and the zip itself.
 *
 * The nav button has three states, so that "click again to download" stays
 * unambiguous:
 *   pick mode off        -- click turns it on (and restores any saved picks)
 *   on, nothing picked   -- click turns it back off
 *   on, 1+ picked        -- click starts the zip
 */
class ZipOnTheFly extends LitElement {
  static properties = {
    picking: { type: Boolean },
    status: { type: String },
    done: { type: Number },
    zipping: { type: Boolean },
  }

  static styles = css`
    :host {
      color: #222;
      font: 14px/1.4 system-ui, sans-serif;
    }
    .toast {
      background: #fff;
      border-radius: 6px;
      bottom: 1rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
      left: 50%;
      padding: 0.75rem 1rem;
      position: fixed;
      transform: translateX(-50%);
      width: min(22rem, calc(100vw - 2rem));
      z-index: 1000;
    }
    .track {
      background: #f3f3f3;
      border: 1px solid #ccc;
      border-radius: 4px;
      overflow: hidden;
    }
    .bar {
      background: ${ACCENT};
      height: 1.25rem;
      transition: width 0.3s ease;
    }
    .label {
      color: #555;
      display: block;
      margin-top: 0.4rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .all {
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 6px;
      bottom: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      cursor: pointer;
      /* #back-to-top already owns the bottom-right corner */
      left: 1rem;
      padding: 0.6rem 0.9rem;
      position: fixed;
      z-index: 1000;
    }
  `

  /** @type {HTMLImageElement[]} every in-scope element, in DOM order -- indices */
  #els = []
  /** @type {Map<number, ZotfPick>} */
  #wrappers = new Map()
  /** @type {Set<number>} */
  #picked = new Set()
  /** @type {HTMLAnchorElement[]} */
  #nav = []
  #total_files = 0

  connectedCallback() {
    super.connectedCallback()
    this.picking = false
    this.zipping = false
    this.status = ''
    this.done = 0

    const { els } = scan()
    this.#els = els
    this.#picked = cookie_read(els.length)

    this.#install_nav()
    // on `document`, not on `this`: the <zotf-pick> wrappers live out in the post
    // content, so their events never pass through this element
    document.addEventListener('zotf-toggle', (ev) => this.#toggle(ev.detail.idx))

    // an undecided preview becomes eligible once it decodes and we can read its width
    for (const el of els) {
      if (!el.complete)
        el.addEventListener('load', () => this.#refresh_overlays(), { once: true })
    }
    log(`ZOTF: ${els.length} files in scope, ${this.#picked.size} picked from cookie`)
  }

  render() {
    if (!this.picking && !this.zipping)
      return html``

    const pct = this.#total_files ? Math.round((this.done / this.#total_files) * 100) : 0
    return html`
      ${this.zipping
        ? html`
          <div class="toast" role="status">
            <div class="track"><div class="bar" style="width:${pct}%"></div></div>
            <small class="label">${this.status}</small>
          </div>`
        : html`
          <button class="all" @click=${this.#toggle_all}>
            ${this.#picked.size === this.#eligible_indices().length ? 'Unselect all' : 'Select all'}
          </button>`}
    `
  }

  // --------------------------------------------------------------- nav button

  /**
   * The theme renders two search toggles -- an icon in the nav bar (>=425px) and a
   * text link inside the mobile flyout -- so mirror both or the button vanishes on
   * phones.  Font Awesome is already bundled, so `fas fa-download` matches exactly.
   */
  #install_nav() {
    const nav = document.querySelector('#site-nav')
    if (!nav)
      return warn('ZOTF: no #site-nav found; nav button not installed')

    document.head.insertAdjacentHTML('beforeend', `<style>
      .zotf-toggle { display: none; position: relative; text-align: center; width: 61px }
      .zotf-toggle i { vertical-align: middle }
      .zotf-toggle.zotf-armed { color: ${ACCENT} }
      .zotf-badge {
        background: ${ACCENT}; border-radius: 999px; color: #fff; font-size: 11px;
        font-style: normal; line-height: 1.5; min-width: 1.5em; padding: 0 .35em;
        position: absolute; right: .5rem; top: .35rem;
      }
      #site-nav-menu .zotf-toggle { display: block; flex-basis: 100%; order: 3; text-align: left; width: auto }
      #site-nav-menu .zotf-toggle .zotf-badge { position: static; margin-left: .5em }
      @media (min-width: 425px) {
        .zotf-toggle { display: block }
        #site-nav-menu .zotf-toggle { display: none }
      }
    </style>`)

    // icon-only, in the nav bar itself
    const icon = document.createElement('a')
    icon.href = '#zotf'
    icon.className = 'nav zotf-toggle'
    icon.innerHTML = '<i class="fas fa-download fa-2x">&nbsp;</i>'
    const search_icon = nav.querySelector(':scope > a.search-toggle')
    if (search_icon)
      search_icon.before(icon)
    else
      nav.append(icon)

    // text link, for the mobile flyout
    const menu = nav.querySelector('#site-nav-menu')
    const link = document.createElement('a')
    link.href = '#zotf'
    link.className = 'nav link zotf-toggle'
    link.innerHTML = '<i class="fas fa-download">&nbsp;</i>Download'
    const search_link = menu?.querySelector('.search-toggle')
    if (search_link)
      search_link.before(link)
    else
      menu?.append(link)

    this.#nav = [icon, link]
    for (const el of this.#nav) {
      el.addEventListener('click', (ev) => {
        ev.preventDefault()
        void this.#nav_click()
      })
    }
    this.#paint_nav()
  }

  /**
   * Show the restored count on load, so a reload visibly says "you still have 12
   * picked" without having to enter pick mode to find out.
   */
  #paint_nav() {
    const n = this.#picked.size
    for (const el of this.#nav) {
      el.classList.toggle('zotf-armed', n > 0)
      el.querySelector('.zotf-badge')?.remove()
      if (n) {
        const badge = document.createElement('i')
        badge.className = 'zotf-badge'
        badge.textContent = `${n}`
        el.append(badge)
      }
      el.title = !this.picking
        ? (n ? `Pick files to zip (${n} already picked)` : 'Pick files to zip')
        : (n ? `Download ${n} file${n === 1 ? '' : 's'} as a zip` : 'Done picking')
    }
  }

  async #nav_click() {
    if (this.zipping)
      return
    if (!this.picking) {
      this.picking = true
      this.#refresh_overlays()
    } else if (this.#picked.size === 0) {
      this.picking = false
      this.#refresh_overlays()
    } else {
      await this.#zip()
    }
    this.#paint_nav()
  }

  // ------------------------------------------------------------------- picks

  /** @returns {number[]} indices of files worth offering */
  #eligible_indices() {
    return this.#els.flatMap((el, idx) => (eligible(el) ? [idx] : []))
  }

  /** Add overlays for newly-eligible files, and tear them all down on exit. */
  #refresh_overlays() {
    if (!this.picking) {
      for (const [, wrapper] of this.#wrappers)
        wrapper.replaceWith(...wrapper.childNodes)
      this.#wrappers.clear()
      return this.requestUpdate()
    }

    for (const idx of this.#eligible_indices()) {
      if (this.#wrappers.has(idx))
        continue
      const el = this.#els[idx]
      // wrap the link rather than the preview where there is one, so the overlay
      // button isn't a descendant of an <a> pointing at the full-rez file
      const target = linked_url(el) ? el.closest('a') : el
      const wrapper = /** @type {ZotfPick} */ (document.createElement('zotf-pick'))
      wrapper.idx = idx
      wrapper.picked = this.#picked.has(idx)
      target.replaceWith(wrapper)
      wrapper.append(target)
      this.#wrappers.set(idx, wrapper)
    }
    this.requestUpdate()
  }

  /** @param {number} idx */
  #toggle(idx) {
    if (this.#picked.has(idx))
      this.#picked.delete(idx)
    else
      this.#picked.add(idx)

    const wrapper = this.#wrappers.get(idx)
    if (wrapper)
      wrapper.picked = this.#picked.has(idx)

    // written on every click, so a lost connection or an accidental reload
    // doesn't cost someone their selection
    cookie_write(this.#picked, this.#els.length)
    this.#paint_nav()
    this.requestUpdate()
  }

  #toggle_all() {
    const all = this.#eligible_indices()
    const none = this.#picked.size === all.length
    this.#picked = none ? new Set() : new Set(all)
    for (const [idx, wrapper] of this.#wrappers)
      wrapper.picked = this.#picked.has(idx)
    cookie_write(this.#picked, this.#els.length)
    this.#paint_nav()
    this.requestUpdate()
  }

  // --------------------------------------------------------------------- zip

  /**
   * Fetch each file only as client-zip pulls it.  Fetching all of them up front
   * would open hundreds of connections and hold hundreds of unread response bodies
   * while the zip is written one entry at a time -- which is how you run a browser
   * out of memory on a 600-file listing.
   * @param {{name: string, url: string}[]} items
   */
  async* #entries(items) {
    for (const item of items) {
      this.status = `Fetching ${item.name}…`
      const res = await fetch(item.url)
      if (!res.ok)
        throw new Error(`${item.name}: ${res.status} ${res.statusText}`)
      if (!res.body)
        throw new Error(`${item.name}: empty response`)

      const counted = res.body.pipeThrough(new TransformStream({
        flush: () => {
          // fires when client-zip has pulled this file's last chunk
          this.done += 1
        },
      }))
      yield { name: item.name, input: counted }
    }
  }

  async #zip() {
    const picked = [...this.#picked]
      .sort((a, b) => a - b)
      .map((idx) => ({
        name: entry_name(this.#els[idx]),
        url: fetchable(linked_url(this.#els[idx])
          ?? this.#els[idx].currentSrc ?? this.#els[idx].src),
      }))

    // the same photo can legitimately appear twice on a page -- a "best of" block at
    // the top repeating shots that also appear in sequence.  Two identical names in
    // one zip is untidy at best, so keep the first of each.
    const seen = new Set()
    const items = picked.filter((i) => !seen.has(i.url) && seen.add(i.url))

    // Distinct files can still collide on name, because entry_name() keeps only the
    // basename: two cameras both numbering DSC_0145.JPG land on one zip entry, and
    // most unzippers silently overwrite rather than complain -- you get 494 files
    // out of a 501-file pick and nothing says so.  Qualify only the ones that
    // actually clash, so an ordinary pick still unzips flat.
    const by_name = new Map()
    for (const i of items)
      by_name.set(i.name, (by_name.get(i.name) ?? 0) + 1)
    for (const i of items) {
      if (by_name.get(i.name) < 2)
        continue
      const parts = new URL(i.url, location.href).pathname.split('/').filter(Boolean)
      const parent = parts.length > 1 ? decodeURIComponent(parts[parts.length - 2]) : ''
      if (parent)
        i.name = `${parent}/${i.name}`
    }

    const streaming = 'showSaveFilePicker' in globalThis
    if (!streaming) {
      const bytes = await total_bytes(items.map((i) => i.url))
      if (bytes > BLOB_LIMIT) {
        const ok = confirm(
          `This browser can't stream a zip to disk, so all ${human(bytes)} has to be `
          + 'held in memory first -- which will probably fail.\n\n'
          + 'Try Chrome, Edge or Firefox on a desktop, or pick fewer files.\n\nAttempt anyway?',
        )
        if (!ok)
          return
      }
    }

    this.zipping = true
    this.done = 0
    this.#total_files = items.length
    this.status = `Preparing ${items.length} file${items.length === 1 ? '' : 's'}…`

    const zip_name = `${location.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'download'}.zip`

    try {
      const res = downloadZip(this.#entries(items))

      if (streaming) {
        log('ZOTF: streaming straight to disk')
        this.status = 'Waiting for save location…'
        const handle = await globalThis.showSaveFilePicker({
          suggestedName: zip_name,
          types: [{ description: 'ZIP Archive', accept: { 'application/zip': ['.zip'] } }],
        })
        this.status = 'Streaming to disk…'
        await res.body.pipeTo(await handle.createWritable())
      } else {
        warn('ZOTF: no showSaveFilePicker; buffering zip in memory')
        this.status = 'Building zip in memory…'
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = zip_name
        a.click()
        URL.revokeObjectURL(a.href)
      }

      this.status = 'Download complete!'
      log(`ZOTF: wrote ${zip_name}`)
      // the picks did their job; clear them so the next visit starts fresh
      this.#picked = new Set()
      cookie_write(this.#picked, this.#els.length)
      this.picking = false
      this.#refresh_overlays()
      setTimeout(() => { this.zipping = false }, 3000)
    } catch (err) {
      this.zipping = false
      if (err.name === 'AbortError') {
        log('ZOTF: save dialog cancelled')
        return
      }
      // picks are still in the cookie, so they can just hit download again
      // eslint-disable-next-line no-console
      console.error('ZOTF: zip failed:', err)
      alert(`Could not download those files: ${err.message}\n\nYour selection was kept -- try again.`)
    }
  }
}
customElements.define('zip-on-the-fly', ZipOnTheFly)


// `type=module` scripts are deferred, so the document is already parsed here.
// Identical module URLs are only evaluated once, but a page that reaches this file by
// two different paths would otherwise get two nav buttons -- so check first.
if (!document.querySelector('zip-on-the-fly'))
  document.body.append(document.createElement('zip-on-the-fly'))
