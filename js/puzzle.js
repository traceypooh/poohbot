

// from http://css-tricks.com/snippets/jquery/shuffle-dom-elements/
$.fn.shuffle = function() {
  var allElems = this.get(),
  getRandom = function(max) {
    return Math.floor(Math.random() * max)
  },
  shuffled = $.map(allElems, function(){
    var random = getRandom(allElems.length),
    randEl = $(allElems[random]).clone(true)[0]
    allElems.splice(random, 1)
    return randEl
  })

  this.each(function(i) {
    $(this).replaceWith($(shuffled[i]))
  })

  return $(shuffled)
}


$(() => {
  const src = 'https://traceypooh.com/albums/images/2007_10_14%20key%20west/keyWest_0136_tj.jpg'
  const cuts = 5

  const img = new Image()
  img.onload = function() {

    const $div = $('#pieces')
    const wdP = $div.width()
    const htP = 0.8 * $(window).height()
    $div.height(htP)

    const left_offset = (img.naturalWidth > wdP ? (img.naturalWidth - wdP) / 4 : 0)
    // console.log({ left_offset, wdP, natw: img.naturalWidth })

    const splitW = Math.min(wdP, img.width ) - cuts * 10
    const splitH = Math.min(htP, img.height) - cuts * 5

    const wd = Math.floor(splitW / cuts)
    const ht = Math.floor(splitH / cuts)

    // tile up the image, perfectly...
    for (var top=0; splitH >= top+ht; top += ht) {
      for (var left=0; splitW >= left+wd; left += wd) {
        $div.append($("<li/>")
                    .css({width:wd, height:ht,
                          'background-image':'url('+src+')',
                          'background-position-x':-left - left_offset,
                          'background-position-y':-top,
                          'margin':'3px'
                          }))
      }
    }

    $div.sortable()
    $div.disableSelection()
  }
  img.src = src
})
