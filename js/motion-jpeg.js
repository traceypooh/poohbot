window.MJ = {
  fi:false, // filestream
  prevStart:0, // byte location of found JPEG frame
  imgNo:0,

  //fetches BINARY FILES synchronously using XMLHttpRequest
  load_url:function(url){
    //uncomment next line when file:// not http://localhost
    //netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
    var req = new XMLHttpRequest();
    req.open('GET',url,false);
    //XHR binary charset opt by Marcus Granado 2006 [http://mgran.blogspot.com]
    req.overrideMimeType('text/plain; charset=x-user-defined');
    req.send(null);
    if (req.status != 200) return '';
    return req.responseText;
  },

  // source .avi arg -- local to this HTM/JS file
  mjpeg:function (start, avi, FPS){
    if (!MJ.fi  &&  start<0){
      MJ.DELAY = ((navigator.userAgent.match(/ Firefox/) ? 3 : 1) *
                  Math.round(1000 / // setTimeout() uses milliseconds...
                             FPS)); // <==  set to FPS of source .avi!
      jQuery('#map').html('loading '+avi+' ('+FPS+' FPS)...');
      setTimeout(function(){
        MJ.fi = MJ.load_url(avi);
        jQuery('#map').html('');
        MJ.mjpeg(0);
      }, MJ.DELAY);
      return;
    }

    for ( ; start <= MJ.fi.length; start++)
    {
      // JPEG images start with (hex) "ffd8" (d8==216, ff==255) and end with "ffd9".
      // Canon elph JPEG frames start with "ffd8ffe0001041564931".
      if ((MJ.fi.charCodeAt(start  ) & 0xff) == 255  && //ff
          (MJ.fi.charCodeAt(start+1) & 0xff) == 216  && //d8
          (MJ.fi.charCodeAt(start+2) & 0xff) == 255  && //ff
          (MJ.fi.charCodeAt(start+3) & 0xff) == 224  && //e0
          (MJ.fi.charCodeAt(start+4) & 0xff) ==   0  && //00
          (MJ.fi.charCodeAt(start+5) & 0xff) ==  16  && //10
          (MJ.fi.charCodeAt(start+6) & 0xff) ==  65  && //41
          (MJ.fi.charCodeAt(start+7) & 0xff) ==  86  && //56
          (MJ.fi.charCodeAt(start+8) & 0xff) ==  73  && //49
          (MJ.fi.charCodeAt(start+9) & 0xff) ==  49  && //31
          1){

        if (MJ.prevStart){

          // try our best to find the end
          var prevEnd = start-1;
          for (var j=MJ.prevStart; j < start-1; j++){
            if ((MJ.fi.charCodeAt(j  ) & 0xff) == 255  && //ff
                (MJ.fi.charCodeAt(j+1) & 0xff) == 217  && //d9
                1){
              prevEnd = j+2;
              break;
            }
          }



          MJ.log('frame @bytes: [='+MJ.prevStart+'..~'+prevEnd+']');
          jQuery('#i'+(MJ.imgNo-2)).remove();//avoid DOM overload/RAM bloat
          jQuery('#map').append('<img id="i'+(MJ.imgNo++)+'" src="data:image/jpg;base64,' +
                                encodeStream64(MJ.fi, MJ.prevStart, prevEnd) +
                                '"/>');

        }
        MJ.prevStart = start;
        setTimeout(function(){ MJ.mjpeg(start+1); }, MJ.DELAY);
        break;
      }
    }
  },


  test_img:function(img) {
    MJ.fi = MJ.load_url(img)

    // now encode the safely transported byte stream into base64
    jQuery('#map').html('<img src="data:image;base64,' + encodeStream64(MJ.fi) + '"/>')
    delete MJ.fi
    MJ.fi = false
  },


  log:function(str){
    if (console  &&  console.log)
      console.log(str);
  }
};// end MJ


/*
    <!--
      CryptoMX Tools
      Copyright (C) 2004 - 2006 Derek Buitenhuis

      This program is free software; you can redistribute it and/or
      modify it under the terms of the GNU General Public License
      as published by the Free Software Foundation; either version 2
      of the License, or (at your option) any later version.

      This program is distributed in the hope that it will be useful,
      but WITHOUT ANY WARRANTY; without even the implied warranty of
      MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
      GNU General Public License for more details.

      You should have received a copy of the GNU General Public License
      along with this program; if not, write to the Free Software
      Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
    -->
*/
// takes binary stream of chars in and returns base64 (ASCII) string out!
function encodeStream64(filestream, beg, fin) {
  var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  if (!beg  &&  !fin){
    beg = 0;
    fin = filestream.length;
  }

  var output = "";
  var chr1, chr2, chr3 = "";
  var enc1, enc2, enc3, enc4 = "";
  var i = beg;

  do {
    chr1 = filestream.charCodeAt(i++) & 0xff;
    chr2 = filestream.charCodeAt(i++) & 0xff;
    chr3 = filestream.charCodeAt(i++) & 0xff;

    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output = output +
      keyStr.charAt(enc1) +
      keyStr.charAt(enc2) +
      keyStr.charAt(enc3) +
      keyStr.charAt(enc4);
    chr1 = chr2 = chr3 = "";
    enc1 = enc2 = enc3 = enc4 = "";
  } while (i < fin);

  return output;
}
