/**************************************************************

  slide-responsively:
  Inspired by wordpress "sliding-door" theme.
  Rewritten entirely to be responsive! 
  (and using minimal jQuery, not mootools)
  by @tracey_pooh May 2015
  https://github.com/traceypooh/slide-responsively

**************************************************************/

( function ($) {
  $(document).ready(function(){
    // DOM ready, page still (likely) loading images, etc...
    $('.slide-responsively li').mouseenter(function(e){
      // user has hovered over a nav img.  (class) mark it "in" and the others "out"
      $('.slide-responsively li').addClass('out');
      $(this).removeClass('out').addClass('in');
    });
    $('.slide-responsively li').mouseleave(function(e){
      // user has stopped hovering.  remove all "out", then "in", class markers.
      $('.slide-responsively li').removeClass('out');    
      $(this).removeClass('in');
    });
  });
}) ( jQuery );

/*
     FILE ARCHIVED ON 17:07:02 Mar 06, 2019 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 04:29:07 Sep 21, 2019.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  PetaboxLoader3.datanode: 1571.878 (5)
  exclusion.robots: 0.417
  RedisCDXSource: 6.87
  LoadShardBlock: 158.886 (3)
  CDXLines.iter: 17.025 (3)
  captures_list: 187.507
  load_resource: 1536.913
  PetaboxLoader3.resolve: 92.365 (2)
  exclusion.robots.policy: 0.397
  esindex: 0.018
*/