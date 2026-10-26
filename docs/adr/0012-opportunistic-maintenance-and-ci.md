# 0012. Opportunistic maintenance and a CI gate instead of a scheduler

- **Status:** Proposed
- **Date:** 2026-10-26
- **Deciders:** Chamrong (to confirm)

## Context
Housekeeping (expired OAuth rows, rate-limit rows, old revisions) is small. A Cloudflare cron trigger needs scheduled-task wiring in Nitro that is easy to get subtly wrong and hard to test locally, for a job that takes milliseconds. Meanwhile there is no CI, so a regression is found by the owner **[Observed]**.

## Decision
Run pruning as part of ordinary writes, at most once an hour per isolate and with a bounded `LIMIT`. Add CI that runs types, unit tests, build and the end-to-end script, and make it a required check before Workers Builds deploys. Add an external uptime check.
If a job ever needs to run when nobody writes (it does not today), revisit with a cron trigger and a test that proves the handler runs.

## Consequences
- No new moving parts; fewer ways to fail silently.
- Pruning stops if nothing is ever written: harmless, since nothing then grows.
- CI takes a few minutes per push and needs the repository setting to be changed.
- The uptime monitor is a small external dependency; nothing else depends on it.

## Alternatives considered
- **Cron trigger now:** correct but heavier than the need.
- **No pruning:** tables grow slowly but without bound against a free-tier cap.

## Links
[FS-OPS-01](../flows/ops/fs_ops_01_maintenance_ci_alerting.md) · [runbook](../runbook.md) · [testing](../testing.md)
