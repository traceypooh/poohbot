#!/bin/zsh -x

for FI in  fa-solid-900  fa-regular-400  fa-brands-400
  do
    for EXT in  woff  woff2  ttf
      do [ -e $FI.$EXT ]  ||  wget https://use.fontawesome.com/releases/v5.9.0/webfonts/$FI.$EXT
    done
done
