# poohbot

poohbot.com static site

https://about.gitlab.com/2016/04/07/gitlab-pages-setup/

```bash
export HUGO_BASEURL=https://traceypooh.gitlab.io; rm -rfv public/  &&  hugo  &&  hugo serve
```

## run and/or make `public/` subdir
- `brew install hugo`
- ensures fresh - removes prior run
- `rm -rfv public/  &&  hugo  &&  (sleep 5; open http://localhost:1313 ) &  &&  hugo serve`
  - `CTL-C` at any point..


## theme setup
- https://themes.gohugo.io/hugo-future-imperfect-slim/
  - `mkdir -p themes`
  - `cd themes`
  - `git submodule add https://github.com/pacollins/hugo-future-imperfect-slim`
  - or if cloned to another machine:
  - `git submodule update --init --recursive`
