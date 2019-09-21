/*
   xxx IE: test album selection, blog (nix custom look?!), etc.
   xxx preload images/js to avoid stalling

---top page:
-bunny logo jaggies; blog pic and title hardcoded @bot
-ie dumbbunny.gif colors

---russ' safari (but not my windoze):
-europe-half
-about bottom fades/chops early  -- sporadically!
-DBP top jacked up a bit
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

const NAVPIC = [
  /**/{name:"../tracey.jpg"         ,w:" 80",h:"122"},
  /**/{name:"keywest.jpg"           ,w:"100",h:"133"},
  /**/{name:"nice.jpg"              ,w:"100",h:"142"},
  /**/{name:"ggreg-pic.jpg"         ,w:"100",h:"160"},
  /**/{name:"pride.jpg"             ,w:"100",h:"197"},
  /**/{name:"happy.jpg"             ,w:"100",h:"120"},
  /**/{name:"helios.jpg"            ,w:"100",h:"174"},
  /**/{name:"sonoma.jpg"            ,w:"100",h:"160"},
  /**/{name:"traceyYahooAvatar.jpg" ,w:"100",h:"220"}
  /*  {name:"new-bike.jpg"          ,w:" 92",h:"150"}*/
]

const log = (typeof console === 'undefined'
  ? () => {}
  : console.log.bind(console)
)


class Pooh {
  constructor() {
    this.albumsingle = false
    this.albumsoverview = false  //true when at (top level/overview of) album.htm
    this.albpix = []
    this.albpixAlbumName = []
    this.randpix = []
    this.randpixAlbumName = []
    this.randquotes = []
    this.loads = []
    // we allow iphone to do 2-per-row; rest do 4-per row.  we need 8 cells...
    this.albumChunkSize = 8


    var els = document.getElementsByClassName('PICTURE')
    for (var i=0, el; el=els[i]; i++) {
      el.innerHTML = this.roundPic({
        'filename':el.getAttribute('src'),
        'title'   :el.getAttribute('title'),
        'href'    :el.getAttribute('href'),
        'wd'      :el.getAttribute('wd'),
        'ht'      :el.getAttribute('ht'),
        'src'     :el.getAttribute('src'),
        'overlay' :el.getAttribute('overlay') //NOTE: not in use yet
            }, el.innerHTML);
    }

    var els = document.getElementsByClassName('ALBUM-PICTURE');
    for (var i=0, el; el=els[i]; i++)
    {
      var fi = el.getAttribute('file');
      if (typeof(fi)=='undefined'  ||  fi==null)
      {
        // variant where we are to pick one from a bunch of options
        var opts = el.getAttribute('files').split(';');
        el.setAttribute(
          'file', opts[Math.round((opts.length-1) * Math.random())]);
      }
      this.albumPicture(el);
    }

    var els = document.getElementsByClassName('RANDOM-PICTURE');
    for (var i=0, el; el=els[i]; i++)
    {
      // marker to know what element gets replaced when "album_call()" invoked
      this.randpix.push(el);
    }

    // now that we have figured out all album and random pictures to insert,
    // we either load the list of all albums
    // (to find a random pic in a random album for *each* random pic)
    // *OR* just load specific albums we know we need
    if (this.randpix.length > 0)
      Pooh.jsload('albums/ALBUMS.js');//... this .js invokes albums_call()
    else
      this.load_albums();


    var els = document.getElementsByClassName('RANDOM-QUOTE');
    for (var i=0, el; el=els[i]; i++)
    {
      // marker to know what element gets replaced when "quotes()" invoked
      this.randquotes.push(el);
    }
    if (this.randquotes.length > 0)
      Pooh.jsload('quotes.js'); // invokes quotes() below
  }


  // (*asynchronously*) loads a .js file
  static jsload(jsfile) {
    const head = document.getElementsByTagName("head")[0]
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = jsfile
    head.appendChild(script)
  }


  load_albums() {
    for (let albumname in this.loads) {
      // this .js invokes album_call() below
      albumname = albumname.replace(/\-[0-9]+$/, '')
      //console.log('loading... ' + albumname)
      $.getJSON(`/albums/${albumname}.json`, (json) => {
        log(json)
        this.album_call(json)
      })
    }
  }


  // eg: file="europe/106-0607_IMG.JPG"
  // eg: file="2004 biking/131-3159_IMG.JPG"
  albumPicture(el) {
    const file = el.getAttribute('file')

    var albumname = file.substring(0, file.indexOf('/')); // before "/" char
    if (file[0]=='2')
      albumname = albumname.substring(albumname.indexOf(' ')+1); // after " " char

    // marker to know what element gets replaced when "album_call()" invoked
    this.albpix.push(el)
    this.albpixAlbumName.push(albumname)

    this.loads[albumname] = 1
  }


