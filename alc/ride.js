// 2009/2019 Tracey Jaquith  GPL/opensource/free to re/use...

if (typeof log === 'undefined') {
  log = (typeof console === 'undefined'
    ? () => {}
    : console.log.bind(console)
  )
}

class Ride {
  constructor() {
    // NOTE: router web service replaces all these when it is used...
    this.custom = '<center><i>NOTE: all rides *do* start/finish at Orinda BART<br/><span style="font-size:80%">(I sometimes had to omit a segment near BART station to make them map nicely 8-)</span></i><br/></center>'
    this.series  = 'Cat 3 East Bay Rides'
    this.leaders = ['Tracey Jaquith: (415)-###-####', 'Hunter Brown: (510)-###-####']
    this.location   = 'Orinda BART, eastern parking lot';
    this.meettime   = '7:30am';
    this.ridetime   = '8am';
    this.rain       = 'Rain cancels';
    this.category   = '3 - moderate-fast pace (12-15 mph)';
    this.terrain    = '3 - rolling hills with some steep climbs';

    log('setup!')

    if (location.pathname.match(/route.htm$/))
      this.route()
    else if (location.pathname.match(/links.htm$/))
      this.linkify()
    else if (location.pathname.match(/elevation.htm$/))
      this.elevation()

    if ($('#indy').length)
      this.index()
  }

  index() {
    const data = {}
    const $indy = $('#indy')
    const rel = '/alc/'
    const ttl = `${rel}${$indy.data('ttl')}`

    data.URL = ($indy.data.url
      ? $indy.data.url
      : this.getMapUrl(ttl)
    )

    log('index()', {rel, ttl}, data)

    // setup zoom level for the embedded (small/inline) map
    const ZOOM = (location.pathname.match(/palomares-canyon/) ?
                  '&z=10&sz=10' : '&z=11&sz=11')
    // setup the url to use in the embedded (small/inline) map
    const U2 = (data.URL.replace(/\&(mra|mrcr|mrsp|sz|sspn|ie|ll|sll|spn|z)=[^&]+/g,'')
               + ZOOM)

    const terrain =  (location.pathname.match(/three-bears-and-mt-diablo/) ?
                      '4 - steep hills, long climbs' : this.terrain)

    $('#indy').html(`
<center><h1>${data.title ? data.title : ($indy.data('title') ? $indy.data('title') : '')}</h1></center>
<ul>
  <li>
    <strong>Location:</strong>
    ${this.location} (<a href="${rel}../meet.jpg">map with red "X"</a>)
  </li>
  <li>
    <strong>Meet Time:</strong>
    ${this.meettime}
  </li>
  <li>
    <strong>Ride-out Time:</strong>
    ${this.ridetime}
  </li>
  <li>
    <strong>Rain policy:</strong>
    ${this.rain}
  </li>
  <li>
    <strong>Category:</strong>
    ${this.category}
  </li>
  <li>
    <strong>Terrain:</strong>
    ${terrain}
  </li>
</ul>

${this.custom}

<center>
  <iframe width="500" height="500" frameborder="0" scrolling="no"
    marginheight="0" marginwidth="0" src="${U2}&output=embed"></iframe><br/>
  <small>
    <a href="${data.URL}&source=embed" style="text-align:left">View Larger Map</a>
  </small>
  <br/><br/>
  <table style="padding:20px"><tr>
    <td><a href="${ttl}/route.htm"><img border="0" src="${rel}sheet.png"></td>
    <td><h2><a href="${ttl}/route.htm">Route Sheet</a></h2> (turn by turn)</td>
  </tr></table>

  <iframe style="border:1px solid #ccc;" width="500" height="350" frameborder="0" scrolling="no"
    marginheight="0" marginwidth="0" src="${ttl}/elevation.htm?half=1"></iframe>
  <br/><br clear="all"/>
</center>
`)
  }


