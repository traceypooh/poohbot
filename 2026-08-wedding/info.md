---
title: info
---

# summary
```
52 avif   all YUV 4:4:4, all long edge 2064, all even dimensions
 3 jpg    the selfies, 1600x1200 untouched as intended
 1 jpg    wed/DSC_9849.jpg — the banger, 4:4:4 JPEG
```

## ran with:
```sh
cd /Volumes/*/pelican-wedding
# 1. the 52 -> avif (avifenc to ensure 4:4:4 color -- imagemagick can only do 4:2:0 avif)
# this also ensures chroma depth ICC profiles carry over
xargs ~/poohbot/bin/avif-blog-img -mirror ~/poohbot/img -long 2064 -minwide 1000 -avifenc \
  < ~/poohbot/misc/blog-convert.txt

# 2. featured also needs a 4:4:4 color JPEG
~/poohbot/bin/avif-blog-img -mirror ~/poohbot/img -long 2064 -minwide 1000 \
  -featured wed/DSC_9849.jpg  wed/DSC_9849.jpg

# 3. copied the 3 low-res selfies verbatim into img/wed-misc
```

## to do
- [ ] xxx the `wed-canon` are placeholder ~720x480px now -- replace them & rebuild preview avifs
- [ ] post opens with the 2 `wed-canon` frames -- now real resolution, but twin says
      they are not colour corrected

## info
```
keep        445
blog         48   (also counts as keep)
discard       8
undecided     0
----------------------
decided     501 / 501  (100%)
-> archive item gets 493 originals
```

| Directory | Photographer | Camera | Keep | Blog | Discard | Total |
|---|---|---|---|---|---|---|
| `wed` | Reenie Raschke — paid professional | Nikon Z 7_2 + D7500 | 73 | 40 | 0 | 113 |
| `wed-bokeh` | Russ — brother, pro A/V; Russian swirly-bokeh lens | Canon 5D Mark II | 37 | 2 | 0 | 39 |
| `wed-mom` | Mom | Nikon D3500 | 75 | 0 | 7 | 82 |
| `wed-nikon` | Russ's spare — Russ + two sisters | Nikon D5200 | 101 | 4 | 0 | 105 |
| `wed-canon` | Russ's spare — previews only so far (720×480) | Canon 70D | 159 | 2 | 1 | 162 |
| | | **totals** | **445** | **48** | **8** | **501** |

Blog picks also count as keepers, so the archive item gets 493 originals.

---

# where things stand  (2026-09-16)

Post is **55 images** (57 refs -- 2 "best shots" bangers repeat later in time order),
all wired to their originals on the `pelican-wedding` archive.org item. 506 photos
triaged: keep 445 / blog 48 / discard 8 (moved out) / wed-misc 5 still `undecided` in
the picker though they *are* in the post.

## done

- [x] **all 501 originals on archive.org + NAS**, md5-verified three ways, subdirs
      kept so `<dir>/<basename>` is one key across item / NAS / blog / previews repo
- [x] repo `img/wed*` originals cleared (3.8GB); `bin/photo-index.js --src` re-points
      the picker at the NAS mirror
- [x] **derivatives regenerated via avifenc** (`-avifenc -long 2064 -minwide 1000`):
      30.8MB vs 32.2MB before, and better PSNR on every file measured. 4:4:4 chroma
      (sources are 4:4:4, so the old 4:2:0 was discarding real chroma), both axes even
- [x] **10-bit tried and rejected** -- 36.1MB for a difference invisible even on the
      bokeh frames where it should have shown. Sources are 8-bit; there is no hidden
      gradation to recover, only encoder quantisation, already below threshold
- [x] **og:image is JPEG 4:4:4, not webp, not avif.** Slack renders no AVIF preview
      (tested); lossy webp is mandatorily 4:2:0 8-bit so it cannot carry 4:4:4 anyway,
      and is no more compatible than JPEG. `featured: wed/DSC_9849.jpg#top30`
- [x] **theme og:image fixed to absURL** (was relURL -> relative URL, which the OG
      spec disallows; Apple's scraper tolerated it, Facebook's would not).
- [x] **Enforce HTTPS on** -- Pages now 301s http->https (note: no HSTS header; GH
      Pages does not send one, on custom domains or `*.github.io`)
- [x] **two `wed-canon` frames replaced** with real originals (`.heic.jpg`, 2.4MB) --
      were 720x480 previews
- [x] **all 39 `wed-bokeh` frames black-point corrected** (`bin/lift-blacks.js`).
      Uncoated Soviet lens -> veiling flare lifted every shadow; p1 averaged 28.5
      (worst: 89) so nothing reached black. Per-frame lift 2.0%-34.5% with a gamma
      that holds each median, so contrast returns without changing brightness.
      Pristine copies kept as `wed-bokeh-orig/` on NAS + item.
- [x] ZOTF dedupes by URL now, so the 2 repeated bangers only zip once
- [x] **lazy loading, via a markdown render hook in the theme** at
      `layouts/_default/_markup/render-image.html`. All 57 refs get
      `loading="lazy" decoding="async"` **plus real `width`/`height`** read from the
      file. Without the dimensions lazy loading is worse than none -- unsized images
      collapse to zero height and the page jumps as each one lands.
      - `.Width` is a hard build error on a non-image resource, not an empty value, so
        the hook checks `eq $res.ResourceType "image"` first
      - **hugo 0.166 reads AVIF dimensions** (many prior versions dont)