  albums_call(albums) { // array of album names
    for (let i = 0, el; el = this.randpix[i]; i++) {
      var albumname = albums[Math.round((albums.length-1) * Math.random())]
      this.randpixAlbumName.push(albumname)
      this.loads[albumname] = 1
    }

    if (this.albumsoverview) {
      let str = '\
<span style="font: 20pt Verdana, Arial, Helvetica;">Tracey\'s photo albums</span> \
<span style="padding-left:200px;"></span>\
2002 - 2010\
<br/>\
<div style="float:left;"> \
';
      // aid to figure out which column, left or right, to add album to
      const half = Math.round(albums.length / 2) - 1

      for (var i=0, albumname; albumname=albums[i]; i++) {
        this.loads[albumname] = i; // save order in which albums should appear!

        str += '<div id="al'+i+'"> </div>'
        if (i == half)
          str += '</div><div style="float:left;">' //start 2nd column
      }

      var obj = document.getElementById('content')
      obj.innerHTML = obj.innerHTML + str + '</div><br clear="all"/>'
    }

    this.load_albums()
  }


  // NOTE: this is invoked in individual album .js files like "albums/europe.js"
  album_call(album) {
    if (this.albumsoverview)
      return this.album_Overview(album)

    if (this.albumsingle)
      return this.album_single(album)


    for (var j=0; j<this.randpix.length; j++) {
      var albpic = this.randpix[j];
      if (albpic==null)
        continue; // picture already set up!

      if (this.randpixAlbumName[j] != album.name)
        continue; // not the album this wanted picture is in

      // pick a random picture from this album
      var fi = album.file[Math.round((album.file.length-1) * Math.random())];

      this.insertPic(albpic, album, fi);
      this.randpix[j] = null; // flag this element as done by null-ing it
    }

    for (var j=0; j<this.albpix.length; j++) {
      var albpic = this.albpix[j];
      if (albpic==null)
        continue; // picture already set up!

      if (this.albpixAlbumName[j] != album.name)
        continue; // not the album this wanted picture is in

      var file = albpic.getAttribute('file');
      var fi=null;
      var filepart = file.substring(file.indexOf('/')+1); // after "/" char
      for (var i=0, el; el=album.file[i]; i++)
      {
        if (el.name==filepart)
        {
          fi=el;
          break;
        }
      }
      if (!fi)
        return false; //picture not found in album!

      this.insertPic(albpic, album, fi);
      this.albpix[j] = null; // flag this element as done by null-ing it
    }
    return false
  }


