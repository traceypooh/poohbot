# js/vendor

Local copies of the three modules `../zip-on-the-fly.js` imports, so it can run with
no internet (a plane, a hotel, a dead CDN).

`zip-on-the-fly.js` imports the CDN versions by default. To switch, comment out the
`ONLINE` import block at the top of that file and uncomment the `OFFLINE` one below it.

## Refreshing these

```sh
~/d/esbuild_es5/esbuild.js -f esm -t es2020 \
  'https://esm.ext.archive.org/lit?target=es2022' \
  'https://esm.ext.archive.org/client-zip@2/index.js?target=es2022'

mv build/lit_target=es2022.min.js  js/vendor/lit.min.js
mv build/index.min.js              js/vendor/client-zip.min.js
cp ~/av/www/js/util/log.js         js/vendor/log.js
```

Two flags matter, and both bite silently if you leave them off:

- **`-t es2020`** — client-zip uses BigInt literals (`0n`), which the wrapper's default
  `es6` target rejects outright with `Big integer literals are not available in the
  configured target environment`.
- **`?target=es2022`** — esbuild runs under Deno, so esm.sh content-negotiates on the
  User-Agent and hands back its `denonext` builds. Those happen to work in a browser,
  but pinning the target means the bundle holds the same code a browser would fetch.

`sourceMappingURL` comments are stripped, since the `.map` files aren't shipped and
devtools would 404 looking for them.
