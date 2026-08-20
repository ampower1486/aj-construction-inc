# AJ Construction Inc — Website

Marketing site for AJ Construction Inc, a family-owned general building contractor in
Placerville, California (CSLB #1129358, Class B).

Static multi-page site built with Vite and vanilla JavaScript. No framework, no runtime
dependencies, no external CDN calls — it deploys to any static host.

---

## Running it

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the built site
npm run assets     # rebuild images/logos from assets-src/
```

---

## Before you launch — three things

### 1. Connect lead delivery

Right now the estimate form and the assistant fall back to opening the visitor's email
client. That works, but it loses people. To deliver leads properly:

1. Create a free form at [formspree.io](https://formspree.io) pointed at
   `aj.construction.inc2@gmail.com`.
2. `cp .env.example .env`
3. Paste the endpoint into `VITE_FORM_ENDPOINT`.
4. Rebuild.

Both the quote form and the assistant go through `src/js/lead-service.js`, so this one
setting wires up both.

### 2. Set the real domain

The site currently uses `https://ajconstructionincca.com` — the domain listed as AJ's
website in search results, which no longer resolves. If the live domain is different,
find and replace it:

```bash
grep -rl "ajconstructionincca.com" --include="*.html" --include="*.xml" --include="*.txt" --include="*.js" .
```

It appears in canonical tags, Open Graph URLs, `partials/schema.html`, `public/sitemap.xml`
and `public/robots.txt`.

### 3. Have the legal pages reviewed

`privacy-policy.html` and `terms-conditions.html` were written specifically for a California
licensed contractor — they cover CCPA/CPRA rights, the $1,000/10% down payment limit, the
three-day (five for 65+) right to cancel, mechanics lien notice, the CSLB complaint route,
and Civil Code §1632 Spanish-language contract rights. They are informational, not legal
advice. Have a California attorney read them before relying on them.

---

## Adding project photos

The gallery is manifest-driven. Three steps:

1. Drop the original photo in `assets-src/gallery/` — e.g. `kitchen-remodel-2026.jpg`.
   Any size; bigger is better.
2. `npm run assets` — generates webp + jpg at full and thumbnail size, and strips EXIF
   (which removes GPS coordinates from phone photos).
3. Add one entry to `src/data/gallery-manifest.js`:

```js
{
  slug: 'kitchen-remodel-2026',        // must match the filename
  categories: ['remodels'],
  titleKey: 'gal.p6.title',
  captionKey: 'gal.p6.caption',
}
```

4. Add `gal.p6.title` and `gal.p6.caption` to **both** `src/data/i18n/en.js` and
   `src/data/i18n/es.js`.

New category? Add it to `CATEGORIES` in the same manifest file plus a `gal.<id>` string in
both dictionaries.

---

## The hero reel

`public/assets/video/intro.mp4` plays as a square inside the hero. While it runs
the headline, buttons and proof row step aside; when it finishes they come back.
A replay control repeats the cycle. **It is not a modal** — the header, nav and
the rest of the page stay visible and usable the whole time.

Delete the file and the reel disappears completely: no frame, no replay button,
no inline script, no request. The hero reverts to the photo.

### Behaviour

| | |
|---|---|
| Autoplay | Once per visitor (`aj:reel-seen` in `localStorage`) |
| Returning visitor | Headline immediately; clip only on demand, never downloaded |
| Replay | Button under the proof row; click the reel or press Esc to end early |
| Reduced motion | Never autoplays, never downloaded — replay still works |
| Save-Data / 2G | Same |
| Homepage only | Interior pages carry no reel |
| If it fails | Missing file, refused autoplay, stalled buffer — the headline returns |

That last row is the one that matters: **the hero copy must always come back.**
Every failure path restores it.

To autoplay on *every* visit instead, drop the `hasSeen()` check in
`autoplayAllowed()` in `src/js/hero-reel.js`.

### The clip currently in place

| | |
|---|---|
| Dimensions | 960 × 960 (square) |
| Length | 10.0s |
| Size | 6.2 MB |
| Faststart | yes — playback starts while it downloads |
| Audio | present, but force-muted on playback |

The reel frame is kept **square** so the clip is never cropped — `min(520px,
56vh, 84vw)` fits it to whichever dimension is tightest. Its own near-white
background reads as a deliberate card against the darkened hero photo.

### Replacing it

Drop a new `intro.mp4` in and reload. Two things to watch:

- **Keep it MP4** (H.264). It is the one container every browser plays.
- **`chmod 644`** it. Copying from Downloads can carry `600` across, which some
  web servers refuse to serve.

A non-square clip still works, but adjust `.hero__reel-video` in
`src/styles/hero-reel.css` — change `aspect-ratio: 1` to match your clip.

`./scripts/prepare-video.sh <your-clip>` strips the audio track and compresses
it, if you have ffmpeg (`brew install ffmpeg`).

---

## The project assistant

Three layers, deliberately separated so the conversation, the driver, and the interface can
change independently:

| File | Holds |
|---|---|
| `src/js/chat/chat-flow.js` | **What it asks.** The question graph and AJ's trade knowledge — what matters for a bathroom versus a concrete pour. |
| `src/js/chat/chat-engine.js` | **How it advances.** `ScriptedEngine` walks that graph. No backend, no API key, no cost. |
| `src/js/chat/chat-ui.js` | **How it looks.** Rendering, focus, session persistence. |

It branches on the chosen trade, validates phone and email, recognises urgency words
("leak", "no power", "fuga") and escalates to a call-now prompt, remembers the conversation
across page changes, and summarises everything back before sending.

### Upgrading the assistant to Claude

`chat-engine.js` exposes `start()`, `send(text)` and `restart()`. Any engine implementing
those three methods drops in without touching the UI or the lead pipeline.

1. Add a serverless function at `api/chat.js` (Vercel or Netlify) that calls the Anthropic
   API. Build its system prompt from `src/data/services.js` plus the lead schema in
   `src/js/lead-service.js`.
2. Set `ANTHROPIC_API_KEY` on the host. **Never put it in client code** — the key must stay
   server-side.
3. Add rate limiting and a spend cap. The endpoint is public.
4. Implement `ClaudeEngine` in `chat-engine.js` and return it from `createEngine()` when
   `import.meta.env.VITE_CHAT_ENGINE === 'claude'`.

The scripted engine stays as the fallback for when the API is down.

---

## The logo

`assets-src/logo/aj-logo.jpg` is the supplied file, used **byte-for-byte and never edited**.
It is copied straight to `public/assets/logo/aj-logo.jpg` by `npm run assets`.

Because the file has a white background and a wide white margin, the header crops to the
artwork with CSS `overflow` rather than by altering the image — see the `.brand` rule in
`src/styles/components.css`, which derives everything from the measured content box
(x 84–943, y 268–774 of the 1024×1024 canvas).

`aj-logo-mark.png` is a *derived* file — the same artwork with the outer white flood-filled
to transparent — used **only** on the dark footer, where a white box would be visible. The
original is untouched.

---

## Colour palette

Sampled from the logo with Pillow, not picked by eye:

| Token | Hex | Source in the logo |
|---|---|---|
| `--navy-800` | `#0C4162` | Dominant navy (largest sample) |
| `--navy-900` | `#082C42` | Footer ground |
| `--steel-600` | `#2A78A8` | Mid blue |
| `--sky-500` | `#4296C0` | Lit facets of the "A" |
| `--brick-600` | `#9C3636` | The red roof |

All tokens live in `src/styles/tokens.css`.

---

## Structure

```
index.html  services.html  gallery.html  story.html  quote.html
privacy-policy.html  terms-conditions.html

partials/          header, footer, <head> meta, JSON-LD — inlined at build time
                   by the htmlIncludes plugin in vite.config.js, so the nav ships
                   as real crawlable markup rather than JS-injected DOM

src/styles/        tokens → base → components → pages → chat
src/js/            i18n, nav, reveal, gallery, quote-form, lead-service, icons
src/js/chat/       flow → engine → ui
src/data/          site.js (business facts), services.js, gallery-manifest.js, i18n/

assets-src/        originals — the source of truth for npm run assets
public/assets/     generated web assets (committed so the site builds without Python)
scripts/           prepare-assets.py
```

`src/data/site.js` is the single source of truth for phone numbers, email, licence details
and service areas. Change a fact there, not in seven HTML files.

---

## Language

English lives in the HTML. `src/js/i18n.js` snapshots it from the DOM at boot, so there is
no English dictionary to keep in sync and the page is readable with JavaScript disabled.
Spanish overlays that snapshot from `src/data/i18n/es.js` (+ `es-legal.js`). Only
JS-generated strings — the assistant, gallery captions, validation — appear in `en.js`.

To check coverage after editing markup:

```bash
python3 - <<'EOF'
import re, glob
keys=set()
for f in glob.glob('*.html')+glob.glob('partials/*.html'):
    s=open(f).read()
    keys |= set(re.findall(r'data-i18n(?:-html)?="([^"]+)"', s))
es=set()
for f in ['src/data/i18n/es.js','src/data/i18n/es-legal.js']:
    es |= set(re.findall(r"^\s*'([^']+)':", open(f).read(), re.M))
print("missing from Spanish:", sorted(keys-es) or "none")
EOF
```

---

## Known gaps

- **Project videos** embed from Facebook because the reel MP4s are login-walled and cannot
  be downloaded. If AJ supplies the original video files, drop them in `public/assets/video/`
  and replace the embed in `initVideos()` (`src/js/gallery.js`) with a native `<video>` —
  that removes the last third-party request on the site.
- **The gallery has five photos**, every one of them AJ's real work pulled from their
  Facebook page. Two other images on that page were excluded deliberately: an older logo
  variant and a stock marketing photo of an East-Coast colonial that is not their project.
  A contractor's portfolio should only contain their own work.
- **Story details** — the family story (a father and his two sons) came directly from the
  owner. The supporting detail — the sons growing up on their dad's job sites, dad still
  being the first call when something looks wrong — is written from that premise and should
  be confirmed before launch. The "13+ years" figure comes from cached copy of AJ's previous
  website. Deliberately **not** invented: names, dad's years in the trade, awards, employee
  counts, testimonials.
