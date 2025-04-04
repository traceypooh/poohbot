/* eslint-disable no-console */
/* eslint-disable no-console, no-alert */

// was 0
// modeval is 1 for gear inches, 12.5 for meters, crank _diam._ for gain ratio
// this currently is not working xxx
// const modeval = 1

let nWheel = 1

// Extra multiplier for MPH data - based on GearInches (xxx?)
let mphmult = 1
let modename
let hubMult
let nHub
let nCassette
let nMode
let tiresize
let cranklength
let cassettename
let rings
let rears


class Gears {
  static clearit() {
    Gears.fill([['', '', ''], ['', '', '', '', '', '', '', '', '', '']], true)

    const gearwin = document.getElementById('gearwin')
    gearwin.innerHTML = 'For the most basic/quickest use, simply select enter the double or triple front ring gear tooth sizes (they are typically imprinted on the rings themselves), pick a "Stock Cassette", then hit "Calculate".  If your rear cassette is not in the list, enter the 7 to 10 gear teeth values in the "Custom Cassette" section.'
    return false
  }


  /**
   * enters gear values into the form
   * @param {object} gears
   * @param {boolean} clear
   */
  static fill(gears, clear = false) {
    for (let n = 0; n < 3; n++)
      document.ringform[`ring${n + 1}`].value = gears[0][n] || ''
    for (let n = 0; n < 13; n++)
      document.ringform[`rear${n + 1}`].value = gears[1][n] || ''

    if (!clear)
      Gears.converter()
  }


  //----------------------------------------------------------
  static get_rings() {
    return [
      parseFloat(document.ringform.ring1.value),
      parseFloat(document.ringform.ring2.value),
      parseFloat(document.ringform.ring3.value),
      0,
    ]
  }

  static get_rears() {
    return [
      parseFloat(document.ringform.rear1.value),
      parseFloat(document.ringform.rear2.value),
      parseFloat(document.ringform.rear3.value),
      parseFloat(document.ringform.rear4.value),
      parseFloat(document.ringform.rear5.value),
      parseFloat(document.ringform.rear6.value),
      parseFloat(document.ringform.rear7.value),
      parseFloat(document.ringform.rear8.value),
      parseFloat(document.ringform.rear9.value),
      parseFloat(document.ringform.rear10.value),
      parseFloat(document.ringform.rear11.value),
      parseFloat(document.ringform.rear12.value),
      parseFloat(document.ringform.rear13.value),
      0,
    ]
  }

  //----------------------------------------------------------
  static calc_rings() {
    const wheelval = parseFloat(nWheel)

    const ringData = new Array(5)
    for (let n = 0; rings[n] > 0; n++) {
      ringData[n] = new Array(15)
      for (let c = 0; rears[c] > 0; c++) {
        ringData[n][c] = ((mphmult * (rings[n] / rears[c])) * wheelval) / nMode
        // xxx - Do rounding at printout instead:
        // ringData[n][c]=rounder(mphmult*(rings[n]/rears[c])*wheelval/nMode)
      }
    }
    return ringData
  }

  //----------------------------------------------------------
  static converter() {
    let viewInteger = document.ringform.diameter.selectedIndex
    let viewString = document.ringform.diameter.options[viewInteger].value
    tiresize = document.ringform.diameter.options[viewInteger].text
    nWheel = parseFloat(viewString)

    viewInteger = document.ringform.crankdiam.selectedIndex
    viewString = document.ringform.crankdiam.options[viewInteger].value
    cranklength = document.ringform.crankdiam.options[viewInteger].text
    const nCrank = parseFloat(viewString)

    viewInteger = document.ringform.modeval.selectedIndex
    viewString = document.ringform.modeval.options[viewInteger].value
    modename = document.ringform.modeval.options[viewInteger].text
    nMode = parseFloat(viewString)

    if (nMode >= 30) { // xxx
      mphmult = nMode / 336.135
      nMode = 1
    } else {
      mphmult = 1.0
    }

    viewInteger = document.ringform.cassette.selectedIndex
    viewString = document.ringform.cassette.options[viewInteger].value
    cassettename = document.ringform.cassette.options[viewInteger].text
    nCassette = viewString

    viewInteger = document.ringform.hubmodel.selectedIndex
    viewString = document.ringform.hubmodel.options[viewInteger].value
    nHub = viewString

    if (!nMode)
      nMode = nCrank

    Gears.main()
    return false
  }

  //----------------------------------------------------------
  //
  // This method rounds the passed number to one decimal place
  // and returns it as a string.
  //
  // Future Enhancement: It should probably check to make sure that
  // the variable passed in *is* a number.
  //
  static rounder(n) {
    const tmp = String(Math.round(n * 10) / 10.0)
    return tmp + (tmp.indexOf('.') < 0 ? '.0' : '')
  }

