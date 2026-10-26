-- Fixed-window counters shared by every Worker isolate (login, OAuth registration/token).
CREATE TABLE rate_limits (
  id       TEXT PRIMARY KEY,
  count    INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