  route() {
    const bodyobj = document.getElementsByTagName("body")[0]
    const data = JSON.parse(document.getElementsByTagName('route')[0].dataset.data)

    var o = document.createElement('div')
    var tmp='', n=0
    for (var i=0, ldr; ldr=this.leaders[i]; i++) {
      tmp += '<tr><td colspan=3>Ride Leader: &nbsp;&nbsp;&nbsp;&nbsp; '+ldr+'</td></tr>'
      n++
    }

    const terrain =  (location.pathname.match(/three-bears-and-mt-diablo/) ?
                      '4 - steep hills, long climbs' : this.terrain);

    var str = '\n\
<table style="font-weight:bold;">\n \
<tr><td rowspan='+(n+2)+
  ' style="width:120px; text-align:right;"><img style="width:100px" src="../ALCtraining.png"/></td><td colspan=3><div style="background-color:white; z-index:100; float:right;"><a href="index.html">overview</a></div><h2>'+this.series+': "'+
  data.title+'"</h2></td></tr>\n \
<tr><td>Category: '+this.category+'</td><td>Terrain: '+
    terrain+'</td><td>Mileage: '+
  data.rows[data.rows.length-1][0]+'</td></tr>\n\
';
    str += tmp + '</table>';

    str += '<table style="margin-top:20px;">';
    str += '<tr><th>Mile</th><th>Turn</th><th>Route/Street</th><th>Notes</th></tr>';
    for (var i=0, row; row=data.rows[i]; i++) {
      var tmp = (row[1]=='X' ? '<span style="font-size:130%; font-weight:bold;">'+row[1]+'</span>' : row[1]);
      str += '<tr><td class="miles">'+parseFloat(row[0]).toFixed(1)+'</td><td>'+tmp+'</td><td>'+row[2]+'</td><td>'+
        (typeof(row[3])=='undefined'?'':row[3])+'</td></tr>';
    }
    str += '</table>';

    o.innerHTML = str;
    bodyobj.appendChild(o);

    this.css('\n\
td.miles { font-family:monospace; text-align:right; } \n\
td       { padding:0 7 0 7; border:1px solid black; } \n\
table    { width:100%; border-collapse:collapse; border:1px solid black; } \n\
');
  }


  elevation() {
    const SAMPLE = 4
    const SAMPLE_CLIMBED = 5
    let MAXY = 2500.0 //feet, eg: top o' diablo (needs to be multiple of 500!)
    const legendY = 500
    const LINEWIDTH = 3

    const data = JSON.parse(document.getElementsByTagName('elevation')[0].dataset.data)
    log(data)

    if (location.pathname.match(/three-bears/))
      MAXY = 4000

    if (data.maxY > MAXY)
      MAXY = data.maxY + 200

    // pixel size of rendered graph
    let WIDE = 800
    let TALL = 450

    var legbot  = 'h2'
    var legrite = '24'//pt font
    var larger = ''
    let sty = 'margin:50px;'
    var start = '<div style="margin-right:50px; background-color:white; z-index:100; padding:5 20 5 20; border:1px solid gray; float:right;"><a href="index.html">overview</a></div>'
    if (this.arg('half')) {
      WIDE /= 2
      TALL /= 2
      legbot  = 'h3' //legend bottom
      legrite = '16'
      larger = '<span style="padding-left:50px; font-weight:normal; font-size:12pt;">(click chart or <a onclick="window.top.location.href=\'elevation.htm\'; return false;" href="/#">here</a> for larger view)</span>'
      start = ''
      sty = ''
    }



    const bodyobj = document.getElementsByTagName('body')[0];


    const o = document.createElement('div')
    o.style.backgroundColor = 'white'
    var str = start
    str += '<table style=\"'+sty+'\"><tr><td colspan=\"3\"><center><'+legbot+
  '>Climbing Profile: '+larger+'</'+
  legbot+'></center></td></tr><tr><td><div style=\"font-weight:bold; font-size:'+
    legrite+'pt;\">E<br/>l<br/>e<br/>v<br/>a<br/>t<br/>i<br/>o<br/>n</div></td><td style=\"width:60px;\">';
  for (var i=Math.round(MAXY/legendY); i > 0; i--)
    str += '<div style=\"text-align:right; vertical-align:bottom; width:60px; height:'+(TALL*legendY/MAXY)+'\">'+(legendY*i)+' ft</div>';
  str += '</td><td><canvas onclick=\"window.top.location.href=\'elevation.htm\'\" id=\"can\"> </canvas></td></tr>';

    str += '<tr><td></td><td></td><td>';
    for (var i=1; i <= Math.floor(data.maxX / 10); i++)
      str += '<div style=\"float:left; text-align:right; vertical-align:top; height:15px; width:'+(10*WIDE/data.maxX)+'\">'+(10*i)+'mi</div>';
    str += '</td></tr>';


    // compute approx #feet climbed
    var prevAvgy = 100000
    this.feetClimbed = 0.0
    for (var i=SAMPLE_CLIMBED; data.points[i]; i+=SAMPLE_CLIMBED) {
      var avgy=0.0;
      for (var j=0; j<SAMPLE_CLIMBED; j++)
        avgy += data.points[i-j][1]
      avgy /= SAMPLE_CLIMBED
      if (avgy > prevAvgy)
        this.feetClimbed += avgy - prevAvgy
      prevAvgy = avgy
    }
    log(this.feetClimbed)


    // actually -- instead of picking every X points, we average all heights
    // over distances of about 1/5th mile and compute the diffs between
    // adjacent "average height groups"
    var CLIMBED_SPAN=0.21;// ~1/5th of a mile -- determined by comparing w/ ciclo
    this.feetClimbed = 0.0;
    var prevDist=0.0;
    var n=0;
    var sumY=0.0;
    var prevAvgY = data.points[0][1];
    for (var i=0; data.points[i]; i++)
    {
      var curDist = data.points[i][0];
      if (curDist - prevDist > CLIMBED_SPAN)
      {
        var avgY = sumY / n;
        if (avgY > prevAvgY)
          this.feetClimbed += avgY - prevAvgY;

        prevDist = curDist;
        n=0;
        sumY=0.0;
        prevAvgY = avgY;
      }
      else
      {
        sumY += data.points[i][1];
        n++;
      }
    }
    log(this.feetClimbed);



    str += '<tr><td colspan=\"3\">'+
      '<div style="font-size:90%; padding-top:10px; float:right;">Approximate #feet climbed: '+
      Math.round(this.feetClimbed)+'</div>'+
      '<center><'+legbot+'>Approximate distance:<br/>'+parseInt(data.maxX, 10).toFixed(1)+' miles</'+
      legbot+'></center></td></tr>';
    str +=
      '</table>';
    o.innerHTML = str;
    bodyobj.appendChild(o);

    var can = document.getElementById('can');

    var mulx = WIDE / data.maxX;
    var muly = TALL / MAXY;

    can.setAttribute('width', WIDE);
    can.setAttribute('height', TALL);
    can.style.width = WIDE;
    can.style.height = TALL;
    can.style.border = '2px solid red';

    var ctx = can.getContext('2d');


    // add background/gray grid lines
    ctx.fillStyle = '#bbb';
    for (var i=Math.round(MAXY/legendY); i > 0; i--)
      ctx.fillRect(0, i*TALL*legendY/MAXY, WIDE, 1);

    var tmp = 10*WIDE/data.maxX;
    for (var i=1; i <= Math.floor(data.maxX / 10); i++)
      ctx.fillRect(tmp*i, 0, 1, TALL);
    ctx.save();



    ctx.fillStyle = 'black';
    ctx.lineWidth = LINEWIDTH;

    ctx.beginPath();
    ctx.moveTo(0, TALL);
    for (var i=SAMPLE; data.points[i]; i+=SAMPLE)
    {
      var avgx=0.0, avgy=0.0;
      for (var j=0; j<SAMPLE; j++)
      {
        avgx += data.points[i-j][0];
        avgy += data.points[i-j][1];
      }
      avgx /= SAMPLE;
      avgy /= SAMPLE;
      var x = Math.floor(avgx * mulx);
      var y = TALL - Math.round(avgy * muly);
      // log(x,y,avgy);
      ctx.lineTo(x,y);
    }
    ctx.lineTo(WIDE, TALL);
    ctx.closePath();
    ctx.stroke();
    ctx.save();
  }


