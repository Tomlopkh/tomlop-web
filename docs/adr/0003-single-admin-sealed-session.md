# 0003. One admin, scrypt password, sealed session cookie

- **Status:** Accepted
- **Date:** 2026-10-26
- **Deciders:** Chamrong

## Context
The backoffice has one user today: the owner. It can publish text to every phone and delete articles, so sign-in must be strong
but a user-management system would be wasted effort. The owner's other site (chamrong.com) uses `nuxt-auth-utils` with a scrypt hash, which is a proven pattern here.

## Decision
A single admin identified by `NUXT_ADMIN_EMAIL`, with `NUXT_ADMIN_PASSWORD_HASH` (scrypt, made by `npm run hash-password`) and a sealed, HttpOnly,
`Secure`, `SameSite=Lax` session cookie (12 hours). Secrets are Cloudflare secrets. Sign-in is limited to 5 attempts per 15 minutes per address, counted in D1 so every isolate shares the budget.
Every `/api/admin/*` call checks the session server-side; the SPA's redirect to the sign-in page is a convenience, not the protection.
State-changing requests must also pass a same-origin check. The password is compared even when the email is wrong, so the reply never says which was wrong.

## Consequences
- No password reset, no invitations, no roles, no MFA. Losing the password means setting a new secret with `wrangler`.
- A second author means either sharing the password (bad) or revisiting this decision. Cloudflare Access in front of `/admin*` is the planned stop-gap and adds MFA for free (see the runbook).
- Rate limiting is per client address; a distributed guesser is slowed, not stopped. Password length (12+ enforced by the hash script) is the real defence.

## Alternatives considered
- **Cloudflare Access only.** Strong, but couples sign-in to Cloudflare and does not protect `/api/admin` if mis-scoped. Kept as an additional layer, not a replacement.
- **OAuth with Google.** Needs a client, consent screen and an allow-list; more moving parts than one password for one person.
- **Magic links by email.** Needs an email provider. Deferred until there is more than one author.

## Links
[FS-ADMIN-01](../flows/admin/fs_admin_01_sign_in.md) · `server/api/admin/auth/login.post.ts` · `server/middleware/admin-guard.ts`
