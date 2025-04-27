

```sh
cp traceypooh.png tp.png
# manually removed black background with mac `Preview`; saved

identify tp.png
# img/banner/tp.png PNG 4000x500 4000x500+0+0 8-bit sRGB 1.78055MiB 0.000u 0:00.000
convert tp.png -resize 1500x -quality 98 banner.avif
rm tp.png
```
