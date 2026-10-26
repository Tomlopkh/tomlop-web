-- One row per article. `body` is the exact Markdown served to the app; `sha256`,
-- `bytes` and the title/minutes columns are derived from it on every save, so the
-- feed index can be built without reading any body.
CREATE TABLE articles (
  id              TEXT PRIMARY KEY,
  title_en        TEXT NOT NULL,
  title_km        TEXT NOT NULL,
  body            TEXT NOT NULL,
  reading_minutes INTEGER NOT NULL,
  bytes           INTEGER NOT NULL,
  sha256          TEXT NOT NULL,
  published       INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL
);

CREATE INDEX articles_published ON articles (published);