  //----------------------------------------------------------
  static main() {
    rings = Gears.get_rings()
    if (!rings[0] || isNaN(rings[0])) {
      alert('Enter a chainring value!')
    } else {
      rears = (nCassette === 'Custom'
        ? Gears.get_rears()
        : Gears.parse_cassette()
      )

      const ringData = Gears.calc_rings()
      hubMult = Gears.parse_hubmodel(nHub)
      Gears.showit(ringData)
    }
  }

  //----------------------------------------------------------
  static parse_hubmodel() {
    const hubs = nHub.split('-', 14)
    hubs.push(0)
    return hubs
  }

  //----------------------------------------------------------
  static parse_cassette() {
    rears = nCassette.split('-', 14)
    rears.push(0)
    return rears
  }

  //----------------------------------------------------------
  static percentrear(c) {
    let percentage = 1
    percentage = Gears.rounder((rears[c + 1] / rears[c]) * 100 - 100)
    if (rears[c] > rears[c + 1])
      percentage = Gears.rounder((rears[c] / rears[c + 1]) * 100 - 100)

    if (rears[c + 1] > 0)
      return (`<tr><td><FONT SIZE=-1>${percentage} %</FONT></td></tr>`)
    return ''
  }

  //----------------------------------------------------------
  static percentfront(rnum) {
    let percentage = 1
    percentage = Gears.rounder((rings[rnum - 1] / rings[rnum]) * 100 - 100)
    if (rings[rnum - 1] < rings[rnum])
      percentage = Gears.rounder((rings[rnum] / rings[rnum - 1]) * 100 - 100)

    if (rings[rnum] > 0)
      return `<TD><FONT SIZE=-1>${percentage} %</FONT></TD>`
    return ''
  }

  //----------------------------------------------------------
  // **********output-big
  static showit(ringData) {
    let head = '<h2>Gear chart using '

    // xxx
    if      (mphmult !== 1)  head += modename
    else if (nMode === 1)    head += '<a href="http://sheldonbrown.com/gloss_g.html#gearinch">Gear Inches</a>'
    else if (nMode === 12.5) head += '<a href="http://sheldonbrown.com/gloss_da-o.html#development">Meters Development</a>'
    else                     head += '<a href="http://sheldonbrown.com/gain.html">Gain Ratios</a>'

    head += '</h2>'


    const hub = 0
    let gwHTML = `<table class="grid"><tr><td> </td> <th>${rings[0]}</th>`

    // **********  header of output
    if (rings[1] > 0) {
      gwHTML   += `${Gears.percentfront(1)}<th>${rings[1]}</th>`
      if (rings[2] > 0)
        gwHTML += `${Gears.percentfront(2)}<th>${rings[2]}</th>`
    }
    gwHTML += ('</tr>')


    // ******** loop to calculate gears for each sprocket
    for (let c = 0; rears[c] > 0; c++) {
      gwHTML += (`<tr><th>${rears[c]}</th><td class="val">${Gears.rounder(hubMult[hub] * ringData[0][c])}</td>`)
      if (rings[1] > 0) {
        gwHTML += (`<td></td><td class="val">${Gears.rounder(hubMult[hub] * ringData[1][c])}</td>`)
        if (rings[2] > 0)
          gwHTML += (`<td></td><td class="val">${Gears.rounder(hubMult[hub] * ringData[2][c])}</td>`)
      }
      gwHTML += '</tr>'
      gwHTML += Gears.percentrear(c)
    }
    gwHTML += `</table>
      ${head}
      <i><h3>For ${tiresize} tire with ${cranklength} cranks</h3></i>
      <i><H3>With ${cassettename} Cassette</H3></i>`


    const gearwin = document.getElementById('gearwin')
    // alert(gwHTML);
    gearwin.innerHTML = gwHTML
  }
}


document.addEventListener('DOMContentLoaded', () => {
  // create the preset links text - from their href
  document.querySelectorAll('#presets > a').forEach((e) => {
    if (e.innerText.trim() === 'x') {
      const [front, rear, desc] = new URL(e.href).search.slice(1).split('/')
      const range = `[${rear.split(/[^\d]/).shift(1)} .. ${rear.split(/[^\d]/).pop(1)}]`
      e.innerHTML = `${desc.replace(/_/g, ' ')} -- ${front} / ${range}<br>`
    }
  })

  document.querySelectorAll('[data-click]').forEach((e) => {
    const method = e.dataset.click
    console.log(method)
    e.addEventListener('click', (evt) => {
      Gears[method]()
      evt.preventDefault()
      evt.stopPropagation()
    })
  })

  const cgiarg = new URL(document.URL).search.slice(1)
  if (cgiarg) {
    const [front, rear, desc] = cgiarg.split('/')
    console.log(front.split(/[^\d]/).map((e) => Number(e)), rear.split(/[^\d]/).map((e) => Number(e)))
    Gears.fill([front.split(/[^\d]/).map((e) => Number(e)), rear.split(/[^\d]/).map((e) => Number(e))])
  }

})
