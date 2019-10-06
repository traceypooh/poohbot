// NOTE: you can run this companion file 'lacer.php' on the command-line
// to take a source video file and output some 1/2-height fields yourself.
// Example:
//     php lacer.php good.mov  0.5  0.7

const BFF = true // DV is typically Bottom Field First.  Set to 0/falsey if Top Field First
const BASE = 'https://archive.org/download/lacer/' // imagery base url

// NOTE: the PNG used below are all 720x240
const WD = 720
const HT = 240

// parse a CGI arg
function arg(theArgName) {
  const sArgs = location.search.slice(1).split('&')
  let r = ''
  for (var i = 0; i < sArgs.length; i++) {
    if (sArgs[i].slice(0,sArgs[i].indexOf('=')) === theArgName) {
      r = sArgs[i].slice(sArgs[i].indexOf('=') + 1)
      break
    }
  }
  return (r.length > 0 ? unescape(r).split(',') : '')
}


$.getJSON('https://archive.org/metadata/lacer/files', (json) => {

  console.log(json)

  let IMGS = []
  const twothree = arg('alt')  ||  arg('deinterlaced')
  for (const file of json.result) {
    const twothreeFi = file.name.match(/2323\/.*\.png$/)
    if (( twothree  &&   twothreeFi)  ||
        (!twothree  &&  !twothreeFi  &&  file.name.match(/[^\/]+\.png$/))) {
      console.log(file.name)
      IMGS.push(file.name)
    }
  }
  IMGS = IMGS.sort()
  console.log(IMGS)

  if (arg('deinterlaced')) {
    // counting first field as 0, throw out fields 3 and 4.
    // continue that pattern every 10 fields...
    IMGS = IMGS.filter((val,idx) => (3 !== idx % 10  &&  4 !== idx % 10))
  }


  let htm = ''
  if (arg('all')) {
    for (let im of IMGS)
      htm += `<div class="ttl ghost roundbox5">${im}</div><img src="${BASE + im}"><br/>`
  }


  const shift = (arg('shift') === '' ? 0 : parseInt(arg('shift'), 0))
  const url =
    '/lacer/?' +
    (arg('alt') ? 'alt=1&' : '') +
    (arg('deinterlaced') ? 'deinterlaced=1&' : '')


  if (arg('pick') !== '') {
    htm += `
  <form>
    <div class="topinblock">
    Top field:<br/>
    <select name="tN" size="50">
      ${IMGS.map((val, i) => `
        <option value="${i}">${val}</option>
      `).join('')}
    </select>
    </div>
    <div class="topinblock">
    Bottom field:<br/>
    <select name="bN" size=50>
      ${IMGS.map((val, i) => `
        <option value="${i}">${val}</option>
      `).join('')}
    </select>
    </div>
    <input type="submit"/>
  </form>
  <br/>
  <a href="${url}all=1">show all fields</a>`

    $('#js-form').html(htm)
    return
  }


  const tN = (arg('tN') !== '' ? parseInt(arg('tN'), 10) : (BFF ? 1 : 0))
  const bN = (arg('bN') !== '' ? parseInt(arg('bN'), 10) : (BFF ? 0 : 1))

  const t = BASE + IMGS[tN]
  const b = BASE + IMGS[bN]



  htm += `<div id="lacer" style="width:${WD}px; height:${2*HT}px">`
  for (let y = 0; y <= HT; y++) {
    // CSS MAGIC!
    const line = `clip:rect(${y}px ${WD}px ${y+1}px 0px)`
    htm += `<img src="${BFF ? b : t}" style="top:${y  }px; ${line};">`
    htm += `<img src="${BFF ? t : b}" style="top:${y+1}px; ${line}; left:${shift}px;">`
  }
  htm += '</div>'

  htm += (BFF
? `bot ==> ${b}<br/>top ==> ${t}<br/>
<div class="note">
  (NOTE: showing bottom field first since DV source,
  so first line you see above is from a 'bottom field')
</div><br/>`
: `top ==> ${t}<br/>bot ==> ${b}<br/>`
) + `
 [ <a href="${url}bN=${bN+2}&tN=${tN+2}">NEXT PAIR</a>
 | <a href="${url}bN=${bN-2}&tN=${tN-2}">PREV PAIR</a>
 | <a href="${url}bN=${tN}&tN=${bN}">SWAP TOP/BOTTOM</a>
 | <a href="${url}bN=${bN}&tN=${tN}&shift=${shift-1}">SHIFT X LEFT 1</a>
 | <a href="${url}bN=${bN}&tN=${tN}&shift=${shift+1}">SHIFT X RIGHT 1</a>
 | <a href="/lacer/">START OVER</a>
 | <a href="${url}pick=1">PICK TWO FIELDS</a>
 ]<br/>` +

(arg('alt')
? ` [ <a href="/lacer/">original set</a>
 | alternate 3:2 pulldown DV sample set
 | <a href="/lacer/?deinterlaced=1">alternate set - deinterlaced</a>
 ] <br>`
: (arg('deinterlaced')
  ? `[ <a href="/lacer/">original set</a>
   | <a href="/lacer/?alt=1">alternate 3:2 pulldown DV sample set</a>
   | alternate set - deinterlaced
   ] <br>`
  : `[ original set".
   | <a href="/lacer/?alt=1">alternate 3:2 pulldown DV sample set</a>
   | <a href="/lacer/?deinterlaced=1">alternate set - deinterlaced</a>
   ] <br>`
  )
)
  $('#js-form').html(htm)
})
