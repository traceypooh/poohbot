
// const log = console.log.bind(console) // xxxhls

class IAV {
  constructor() {
    IAV.ios = (navigator.userAgent.indexOf('iPhone')>0  ||
         navigator.userAgent.indexOf('iPad')>0  ||
         navigator.userAgent.indexOf('iPod')>0)

    // ----------------  STUFF FOR THE "FILMSTRIP" PART  --------------
    // maps IDENTIFIER to thumbnail #/seconds (we'll left 0-pad to the 6 digits...)
    this.MAP = {
"morebooks"               :[60, "The Archive gets 130K books!  2 days in 2 minutes!"],
"dance4rescues"           :[57, "Dance for the Rescues -- charity animal rescue promo video"],
"kauai"                   :[4,  "Kauai Hawaii sunrise -- vacation 2010"],
"road250"                 :[1,  "Road 250 -- 50th birthday for friend"],
"bali"                    :[117,"Bali island vacation 2010"],
"nightbay"                :[1,  "Night time-lapse of bustling SF bay -- music by Hunter!"],
"drake_saga1"             :[30, "The Drake Saga -- lightsabers!"],
"alc2008"                 :[1194,"AIDS LifeCycle 2008 -- biked SF to LA"],
"commute"                 :[9,  "Time lapse of my commute across bay to work"],
"meteorocino"             :[1,  "Perseids Meteor Shower near Mendocino, CA"],
"funston"                 :[152,"Work holiday party. Longest lapse ever (8+ hrs!)"],

"bikeDiabloVideo"         :[60, "Spring bikedride up Mount Diablo (the Video)"],
"oldpresidio"             :[1,  "Walking through the antiqued Presidio"],
"TRL-2009"                :[88, "It's OK to be a Training Ride Leader"],
"dumpster"                :[1,  "dumpster diving for trashed video frames "],

"holiDVD"                 :[90, "Seasons Greetings 2008.  DVD loop video with stop motion"],
"inauguration2009"        :[327,"Hunter and I travel to D.C. to watch Obama's Inauguration"],
"ImLost"                  :[1,  "Fun with the Lost TV show for my BFF kim's birthday"],
"ALC_stop_motion"         :[27, "AIDS LifeCycle -- stop motion daily intros"],

"CapeCodMarshClouds"      :[5,  "short time lapse of clouds moving over Cape Cod marsh"],
"MendocinoMeteorWeekend"  :[210,"Fun camping in the backcountry over a peak meteor weekend"],
"bikeDiablo"              :[65, "Spring bikeride up Mount Diablo (time lapse)"],

"Jessies_Sunrise"         :[20, "Early workday at Jessie St, SF (so I lapsed the sunrise 8-)"],
"briones_dusk"            :[5,  "Beautiful low clouds rushing over ridgeline in Briones park"],
"baysunset"               :[1,  "Low-light &amp; grainy quick clip of a breathtaking sunset"],
"helios-sunset"           :[1,  "Sunset at friend's land in Mendocino while camping"],

"TourOfCA"                :[29, "Time lapse of Tour of California race - Music by Hunter"],
"SFOsouth"                :[35, "Time lapse of sunny SFO flight to SoCal"],
"to-SF"                   :[30, "Earlier time lapse where I drive into SF"],
"from-SF"                 :[150,"Earlier time lapse where I drive home from a SF party"],
"archivewalk"             :[35, "Internet Archive takes a walk (time lapse)"],

"sunsetstrip"             :[1,  "Ultra widescreeen sunset short time lapse"],
"skyline-sunset"          :[5,  "My 2nd time lapse, at night overlooking SF bay from Skyline"],
"skyline-fireworks"       :[15, "Fireworks time lapse overlooking the SF bay from Skyline"],
"traceys-first-time-lapse":[1,  "2003 first scientific experiments with time lapsing"],

"rotoscope"               :[2,  "Tracey being a geek experimenting with lightsabers!"]
  }

    this.LAPSES = [
    "morebooks","kauai","road250","bali","nightbay","commute","meteorocino","funston","CapeCodMarshClouds",
    "bikeDiablo","ALC_stop_motion","TourOfCA","Jessies_Sunrise","briones_dusk",
    "baysunset","helios-sunset","SFOsouth","to-SF","from-SF",
    "archivewalk","sunsetstrip","traceys-first-time-lapse",
    "skyline-sunset","skyline-fireworks",
  ]


    this.HALF = 'HALF'
    this.playerHeight = 480 + 24 // ... + controller height
    this.filmstrip = null

    this.videourl = false
    this.lapsesurl = false
    this.usingplayer = false
    this.mobile = false

  //=========================================================================
  //
  //           CLIP EVENTS:
  //=========================================================================
  // [page start]  [0 can play]  [0 all loaded]  [1 can play]  [0 played] ...
  //=========================================================================
  //
  //           WHAT HAPPENS:
  //=========================================================================
  // load(0)         play(0)        load(2)                     hide(0)
  // load(1)           |               |                        show(1)
  //   |               |               |                        play(1)
  //   |               |               |                           |
  // --+---------------+---------------+---------------------------+----- ...
  //
    this.CLIPS = [
"https://archive.org/download/BraveNewFilmsFoxAttacksObama/foxattacksobama320_512kb.mp4?t=60.5/79",
"https://archive.org/download/SitaSingstheBlues_Trailer1/SitaTrailer1.2Sorensen_512kb.mp4?t=10/28",
"https://archive.org/download/dragostea_tin_dei_by_ozone/Dragostea_din_tei_By_Ozone_512kb.mp4?t=13/42",
"https://archive.org/download/allofthedead/allofthedead_fullscr_512kb.mp4?t=36/77",
"https://archive.org/download/Kinetic_Art_Demo_Video/nym_512kb.mp4?t=169/237.5",
"https://archive.org/download/StoreWars/sw_14M_512kb.mp4?t=46/104",
"https://archive.org/download/Political_Commercial/Political_Commercial_512kb.mp4?t=124.5/232",
"https://archive.org/download/inauguration2009/inauguration2009_512kb.mp4?t=220/239",
"https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4?t=365/369",
"https://archive.org/download/alc7brownhunter/alc7brownhunter_512kb.mp4?t=137/153.5"
  ]

    this.IDS = []
    this.FILES = []
    this.QSTRINGS = []
    this.v = []
    this.playable = []
    this.playing = false
    this.playnext = 0
    this.nloading = 0


    this.videourl  = location.href.match(/\/video\/*$/)
    this.lapsesurl = location.href.match(/\/lapses\/*$/)
    this.usingplayer = (this.lapsesurl || this.videourl)

    if (this.lapsesurl)
      this.setup_lapses()
    else
      this.LAPSES = [] // no filtering needed!


    if (this.usingplayer) {
      // insert:
      //    <div id="filmstrip"></div>
      //    <br clear="left">
      var content = document.getElementById("content");
      if (!content) {
        var obj = document.getElementById("wptouch-search");
        if (!obj)
          return false;
        // else we are mobile theme for my site...
        this.mobile = true;
      }

      var post = document.getElementById("vvv");
      //var post = document.getElement('div.post');//mootools shortcut since have it!

      var obj = document.createElement('div');
      obj.setAttribute('id', 'filmstrip');
      post.appendChild(obj);
      obj = document.createElement('br');
      obj.setAttribute('clear', 'left');
      post.appendChild(obj);
    }

    if (location.href.match(/filmstrip/)) {
      var bodyobj = document.getElementsByTagName("body")[0];
      if (!bodyobj)
        return false;
      var obj = document.createElement('div');
      obj.setAttribute('id', 'filmstrip');
      bodyobj.appendChild(obj);

      obj = document.getElementById('clips');
      if (obj)
        obj.setAttribute('id', 'ignored');
    }

    if (document.getElementById('clips'))
      return this.playClips();


    this.filmstrip = document.getElementById('filmstrip');

    if (!this.filmstrip)
      return false;

    if (this.usingplayer) {
      // allow for 4 vids per line!
      this.css("div#content { padding-right:10px !important; }");//xxx
      this.HALF = '';
    } else {
      // archive.org
      $('#picks').insertAfter('#spotlight');
    }

    const imgPre = (location.hostname.match('archive.org') ? '/serve/poohBot/' : '/img/');

    this.css("\n\
.topinblock {\n\
  vertical-align:top;\n\
  display:inline-block;\n\
  *display:inline; /*for IEv8, at least*/\n\
}\n\
.rounded15 {\n\
  -moz-border-radius:15px;\n\
  -webkit-border-radius:15px;\n\
  -khtml-border-radius:15px;\n\
  border-radius:15px;\n\
}\n\
.strip {\n\
  padding-top:25px;\n\
  height:200px;\n\
  position:relative;\n\
  background:url('"+imgPre+"sprok200x174.jpg');\n\
  background-repeat:no-repeat;\n\
}\n\
.stripHALF {\n\
  padding-top:25px;\n\
  height:130px;\n\
  position:relative;\n\
  background:url('"+imgPre+"sprok200x119.jpg');\n\
  background-repeat:no-repeat;\n\
}\n\
.cell {\n\
  width:160px;\n\
  height:110px;\n\
  margin:0px !important;\n\
  /* these next 4 should be padding but IE sux */\n\
  border-left:20px solid black;\n\
  border-right:20px solid black;\n\
  border-top:10px solid black;\n\
  border-bottom:10px solid black;\n\
}\n\
.cellHALF {\n\
  width:80px;\n\
  height:55px;\n\
  margin:0px !important;\n\
  border:10px solid black; /* should really be padding but IE sux */\n\
}\n\
.placard {\n\
  cursor:pointer;\n\
  border:1px solid #333;\n\
  color:white;\n\
  filter:alpha(opacity=70);-moz-opacity:.70;opacity:.70;\n\
  position:absolute;\n\
  background-color:black;\n\
  font-style:italic;\n\
  font-size:10pt;\n\
  padding:0 5 2 5;\n\
}\n\
.placard2 {\n\
  top:140px;\n\
  left:30px;\n\
  min-width:110px;\n\
}\n\
.placard2HALF {\n\
  min-width:55px;\n\
  top:88px;\n\
  left:5px;\n\
}\n\
.placard2HALFb {\n\
  min-width:55px;\n\
  top:88px;\n\
  left:115px;\n\
}\n\
    ");

    this.filmstripSetup()
    return false
  }