  insertPic(el, album, fi) {
    //console.log(el);
    const filename = Pooh.filename(album, fi)

    // tracey thumbnails are *always* 150px high; but width varies
    // determine what width to use (and scale appropriately to desired height)
    var ht = 150;
    var ht = el.getAttribute('ht');
    if (!ht)
      ht = 150;
    var wd = Math.round(fi.w * ht / 150);

    // if href *not* set, use album as target
    var href = el.getAttribute('href');
    if (typeof(href)=='undefined'  ||  href==null)
      href = '/photos/?' + album.name

    el.innerHTML = this.roundPic({
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
  // pic.src       - when not used, uses 'albums/thumbs/' + filename
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


    var str = '\
  <div class="imbox" style="width:'+pic.wd+'px; height:'+pic.ht+'px;">\
    <a class="hoverShower"\
       href="' + pic.href +
    (typeof(pic.onclick)=='undefined' ? '' : '" onclick="'+pic.onclick) +
    '" target="_top">';


    // hidden part (NOTE HAS TO APPEAR TWICE!)
    var hid = ''
    if (pic.title != 'untitled')
    {
      hid = '\n\
\n\
      <!-- HIDDEN BEG -->\n\
';

      if (html)
        hid += '<span class="showOnHover">'+html+'</span>';

      hid +=
      '<span class="showOnHover pixOverlay">' +
      (typeof(pic.overlay)=='undefined' || !pic.overlay ? pic.title :pic.overlay)+
      '</span>\
\n\
      <!-- HIDDEN END -->\n\
\n\
';
    }


    str += hid + '\
      <img class="imbox1" style="width:'+pic.wd+'px; height:'+pic.ht+'px;" ' +
    (pic.title == 'untitled' ? '' : ' title="'+pic.title+'" alt="'+pic.title+'" ')+
    ' src="'+pic.src+'"/>\
\
    </a>\
    <div class="imbox2">\
      <a class="hoverShower"\
         href="' + pic.href +
    (typeof(pic.onclick)=='undefined' ? '' : '" onclick="'+pic.onclick) +
    '" target="_top">\
\
'
    + hid +

    '\
\
\
\
        <div style="width:'+pic.wd+'px; height:'+pic.ht+'px;"></div>\
      </a>\
    </div>\
  </div>\
\
';
    return str;
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


  // random tracey pic; centered inside 100x220 box
  randNavPic() {
    const pic = NAVPIC[Math.round((NAVPIC.length-1) * Math.random())]
    const topspc = (220 - parseInt(pic.h)) / 2

    return '\
  <div id="navpic" style="position:relative; height:220px;">\
    <div style="width:'+pic.w+'px; margin-left:auto; margin-right:auto;">\
      <a href="index.htm">\
        <img style="position:absolute; top:'+topspc+'px; z-index:0; width:'+
    pic.w+'px; height:'+pic.h+'px;" src="images/nav/'+
    pic.name+'" alt="Tracey Jaquith"/>\
      </a>\
    </div>\
  </div>'
  }


  // for album.htm
  static album_loaded() {
    const pooh = new Pooh()
    const tmp = location.search.replace(/\?/, '')
    if (tmp === '') {
      pooh.albumsoverview = true
      pooh.albums_call(ALBUMS)
    } else {
      pooh.albumsingle = true
      pooh.loads[tmp] = 1
      pooh.load_albums()
    }
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
<span class="nav"><a onclick="return Pooh.album_Go(this.href);" target="_top" href="/photos/">See all albums</a></span>\
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


  album_go(albumurl) {
    var tmp = albumurl.indexOf('#')
    if (tmp > 0) {
      this.albumsingle = true
      var albumname = albumurl.substring(tmp + 1)
      this.loads[albumname] = 1
      this.load_albums()
      location.href = albumurl
    } else {
      //this, uh, got a bit convoluted (going back to overview from indiv album)
      location.href = albumurl
      this.album_Loaded()
    }
    return false
  }


  // for album.htm
  album_Overview(album) {
    // add this album to the album index/overview page

    var str =
    '<table style="text-align:right;"><tr><td>\
<a onclick="return Pooh.album_Go(this.href);" href="/photos/?' + album.name + '">' +
    album.name + '</a><br/>\
<span style="font-size: 6pt;">\
'
    + Pooh.pretty(album.date) + '\
</span>\
</td>\
'

    for (let i = 1; i <= 2; i++) {
      if (typeof album['idx'+i] !== 'undefined') {
        var fi=album.file[album['idx'+i]-1];
        var ht=75;
        // tracey thumbnails are *always* 150px high; but width varies
        // determine what width to use (scale appropriately to desired height)
        var wd = Math.round(fi.w * ht / 150);
        var filename = Pooh.filename(album, fi);
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
    </td>\
';
      }
    }
    str += '</tr></table>'


    // insert this album's HTML into the div set aside for this album
    // previously (because remember, each album can load out of order...)
    var obj = document.getElementById('al'+this.loads[album.name])
    obj.innerHTML = str


    // this allows us to know when every album has been loaded!
    delete(this.loads[album.name])

    for (var j in this.loads)
      return false // not every album has been loaded yet


    // ALL ALBUMS LOADED!
    // turn this mode "off" now so onclick-ing will load a given album
    this.albumsoverview = false

    return false
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
     <div class="pixcell pc'+chunk+'" style="width:'+wd2+'px;">' +
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


  // for quotes.htm and <RANDOM-QUOTE>
  quotes(quotes) {
    if (this.randquotes.length > 0) {
      for (var i=0, el; el=this.randquotes[i]; i++) {
        var q=quotes.short[Math.round((quotes.short.length-1) * Math.random())];
        el.innerHTML =
        '<a class="stealth" href="quotes.htm"><dt>'+
        q.q+'<dt><dd> - '+q.a + '<br/></dd></a>';
      }
    } else {
      var str=''
      for (var longy=0; longy<2; longy++) {
        var qs = (longy ? quotes.long : quotes.short)
        for (var i=0, q; q=qs[i]; i++)
        {
          str +=
            '<div'+(longy  &&  i==qs.length-1 ? ' style="clear:left;"' :
                    ' class="quote"')+
            '><dl><dt><q>'+q.q+'</q></dt><dd> - '+q.a+'<br/>'+
            (q.href ? '<a href="'+q.href+'">'+q.anchor+'</a>':'') +
            '</dd></dl></div>';
          if ((i+1) % 3 == 0  ||  i==qs.length-1)
            str += '<br clear="left"/>';
        }
      }

      var obj = document.getElementById("fillme")
      obj.innerHTML = str
    }
    return false
  }
}


$(Pooh.album_loaded)
// window.onload = function() { Pooh.init(); } //xxx
