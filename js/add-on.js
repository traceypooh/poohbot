/*
  This js file is for individual users to modify the scripts for their personal site,
  or for the implementation of features specifically for their site. Anything that
  is an official part of the theme (ex. Pull Requests) should be included in main.js
  and follow the formatting and style given.
*/

/* eslint-disable no-console */

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
  const el = document.getElementById('quote-random')
  if (!el)
    return
  fetch('/js/quotes.json')
    .then((r) => r.json())
    .then((json) => {
      const q = rand(json.short)
      el.innerHTML = `
<a href="/quotes">
  <dt>${q.q}<dt>
  <dd> - ${q.a}<br/></dd>
</a>`
    })
}


if (globalThis.matchMedia && globalThis.matchMedia('(prefers-color-scheme: dark)').matches) {
  console.log('bring on the darkness!')
  const hour = new Date().getHours()
  if (hour >= 7 && hour < 17) { // override [7am .. 5pm] localtime
    console.log('.. but its vampire sleep time')
    document.body.classList.add('lite')
  }
  // macOS can force chrome to always use light mode (since it's slaved to mac sys pref otherwise)
  //   defaults write com.google.Chrome NSRequiresAquaSystemAppearance -bool yesa
}


document.addEventListener('DOMContentLoaded', () => {
  const img = document.querySelector('#home-pic img')
  if (img)
    img.src = randNavPic()
  randomQuote()
})