  linkify() {
    var bodyobj = document.getElementsByTagName("body")[0];

    var links = bodyobj.getElementsByTagName("a");
    if (links.length==0)
    {
      // hmm!  no links! parse document as a text file, line by line

      var bod = bodyobj.innerHTML;
      if (navigator.userAgent.indexOf('IE')>=0)
        bod = bod.replace(/http:/g, '\nhttp:');// IE SUX
      var lines = bod.split("\n");

      var str='';
      for (var i=0; i < lines.length; i++)
      {
        var name=lines[i].replace(/http:\/\/maps\.google\.com\/maps\?/, '...');
        if (lines[i][0]=='h')
          str += '<a href="'+lines[i]+'">'+name+'</a><br/><br/>';
      }
      bodyobj.innerHTML = str + '</div>';
      links = bodyobj.getElementsByTagName("a");
    }
  }


  // parse a CGI arg
  arg(theArgName) {
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


  css(str) {
    var obj = document.createElement('style');
    obj.setAttribute('type', 'text/css');
    if (obj.styleSheet)
      obj.styleSheet.cssText = str; //MSIE
    else
      obj.appendChild(document.createTextNode(str)); // other browsers

    var headobj = document.getElementsByTagName("head")[0];
    headobj.appendChild(obj);
  }


  getMapUrl(ttl) {
    if (!ttl)
      ttl = location.pathname
    log('ttl', ttl, location)

    if (ttl.match(/palomares-canyon/))
      return 'http://maps.google.com/maps?f=d&source=s_d&saddr=37.89101,-122.17093&daddr=Pleasant+Hill+Rd+to:Danville+Blvd+to:CA-84%2FNiles+Canyon+Rd+to:Palomares+Rd+to:E+Castro+Valley+Blvd+to:Heyer+Ave+to:Redwood+Rd+to:37.834836,-122.129045+to:11+camino+pablo,+orinda,+ca&hl=en&geocode=%3BFfk6QgIdVvi4-A%3BFVrOQQIdCMW5-A%3BFVKqPQIdKH67-A%3BFc19PgId_sS6-A%3BFTgsPwIdxpG5-A%3BFUtQPwIdZpK5-A%3BFf1nQAIdGY24-A%3B%3B&mra=dpe&mrcr=0&mrsp=8&sz=15&via=1,2,3,4,5,6,7,8&dirflg=w&sll=37.831141,-122.117929&sspn=0.03193,0.049009&ie=UTF8&ll=37.741399,-122.000427&spn=0.511493,0.784149&z=11'

    if (ttl.match(/morgan-territory/))
      return 'http://maps.google.com/?q=https://poohBot.com/alc/morgan-territory/kml.kml'

    if (ttl.match(/oil-sugar-beef/))
      return 'http://maps.google.com/maps?f=d&source=s_d&saddr=11+camino+pablo+rd,+orinda,+ca&daddr=Pinole+Valley+Rd+to:Rolph+Ave+to:Loring+Ave+to:Carquinez+Scenic+Dr+to:Reliez+Valley+Rd+to:37.925006,-122.108874+to:37.89101,-122.1709&hl=en&geocode=%3BFf6JQwIdCmC2-A%3BFeakRAIdJhK3-A%3BFRSwRAIdmyC3-A%3BFe2iRAIdCFC3-A%3BFZVKQwId46W4-A%3B%3BFcIrQgId7NG3-A&mra=dpe&mrcr=0&mrsp=6&sz=15&via=1,2,3,4,5,6&dirflg=w&sll=37.924498,-122.106729&sspn=0.031821,0.039139&ie=UTF8&ll=37.957463,-122.175865&spn=0.254457,0.31311&z=12'

    if (ttl.match(/mt-diablo-halfway/))
      return 'http://maps.google.com/maps?f=d&source=s_d&saddr=37.892805,-122.171702&daddr=Pleasant+Hill+Rd+to:Danville+Blvd+to:Railroad+Ave+to:Hartz+Ave+to:Diablo+Rd+to:Diablo+Rd+to:Mount+Diablo+Scenic+Blvd+to:N+Gate+Rd%2FMount+Diablo+Scenic+Blvd+to:Oak+Grove+Rd+to:Ygnacio+Canal+Trail+to:Ygnacio+Canal+Trail+to:Contra+Costa+Canal+Trail+to:Iron+Horse+Trail+to:Iron+Horse+Trail+to:Iron+Horse+Trail+to:Olympic+Blvd+to:Mt+Diablo+Blvd+to:1+st+stephens+dr,++orinda,+ca&geocode=%3BFe47QgId-Pe4-A%3BFQzTQQIdMsK5-A%3BFREeQQId3ma6-A%3BFVYgQQIdOGq6-A%3BFYpJQQIdfgC7-A%3BFd1EQQIdFym7-A%3BFdBuQQIdsDK7-A%3BFRPkQQIdJBa7-A%3BFTaKQgId7Ey6-A%3BFUiRQgId8lW6-A%3BFXTsQgIdREW6-A%3BFQfGQgIdMuq5-A%3BFQGhQgIdgJS5-A%3BFUVnQgIdyYy5-A%3BFb43QgId1pa5-A%3BFUoXQgId0Q65-A%3BFa1BQgIdg_C4-A%3B&hl=en&mra=dme&mrcr=0&mrsp=0&sz=15&via=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17&dirflg=w&sll=37.892771,-122.169299&sspn=0.018356,0.02841&ie=UTF8&ll=37.877563,-122.099304&spn=0.146878,0.357742&z=12'

    if (ttl.match(/three-bears-and-mt-diablo/))
      return 'http://maps.google.com/maps?f=d&source=s_d&saddr=37.878309,-122.183762&daddr=Unknown+road+to:Bear+Creek+Rd+to:Wanda+Way%2FWanda+Ln+to:Pleasant+Hill+Rd+to:Danville+Blvd+to:Railroad+Ave+to:Hartz+Ave+to:Diablo+Rd+to:Diablo+Rd+to:Mount+Diablo+Scenic+Blvd+to:Summit+Rd+to:N+Gate+Rd%2FMount+Diablo+Scenic+Blvd+to:Oak+Grove+Rd+to:Ygnacio+Canal+Trail+to:Ygnacio+Canal+Trail+to:Contra+Costa+Canal+Trail+to:Iron+Horse+Trail+to:Iron+Horse+Trail+to:Iron+Horse+Trail+to:Olympic+Blvd+to:Mt+Diablo+Blvd+to:1+st+stephens+dr,++orinda,+ca&geocode=%3BFURAQwId3B23-A%3BFTqDQgIduVu3-A%3BFawmQgIdJ8y3-A%3BFe47QgId-Pe4-A%3BFQzTQQIdMsK5-A%3BFREeQQId3ma6-A%3BFVYgQQIdOGq6-A%3BFYpJQQIdfgC7-A%3BFd1EQQIdFym7-A%3BFdBuQQIdsDK7-A%3BFXoEQgIdZbS7-A%3BFePVQQIdkmm7-A%3BFTaKQgId7Ey6-A%3BFUiRQgId8lW6-A%3BFXTsQgIdREW6-A%3BFQfGQgIdMuq5-A%3BFQGhQgIdgJS5-A%3BFUVnQgIdyYy5-A%3BFb43QgId1pa5-A%3BFUoXQgId0Q65-A%3BFa1BQgIdg_C4-A%3B&hl=en&mra=dme&mrcr=0&mrsp=0&sz=14&via=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21&dirflg=w&sll=37.893076,-122.162905&sspn=0.06367,0.074329&ie=UTF8&ll=37.903574,-122.101021&spn=0.509286,0.594635&z=11'

    if (ttl.match(/redwood-inspiration/))
      return 'http://maps.google.com/maps?f=d&source=s_d&saddr=Camino+Pablo&daddr=Wildcat+Canyon+Rd+to:Golf+Course+Rd+to:Grizzly+Peak+Blvd+to:Redwood+Rd+to:37.878512,-122.183847&hl=en&geocode=FZj7QQIdVp-3-A%3BFaxNQgIdSvm2-A%3BFe0cQgIdR662-A%3BFWGuQQIdySW3-A%3BFXnDQAIdwxW4-A%3B&mra=dme&mrcr=0&mrsp=5&sz=16&via=1,2,3,4&sll=37.878292,-122.18389&sspn=0.015955,0.019805&ie=UTF8&ll=37.852086,-122.187881&spn=0.127682,0.158443&z=13'

    if (ttl.match(/presidio-to-china-camp-and-lucas-valley/))
      return 'http://maps.google.com/maps?f=d&source=s_d&saddr=Old+Mason+St&daddr=Bridgeway+Blvd+to:Miller+Ave+to:Corte+Madera+Ave+to:Kent+Ave+to:37.959713,-122.555194+to:Greenfield+Ave+to:N+San+Pedro+Rd+to:Los+Ranchitos+Rd+to:Lucas+Valley+Rd+to:Center+Blvd+to:Shady+Ln+to:Corte+Madera+Ave+to:CA-1+to:Bridgeway+Blvd+to:Lincoln+Blvd+to:Old+Mason+St&hl=en&geocode=FQTXQAIddHGz-A%3BFdKeQQIdrh6z-A%3BFbMlQgIdPmqy-A%3BFQOTQgIdSWCy-A%3BFe4cQwId2QWy-A%3B%3BFZR2QwIdOgey-A%3BFUDPQwIdSGaz-A%3BFc_UQwIdFCiy-A%3BFbCqRAId8dqv-A%3BFZCKQwIdiamx-A%3BFYZSQwId6t2x-A%3BFaaoQgId0VOy-A%3BFTQGQgIdrmyy-A%3BFYGdQQIdfB6z-A%3BFajgQAIdez2z-A%3BFQ7XQAIdunGz-A&mra=dpe&mrcr=0&mrsp=5&sz=16&via=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15&sll=37.959358,-122.552104&sspn=0.015937,0.025363&ie=UTF8&ll=37.932825,-122.564507&spn=0.255084,0.405807&z=12'

    return 'xxx'
  }
}


// Loads an external JS file and append it to the head, from:
// http://zcourts.com/2011/10/06/dynamically-requireinclude-a-javascript-file-into-a-page-and-be-notified-when-its-loaded
function require(file, callback) {
  var head = document.getElementsByTagName('head')[0]
  var script = document.createElement('script')
  script.src = file
  script.type = 'text/javascript'
  // real browsers:
  script.onload = callback
  // MSIE:
  script.onreadystatechange = function() {
    if (this.readyState === 'complete')
      callback()
  }
  head.appendChild(script)
}



require('/js/jquery.js', () => new Ride())
