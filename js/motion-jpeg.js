

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

// Canon Motion JPEG stores the shared Huffman table in the AVI container, not
// each frame. Chrome/Firefox tolerate its absence; macOS Preview does not.
// Inject the standard tables (ISO 10918-1 Annex K) before the SOS marker.
const DHT_SEGMENT = Uint8Array.from([
  0xFF, 0xC4, 0x01, 0xA2,
  0x00,  // DC luminance (TC=0, TH=0)
  0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B,
  0x01,  // DC chrominance (TC=0, TH=1)
  0x00, 0x03, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B,
  0x10,  // AC luminance (TC=1, TH=0)
  0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
  0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08, 0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0,
  0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
  0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
  0x6A, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7,
  0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5,
  0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
  0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8,
  0xF9, 0xFA,
  0x11,  // AC chrominance (TC=1, TH=1)
  0x00, 0x02, 0x01, 0x02, 0x04, 0x04, 0x03, 0x04, 0x07, 0x05, 0x04, 0x04, 0x00, 0x01, 0x02, 0x77,
  0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71,
  0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xA1, 0xB1, 0xC1, 0x09, 0x23, 0x33, 0x52, 0xF0,
  0x15, 0x62, 0x72, 0xD1, 0x0A, 0x16, 0x24, 0x34, 0xE1, 0x25, 0xF1, 0x17, 0x18, 0x19, 0x1A, 0x26,
  0x27, 0x28, 0x29, 0x2A, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
  0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
  0x69, 0x6A, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
  0x88, 0x89, 0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3, 0xA4, 0xA5,
  0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3,
  0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA,
  0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8,
  0xF9, 0xFA,
])

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

  // inject DHT tables if absent; returns Uint8Array ready for Blob download
  fixJpeg(start, end) {
    const len = end - start
    const raw = new Uint8Array(len)
    for (let i = 0; i < len; i += 1) {
      raw[i] = this.fi.charCodeAt(start + i) & 0xff
    }
    let hasDHT = false
    let sosPos = len
    let pos = 2  // skip SOI (FF D8)
    while (pos + 3 < len && raw[pos] === 0xff) {
      const marker = raw[pos + 1]
      // eslint-disable-next-line @stylistic/max-statements-per-line
      if (marker === 0xc4) { hasDHT = true; break }
      // eslint-disable-next-line @stylistic/max-statements-per-line
      if (marker === 0xda) { sosPos = pos; break }
      if (marker === 0xd9) break
      const segLen = (raw[pos + 2] << 8) | raw[pos + 3]
      pos += 2 + segLen
    }
    if (hasDHT) return raw
    const fixed = new Uint8Array(raw.length + DHT_SEGMENT.length)
    fixed.set(raw.subarray(0, sosPos))
    fixed.set(DHT_SEGMENT, sosPos)
    fixed.set(raw.subarray(sosPos), sosPos + DHT_SEGMENT.length)
    return fixed
  }

  // download current frame as a self-contained JPEG (DHT tables injected if needed)
  saveFrame() {
    if (this.currentFrame < 0 || !this.frames.length) return
    const { start, end } = this.frames[this.currentFrame]
    const fixed = this.fixJpeg(start, end)
    const blob = new Blob([fixed], { type: 'image/jpeg' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `frame-${String(this.currentFrame + 1).padStart(4, '0')}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
  document.getElementById('mj-save')?.addEventListener('click', () => mj.saveFrame())
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
  void fetch('/js/motion-jpeg.js').then((r) => r.text()).then((js) => {
    const src = document.getElementById('src')
    if (src) src.textContent = `${document.getElementById('bodydiv').innerHTML}<script>${js}</script>`
  })
})