  playClips() {
    if (!document.getElementById('clips'))
      return

    // newer browsers like FF 3.5+ and Safari 4+ can play the new <video> tag!
    // check for browsers that can handle the <video> tag natively...
    // (credit to J at v2v dot cc for this simpler JS detection technique!)
    var video = document.createElement('video')
    if (!video.play)
      return

    for (var clip, i=0; clip=this.CLIPS[i]; i++) {
      clip = clip.replace(/https:\/\/archive.org\/download\//, '');
      var pcs = clip.split(/[\/\?]/);
      this.IDS[i] = pcs[0];
      this.FILES[i] = pcs[1].replace(/(_512kb.mp4|.ogv)$/, '');
      this.QSTRINGS[i] = ((pcs.length>2 ? '?'+pcs[2] : '') +
                          (pcs.length>3 ? '/'+pcs[3] : ''));
    }

    this.load(0)
    this.load(1)
  }

  load(idx) {
    var id=this.IDS[idx];
    log(id,' is loading');
    this.nloading++;
    var v=document.createElement('video');
    v.autoload = true;
    v.style.position = 'absolute';
    v.style.top=0;
    v.style.left=0;
    v.width = 10;
    v.height = 10;
    v.autoplay = false;
    v.controls = false;
    v.innerHTML = '<source type="video/mp4" src="https://archive.org/download/'+id+'/'+this.FILES[idx]+'_512kb.mp4'+this.QSTRINGS[idx]+'"/><source type="video/ogg" src="https://archive.org/download/'+id+'/'+this.FILES[idx]+'.ogv'+this.QSTRINGS[idx]+'"/>';

    v.addEventListener("canplay", function() { IAV.canplay(idx); }, true);
    v.addEventListener("load",    function() { IAV.loaded(idx); }, true);
    v.addEventListener("ended",   function() { IAV.ended(idx); }, true);

    this.v[idx] = v;
    document.getElementById('clips').appendChild(v);
  }

  static canplay(idx) {
    var id=this.IDS[idx];
    log(id, ' can start playback');
    if (!this.playing  &&  this.playnext == idx)
    {
      this.playing = true;
      this.playnext = idx + 1;
      this.v[idx].width = 640;
      this.v[idx].height = 480;
      this.v[idx].style.position = 'relative';

      this.v[idx].play();
      log(id, ' is playing');
    }
    else
    {
      if (this.playable[idx])  return; //xxx shouldnt need to do this?!
      this.playable[idx] = true;

      this.v[idx].currentTime=0;
      this.v[idx].play();
      this.v[idx].pause();
    }
  }

  static loaded(idx) {
    var id=this.IDS[idx];
    log(id,' has been 100% downloaded');
    this.nloading--;

    if (this.nloading < 2  &&  idx+2 < this.IDS.length)
      this.load(idx+2);
  }

  static ended(idx) {
    var id=this.IDS[idx];
    log(id,' has finished playback');
    this.v[idx].width = 10;
    this.v[idx].height = 10;
    this.v[idx].style.position = 'absolute';
    this.playing = false;
    if (this.playable[idx+1])
      this.canplay(idx+1);
  }


  // for video.md and lapses.md only
  static playmp4(evt) {
    const identifier = (evt ? evt.dataset.id : '')
    let playlist = false

    if (!evt) {
      // means play all videos

      if (!this.playallSetup) {
        this.playallSetup = true
        $.getScript('https://archive.org/jw/jwplayer.js', function() {
          log('play all setup')
          IAV.playmp4(0)
        })
        return false
      }


      playlist = []
      for (let id in this.MAP) {
        if (this.omitClip(id))
          continue

        playlist.push({
          'title': this.MAP[id][1],
          'file': 'https://archive.org/download/'+id+'/format=h.264&x=ignore.mp4'
        })
      }

      log(playlist)
    }


    // now figure out where we should place the player:
    //   _after_ the last cell in the row w/ the clicked cell
    //   _before_ the first cell in the row w/ the clicked cell (when last row clicked)
    const firstY = $('.strip:first').offset().top
    const lastY = $('.strip:last').offset().top
    const clickedY = (evt ? $(evt.parentNode).offset().top : firstY)
    log({ identifier, firstY, clickedY, lastY })
    const $after = (clickedY === lastY
      // if clicked on last row, find last element in prior row
      ? $('.strip').filter((idx, e) => $(e).offset().top < clickedY).last()
      // else find last element in clicked row
      : $('.strip').filter((idx, e) => $(e).offset().top === clickedY).last()
    )


    // first clear and hide any already visible/playing player
    $('body').append($('<div id="player1" style="display:none"></div>'))

    $('#player1').hide('slow', () => {
      $('#player1').remove()
      $('<div id="player1" style="display:none"></div>').insertAfter($after)


      if (playlist) {
        $('#player1').html('<div id="mwplayer" width="800" height="480"> </div>')
      } else {
        $('#player1').html('<iframe src="https://archive.org/details/'+identifier+'?embed=1'+(IAV.ios?'':'&autoplay=1')+'" width="100%" style="min-width:320px" height="480" frameborder="0"></iframe>')
      }

      $('#player1').show('slow')


      if (playlist) {
        jwplayer('mwplayer').setup({
          'http.startparam': 'start',
          autoplay: (IAV.ios ? false : true),
          playlist: playlist,
          provider: 'http',
          width: 800,
          height: 480
        })
      }
    })

    return false;
  }

  omitClip(identifier) {
    if (!this.LAPSES.length)
      return false

    // means we are on page "lapses.md" and need to omit non time lapses
    for (let i = 0, id; id = this.LAPSES[i]; i++) {
      if (id === identifier) return false // not a timelapse video, omit
    }
    return true
  }

  filmstripSetup() {
    let str = ''
    if (this.usingplayer)
      str += '\n\
\n\
<div style="margin-top:-10px;  float:right;">\n\
  <a onclick="return IAV.playmp4()">Play all</a>\n\
</div>\n\
';

    str += '\n\
<center>\n\
  <div style="font-size:9pt;'+(this.usingplayer?'':'padding-left:100px;')+'font-style:italic;">\n \
    mouse over an image to see more scenes\n\
    -- click image to watch the full video\n\
'+(this.usingplayer?'-- click text for more info/formats':'')+'\n\
  </div>\n\
</center>\n\
<div>\n\
\n\
    ';
    let n = 0

    for (const id in this.MAP) {
      if (this.omitClip(id))
        continue

      const thumbn = this.MAP[id][0]
      const title  = this.MAP[id][1]

      if (!this.HALF  ||  (n % 2 == 0))
        str += '</div><div class="topinblock strip'+this.HALF+'">';
      str += '<div title="click for more info" alt="click for more info" onclick="location.href=\'https://archive.org/details/'+id+'\'" class="rounded15 placard placard2'+this.HALF+((this.HALF && n % 2)?'b':'')+'">'+id+'</div>';

      // left 0-pad to 6 digits as needed
      let thumb = '000000' + thumbn
      thumb = thumb.substr(thumb.length-6, 6)

      const onclik = (this.usingplayer ? 'data-id="'+id+'" onclick="return IAV.playmp4(this)"' : // xxx CSP onmouse.. 2 lines below..
                    'href="https://archive.org/details/'+id+'"');

      str += '<a '+ onclik + '><img title="'+title+'" alt="'+title+'" id="'+id+'" onmouseover="IAV.imtoggle(\''+id+'\')" onmouseout="IAV.imtoggle(\''+id+'\')" class="cell'+this.HALF+'" src="https://archive.org/serve/'+id+'/'+id+'.thumbs/'+id+'_'+thumb+'.jpg"/></a>';

      n++;
      if (this.HALF  &&  n==8)
        break;
    }
    str += '</div>';


    var obj = document.getElementById('numvid');
    if (obj) obj.innerHTML = n;

    this.filmstrip.innerHTML += str;
    log(this.filmstrip);
  }


  setup_lapses() {
    const e = document.getElementById('agif-wrap')
    e.style.float = 'right'
    e.style.margin = '10px 0 12px 30px'
    e.style.color = '#888' // neutral for light or dark mode ;)
    e.style.textAlign = 'right'

    let gif = document.getElementById('agif')
    gif.style.border = '5px solid black'

    for (const link of e.getElementsByTagName('a')) {
      link.style.display = 'block'
      const img = link.getAttribute('href')
      link.addEventListener('mouseover', function() {
        log(img)
        gif.src = img
        log(gif.src)
      })
      link.addEventListener('click', function(evt) {
        evt.preventDefault()
        evt.stopPropagation()
      })
    }
  }


  static imtoggle(id) {
    const e = document.getElementById(id)
    if (e) {
      if (e.src.match(/.jpg$/)) {
        e.jpg = e.src
        e.src = 'https://archive.org/serve/'+id+'/'+id+'.gif'
      } else {
        e.src = e.jpg
      }
    }
    return false
  }


  css(str) {
    var headobj = document.getElementsByTagName("head")[0]
    if (!headobj)
      return

    const obj = document.createElement('style')
    obj.setAttribute('type', 'text/css')
    if (obj.styleSheet)
      obj.styleSheet.cssText = str //MSIE
    else
      obj.appendChild(document.createTextNode(str)) // other browsers

    headobj.appendChild(obj)
  }
}


new IAV()
