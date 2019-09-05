# poohbot

poohbot.com static site version

```bash

F=poohbot-pictures; cd ~/poohbot/hugo-export; cat $F/index.md ~/Sites/$F.php |tee ../content/$F.md; rm -v $F/index.md ~/Sites/$F.php;  code ../content/$F.md

cd ~/poohbot/hugo-export; lc */*



egrep -v '^albums/(thumbs|images)/' BLUE |egrep -v '^wp\-'
```

## todo
```bash
cd ~/poohbot/content/post
gg -i poohbot.com 2015
perl -i -pe "s/&#8217;/'/g"   */*.md
perl -i -pe 's/&#8220;/"/g'   */*.md
perl -i -pe 's/&#8221;/"/g'   */*.md
perl -i -pe 's/&#8230;/.../g' */*.md
perl -i -pe 's/&#8212;/--/g'  */*.md

perl -i -pe "s/\\\*/**/g"   */*.md
gg -ho '&#8[0-9][0-9][0-9];'|sort|uniq -c
cd ~/poohbot/content  &&  gg wp-

fgrep '<?' ../*.md  */*.md
```

- aliases /img => /images    (for prior site 404s...)
- pick 2 random posts for left side
- make videos take up full 854px wide (720x480 now)
- link any <img> local tag in a post to fullsize nake img?
- get WP comments (eg: pinky post..)
- `embed: ` in .md auto does archive.org iframe..
- builtin in images/carousel?

- **imagery:**
- http://localhost:1313/2008/04/bike-gears-jamming-a-triple-into-a-double/

- http://localhost:1313/2015/05/slide-responsively-minimal-standalone-htm/css/js-inspired-by-sliding-door-from-wayne-connor/
- http://localhost:1313/2013/11/play-motion-jpeg-video-using-javascript-in-browser-no-plugins-minimal-js/
- http://localhost:1313/2013/02/how-to-turn-time-machine-from-disk-with-many-partitions-to-single-partition-logically-extending-time-machine-partition/
- http://localhost:1313/2013/02/simple-way-to-make-h.264-mp4-web-and-ios/mobile-playable-video-mp4-files-for-linux-and-macosx-using-ffmpeg/
- http://localhost:1313/2012/06/convert-yuvj420p-to-yuv420p-chrome-playable-mp4-video-eg-canon/nikon-video/
- http://localhost:1313/2012/01/natively-compiling-ffmpeg-mplayer-mencoder-on-macos-lion-with-x264/
- http://localhost:1313/2011/07/bloviate/
- http://localhost:1313/2011/06/mole-rolls-to-freedom/
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

