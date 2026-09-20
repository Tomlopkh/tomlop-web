#!/usr/bin/env python3
"""Regenerate library/library.json and the /read/ pages from library/articles/*.md.

The Markdown parser here mirrors parseReadingArticle in the Android app
(app/src/main/java/com/chamrong/tomlop/data/ReadingArticles.kt). Keep them in
step: if one starts accepting syntax the other does not, the same file renders
differently on the web and in the app.

    python3 scripts/build-library.py
"""
import datetime
import hashlib
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
ARTICLES = ROOT / "library" / "articles"
READ = ROOT / "read"

SCHEMA_VERSION = 1
MIN_APP_VERSION_CODE = 2


def parse(article_id, markdown):
    """Mirror of parseReadingArticle: intro paragraphs, then ## sections of
    paragraphs and - bullets."""
    lines = markdown.splitlines()
    heading = next((l[2:] for l in lines if l.startswith("# ")), None)
    if heading is None:
        return None
    parts = heading.split(" / ", 1)
    title_en = parts[0].strip()
    title_km = parts[1].strip() if len(parts) > 1 else title_en

    intro, sections = [], []
    section_title, section_lines = None, []

    def finish():
        nonlocal section_title, section_lines
        if section_title is not None and section_lines:
            sections.append((section_title, section_lines))
        section_lines = []

    after = lines[lines.index(next(l for l in lines if l.startswith("# "))) + 1:]
    for raw in after:
        line = raw.strip()
        if line.startswith("## "):
            finish()
            section_title = line[3:].strip()
        elif line.startswith("- "):
            section_lines.append((line[2:].strip(), True))
        elif line and section_title is None:
            intro.append(line)
        elif line:
            section_lines.append((line, False))
    finish()

    chars = sum(len(p) for p in intro) + sum(len(t) for _, s in sections for t, _ in s)
    minutes = max(1, chars // 550 + 1)
    return {
        "id": article_id,
        "titleEn": title_en,
        "titleKm": title_km,
        "intro": intro,
        "sections": sections,
        "minutes": minutes,
    }


KH_DIGITS = "០១២៣៤៥៦៧៨៩"


def kh(n):
    return "".join(KH_DIGITS[int(d)] for d in str(n))


def head(title, desc, depth):
    up = "../" * depth
    return f"""<!doctype html>
<html lang="km" data-lang="km">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="icon" href="{up}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;600&family=Noto+Serif+Khmer:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{up}assets/style.css">
</head>
<body>
<a class="skip" href="#main"><span class="km">ទៅកាន់ខ្លឹមសារ</span><span class="en">Skip to content</span></a>
<div class="shell">
  <header class="masthead">
    <a class="brand" href="{up}"><img src="{up}assets/mark.svg" alt=""><b>ទម្លាប់</b></a>
    <div class="langs" role="group" aria-label="Language">
      <button type="button" data-setlang="km" aria-pressed="true">ខ្មែរ</button>
      <button type="button" data-setlang="en" aria-pressed="false">English</button>
    </div>
  </header>
</div>
<main id="main">
<div class="shell">
"""


def tail(depth):
    up = "../" * depth
    return f"""</div>
</main>
<div class="shell">
  <footer class="foot">
    <nav>
      <a href="{up}"><span class="km">ទំព័រដើម</span><span class="en">Home</span></a>
      <a href="{up}read/"><span class="km">បណ្ណាល័យ</span><span class="en">Library</span></a>
      <a href="{up}privacy/"><span class="km">គោលការណ៍ឯកជនភាព</span><span class="en">Privacy policy</span></a>
    </nav>
  </footer>
</div>
<script src="{up}assets/app.js"></script>
</body>
</html>
"""


def article_html(a, prev_a, next_a):
    body = [f'<article class="prose article">']
    body.append(f'<p class="kicker">{html.escape(a["titleEn"])}</p>')
    body.append(f'<h1>{html.escape(a["titleKm"])}</h1>')
    body.append(f'<p class="updated"><span class="km">អានប្រហែល {kh(a["minutes"])} នាទី</span>'
                f'<span class="en">About {a["minutes"]} min read</span></p>')
    for p in a["intro"]:
        body.append(f"<p>{html.escape(p)}</p>")
    for title, lines in a["sections"]:
        body.append(f"<h2>{html.escape(title)}</h2>")
        buf = []
        for text, bullet in lines:
            if bullet:
                buf.append(f"<li>{html.escape(text)}</li>")
            else:
                if buf:
                    body.append("<ul>" + "".join(buf) + "</ul>")
                    buf = []
                body.append(f"<p>{html.escape(text)}</p>")
        if buf:
            body.append("<ul>" + "".join(buf) + "</ul>")
    body.append('<nav class="pager">')
    if prev_a:
        body.append(f'<a class="pager-prev" href="../{prev_a["id"]}/">'
                    f'<span class="pager-dir km">មុន</span><span class="pager-dir en">Previous</span>'
                    f'<span class="pager-title">{html.escape(prev_a["titleKm"])}</span></a>')
    else:
        body.append("<span></span>")
    if next_a:
        body.append(f'<a class="pager-next" href="../{next_a["id"]}/">'
                    f'<span class="pager-dir km">បន្ទាប់</span><span class="pager-dir en">Next</span>'
                    f'<span class="pager-title">{html.escape(next_a["titleKm"])}</span></a>')
    else:
        body.append("<span></span>")
    body.append("</nav>")
    body.append("</article>")
    return head(f'{a["titleKm"]} — ទម្លាប់', a["intro"][0] if a["intro"] else a["titleEn"], 2) \
        + "\n".join(body) + tail(2)


def index_html(arts):
    body = ['<section class="band band--flush">']
    body.append('<h1 class="library-title"><span class="km">បណ្ណាល័យ</span><span class="en">Library</span></h1>')
    body.append(f'<p class="hero-lede"><span class="km">អត្ថបទខ្លីៗចំនួន {kh(len(arts))} ជាភាសាខ្មែរ '
                f'អំពីការគិត ទម្លាប់ និងការរស់នៅ។ អត្ថបទទាំងអស់នេះមានស្រាប់ក្នុងកម្មវិធី '
                f'ហើយអានបានទោះគ្មានអ៊ីនធឺណិត។</span>'
                f'<span class="en">{len(arts)} short Khmer articles on thinking, habit and living. '
                f'All of them ship inside the app and are readable with no connection.</span></p>')
    body.append('<ol class="index">')
    for a in arts:
        num = a["id"].split("-")[0]
        body.append(
            f'<li class="index-row"><a href="{a["id"]}/">'
            f'<span class="index-num">{kh(int(num))}</span>'
            f'<span class="index-titles"><b>{html.escape(a["titleKm"])}</b>'
            f'<i>{html.escape(a["titleEn"])}</i></span>'
            f'<span class="index-min"><span class="km">{kh(a["minutes"])} នាទី</span>'
            f'<span class="en">{a["minutes"]} min</span></span></a></li>')
    body.append("</ol></section>")
    return head("បណ្ណាល័យ — ទម្លាប់",
                "អត្ថបទខ្មែរខ្លីៗអំពីការគិត ទម្លាប់ និងការរស់នៅ។", 1) + "\n".join(body) + tail(1)


def main():
    files = sorted(ARTICLES.glob("*.md"))
    arts, entries = [], []
    for f in files:
        raw = f.read_bytes()
        a = parse(f.stem, raw.decode("utf-8"))
        if a is None:
            print(f"  skipped (no heading): {f.name}")
            continue
        arts.append(a)
        entries.append({
            "id": a["id"],
            "path": f"articles/{f.name}",
            "titleEn": a["titleEn"],
            "titleKm": a["titleKm"],
            "readingMinutes": a["minutes"],
            "bytes": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest(),
        })

    index = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": datetime.datetime.now(datetime.timezone.utc)
                        .replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "minAppVersionCode": MIN_APP_VERSION_CODE,
        "articles": entries,
    }
    out = ROOT / "library" / "library.json"
    with out.open("w", encoding="utf-8") as fh:
        json.dump(index, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    for d in READ.glob("*/"):
        for p in d.glob("*.html"):
            p.unlink()
    READ.mkdir(exist_ok=True)
    (READ / "index.html").write_text(index_html(arts), encoding="utf-8")
    for i, a in enumerate(arts):
        d = READ / a["id"]
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(
            article_html(a, arts[i - 1] if i else None,
                         arts[i + 1] if i + 1 < len(arts) else None), encoding="utf-8")

    print(f"{len(arts)} articles -> library/library.json and read/")


if __name__ == "__main__":
    main()