- [x] **previews repo shipped** -- `traceypooh/pelican-wedding` on GH Pages, all 501
      at 1200px (107MB). Not Hugo, so the lazy + sized `<img>` logic is ported rather
      than reusing the hook. One merged timeline across all six cameras; estimated
      times are marked `~`. Tooling lives there: `make-thumbs`, `build-index.js`,
      `make-originals.js`, and `make-align.js` (the clock alignment tool).
      - the item holds **503** originals but only **501** previews: `IMG_6836` and
        `IMG_6844` each exist twice, as a stale 720x480 `.JPG` and the real
        `.heic.jpg`. Both reduce to one `.avif` name, and `avif-blog-img` skips an
        existing output -- so left alone, the stale pair wins on sort order
      - `zip-on-the-fly.js` flattened zip entries to basename, and 7 filenames exist
        in both `wed/` and `wed-mom/`; a 501-file pick unzipped to 494 silently.
        Fixed in both copies -- only clashing names get directory-qualified
      - `bin/avif-blog-img` now passes `-m` to exiftool (one damaged embedded
        thumbnail exited 1 and killed a 501-file batch at 283) and removes a
        half-made output on exit, since re-runs skip anything already present

## URL forms that matter

Link `archive.org/serve/...`, fetch `cors.archive.org/cors/...`:

- `/serve/` gives `image/jpeg` + `access-control-allow-origin: *` for recognised image
  types, so click-through displays inline. It is also the durable form.
- but for a type it does *not* recognise (`.heic`) it 302s to the storage node, and
  that response has **no CORS header** -- so `fetch()` fails, opaquely.
- `cors.archive.org/cors/` sends CORS for every type, but `application/octet-stream`,
  which makes a browser download rather than display.

`zip-on-the-fly.js` handles this in `fetchable()`: hrefs stay `/serve/`, fetches get
rewritten to the cors host.

## running the tools again

```sh
bin/photo-index.js          # rescan + EXIF + thumb cache; safe to re-run, skips existing
bin/photo-index.js --force-thumbs
bin/photo-pick.js           # http://localhost:8777/  (restart after re-indexing:
                            #  the manifest is read once at startup)
```

Picks live in `misc/state.json`, keyed by original filename and **separate
from the manifest** — so re-indexing (new files, the real 70D originals replacing
previews) never costs you the triage.

## clock corrections, for the record

Only Reenie's clock was trustworthy — corroborated twice: cake cut ~9:19pm ==
`DSC_0053` @ 21:19:33, and the ~5:10pm ceremony vs. her event frames starting 17:23.

Settled properly in the previews repo (`~/d/pelican-wedding`, `align.html`), by
looking at what two cameras shot at the same moment. Live values are in that repo's
`clocks.json`; this is the record.

| camera | fix |
|---|---|
| `wed` | reference — the one clock that was right |
| `wed-bokeh` | **−2.047h** (−7369s) |
| `wed-mom` | **−3h exactly** — she flew in and the camera was still on Eastern time |
| `wed-nikon` | **−3.799h** (−13677s) |
| `wed-misc` | iPhones network-synced; the 3 selfies have no EXIF and are placed by hand |
| `wed-canon` | dead coin cell, 43 resets across 161 frames. 27 hand anchors; each burst keeps the duration it recorded and all the slack goes into the gaps between power-ons |

**The window check was not enough.** `wed-bokeh` and `wed-mom` both scored ~100%
"inside the event window" and both were hours wrong — a wedding runs long enough that
a 2-3h shift still lands inside it. Only content told the truth: `wed-mom/DSC_0187`
sat at 8:17pm showing guests seated on the lawn for the ceremony, and `DSC_0138` was
stamped Friday 9:23pm in bright daylight, an hour after sunset.

Automatic offset detection was tried and removed. At a wedding every camera shoots
continuously through the same hours, so each shot-density curve is one broad plateau;
shifting it 2h still lands on the plateau and scores as well. It confidently proposed
−2h for two cameras — which, ironically, turned out to be roughly right for one of
them, but for no reason the search could justify. See the note in `bin/photo-index.js`.

**`wed-canon` needed a different model entirely.** Interpolating across the frame
counter between anchors — the obvious approach, and what was used first — spreads
every burst evenly over the anchors bracketing it: a 15-frame burst genuinely shot in
619 seconds came out smeared across 4154. The coin cell only killed the *absolute*
clock; within one power-on it ran normally, so burst-internal timing was exact all
along. See `clock.js` in the previews repo.


## Dance Music
- Muppet Show Theme
- At Last - Etta James (~9:26pm)
- Summer Girl - Haim
- Steal My Sunshine - Len (~9:35pm)
- Groove is in the Heart - Deee-Lite (~9:38pm)
- Wonderwall - Oasis (~9:41pm - 9:44pm)
- It Takes Two - Rob Base and DJ EZ Rock (~9:45pm - 9:48pm)
- Dancing Queen - ABBA (~9:50pm)
- Pink Pony Club - Chappell Roan (~9:56pm)
- Slow Burn - Kacey Musgraves (~10:00pm)
- [cowbells] (~10:01pm)
