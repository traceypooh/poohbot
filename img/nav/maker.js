#!/usr/bin/env -S deno run --allow-env --allow-import --allow-run --allow-read --allow-write --location=https://traceypooh.com
/* eslint-disable max-len */

// website top-page navigation imagery maker

import { exePP } from 'https://av.archive.org/js/util/cmd.js'

Deno.chdir(`${Deno.env.get('HOME')}/poohbot/img/nav/`)

await exePP('magick -size 320x200 xc:black black.jpg')


async function mylayout(TTL, Y, PRE) {
  const OUT = `${TTL.toLowerCase().replace(/[^a-z]/g, '')}.jpg`

  const cmd = `${PRE} | magick -quality 98 -size 200x28 xc:none -gravity center -font 'Helvetica-Neue-Medium'      -pointsize 22 -background black -strokewidth 2 -annotate 0 '${TTL}'           -background black -shadow 200x6+0+0  +repage     -stroke none -fill white -annotate 0 '${TTL}'           +size -rotate 270  - +swap -gravity southwest -geometry -10-${Y} -composite ${OUT}`

  await exePP(cmd)

  await exePP(`open ${OUT}`)
}


// About
await mylayout(
  'About',
  65,
  'composite -quality 98 -gravity west ../menu/key.jpg black.jpg -colorspace sRGB JPG:-',
)
// 'Tracey Pooh', 40,      // was prior params for leftmost nav image

// Biking
await mylayout(
  'Biking',
  68,
  // NOTE: 2025 added `PNG:-` and `-colorspace sRGB` to avoid grayscale output
  'magick convert -quality 100 -resize x200 -colorspace sRGB ../banner/phoenix-floral-kits-flipped.avif PNG:- | magick composite -quality 98 -gravity west - black.jpg -colorspace sRGB PNG:-',
)

// Favorites
await mylayout(
  'Favorites',
  55,
  "magick convert -quality 100 -resize '320x200!' ../capepaint05.jpg JPG:-",
)

// Quotes
await mylayout(
  'Quotes',
  65,
  "magick convert -quality 100 -crop '300x200+0+0!' ../menu/richardnixonfarewell.jpg JPG:- | magick composite -quality 100 -gravity west - black.jpg -colorspace sRGB jpg:-",
)

Deno.exit()


// Time-Lapses
await exePP('magick convert -quality 100 -resize \'160x100!\'  0001.jpg  lap1.jpg')
await exePP('magick convert -quality 100 -resize \'160x100!\'  0023.jpg  lap2.jpg')
await exePP('magick convert -quality 100 -resize \'160x100!\'  0043.jpg  lap3.jpg')
await exePP('magick convert -quality 100 -resize \'160x100!\'  0064.jpg  lap4.jpg')

await mylayout(
  'Time-Lapses',
  37,
  'montage -mode Concatenate -tile 2x2 -quality 100 -gravity west lap2.jpg lap1.jpg lap3.jpg lap4.jpg -',
)
await exePP('rm lap2.jpg lap1.jpg lap3.jpg lap4.jpg')
Deno.exit()


await mylayout(
  'Photos',
  62,
  'magick convert -quality 100 ~/Pictures/best\\ euro\\ I/101-0158_IMG.JPG -resize x200 - | composite -quality 100 -gravity west - black.jpg -',
)


await mylayout(
  'Video',
  70,
  "magick convert -quality 100 -crop '500x312+80+0!'  6.jpg - | magick -quality 100 - -resize '320x200!' -| composite -quality 98 -gravity center - black.jpg -",
)


/* -------- OLDER (NOTE: if restore, convert to above invocation style!)

T="Training Rides";  magick convert -quality 100 -crop '500x400+10+350!' ~/www/ciclo/oil-sugar-and-beef.jpg -negate -| magick -quality 100 -resize '320x200!' - - | composite -quality 98 -gravity west - black.jpg - | mylayout -geometry -10-35  TrainingRides.jpg


T="Dumb Bunnies";  montage  -mode Concatenate -tile x1 -quality 100 -gravity west bunnies.jpg newbike.jpg killme.jpg;  composite -quality 100 -gravity west killme.jpg black.jpg - | mylayout -geometry -10-28 DumbBunnies.jpg


T="AIDS LifeCycle";  magick convert -quality 100 -gamma 1.3 -resize 'x200' halfway-from-0144_tp.jpg -  | composite -quality 98 -gravity west - black.jpg - | mylayout -geometry -10-28  ALC.jpg
*/
