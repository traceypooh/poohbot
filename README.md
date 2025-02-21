
CRAWL CHECK
---
# poohbot
tracey pooh's site & blog, static site generated

- https://poohbot.com
- https://traceypooh.com


### 404s
- https://poohbot.com/tags/h-264/
- https://poohbot.com/tags/spottheshuttle/

### aliases
- /img           => /images
- /albums/thumbs => /albums/images
```
gg kml.php
gg featured-click
```
- /video/ and /lapses/ - switch to CSS grid for centering filmstrip
- /video/ and /lapses/ - 'Play all'
- pick 2 random posts for left side
- make videos take up full 854px wide (720x480 now)
- link any <img> local tag in a post to fullsize naked img?
- `embed: ` in .md auto does archive.org iframe..

### map route fails
```
gg https://poohbot.com/alc/morgan-territory/kml.kml
```
- http://localhost:1313/morgan-territory/
- http://localhost:1313/three-bears-and-mt-diablo/


### Imagery++
- http://localhost:1313/2013-02-how-to-turn-time-machine-from-disk-with-many-partitions-to-single-partition-logically-extending-time-machine-partition/
- http://localhost:1313/2013-02-simple-way-to-make-h.264-mp4-web-and-ios/mobile-playable-video-mp4-files-for-linux-and-macosx-using-ffmpeg/
- http://localhost:1313/2012-06-convert-yuvj420p-to-yuv420p-chrome-playable-mp4-video-eg-canon/nikon-video/
- http://localhost:1313/2012-01-natively-compiling-ffmpeg-mplayer-mencoder-on-macos-lion-with-x264/
- http://localhost:1313/2011-05-natively-compiling-ffmpeg-x264-mplayer-on-mac-with-builtin-x264-and-webm-encoding/
- http://localhost:1313/2009-09-ffmpeg-for-time-lapse-sets-of-images-and-even-archiving/
- http://localhost:1313/2009-04-ffmpeg-building-on-mac-intel/x386/

#### GPS removal
```
exiftool "-gps*=" file1.jpg file2.jpg ...
```

## CSP
```bash
gg -i onclick
gg -i '<script>' |chopper
gg '<style[^U]' |chopper |fgrep '<style'
gg 'style='
```

---


## helpful related links
- https://fontawesome.com/v4.7.0/icons/
- crawl site (and find => fix all 404s)
`wget --spider -o log -e robots=off -w 1 -r -nv -p https://poohbot.com  &&  fgrep -B1 'not exist' log`


## Could Use
- layouts/shortcodes/fancybox.html
```go

{{% fancybox path="/img" file="k8.png" caption="golly" gallery="the-met" %}}

{{%/* fig class="full"
    src="http://farm5.staticflickr.com/4136/4829260124_57712e570a_o_d.jpg"
    title="One of my favorite touristy-type photos. I secretly waited for the
    good light while we were having fun and took this. Only regret: a stupid
    pole in the top-left corner of the frame I had to clumsily get rid of at
    post-processing."
    link="http://www.flickr.com/photos/alexnormand/4829260124/in/
            set-72157624547713078/" */%}}
```

## archive.org embeds
```html
<iframe src="https://archive.org/embed/ID" width="854" height="480" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe>
```

---

## theme setup
- https://themes.gohugo.io/hugo-future-imperfect-slim/
  - `git clone https://github.com/traceypooh/hugo-future-imperfect-slim theme`


## initial setup
- https://gohugo.io/hosting-and-deployment/hosting-on-gitlab/
- https://about.gitlab.com/2016/04/07/gitlab-pages-setup/
- https://github.com/pacollins/hugo-future-imperfect-slim/wiki/Staticman-config
- added Git LFS (esp. for imagery / big files and if i future resize/recrop, etc.)
  - `git lfs track "*.jpg"`
- had to sort out http://localhost:1313/post/
- https://gohugo.io/content-management/shortcodes/#youtube
- archive.org video/book embeds
- `hugo` # build public


## make a post
```bash
cd ~/poohbot/
PO=$(date +%Y)/$(date +%m)-title-something-something.md
hugo new $PO
code .
code $PO

# imagery is nice/fullsize at 880px wide, preview/shows at 880x375 (2.35:1) where you can
# pick to show more of the top or bottom..
#   featured: littlefingers.jpg#top
#   featured: https://archive.org/download/reremaster/both10107.jpg#bottom
# 880x495 is nice 16:9 pic size

# center an image into 880x495 black background:
# convert -size 880x495 xc:black in.jpg -gravity center -composite x.jpg; identify x.jpg; open x.jpg

# more recently, have been using `Photos` to export pix to "max dimension" of 2016px, since
# my iphone 12 mini shoots at 4032px on the long side
```

Try `ispell` spell checker before you publish (commit & push).  ( `brew install ispell` )


## run and/or make `public/` subdir
- `brew install hugo caddy`
- ensures fresh - removes prior run
- [gogo](gogo)
  - `CTL-C` at any point..



## contact me / emails
- [contact/_index.md](contact/_index.md) - (pathway setup via account signup)


## browser search
files involved:
- `theme/layouts/_default/index.json.json`
```ini
[outputs]
  home                  = ["html", "json", "rss"]
```
- these create a top-level [index.json](https://poohbot.com/index.json) during `hugo` build/serve
- browser then uses for search:
- [themes/hugo-future-imperfect-slim/assets/js/main.js](themes/hugo-future-imperfect-slim/assets/js/main.js)
- [themes/hugo-future-imperfect-slim/assets/js/lunr.js](themes/hugo-future-imperfect-slim/assets/js/lunr.js)
