# poohbot

poohbot.com static site version

## could use
- layouts/shortcodes/fancybox.html
```go

{{% fancybox path="/post/2019/img" file="k8.png" caption="golly" gallery="the-met" %}}

{{%/* fig class="full"
    src="http://farm5.staticflickr.com/4136/4829260124_57712e570a_o_d.jpg"
    title="One of my favorite touristy-type photos. I secretly waited for the
    good light while we were having fun and took this. Only regret: a stupid
    pole in the top-left corner of the frame I had to clumsily get rid of at
    post-processing."
    link="http://www.flickr.com/photos/alexnormand/4829260124/in/
            set-72157624547713078/" */%}}
```

## todo

`static/js/` location _still_ broken in production :(
unifiy to `/js/jquery.js`

```bash
egrep -v '^albums/(thumbs|images)/' BLUE |egrep -v '^wp\-'
```

```bash
cd ~/poohbot
gg -i poohbot.com
gg featured-click
gg Ride.index

cd ~/poohbot/content/
perl -i -pe "s/\\\*/**/g"   */*.md
gg  '&#8[0-9][0-9][0-9]'
gg wp-
gg https://poohbot.com/alc/morgan-territory/kml.kml

fgrep '<?' ../*.md  */*.md
```
- aliases /img => /images    (for prior site 404s...)
- aliases every prior post url to current (when differ)
- crawl new site and fix all 404s
- pick 2 random posts for left side
- make videos take up full 854px wide (720x480 now)
- link any <img> local tag in a post to fullsize naked img?
- get WP comments (eg: pinky post..)
- `embed: ` in .md auto does archive.org iframe..
- about.md
- europe.md
- photos.md
- work.md
- `<script>`-- and CSP

- **imagery:**
- http://localhost:1313/2015/05/slide-responsively-minimal-standalone-htm/css/js-inspired-by-sliding-door-from-wayne-connor/
- http://localhost:1313/2013/11/play-motion-jpeg-video-using-javascript-in-browser-no-plugins-minimal-js/
- http://localhost:1313/2013/02/how-to-turn-time-machine-from-disk-with-many-partitions-to-single-partition-logically-extending-time-machine-partition/
- http://localhost:1313/2013/02/simple-way-to-make-h.264-mp4-web-and-ios/mobile-playable-video-mp4-files-for-linux-and-macosx-using-ffmpeg/
- http://localhost:1313/2012/06/convert-yuvj420p-to-yuv420p-chrome-playable-mp4-video-eg-canon/nikon-video/
- http://localhost:1313/2012/01/natively-compiling-ffmpeg-mplayer-mencoder-on-macos-lion-with-x264/
- http://localhost:1313/2011/07/bloviate/
- http://localhost:1313/2011/05/natively-compiling-ffmpeg-x264-mplayer-on-mac-with-builtin-x264-and-webm-encoding/
- http://localhost:1313/2010/06/updated-site/
- http://localhost:1313/2009/09/ffmpeg-for-time-lapse-sets-of-images-and-even-archiving/
- http://localhost:1313/2009/04/ffmpeg-building-on-mac-intel/x386/

## archive.org embeds
```html
<iframe src="https://archive.org/embed/ID" width="854" height="480" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe>
```

## run and/or make `public/` subdir
- `brew install hugo`
- ensures fresh - removes prior run
- [gogo](gogo)
  - `CTL-C` at any point..


## theme setup
- https://themes.gohugo.io/hugo-future-imperfect-slim/
  - `mkdir -p themes`
  - `cd themes`
  - `git submodule add https://github.com/pacollins/hugo-future-imperfect-slim`
  - or if cloned to another machine:
  - `git submodule update --init --recursive`


## initial setup
- https://gohugo.io/hosting-and-deployment/hosting-on-gitlab/
- https://about.gitlab.com/2016/04/07/gitlab-pages-setup/
- added Git LFS (esp. for imagery / big files and if i future resize/recrop, etc.)
  - `git lfs track "*.jpg"`
- had to sort out http://localhost:1313/post/
- https://gohugo.io/content-management/shortcodes/#youtube
- archive.org video/book embeds
- unbug users!
- `hugo` # build public
- `hugo new post/my-first-post.md`

