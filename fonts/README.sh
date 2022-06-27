#!/bin/zsh -x

# ensure all Raleway and sourcesanspro fonts load `.woff2` files locally *too*

CSSDIR=../../themes/hugo-future-imperfect-slim/assets/css/

[ -e $CSSDIR/fonts-ORIG.css ]  ||  cp  $CSSDIR/fonts.css  $CSSDIR/fonts-ORIG.css


for i in $(egrep -o 'https://[^\)]+' $CSSDIR/fonts.css); do
  f=$(basename "$i")
  [ -e $f ]  ||  wget $i
done


for i in  https://fonts.gstatic.com/s/raleway/v14/  https://fonts.gstatic.com/s/sourcesanspro/v13/
  do perl -i -pe "s|$i|/fonts|" $CSSDIR/fonts.css
done
