/*
---top page xxx:
-bunny logo jaggies; blog pic and title hardcoded @bot
-ie dumbbunny.gif colors
*/

const ALBUMS = [
  "ALC",
  "Briones",
  "Cape Rock Harbor",
  "Jonathan Pon Ride",
  "Kim Capitola",
  "New York City",
  "Tahoe with Dan",
  "Tyler Hamilton Foundation",
  "berkeley marina",
  "bike phonak redwood",
  "biking",
  "cape cod",
  "cape provincetown, hike, cottage",
  "disney MGM",
  "disney animal kingdom",
  "disney epcot",
  "disney magic kingdom",
  "drake moved in",
  "drake power outtage",
  "drake",
  "europe",
  "halloween",
  "helios",
  "hummingbird",
  "isaac",
  "key west",
  "madone",
  "morgan territory",
  "russ bike redwood loop",
  "sonoma",
  "winery bikeride",
]

const MONTH = {
  '1' :'January',
  '2' :'February',
  '3' :'March',
  '4' :'April',
  '5' :'May',
  '6' :'June',
  '7' :'July',
  '8' :'August',
  '9' :'September',
  '10':'October',
  '11':'November',
  '12':'December',
  '01':'January',
  '02':'February',
  '03':'March',
  '04':'April',
  '05':'May',
  '06':'June',
  '07':'July',
  '08':'August',
  '09':'September'
}



class Pooh {
  constructor() {

    this.albpix = []
    this.randpix = []
    this.loads = []
    // we allow iphone to do 2-per-row; rest do 4-per row.  we need 8 cells...
    this.albumChunkSize = 8


    $('.album-picture').each((idx, el) => {
      this.albumPicture(el)
    })

    $('.round-picture').each((idx, el) => {
      el.outerHTML = this.roundPic({
        'filename':el.getAttribute('src'),
        'title'   :el.getAttribute('title'),
        'href'    :el.getAttribute('href'),
        'wd'      :el.getAttribute('wd'),
        'ht'      :el.getAttribute('ht'),
        'src'     :el.getAttribute('src'),
        'overlay' :el.getAttribute('overlay') //NOTE: not in use yet
            }, el.innerHTML)
    })

    $('.random-picture').each((idx, el) => {
      const albumname = ALBUMS[Math.round((ALBUMS.length-1) * Math.random())]
      this.loads[albumname] = 1
      // marker to know what element gets replaced when "album_json_gotten()" invoked
      this.randpix.push({ albumname, el })
    })


    const q = location.search.replace(/\?/, '')
    if (location.pathname === '/') {
    } else if (location.pathname === '/europe/') {
      this.albumsingle = true
      this.loads = { europe: 1 }
    } else if (q !== ''  &&  q !== 'albums') {
      this.albumsingle = true
      this.loads = {}
      this.loads[q] = 1
      $('body').addClass('album')
      $('#wrapper').show()
    } else {
      this.albumsoverview = true
      this.albums_overview()
      $('body').addClass('album')
      $('#wrapper').show()
    }

    this.load_albums()
  }


  load_albums() {
    for (let albumname in this.loads) {
      $.getJSON(`/albums/${albumname}.json`, (json) => {
        this.album_json_gotten(json)
      })
    }
  }


