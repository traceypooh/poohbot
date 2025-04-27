# poohbot
tracey pooh's site & blog, static site generated

- https://traceypooh.com
- https://poohbot.com


## Comments setup
I'm using a forked version of `Staticman` here:

https://github.com/traceypooh/staticmin

that is hosted free on https://netlify.com
and you can, too!

- See [staticman.yml](staticman.yml) for the setup.
- Submitted comments go into approval (by you) mode, where your GitHub repo hosting your blog/site gets a "Pull Request" and new branch for each comment.
- Current setup puts comments in [comments/](comments/) top-level subdir, as JSON files.
- Each post or page gets the comment added to a `comments/` subdir, based on the corresponding post/page's path name [example](comments/about)


### 404s fixme xxx
- https://traceypooh.com/tags/h-264/
- https://traceypooh.com/05/new-shoes-day-tracey-loves-candy/
- https://traceypooh.com/2022-01-traceys-tamalpais-thirty-3t/gravel
- https://traceypooh.com/2023-02-gravel-bike-mt-tam.-muir-beach-highway-1-ocean/
- https://traceypooh.com/2023-06-lost-and-found-race-won-womens-100-mile-50-years-and-up/
- https://traceypooh.com/categories/biking/page/2/gravel
- https://traceypooh.com/gravel-race-lost-and-found-sierra-tahoe/
- https://traceypooh.com/page/2/gravel
- https://traceypooh.com/tags/biking/page/2/gravel
- https://traceypooh.com/tags/gravel-bike/page/2/gravel
- https://traceypooh.com/tags/mt-tamalpais/gravel

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
gg https://traceypooh.com/alc/morgan-territory/kml.kml
```
- http://localhost:1313/morgan-territory/
- http://localhost:1313/three-bears-and-mt-diablo/


#### GPS removal
```sh
exiftool "-gps*=" file1.jpg file2.jpg ...
```

## CSP
```sh
gg -i onclick
gg -i '<script>' |chopper
gg '<style[^U]' |chopper |fgrep '<style'
gg 'style='
```

---


## helpful related links
- https://fontawesome.com/v4.7.0/icons/

## crawl site to find any 404s
`wget --spider -o log -e robots=off -w 1 -r -nv -p https://traceypooh.com  &&  fgrep -B1 'not exist' log`


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
- https://themes.gohugo.io/hugo-future-imperfect-slim/ (unmaintained)
- https://github.com/traceypooh/hugo-future-imperfect-slim (tracey forked & maintains)
  - `git clone https://github.com/traceypooh/hugo-future-imperfect-slim theme`


## initial setup
- https://gohugo.io/hosting-and-deployment/hosting-on-gitlab/
- https://about.gitlab.com/2016/04/07/gitlab-pages-setup/
- https://github.com/pacollins/hugo-future-imperfect-slim/wiki/Staticman-config
- had to sort out http://localhost:1313/
- https://gohugo.io/content-management/shortcodes/#youtube
- archive.org video/book embeds
- [gogo](gogo) # build `public/`


## make a post
```sh
cd ~/poohbot/
PO=$(date +%Y)-$(date +%m)-title-something-something/index.html
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
- [theme/layouts/_default/index.json.json](https://github.com/traceypooh/hugo-future-imperfect-slim/tree/master/layouts/_default/index.json.json)
```ini
[outputs]
  home                  = ["html", "json", "rss"]
```
- these create a top-level [index.json](https://traceypooh.com/index.json) during `hugo` build/serve
- browser then uses for search:
- [theme/assets/js/main.js](https://github.com/traceypooh/hugo-future-imperfect-slim/tree/master//assets/js/main.js)
- [theme/assets/js/lunr.js](https://github.com/traceypooh/hugo-future-imperfect-slim/tree/master/assets/js/lunr.js)
