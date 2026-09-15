---
title: info
---

## run with:
-long 2064 -minwide 1000

- make alt repo have index.html + zotf JS + avif previews too -- same link to HQ originals for d/l
- 3 reenie images cropped to 20% size, restore, better HQ crop??
- kim AI de-mask & uprez


- send to dad https://www.proprofs.com/quiz-school/story.php?title=mteynjc2mgk5sl
- Meshell Ndegeocello & Cat Power - Don’t You Want Me


keep        445
blog         48   (also counts as keep)
discard       8
undecided     0
----------------------
decided     501 / 501  (100%)
-> archive item gets 493 originals

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

# where things stand  (2026-09-14)

Numbers above were taken before `img/wed-misc/` existed. Current: **506 photos**,
keep 445 · blog 48 · discard 8 · **undecided 5** (all of `wed-misc`).

## FIXME — content

- [ ] post opens with 2 `wed-canon` frames — those are the **720×480 previews** and
      will look soft against 8256px neighbours. Move, drop, or wait for the originals.
- [ ] 3 Reenie frames were cropped in Preview and lost ~84% of their bytes
      (`DSC_9670` 25MB→4MB, also `DSC_9701`, `DSC_9721`). Consider uploading the
      *uncropped* originals to archive.org and keeping the crops as blog-only.

## next steps, in order

   NOTE: subdirs are kept, so every URL includes the photographer dir:
       https://cors.archive.org/cors/pelican-wedding/wed/DSC_5522.JPG
   ...not `/pelican-wedding/DSC_5522.JPG`. That path is what the blog `full=` and
   ZOTF links must use. Verify on a few files, because each breaks a different link:
   - `access-control-allow-origin: *` — without it ZOTF's fetch fails *silently*
   - filenames survive verbatim (`DSC_9603long.jpg` keeps its lowercase `.jpg`)
   - `content-type: image/jpeg` so click-through displays rather than downloads
2. **resolve the two state/post FIXMEs above**, then Apply → writes
   `misc/wedding-keep.txt` + `misc/wedding-blog.txt`, moves 8 discards to
   `img/.trash/`, prints the conversion commands.
3. **convert blog images**: `cd img && ../bin/avif-blog-img 2026-08-wedding $(...)`
   — deliberately *without* `-oldest`, or it re-sorts and undoes your ordering.
5. **new previews repo**: 2048px avifs via `-mirror`, measured at **535KB avg → 258MB
   for 493** (25% of the 1GB Pages cap, so one repo is fine). Needs `loading="lazy"`
   on every `<img>` — 258MB eager would be unusable — plus width/height attributes to
   stop layout shift.
6. **`photo` shortcode** in `layouts/shortcodes/` taking `src` + `full` + `credit`, so
   the blog renders `<figure><a href=archive.org/...><img></a><figcaption>`. The theme
   already styles `figure`/`figcaption`, and that `<a href>` is exactly what ZOTF's
   `linked_url()` detects. No theme fork needed.


## running the tools again

```sh
bin/photo-index.js          # rescan + EXIF + thumb cache; safe to re-run, skips existing
bin/photo-index.js --force-thumbs
bin/photo-pick.js           # http://localhost:8777/  (restart after re-indexing:
                            #  the manifest is read once at startup)
```

Picks live in `.photo-cache/state.json`, keyed by original filename and **separate
from the manifest** — so re-indexing (new files, the real 70D originals replacing
previews) never costs you the triage.

## clock corrections, for the record

Only Reenie's clock was trustworthy — corroborated twice: cake cut ~9:19pm ==
`DSC_0053` @ 21:19:33, and the ~5:10pm ceremony vs. her event frames starting 17:23.

| camera | fix |
|---|---|
| `wed` | reference |
| `wed-bokeh`, `wed-mom` | already correct (100% / 99% inside the event window) |
| `wed-misc` | iPhones, network-synced — correct |
| `wed-nikon` | **−3.816h**, from one matched pair |
| `wed-canon` | dead coin cell (resets ~every 3 frames, 31 times across 162). No usable absolute *or* relative time — placed by 8 hand anchors interpolated across the frame counter |

Automatic offset detection was tried and removed. At a wedding every camera shoots
continuously through the same hours, so each shot-density curve is one broad plateau;
shifting it 2h still lands on the plateau and scores as well. It confidently proposed
−2h for two cameras that were already correct. See the note in `bin/photo-index.js`.
