# poohbot

poohbot.com static site version


## todo
```bash
cd ~/poohbot/content/post
gg -E ^geo
gg featured-top
gg lacer.php_.txt
perl -i -pe "s/&#8217;/'/g" */*.md
```

- make videos take up full 854px wide (720x480 now)

- **imagery:**
- http://localhost:1313/2017/09/responsive-masonic-tiles-using-css-grid-no-js-no-flexbox/
- http://localhost:1313/2015/05/slide-responsively-minimal-standalone-htm/css/js-inspired-by-sliding-door-from-wayne-connor/
- http://localhost:1313/2013/11/play-motion-jpeg-video-using-javascript-in-browser-no-plugins-minimal-js/
- http://localhost:1313/2013/02/how-to-turn-time-machine-from-disk-with-many-partitions-to-single-partition-logically-extending-time-machine-partition/
- http://localhost:1313/2013/02/simple-way-to-make-h.264-mp4-web-and-ios/mobile-playable-video-mp4-files-for-linux-and-macosx-using-ffmpeg/
- http://localhost:1313/2012/06/convert-yuvj420p-to-yuv420p-chrome-playable-mp4-video-eg-canon/nikon-video/


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
- archive.org video/book embeds
- https://gohugo.io/content-management/shortcodes/#youtube
- unbug users!
- `hugo` # build public
- `hugo new post/my-first-post.md`