  // eg: file="best euro I/106-0607_IMG.JPG"
  // eg: file="2004 biking/131-3159_IMG.JPG"
  albumPicture(el) {
    const file = el.getAttribute('src').replace(/\/albums\/images\//, '')

    let albumname = file.substring(0, file.indexOf('/')) // before "/" char
    if (file[0] === '2')
      albumname = albumname.substring(albumname.indexOf(' ') + 1) // skip YYYY_MM_DD to after ' ' char
    if (albumname === 'best euro I') // um.... handle the only anamoly manually...
      albumname = 'europe'


    // marker to know what element gets replaced when "album_json_gotten()" invoked
    this.albpix.push({ albumname, el })

    this.loads[albumname] = 1
  }


  albums_overview() { // array of album names
    let str = '\
<span style="font: 20pt Verdana, Arial, Helvetica;">Tracey\'s photo albums</span> \
<span style="padding-left:200px;"></span>\
2002 - 2010\
<br/>\
<div style="float:left"> \
';
    // aid to figure out which column, left or right, to add album to
    const half = Math.round(ALBUMS.length / 2) - 1

    for (var i = 0, albumname; albumname = ALBUMS[i]; i++) {
      this.loads[albumname] = i // save order in which albums should appear

      str += '<div id="al'+i+'"> </div>'
      if (i == half)
        str += '</div><div style="float:left;">' //start 2nd column
    }

    $('#content').append(str + '</div><br clear="all"/>')
  }


  // NOTE: this is invoked in individual album .json files like "albums/biking.json"
  album_json_gotten(album) {
    log(Object.keys(this.loads).length, 'album JSON loads to go')

    if (this.albumsingle)
      return this.album_single(album)

    if (this.albumsoverview)
      this.album_overview(album)

    for (let j = 0; j < this.randpix.length; j++) {
      let albpic = this.randpix[j]
      if (albpic === null)
        continue // picture already set up!

      if (album.name !== albpic.albumname)
        continue // not the album this wanted picture is in

      // pick a random picture from this album
      const fi = album.file[Math.round((album.file.length-1) * Math.random())]

      this.insertPic(albpic.el, album, fi)
      this.randpix[j] = null // flag this element as done by null-ing it
    }

    for (let j = 0; j < this.albpix.length; j++) {
      const albpic = this.albpix[j]
      if (albpic === null)
        continue // picture already set up!

      if (album.name !== albpic.albumname)
        continue // not the album this wanted picture is in

      const file = albpic.el.getAttribute('src').replace(/\/albums\/images\//, '')
      let fi = null
      var filepart = file.substring(file.indexOf('/')+1); // after "/" char
      for (var i = 0, el; el = album.file[i]; i++) {
        if (el.name == filepart) {
          fi = el
          break
        }
      }
      if (!fi)
        return false //picture not found in album!

      this.insertPic(albpic, album, fi)
      this.albpix[j] = null // flag this element as done by null-ing it
    }
    return false
  }


  insertPic(el, album, fi) {
    //console.log(el);
    const filename = Pooh.filename(album, fi)

    // tracey thumbnails are *always* 150px high; but width varies
    // determine what width to use (and scale appropriately to desired height)
    const ht = (el.getAttribute('ht') ? el.getAttribute('ht') : 150)
    const wd = Math.round(fi.w * ht / 150)

    // if href *not* set, use album as target
    var href = el.getAttribute('href')
    if (typeof href === 'undefined'  ||  href === null)
      href = '/photos/?' + album.name

    el.outerHTML = this.roundPic({
        'filename'  :filename,
        'title'     :fi.title,
        'href'      :href,
        'wd'        :wd,
        'ht'        :ht,
        'overlay'   :(Pooh.pretty(album.date) + '<hr/>' +
                      album.name + '<hr/>' +
                      fi.title)
      }, el.innerHTML);
    return false
  }


  static pr(str) {
    return (typeof(str)=='undefined' ? "" : str);
  }


  // normally filename is "album.date album.name"/"file.name"
  // but album can override with attr...
  static filename(album, fi) {
    if (typeof(album.subdir)=='undefined')
      return Pooh.pr(album.date) + ' ' + Pooh.pr(album.name) + '/' + Pooh.pr(fi.name)

    return Pooh.pr(album.subdir) + '/' + Pooh.pr(fi.name)
  }


  static getImgSize(imgSrc) {
    var newImg = new Image()
    newImg.src = imgSrc
    var tmp = parseInt(newImg.width)
    newImg = null
    return tmp
  }


  //REQUIRED:
  // pic.filename
  // pic.title
  // pic.href
  //
  //OPTIONAL:
  // pic.wd        - when not used, uses width of what is/will be pic.src
  // pic.ht        - when not used, we'll use 150
  // pic.src       - when not used, uses 'albums/images/' + filename
  // pic.overlay   - overrides the "showOnHover" section
  // pic.onclick   - used in conjunction with href
  roundPic(pic, html) {
    // setup defaults for optional elements
    if (typeof pic.ht === 'undefined')
      pic.ht = 150
    if (typeof pic.src === 'undefined')
      pic.src = '/albums/images/' + pic.filename

    if (typeof pic.wd === 'undefined')
      pic.wd = Pooh.getImgSize(pic.src)


    let str = '\
  <div class="imbox" style="width:'+pic.wd+'px; height:'+pic.ht+'px;">\
    <a class="hoverShower"\
       href="' + pic.href +
    (typeof(pic.onclick)=='undefined' ? '' : '" onclick="'+pic.onclick) +
    '" target="_top">';


    // hidden part (NOTE HAS TO APPEAR TWICE!)
    let hid = ''
    if (pic.title !== 'untitled') {
      hid = '\n\
\n\
      <!-- HIDDEN BEG -->\n\
';

      if (html)
        hid += '<span class="showOnHover">'+html+'</span>'

      hid +=
      '<span class="showOnHover pixOverlay">' +
      (typeof(pic.overlay)=='undefined' || !pic.overlay ? pic.title :pic.overlay)+
      '</span>\
\n\
      <!-- HIDDEN END -->\n\
\n\
'
    }


    str += hid + '\
      <img class="imbox1" style="width:'+pic.wd+'px; height:'+pic.ht+'px;" ' +
    (pic.title == 'untitled' ? '' : ' title="'+pic.title+'" alt="'+pic.title+'" ')+
    ' src="'+pic.src+'"/>\
\
    </a>\
  </div>\
\
'
    // log(str)
    return str
  }


  // YYYY_MM_DD         ==>   January 3, 2005
  // YYYY-MM            ==>   January 2005
  // ####.##.##         ==>   February 27, 2006
  // ####.##.##,true    ==>   Feb 27, 2006
  static pretty(date, month3letters) {
    if (typeof(date)=='undefined'  ||  !date  ||  date=='200')
      return '';

    var year = date.substring(0,4);
    var month= date.substring(5,7);
    var day  = date.substring(8,10);
    // need to remove lead 0s!
    while (  day.length &&   day[0]=='0')   day =   day.substr(1);

    var str='';
    if (typeof(month)!='undefined'  &&  month!=null  &&  month!='')
    {
      while (month.length && month[0]=='0') month = month.substr(1);
      str += MONTH[month];

      if (month3letters)
        str = str.substring(0,3);
      str += ' ';
    }

    if (typeof(day)!='undefined'  &&  day!='')
      str += day+', ';
    str += year;
    return str;
  }


  // for album.htm
  album_single(album) {
    document.title = 'Photo album: '+album.name;

    var str = '\
<a name="'+album.name+'"> </a>\
<span style="font: 20pt Verdana, Arial, Helvetica;">Album: '+
    album.name+'</span> ('+album.file.length+' pictures)\
<span style="padding-left:200px;"></span>\
\
'
    + Pooh.pretty(album.date) +
    '<br/>\
\
<span class="nav"><a onclick="return Pooh.album_Go(this.href);" target="_top" href="/photos/?albums">See all albums</a></span>\
<br/>\
'
    +
    (typeof(album.description)=='undefined' ? '' :
     '<div id="description">' + album.description + '</div>') +
    '\
<div style="padding:20px;"></div>\
\
';

    let ht = 150
    const tmp = location.hash.substring(location.hash.lastIndexOf('-')+1)
    if (typeof tmp !== 'undefined'  &&  tmp.match(/^[0-9]+$/))
      ht = parseInt(tmp) // 1/2 height pictures for inline frame on europe.htm!
    if (typeof album.height !== 'undefined')
      ht = parseInt(album.height) // NOTE: legacy; not used right now

    for (let i = 0; i < album.file.length; i++)
      str += this.pixcell(album, i, ht)

    document.getElementById('content').innerHTML = str
  }


  // for album.htm
  album_overview(album) {
    // add this album to the album index/overview page

    var str =
    '<table><tr><td>\
<a onclick="return Pooh.album_Go(this.href);" href="/photos/?' + album.name + '">' +
    album.name + '</a><br/>\
<span style="font-size: 6pt;">\
'
    + Pooh.pretty(album.date) + '\
</span>\
</td>\
'

    for (let i = 1; i <= 2; i++) {
      if (typeof album['idx' + i] === 'undefined')
        continue

      const fi = album.file[album['idx' + i] - 1]
      const ht = 75
      // tracey thumbnails are *always* 150px high; but width varies
      // determine what width to use (scale appropriately to desired height)
      const wd = Math.round(fi.w * ht / 150)
      const filename = Pooh.filename(album, fi)
      str += '\
    <td>\
'
          + '\
      <div class="pixcell" style="width:'+(wd+20)+'px;">\
'
          + this.roundPic({
              'filename':filename,
              'title'   :'untitled',
              'href'    :'/photos/?' + album.name,
              'wd'      :wd,
              'ht'      :ht,
              'onclick' : 'return Pooh.album_Go(this.href)'
                }, '');

       str += '\
      </div>\
    </td>';
    }
    str += '</tr></table>'


    // insert this album's HTML into the div set aside for this album
    // previously (because remember, each album can load out of order...)
    // log('hey', album.name, this.loads)
    const obj = document.getElementById('al'+this.loads[album.name])
    obj.innerHTML = str


    // this allows us to know when every album has been loaded!
    delete(this.loads[album.name])
  }


  // for album.htm
  pixcell(album, idx, ht) {
    const fi = album.file[idx]
    const filename = Pooh.filename(album, fi)

    // tracey thumbnails are *always* 150px high; but width varies
    // determine what width to use (and scale appropriately to desired height)
    const wd = Math.round(fi.w * ht / 150)

    const wd2 = wd + (ht < 76 ? 50 : 14)
    const wd3 = wd - 7

    const chunk = ((idx) % this.albumChunkSize) + 1

    const href = (location.host.indexOf('.archive.org')>0 ?
                '' : 'file:///Users/tracey/') + 'Pictures/' + filename

    return '\
     <div class="pixcell topinblock pc'+chunk+'" style="width:'+wd2+'px;">' +
    this.roundPic({
          "filename" :filename,
          "title"    :fi.name,
          "href"     :href,
          "wd"       :wd,
          "ht"       :ht
            }, '') +
    '<p style="width:'+wd3+'px;">'+fi.title+'</p>\
     </div>\
    '
  }
}

$(() => new Pooh())
