# 0010. Measure the product without identifying anyone

- **Status:** Proposed
- **Date:** 2026-10-26
- **Deciders:** Chamrong (to confirm)

## Context
Tomlop's differentiator is privacy: no account, no analytics SDK, no ad ID, no behavioural data leaves the device (PRODUCT.md, privacy policy).
A product with no measurement cannot tell whether it is useful. The task is to learn enough without breaking the promise.

## Decision
Use only aggregate signals that need no identifier on the device:
1. **Google Play Console** aggregates (installs, uninstalls, retention cohorts, crashes, ANRs, ratings). These are Google's, not ours.
2. **Cloudflare request counts** for `/library/library.json` per day, as a proxy for daily active installs of versions that sync. No cookies, no IP storage in our database.
3. **Opt-in, in-app, human feedback**: a link to a short form the user chooses to open. Nothing is sent automatically.
4. **A stated list of what we will never add** (analytics SDKs, advertising IDs, per-user event logs), published in the privacy policy so the promise is checkable.
We deliberately do **not** add a version header to the feed request in the first iteration; the fixed `User-Agent: Tomlop` stays.

## Consequences
- Metrics are coarse and lagging; funnel questions ("where do users drop in onboarding") cannot be answered. Qualitative research fills the gap ([research plan](../../../tomlop-mobile-android/docs/product/research-plan.md)).
- Feed requests count syncs, not people; reinstalls and several devices distort it. Treat it as a trend line, not a headcount.
- Any later telemetry (even anonymous) needs a new ADR and a privacy-policy change before it ships.

## Alternatives considered
- **Privacy-friendly analytics (Plausible/Umami-style).** Still a network call per event from the app, and still a change to the "no analytics" claim. Rejected for the app; fine for the public website if wanted.
- **On-device stats shown to the user only.** Already the model for personal progress; it informs the user, not us.

## Links
[metrics](../../../tomlop-mobile-android/docs/product/metrics.md)
