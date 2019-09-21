/*
   xxx IE: test album selection, blog (nix custom look?!), etc.
   xxx load dnow from live site via proxy at current host via PHP?!
   xxx preload images/js to avoid stalling

---top page:
-bunny logo jaggies; blog pic and title hardcoded @bot
-ie dumbbunny.gif colors

---russ' safari (but not my windoze):
-europe-half
-about bottom fades/chops early  -- sporadically!
-DBP top jacked up a bit
 */

var Pooh =
{
  xfile:'',
  lastmod:null,
  printpix:false,
  albumsingle:false,
  albumsoverview:false, //true when at (top level/overview of) album.htm
  albpix:[],
  albpixAlbumName:[],
  randpix:[],
  randpixAlbumName:[],
  randquotes:[],
  loads:{},
  xmls:[],
  xmlurls:[],
  blogged:false,
  dnowed:false,

  // we allow iphone to do 2-per-row; rest do 4-per row.  we need 8 cells...
  albumChunkSize:8,


  nav:{"Home"           :"index",
       "My favorite..." :"favorites",
       "Pictures"       :"pictures",
       "Video"          :"video",
       "Time-lapse pix" :"samples",
       "Biking"         :"biking",
       "AIDS LifeCycle" :"alc",
       "Quotes"         :"quotes",
       "Europe Trip"    :"europe",
       "Work history"   :"work",
       "Resum&#233;"    :"resume",
       "Dumb Bunny"     :"DumbBunnyProductions",
       "About"          :"about",
       "Blog"           :"blog"
  },
  month:{'1' :'January',
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
  },
  navpic:[/**/{name:"../tracey.jpg"         ,w:" 80",h:"122"},
          /**/{name:"keywest.jpg"           ,w:"100",h:"133"},
          /**/{name:"nice.jpg"              ,w:"100",h:"142"},
          /**/{name:"ggreg-pic.jpg"         ,w:"100",h:"160"},
          /**/{name:"pride.jpg"             ,w:"100",h:"197"},
          /**/{name:"happy.jpg"             ,w:"100",h:"120"},
          /**/{name:"helios.jpg"            ,w:"100",h:"174"},
          /**/{name:"sonoma.jpg"            ,w:"100",h:"160"},
          /**/{name:"traceyYahooAvatar.jpg" ,w:"100",h:"220"}
          /*  {name:"../new-bike.jpg"          ,w:" 92",h:"150"}*/
    ],


  init:function()
  {
    var obj = document.getElementsByTagName("meta")[0];
    if (typeof(obj)!='undefined')
    {
      var ret = obj.getAttribute('fi').substr(10);
      if (typeof(ret)!='undefined')
        this.xfile = ret.substring(0, ret.lastIndexOf('.htm,v'));
      ret = obj.getAttribute('mod').substr(7);
      if (typeof(ret)!='undefined')
        this.lastmod = ret.substring(0, ret.indexOf(' '));
    }

    var bodyobj = document.getElementsByTagName("body")[0];
    var bodyclass = bodyobj.getAttribute('class');
    if (bodyclass=='std')
      bodyobj.setAttribute('class', 'std clouds');


    if (this.xfile=='quotes')
      this.jsload('quotes.js'); // invokes quotes() below


    // setup <head>
    var headobj = document.getElementsByTagName("head")[0];
    if (navigator.userAgent.indexOf('iPhone') >= 0 ||
        navigator.userAgent.indexOf('iPod'  ) >= 0)
    {
      var obj = document.createElement('link');
      obj.setAttribute('type', 'text/css');
      obj.setAttribute('href', 'iphone.css');
      obj.setAttribute('rel' , 'stylesheet');
      headobj.appendChild(obj);

      // scroll iphone down nicely to hide location bar
      window.scrollTo(0,1);
    }
    if (headobj.getElementsByTagName("title").length==0)
      document.title = 'chez Tracey Jaquith';

    var obj = document.createElement('link');
    obj.setAttribute('href', 'images/iphone.png');
    obj.setAttribute('rel' , 'apple-touch-icon');
    headobj.appendChild(obj);

    var obj = document.createElement('meta');
    obj.setAttribute('name',    'viewport');
    obj.setAttribute('content', 'width=device-width, minimum-scale=0');
    headobj.appendChild(obj);

    var obj = document.createElement('meta');
    obj.setAttribute('name',    'apple-touch-fullscreen');
    obj.setAttribute('content', 'YES');
    headobj.appendChild(obj);

    var obj = document.createComment('\n\
  [if  ie]> <link rel="stylesheet" href="notmoz.css" type="text/css" type="text/css" <![endif] \n\
  [if lt IE 7]> <style> body { behavior:url("csshover.htc"); } </style> <![endif] \n\
');
    headobj.appendChild(obj);





    if (bodyclass=='album')
      return false; // photo album(s) -- they have totally separate look


    // setup <body>
    var vacuum = bodyobj.innerHTML;
    bodyobj.innerHTML = '';

    var container = document.createElement('div');
    container.setAttribute('id', 'container');
    bodyobj.appendChild(container);

    var obj = document.createElement('div');
    obj.setAttribute('id', 'header');
    obj.innerHTML='<div class="bgcol" style="position: absolute; padding:5px 0px 0px 155px;">\
<img src="images/logo.png"/>                                            \
</div>\
<object type="application/x-shockwave-flash" width="1000" height="100" id="FlowPlayer" data="http://archive.org/flv/FlowPlayer.swf"> \
<param name="allowScriptAccess" value="archive.org"/>\
<param name="movie" value="http://archive.org/flv/FlowPlayer.swf" />\
<param name="quality" value="high" />\
<param name="scale" value="noScale" />\
<param name="wmode" value="transparent" />\
<param name="flashvars" value="config={hideControls:true, loop:true, autoPlay:true, showPlayList:false, videoHeight:100, initialScale:\'scale\', videoFile:\'../images/sunset.flv\'}"/>\
</object>';
    container.appendChild(obj);

    var obj1 = document.createElement('div');
    var obj2 = document.createElement('div');
    obj1.setAttribute('id', 'nav');
    obj2.setAttribute('id', 'nav2');
    var str = '<div style="text-align:center; width:100%; z-index:100; font-size:10pt;">Tracey Jaquith</div>' + this.randNavPic();

    for (var elm in this.nav)
    {
      str += '<a href="'+this.nav[elm]+'.'+
        (this.nav[elm]=='blog'?'xml':'htm')+'"><div'+
        (this.xfile==this.nav[elm] ? ' class="navsel"' : '') +
        '><p>'+elm+'</p></div></a>';
    }
    obj2.innerHTML=str;
    obj1.appendChild(obj2);
    container.appendChild(obj1);

    var content = document.createElement('div');
    content.setAttribute('id', 'content');
    container.appendChild(content);

    var obj = document.createElement('div');
    obj.setAttribute('id', 'spacer');
    content.appendChild(obj);

    var obj = document.createElement('div');
    obj.setAttribute('id', 'iphone');
    obj.innerHTML = '\
     <div id="menu">\
       <img style="position:absolute; width:480px;" src="images/sunset.gif"/>\
       <a href="index.htm"><div>Home</div></a>\
       <a href="pictures.htm"><div>Pictures</div></a>\
       <a href="blog.xml"><div>Blog</div></a>\
       <a href="biking.htm"><div>Biking</div></a>\
       <a href="favorites.htm"><div>Faves</div></a>\
     </div>';
    if (this.xfile=='index')
      obj.innerHTML += this.randNavPic();
    content.appendChild(obj);


    content.innerHTML += vacuum;


    var obj = document.createElement('div');
    obj.setAttribute('id', 'footer');
    obj.innerHTML='&#169;Copyright 2010 Dumb Bunny Productions&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;'+
    this.xfile +'.htm&#160;&#160;last updated: '+this.pretty(this.lastmod, true);
    container.appendChild(obj);



    var els = document.getElementsByClassName('PICTURE');
    for (var i=0, el; el=els[i]; i++)
    {
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
      // marker to know what element gets replaced when "albumCall()" invoked
      this.randpix.push(el);
    }

    // now that we have figured out all album and random pictures to insert,
    // we either load the list of all albums
    // (to find a random pic in a random album for *each* random pic)
    // *OR* just load specific albums we know we need
    if (this.randpix.length > 0)
      this.jsload('albums/ALBUMS.js');//... this .js invokes albumsCall()
    else
      this.loadAlbums();


    var els = document.getElementsByClassName('RANDOM-QUOTE');
    for (var i=0, el; el=els[i]; i++)
    {
      // marker to know what element gets replaced when "quotes()" invoked
      this.randquotes.push(el);
    }
    if (this.randquotes.length > 0)
      this.jsload('quotes.js'); // invokes quotes() below

    if (this.xfile=='tours')
      this.tours();
    if (document.getElementById('dnnew'))
      this.loadXMLDoc('democracynow.xml?v='+(Math.random()*10000)); //force reload
    if (document.getElementById('thingRSS'))
      this.loadXMLDoc('blog.xml');


    // for video.htm, samples.htm
    if (location.href.match(/\/(video.htm|samples.htm)$/))
    {
      var obj = document.createElement('div');
      obj.setAttribute('id', 'filmstrip');
      content.appendChild(obj);
      obj = document.createElement('br');
      obj.setAttribute('clear', 'left');
      content.appendChild(obj);
      IAV.setup();
    }

    return false;
  },


  // (*asynchronously*!) loads a .js file
  jsload:function(jsfile)
  {
    if (typeof(document)!='undefined')
    {
      var head = document.getElementsByTagName("head")[0];
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = jsfile;
      head.appendChild(script);
    }
    else
    {
      // SSJS!
      load(jsfile);
    }
  },


  loadAlbums:function()
  {
    for (albumname in this.loads)
    {
      // this .js invokes albumCall() below
      albumname = albumname.replace(/\-[0-9]+$/, '');
      //console.log('loading... ' + albumname);
      this.jsload('albums/' + albumname + '.js');
    }
  },


  // eg: file="europe/106-0607_IMG.JPG"
  // eg: file="2004 biking/131-3159_IMG.JPG"
  albumPicture:function(el)
  {
    var file=el.getAttribute('file');

    var albumname = file.substring(0, file.indexOf('/')); // before "/" char
    if (file[0]=='2')
      albumname = albumname.substring(albumname.indexOf(' ')+1); // after " " char

    // marker to know what element gets replaced when "albumCall()" invoked
    this.albpix.push(el);
    this.albpixAlbumName.push(albumname);

    this.loads[albumname] = 1;
  },


  albumsCall:function(albums) // array of album names
  {
    for (var i=0, el; el=this.randpix[i]; i++)
    {
      var albumname = albums[Math.round((albums.length-1) * Math.random())];
      this.randpixAlbumName.push(albumname);
      this.loads[albumname] = 1;
    }

    if (this.albumsoverview)
    {
      var str = '\
<span style="font: 20pt Verdana, Arial, Helvetica;">Tracey\'s photo albums</span> \
<span style="padding-left:200px;"></span>\
2002 - 2010\
<br/>\
<span class="nav"><a href="pictures.htm">return to Tracey\'s Home</a></span><br/><br/>\
\
<div style="float:left;"> \
';
      // aid to figure out which column, left or right, to add album to
      var half = Math.round(albums.length / 2) - 1;

      for (var i=0, albumname; albumname=albums[i]; i++)
      {
        this.loads[albumname] = i; // save order in which albums should appear!

        str += '<div id="al'+i+'"> </div>';
        if (i==half)
          str += '</div><div style="float:left;">'; //start 2nd column
      }

      var obj = document.getElementById('fillme');
      obj.innerHTML = str + '</div><br clear="all"/>';
    }
    else if (this.printpix)
    {
      for (var i=0, albumname; albumname=albums[i]; i++)
        this.loads[albumname] = i; // save order in which albums should appear!
    }


    this.loadAlbums();
  },


  // NOTE: this is invoked in individual album .js files like "albums/europe.js"
  albumCall:function(album)
  {
    if (this.albumsoverview)
    {
      return this.album_Overview(album);
    }
    else if (this.albumsingle)
    {
      return this.album_Single(album);
    }
    else if (this.printpix)
    {
      for (var i=0, fi; fi=album.file[i]; i++)
      {
        var filename = this.filename(album, fi);
        print("albums/images/" + filename);
        print("albums/thumbs/" + filename);
      }
      return false;
    }


    for (var j=0; j<this.randpix.length; j++)
    {
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

    for (var j=0; j<this.albpix.length; j++)
    {
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
    return false;
  },


  insertPic:function(el, album, fi)
  {
    //console.log(el);
    var filename = this.filename(album, fi);

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
      href = 'album.htm#' + album.name;

    el.innerHTML = this.roundPic({
        'filename'  :filename,
        'title'     :fi.title,
        'href'      :href,
        'wd'        :wd,
        'ht'        :ht,
        'overlay'   :(this.pretty(album.date) + '<hr/>' +
                      album.name + '<hr/>' +
                      fi.title)
      }, el.innerHTML);
    return false;
  },


  pr:function(str)
  {
    return (typeof(str)=='undefined' ? "" : str);
  },


  // normally filename is "album.date album.name"/"file.name"
  // but album can override with attr...
  filename:function(album, fi)
  {
    if (typeof(album.subdir)=='undefined')
      return this.pr(album.date)+' '+this.pr(album.name)+'/'+this.pr(fi.name);

    return this.pr(album.subdir)+'/'+this.pr(fi.name);
  },

  getImgSize:function(imgSrc)
  {
    var newImg = new Image();
    newImg.src = imgSrc;
    var tmp = parseInt(newImg.width);
    newImg = null;
    return tmp;
  },


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
  roundPic:function(pic, html)
  {
    // setup defaults for optional elements
    if (typeof(pic.ht)=='undefined') pic.ht=150;
    if (typeof(pic.src)=='undefined')
      pic.src = 'albums/thumbs/' + pic.filename;

    if (typeof(pic.wd)=='undefined')
      pic.wd = Pooh.getImgSize(pic.src);


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
  },


  // YYYY_MM_DD         ==>   January 3, 2005
  // YYYY-MM            ==>   January 2005
  // ####.##.##         ==>   February 27, 2006
  // ####.##.##,true    ==>   Feb 27, 2006
  pretty:function(date, month3letters)
  {
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
      str += this.month[month];

      if (month3letters)
        str = str.substring(0,3);
      str += ' ';
    }

    if (typeof(day)!='undefined'  &&  day!='')
      str += day+', ';
    str += year;
    return str;
  },


  // random tracey pic; centered inside 100x220 box
  randNavPic:function()
  {
    var pic = this.navpic[Math.round((this.navpic.length-1) * Math.random())];
    var topspc = (220 - parseInt(pic.h)) / 2;

    return '\
  <div id="navpic" style="position:relative; height:220px;">\
    <div style="width:'+pic.w+'px; margin-left:auto; margin-right:auto;">\
      <a href="index.htm">\
        <img style="position:absolute; top:'+topspc+'px; z-index:0; width:'+
    pic.w+'px; height:'+pic.h+'px;" src="images/nav/'+
    pic.name+'" alt="Tracey Jaquith"/>\
      </a>\
    </div>\
  </div>';
  },




  // for album.htm
  album_Loaded:function()
  {
    var tmp = location.href.indexOf('#');
    if (tmp > 0)
    {
      this.albumsingle = true;
      this.loads[location.href.substring(tmp+1)]=1;
      this.loadAlbums();
    }
    else
    {
      this.albumsoverview = true;
      Pooh.init();
      Pooh.jsload('albums/ALBUMS.js');//... this .js invokes albumsCall()
    }
  },


  // for album.htm
  album_Single:function(album)
  {
    document.title = 'Photo album: '+album.name;

    var str = '\
<a name="'+album.name+'"> </a>\
<span style="font: 20pt Verdana, Arial, Helvetica;">Album: '+
    album.name+'</span> ('+album.file.length+' pictures)\
<span style="padding-left:200px;"></span>\
\
'
    + this.pretty(album.date) +
    '<br/>\
\
<span class="nav"><a onclick="return Pooh.album_Go(this.href);" target="_top" href="album.htm">See all albums</a></span>\
<br/>\
'
    +
    (typeof(album.description)=='undefined' ? '' :
     '<div id="description">' + album.description + '</div>') +
    '\
<div style="padding:20px;"></div>\
\
';

    var ht=150;
    var tmp = location.hash.substring(location.hash.lastIndexOf('-')+1);
    if (typeof(tmp)!='undefined'  &&  tmp.match(/^[0-9]+$/))
      ht = parseInt(tmp); // 1/2 height pictures for inline frame on europe.htm!
    if (typeof(album.height)!='undefined')
      ht = parseInt(album.height); // NOTE: legacy; not used right now

    for (var i=0; i<album.file.length; i++)
      str += this.pixcell(album, i, ht);

    var obj=document.getElementById('fillme');
    obj.innerHTML = str;
  },


  album_Go:function(albumurl)
  {
    var tmp = albumurl.indexOf('#');
    if (tmp > 0)
    {
      this.albumsingle = true;
      var albumname = albumurl.substring(tmp+1);
      this.loads[albumname]=1;
      this.loadAlbums();
      location.href=albumurl;
    }
    else
    {
      //this, uh, got a bit convoluted (going back to overview from indiv album)
      location.href=albumurl;
      this.album_Loaded();
    }
    return false;
  },


  // for album.htm
  album_Overview:function(album)
  {
    // add this album to the album index/overview page

    var str =
    '<table style="text-align:right;"><tr><td>\
<a onclick="return Pooh.album_Go(this.href);" href="album.htm#'+album.name+'">' +
    album.name + '</a><br/>\
<span style="font-size: 6pt;">\
'
    + this.pretty(album.date) + '\
</span>\
</td>\
';

    for (i=1; i<=2; i++)
    {
      if (typeof(album['idx'+i])!='undefined')
      {
        var fi=album.file[album['idx'+i]-1];
        var ht=75;
        // tracey thumbnails are *always* 150px high; but width varies
        // determine what width to use (scale appropriately to desired height)
        var wd = Math.round(fi.w * ht / 150);
        var filename = this.filename(album, fi);
        str += '\
    <td>\
'
          + '\
      <div class="pixcell" style="width:'+(wd+20)+'px;">\
'
          + this.roundPic({
              'filename':filename,
              'title'   :'untitled',
              'href'    :'album.htm#'+album.name,
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
    str += '</tr></table>';


    // insert this album's HTML into the div set aside for this album
    // previously (because remember, each album can load out of order...)
    var obj = document.getElementById('al'+this.loads[album.name]);
    obj.innerHTML = str;


    // this allows us to know when every album has been loaded!
    delete(this.loads[album.name]);

    for (var j in this.loads)
      return false; // not every album has been loaded yet


    // ALL ALBUMS LOADED!
    // turn this mode "off" now so onclick-ing will load a given album
    this.albumsoverview = false;

    return false;
  },


  // for album.htm
  pixcell:function(album, idx, ht)
  {
    var fi = album.file[idx];
    var filename = this.filename(album, fi);

    // tracey thumbnails are *always* 150px high; but width varies
    // determine what width to use (and scale appropriately to desired height)
    var wd=Math.round(fi.w * ht / 150);

    var wd2 = wd + (ht < 76 ? 50 : 14);
    var wd3 = wd - 7;

    var chunk = ((idx) % this.albumChunkSize) + 1;

    var href = (location.host.indexOf('.archive.org')>0 ?
                '' : 'file:///Users/tracey/') + 'Pictures/' + filename;

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
    ';
  },



  // for tours.htm
  tours:function()
  {
    var els = document.getElementsByClassName('biketour');
    for (var i=0, el; el=els[i]; i++)
    {
      var name = el.getAttribute('name');
      el.innerHTML = '\
  <div style="margin:20px; background-color:black; padding:5px; float:left; margin-right:10px;"> \
    <div style="padding-left:5px; padding-right:5px; padding-bottom:5px;">\
      <img src="images/star.png"/>\
        <a href="ciclo/'+name+'.htm">'+el.getAttribute('title')+'</a> \
    </div> \
    <a class="hoverShower2" href="ciclo/'+name+'-overview.jpg"> \
      <span class="showOnHover2 tourOverlay"> \
        ' + el.innerHTML + '\
        <hr/> \
        <h5>'+el.getAttribute('miles')+' miles</h5> \
      </span> \
      <img width="300" src="ciclo/'+name+'-thumb.jpg"/> \
    </a> \
  </div> \
      ';
    }
  },


  // for jpegs.htm
  insertPICs:function()
  {
    var PERROW=5;
    var els = document.getElementsByTagName('PIX');
    var used={};
    for (var i=0, el; el=els[i]; i++)
    {
      var rowwd=0;
      var file;
      el.innerHTML = '<div class="row">';
      for (var colnum=0; colnum < PERROW; colnum++)
      {
        for (var x=0; x<10; x++)
        {
          file = jpegs[Math.round((jpegs.length - 1) * Math.random())];

          // keep track of the pictures we use so we don't repeat
          if (typeof(used[file])=='undefined')
            break;
        }
        used[file]=1;

        // split into date and "album" where we can
        var pieces = [];
        var date = file.split(/[^0-9_]/)[0];
        if (typeof(date)!='undefined'  &&  date.indexOf('200')==0)
        {
          var albumname = file.substring(date.length);
          albumname = albumname.substring(0, albumname.lastIndexOf('/'));
          //console.log(date + ' ==> ' + this.pretty(date) + ' ==> '+ albumname);
          pieces = [this.pretty(date, true), albumname];
        }
        else
        {
          var filepart = file.substring(file.lastIndexOf('/')+1);
          var dirs = file.substring(0, file.lastIndexOf('/'));
          pieces = [dirs];
          //console.log("NO DICE "+file+ '  ==>  '+dirs+'  '+filepart);
        }


        var src = 'albums/thumbs/' + file;
        var href= 'albums/images/' + file;
        var str=
          '<a class="hoverShower" href="'+href+'"><span class="hoverShower">'+
          '<span class="showOnHover pixOverlay" style="width:90px;">';
        for (var ii=0, piece; piece=pieces[ii]; ii++)
          str += (ii ? '<hr/>':'') + piece;
        str += '</span><img class="'+
          (colnum==0?"left":(colnum+1==PERROW?"rite":"")) +
          '" src="' + src + '"/></span></a>';
        el.innerHTML += str;
      }
      el.innerHTML += '</div>';
    }
    return false;
  },


  // for quotes.htm and <RANDOM-QUOTE>
  quotes:function(quotes)
  {
    if (this.randquotes.length > 0)
    {
      for (var i=0, el; el=this.randquotes[i]; i++)
      {
        var q=quotes.short[Math.round((quotes.short.length-1) * Math.random())];
        el.innerHTML =
        '<a class="stealth" href="quotes.htm"><dt>'+
        q.q+'<dt><dd> - '+q.a + '<br/></dd></a>';
      }
    }
    else
    {
      var str='';
      for (var longy=0; longy<2; longy++)
      {
        var qs = (longy ? quotes.long : quotes.short);
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

      var obj = document.getElementById("fillme");
      obj.innerHTML = str;
    }
    return false;
  },


  // for samples.htm
  playimg:function(img)
  {
    var ag = document.getElementById("agif");
    ag.src = 'images/'+img;
  },


  arg:function(theArgName)//NOTE: presently not used
  {
    sArgs = location.search.slice(1).split('&');
    r = '';
    for (var i=0; i < sArgs.length; i++)
    {
      if (sArgs[i].slice(0,sArgs[i].indexOf('=')) == theArgName)
      {
        r = sArgs[i].slice(sArgs[i].indexOf('=')+1);
        break;
      }
    }
    return (r.length > 0 ? unescape(r).split(',') : '')
  },


  loadXMLDoc:function(url)
  {
    var xml = false;

    // branch for native XMLHttpRequest object
    if (window.XMLHttpRequest  &&  !(window.ActiveXObject))
    {
      try { xml = new XMLHttpRequest(); } catch(e) { xml = false; }
      // branch for IE/Windows ActiveX version
    }
    else if (window.ActiveXObject)
    {
      try { xml = new ActiveXObject("Msxml2.XMLHTTP"); } catch(e) {
        try { xml = new ActiveXObject("Microsoft.XMLHTTP"); } catch(e) {
          xml = false;
        }
      }
    }
    if (xml)
    {
      Pooh.xmls.push(xml);
      Pooh.xmlurls.push(url);
      xml.onreadystatechange = Pooh.processReqChange;
      xml.open("GET", url, true);
      xml.send("");
    }
  },


  processReqChange:function()
  {
    for (var idx=0, xml; xml=Pooh.xmls[idx]; idx++)
    {
      // only if Pooh.xml shows "loaded"
      if (xml.readyState == 4)
      {
        // only if "OK"
        if (xml.status == 200)
        {
          // ...processing statements go here...
          Pooh.handleXML(idx);
        }
        else
        {
          alert("There was a problem retrieving the XML data:\n" +
                xml.statusText);
        }
      }
    }
  },


  handleXML:function(idx)
  {
    var xml = this.xmls[idx];
    var url = this.xmlurls[idx];
    if (url.indexOf('blog.xml')>=0)
    {
      if (this.blogged)
        return;
      this.blogged = true;

      // get most recent blog entry
      var e = xml.responseXML.getElementsByTagName('item')[0];

      // render first 75 chars of title + description, where description has
      // had any HTML in it removed and is 'pretty truncated' at a
      // word boundary
      var title =e.getElementsByTagName('title'      )[0].childNodes[0].nodeValue;
      var date  =e.getElementsByTagName('pubDate'    )[0].childNodes[0].nodeValue;
      var descr =e.getElementsByTagName('description')[0].childNodes[0].nodeValue;
      if (!date)
        date = e.getElementsByTagName('pubdate')[0].childNodes[0].nodeValue;
      date = date.substring(5, date.indexOf(' 00:00:00'));

      descr = descr.replace(/<[^>]+>/g,""); // strip HTML (weird it works!)
      //console.log(descr);
      descr = descr.substring(0, 75 - title.length);
      descr = descr.substring(0, descr.lastIndexOf(' ')) + ' ..';

      var el=document.getElementById('thingRSS');
      el.innerHTML = '\
  <a class="stealth" href="blog.xml">                                \
    <div style="font-style:italic; font-size:9pt; margin-top:10px;"> \
      <span style="float:right; font-size:7pt;">['+this.pr(date)+']</span> \
      <span style="font-weight:bold;">'+title+'</span>:\n' + descr +
      '\
      <br clear="all"/> \
    </div> \
  </a>';
    }
    else if (!this.dnowed)
    {
      this.dnowed = true;

      var str = '\
  <div style="margin-top:20px; border-color:#FFF380; border-style:solid; border-width:2px 0px 2px 0px;"> \
Latest headlines<br/> \
    <a class="stealth" href="http://www.democracynow.org/"> \
      <img style="float:right;" src="images/demnow.png"/> \
      Democracy Now! \
    </a> \
  </div> \
  <div id="dnow"> \
';
      var els = xml.responseXML.getElementsByTagName('item');

      var n=1;
      for (var i=0; i < els.length; i++)
      {
        var el = els[i];
        var title = el.getElementsByTagName('title')[0].childNodes[0].nodeValue;
        if (typeof(title)=='undefined'  ||  !title  ||
            title.indexOf('Headlines for')>=0)
        {
          continue;
        }

        // pretty truncate title
        title = title.substring(0, 60);
        title = title.substring(0, title.lastIndexOf(' ')) + ' ..';

        var link = el.getElementsByTagName('link')[0].childNodes[0].nodeValue;
        str += '<div><a class="stealth" href="'+link+'">'+title+'</a></div>\n';
        if (n++ > 6)
          break; // only print most recent 7 headlines
      }

      var el=document.getElementById('dnnew');
      el.innerHTML = str + '</div>';
    }
  }
}; // end Pooh var (encapsulation)


if (typeof(document)!='undefined'  && // (I have a SSJS script use js.js...)
    typeof(document.getElementsByClassName)=='undefined')
{
  //prolly IE or some junk
  document.getElementsByClassName = function(className) {
    var children = document.body.getElementsByTagName('*');
    var elements = [];
    for (var i=0, child; child=children[i]; i++)
    {
      if (child.className.match(new RegExp("(^|\\s)" + className + "(\\s|$)")))
        elements.push(child);
    }
    return elements;
  };
}


if (typeof(window)!='undefined')
  window.onload = function() { Pooh.init(); }
