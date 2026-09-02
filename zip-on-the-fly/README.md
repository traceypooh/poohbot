For the originals specifically (the actual zip-download use case), I'd reach for one of these instead:

A tiny Cloudflare Worker as a CORS-adding proxy — sits in front of your existing GH Pages photos repo, forwards the request, adds Access-Control-Allow-Origin: * on the way back. Free tier is generous, ~10 lines of code, no data migration, keeps your "second GH repo" plan exactly as-is. This is probably the least-disruptive fix given everything you've already built.

Move originals to Cloudflare R2 or Backblaze B2 — both let you set an explicit CORS policy yourself (no guessing about undocumented CDN behavior), and both are free/cheap at this scale. More setup than option 1, but more "correct" long-term and avoids depending on GitHub's edge behavior at all.

Want me to write the Worker proxy? It's small and would let you keep testing with your real demo/URLs immediately, without re-architecting anything.

```
how does tiny CF worker work?  I suppose could look at the ~10 lines -- but where does it live, how to setup, etc.?
```

Cloudflare Workers are basically small JS functions that run on Cloudflare's edge network (their CDN, since they don't have their own physical servers to run them on). You write a bit of JS, deploy it with a CLI tool, and it gets a public URL. No server to manage, no config beyond one small file.
Setup, start to finish:

1. Cloudflare account — free, sign up at cloudflare.com if you don't have one already. No credit card needed for the free tier.

2. Install the CLI (wrangler):
```sh
   npm create cloudflare@latest cors-proxy
```
This scaffolds a folder, asks a couple of prompts (pick "Hello World" template, JS not TS unless you want TS), and installs wrangler as a dependency.

3. Replace the generated src/index.js with the proxy logic (below).

4. Deploy:
```sh
   cd cors-proxy
   npx wrangler deploy
```
First run will prompt you to log in (opens a browser). After that, it prints a URL like https://cors-proxy.yourname.workers.dev — that's live immediately, no DNS setup needed.

5. Iterate: edit src/index.js, run npx wrangler deploy again. Or npx wrangler dev for a local preview before pushing live.
The actual proxy — fetches the real GH Pages image and re-serves it with CORS allowed:
```js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url"); // ?url=https://traceypooh.github.io/...
    if (!target) return new Response("Missing ?url=", { status: 400 });

    const resp = await fetch(target);
    const headers = new Headers(resp.headers);
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(resp.body, { status: resp.status, headers });
  },
};
```

Then in your demo, instead of fetching photo.original directly, you'd fetch https://cors-proxy.yourname.workers.dev/?url=${encodeURIComponent(photo.original)}.
Free tier is plenty for this: 100,000 requests/day, which for a wedding photo site being checked out by guests is nowhere close to a concern. One real limit to know about: the Worker itself is capped at 50 outgoing subrequests per invocation on the free plan — irrelevant here since your Worker only makes one outgoing fetch per invocation (it's the browser doing 100+ parallel fetches to the Worker, not the Worker doing 100+ fetches itself).
One design note: you'd want to lock the target param down to only your own github.io/custom domain (a simple `if (!target.startsWith("https://traceypooh.github.io/"))` check) so randos can't turn your Worker into a generic open proxy.
