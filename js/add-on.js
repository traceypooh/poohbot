/*
  This js file is for individual users to modify the scripts for their personal site,
  or for the implementation of features specifically for their site. Anything that
  is an official part of the theme (ex. Pull Requests) should be included in main.js
  and follow the formatting and style given.
*/

const log = (typeof console === 'undefined'
  ? () => {}
  : console.log.bind(console)
)


function rand(ary) {
  return ary[Math.round((ary.length - 1) * Math.random())]
}


function randNavPic() {
  const NAVPIC = [
    'ggreg-pic.jpg',
    'happy.jpg',
    'helios.jpg',
    'keywest.jpg',
    'new-bike.jpg',
    'nice.jpg',
    'pride.jpg',
    'sonoma.jpg',
    'tracey.jpg',
    'traceyYahooAvatar.jpg',
    'trek.jpg',
  ]
  return `/img/nav/${rand(NAVPIC)}`
}

function randomQuote() {
  const $q = $('#quote-random')
  if (!$q.length)
    return
  $.getJSON('/js/quotes.json', (json) => {
    const q = rand(json.short)

    $q.html(`
<a href="/quotes">
  <dt>${q.q}<dt>
  <dd> - ${q.a}<br/></dd>
</a>`)
  })
}


if (window.matchMedia  &&  window.matchMedia('(prefers-color-scheme: dark)').matches) {
  log('bring on the darkness!')
  const hour = new Date().getHours()
  if (7 <= hour  &&  hour < 17) { // override [7am .. 5pm] localtime
    log('.. but its vampire sleep time')
    $('body').addClass('lite')
  }
  // macOS can force chrome to always use light mode (since it's slaved to mac sys pref otherwise)
  //   defaults write com.google.Chrome NSRequiresAquaSystemAppearance -bool yesa
}


$(() => $('#home-pic img').attr('src', randNavPic()))
$(randomQuote)
