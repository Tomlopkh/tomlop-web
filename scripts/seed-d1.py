#!/usr/bin/env python3
"""Write seed.sql: every library/articles/*.md as an INSERT for the D1 `articles` table.

    python3 scripts/seed-d1.py
    npx wrangler d1 execute tomlop --remote --file seed.sql

Run it once on a new database. It uses INSERT OR IGNORE, so re-running never overwrites an
article that was edited in the backoffice. The derived columns (titles, reading minutes,
bytes, sha256) follow server/lib/markdown.ts, and server/lib/markdown.test.ts checks that the
result matches library/library.json for all 86 articles.
"""
import hashlib
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def q(text):
    return "'" + text.replace("'", "''") + "'"


def parse(markdown):
    """Titles and reading minutes, the same rules as parseReadingArticle in the Android app."""
    lines = markdown.splitlines()
    heading = next((l[2:] for l in lines if l.startswith("# ")), None)
    if heading is None:
        return None
    parts = heading.split(" / ", 1)
    title_en = parts[0].strip()
    title_km = parts[1].strip() if len(parts) > 1 else title_en

    chars, in_section = 0, False
    for raw in lines[lines.index(next(l for l in lines if l.startswith("# "))) + 1:]:
        line = raw.strip()
        if line.startswith("## "):
            in_section = True
        elif line.startswith("- "):
            chars += len(line[2:].strip())
        elif line:
            chars += len(line)
    return title_en, title_km, max(1, chars // 550 + 1)


rows = []
for f in sorted((ROOT / "library" / "articles").glob("*.md")):
    raw = f.read_bytes()
    text = raw.decode("utf-8")
    parsed = parse(text)
    if parsed is None:
        continue
    title_en, title_km, minutes = parsed
    rows.append(
        "INSERT OR IGNORE INTO articles "
        "(id, title_en, title_km, body, reading_minutes, bytes, sha256, published, updated_at) VALUES "
        f"({q(f.stem)}, {q(title_en)}, {q(title_km)}, {q(text)}, {minutes}, "
        f"{len(raw)}, {q(hashlib.sha256(raw).hexdigest())}, 1, '2026-09-20T14:43:45Z');"
    )

(ROOT / "seed.sql").write_text("\n".join(rows) + "\n", encoding="utf-8")
print(f"{len(rows)} articles -> seed.sql")
