-- AI connectors (MCP). Clients register themselves (RFC 7591); the admin approves each
-- one on /admin/connect. Only SHA-256 hashes of codes and tokens are stored.
CREATE TABLE oauth_clients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  redirect_uris TEXT NOT NULL,
  secret_hash TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE oauth_codes (
  code_hash      TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL,
  redirect_uri   TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  scope          TEXT NOT NULL,
  resource       TEXT NOT NULL,
  expires_at     INTEGER NOT NULL,
  used           INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE oauth_tokens (
  token_hash TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,          -- 'access' | 'refresh'
  client_id  TEXT NOT NULL,
  scope      TEXT NOT NULL,
  resource   TEXT NOT NULL,
  family     TEXT NOT NULL,          -- tokens from one authorization, revoked together
  expires_at INTEGER NOT NULL,
  revoked    INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX oauth_tokens_client ON oauth_tokens (client_id);
CREATE INDEX oauth_tokens_family ON oauth_tokens (family);
