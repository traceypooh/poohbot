/* eslint-disable no-bitwise */

// Base64-encodes a binary string slice. (CryptoMX Tools, GPL v2+, © 2004-2006 Derek Buitenhuis)
const KEY64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

function encodeStream64(filestream, beg = 0, fin = filestream.length) {
  let output = ''
  let i = beg
  do {
    const chr1 = filestream.charCodeAt(i) & 0xff
    i += 1
    const chr2 = filestream.charCodeAt(i) & 0xff
    i += 1
    const chr3 = filestream.charCodeAt(i) & 0xff
    i += 1
    const enc1 = chr1 >> 2
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
    let enc4 = chr3 & 63
    if (isNaN(chr2)) {
      enc3 = 64
      enc4 = 64
    } else if (isNaN(chr3)) {
      enc4 = 64
    }
    output += KEY64[enc1] + KEY64[enc2] + KEY64[enc3] + KEY64[enc4]
  } while (i < fin)
  return output
}

export default class MotionJpeg {
  constructor(mapId = 'map') {
    this.map = document.getElementById(mapId)
    this.fi = null          // loaded filestream
    this.prevStart = 0      // byte offset of last found JPEG frame start
    this.frames = []        // [{start, end}] byte ranges for each decoded frame
    this.currentFrame = -1
    this.fps = 0
    this.delay = 0
    this.timerId = null
  }

  // fetches binary files synchronously via XHR (sync XHR deprecated; still works locally)
  loadUrl(url) {
    const req = new XMLHttpRequest()
    req.open('GET', url, false)
    // XHR binary charset trick by Marcus Granado 2006
    req.overrideMimeType('text/plain; charset=x-user-defined')
    req.send(null)
    return req.status === 200 ? req.responseText : ''
  }

  // initialise and start playing an .avi -- local to this HTM/JS file
  play(avi, fps) {
    this.stop()
    this.fi = null
    this.prevStart = 0
    this.frames = []
    this.currentFrame = -1
    this.fps = fps
    this.delay = (navigator.userAgent.includes(' Firefox') ? 3 : 1) *
                 Math.round(1000 / fps)
    this.map.innerHTML = `loading ${avi} (${fps} FPS)...`
    setTimeout(() => {
      this.fi = this.loadUrl(avi)
      this.map.innerHTML = '<img id="mj-frame">'
      document.getElementById('mj-controls').hidden = false
      this.mjpeg(0)
    }, this.delay)
  }

  stop() {
    if (this.timerId) clearTimeout(this.timerId)
    this.timerId = null
  }

  // render a specific frame by index (re-encodes from stored byte range on demand)
  showFrame(idx) {
    const i = Math.max(0, Math.min(idx, this.frames.length - 1))
    this.currentFrame = i
    const { start, end } = this.frames[i]
    const img = document.getElementById('mj-frame')
    if (img) img.src = `data:image/jpg;base64,${encodeStream64(this.fi, start, end)}`
  }

  // stop autoplay and step n frames (negative = back, ±fps = ±1 second)
  step(n) {
    this.stop()
    if (this.frames.length) this.showFrame(this.currentFrame + n)
  }

  mjpeg(start) {
    for (let i = start; i <= this.fi.length; i += 1) {
      // Canon Elph JPEG frames: ffd8ffe0 0010 "AVI1"
      if ((this.fi.charCodeAt(i)     & 0xff) === 0xff &&
          (this.fi.charCodeAt(i + 1) & 0xff) === 0xd8 &&
          (this.fi.charCodeAt(i + 2) & 0xff) === 0xff &&
          (this.fi.charCodeAt(i + 3) & 0xff) === 0xe0 &&
          (this.fi.charCodeAt(i + 4) & 0xff) === 0x00 &&
          (this.fi.charCodeAt(i + 5) & 0xff) === 0x10 &&
          (this.fi.charCodeAt(i + 6) & 0xff) === 0x41 &&  // A
          (this.fi.charCodeAt(i + 7) & 0xff) === 0x56 &&  // V
          (this.fi.charCodeAt(i + 8) & 0xff) === 0x49 &&  // I
          (this.fi.charCodeAt(i + 9) & 0xff) === 0x31) {  // 1
        if (this.prevStart) {
          // scan for ffd9 (JPEG EOI) to find the clean frame end
          let prevEnd = i - 1
          for (let j = this.prevStart; j < i - 1; j += 1) {
            if ((this.fi.charCodeAt(j)     & 0xff) === 0xff &&
                (this.fi.charCodeAt(j + 1) & 0xff) === 0xd9) {
              prevEnd = j + 2
              break
            }
          }
          // eslint-disable-next-line no-console
          console.log(`frame @bytes: [=${this.prevStart}..~${prevEnd}]`)
          this.frames.push({ start: this.prevStart, end: prevEnd })
          this.showFrame(this.frames.length - 1)
        }
        this.prevStart = i
        this.timerId = setTimeout(() => this.mjpeg(i + 1), this.delay)
        break
      }
    }
  }

  testImg(src) {
    this.fi = this.loadUrl(src)
    this.map.innerHTML = `<img src="data:image;base64,${encodeStream64(this.fi)}"> `
    this.fi = null
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const mj = new MotionJpeg()

  document.querySelectorAll('[data-mj-src]').forEach((btn) => {
    btn.addEventListener('click', () => mj.testImg(btn.dataset.mjSrc))
  })
  document.querySelectorAll('[data-mj-avi]').forEach((btn) => {
    btn.addEventListener('click', () => mj.play(btn.dataset.mjAvi, Number(btn.dataset.mjFps)))
  })

  document.getElementById('mj-stop')?.addEventListener('click', () => mj.stop())
  document.querySelectorAll('[data-mj-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { mjStep } = btn.dataset
      let n
      if (mjStep === 'fps')       n = mj.fps
      else if (mjStep === '-fps') n = -mj.fps
      else                        n = Number(mjStep)
      mj.step(n)
    })
  })

  // populate #src textarea with page body + this script's source
  fetch('/js/motion-jpeg.js').then((r) => r.text()).then((js) => {
    const src = document.getElementById('src')
    if (src) src.textContent = `${document.getElementById('bodydiv').innerHTML}<script>${js}</script>`
  })
})
