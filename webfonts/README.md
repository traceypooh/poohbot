#!/bin/zsh -x

for j in "" 2; do
  for i in fa-solid-900.woff$j fa-regular-400.woff$j fa-brands-400.woff$j; do
    [ -e $i ]  ||  wget https://use.fontawesome.com/releases/v5.9.0/webfonts/$i
  done
done


for i in fa-solid-900.ttf fa-brands-400.ttf; do
  [ -e $i ]  ||  wget https://use.fontawesome.com/releases/v5.9.0/webfonts/$i
done
