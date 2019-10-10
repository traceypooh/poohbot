#!/bin/zsh -x


[ -e Raleway-ORIG.css ]  ||  wget https://fonts.googleapis.com/css?family=Raleway:400,800,900%7CSource+Sans+Pro:400,700 -O Raleway-ORIG.css


for i in $(egrep -o 'https://[^\)]+' Raleway-ORIG.css); do
  f=$(basename "$i")
  [ -e $f ]  ||  wget $i
done


cp Raleway-ORIG.css Raleway.css
for i in  https://fonts.gstatic.com/s/raleway/v14/  https://fonts.gstatic.com/s/sourcesanspro/v13/
  do perl -i -pe "s|$i||" Raleway.css
done
