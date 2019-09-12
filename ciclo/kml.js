

function kml() {
  const loc = window.location.href.substring(1)
  let splits = loc.split('/')
  splits = splits[splits.length-1]
  splits = splits.split('.')
  const basenom = splits[0]

  // prepend to body
  document.body.innerHTML = `
<h3>Tracey and Hunter East Bay Roadbiking Info</h3>

<a style="font-weight:bold;" href="../tours/">Return to east bay tours</a><br/>

<a style="font-weight:bold;" href="kml.php?file=${basenom}.kml">Plot route on Google Earth</a><br/>

<a style="font-weight:bold;" href="${basenom}.jpg">Climbing profile</a>

<hr/><br/>` + document.body.innerHTML

  // append to body
  const i = document.createElement('i')
  i.appendChild(document.createTextNode('tracey and hunter love east bay roadbiking'))
  document.body.appendChild(i)

  // style the body
  document.body.style.backgroundColor = '#ffffdd'
  document.body.style.color = 'purple'
  document.body.style.font = '11pt Verdana, Arial, Helvetica'
}


document.addEventListener('DOMContentLoaded', kml)
