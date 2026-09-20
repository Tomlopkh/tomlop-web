# tomlop-web

The website for **ទម្លាប់ / Tomlop**, the Khmer-first offline habit app for Android. Static HTML, no build step, deployed to GitHub Pages.

| Path | What it is |
|---|---|
| `index.html` | Landing page, Khmer-first with an English toggle |
| `privacy/` | Privacy policy — the URL Google Play requires |
| `download/` | APK download page, driven by `download.json` |
| `download.json` | Written by `scripts/release.sh` in the app repo; `released: false` until a build is published |
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

## Releases

The Android source repo is private, so a release asset there is not publicly downloadable.
Signed APKs are published to **this** repo's GitHub Releases instead, and `scripts/release.sh`
in `tomlop-mobile-android` updates `download.json` to point at the newest one. The download
page reads that file, so it needs no API call and no rate limit — and it keeps rendering its
not-yet state if the file is missing or the fetch fails.
