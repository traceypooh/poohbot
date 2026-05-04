
function shuffleTiles(div) {
  const tiles = Array.from(div.querySelectorAll('li'))
  const positions = tiles.map((li) => ({
    x: li.style.backgroundPositionX,
    y: li.style.backgroundPositionY,
  }))
  for (let i = positions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }
  for (let i = 0; i < tiles.length; i += 1) {
    tiles[i].style.backgroundPositionX = positions[i].x
    tiles[i].style.backgroundPositionY = positions[i].y
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const src = 'https://traceypooh.com/albums/images/2007_10_14%20key%20west/keyWest_0136_tj.jpg'
  const cuts = 5

  const img = new Image()
  img.onload = function () {
    const div = document.getElementById('pieces')
    const wdP = div.offsetWidth
    const htP = 0.8 * innerHeight
    div.style.height = `${htP}px`

    const leftOffset = (img.naturalWidth > wdP ? (img.naturalWidth - wdP) / 4 : 0)

    const splitW = Math.min(wdP, img.width) - cuts * 10
    const splitH = Math.min(htP, img.height) - cuts * 5

    const wd = Math.floor(splitW / cuts)
    const ht = Math.floor(splitH / cuts)

    // tile up the image, perfectly...
    for (let top = 0; splitH >= top + ht; top += ht) {
      for (let left = 0; splitW >= left + wd; left += wd) {
        const li = document.createElement('li')
        li.style.width = `${wd}px`
        li.style.height = `${ht}px`
        li.style.backgroundImage = `url(${src})`
        li.style.backgroundPositionX = `${-left - leftOffset}px`
        li.style.backgroundPositionY = `${-top}px`
        li.style.margin = '3px'
        li.draggable = true
        div.appendChild(li)
      }
    }

    document.getElementById('shuffle').addEventListener('click', () => shuffleTiles(div))

    let dragSrc = null

    div.addEventListener('dragstart', (e) => {
      dragSrc = e.target
      e.dataTransfer.effectAllowed = 'move'
    })

    div.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    })

    div.addEventListener('drop', (e) => {
      e.preventDefault()
      if (!dragSrc || dragSrc === e.target) return
      const target = e.target.closest('li')
      if (!target) return
      // swap background positions
      const tmpX = dragSrc.style.backgroundPositionX
      const tmpY = dragSrc.style.backgroundPositionY
      dragSrc.style.backgroundPositionX = target.style.backgroundPositionX
      dragSrc.style.backgroundPositionY = target.style.backgroundPositionY
      target.style.backgroundPositionX = tmpX
      target.style.backgroundPositionY = tmpY
    })
  }
  img.src = src
})
