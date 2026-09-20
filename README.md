# tomlop-web

The website for **ទម្លាប់ / Tomlop**, the Khmer-first offline habit app for Android. Static HTML, no build step, deployed to GitHub Pages.

| Path | What it is |
|---|---|
| `index.html` | Landing page, Khmer-first with an English toggle |
| `privacy/` | Privacy policy — the URL Google Play requires |
| `read/` | The 86 articles as web pages, generated |
| `library/` | The same articles as Markdown, plus `library.json` — the feed the app will sync from |
| `scripts/build-library.py` | Regenerates `library.json` and `read/` from `library/articles/*.md` |
| `docs/feed-schema.md` | Feed format and the sync rules it must follow |
| `assets/` | Stylesheet, script, and the ទ brand mark |

The app source lives in the private `Tomlopkh/tomlop-mobile-android`. This repo is public because GitHub Pages requires it on the free plan, and because everything here is published content anyway.

## Working on it

No toolchain. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
```

After adding or editing an article, regenerate the index and pages:

```sh
python3 scripts/build-library.py
```

## Before launch

- Replace `CONTACT_EMAIL` in `privacy/index.html` with a real address.
- Have a native Khmer reader proofread both pages.
- Point the Play Store listing's privacy policy field at `/privacy/`.
