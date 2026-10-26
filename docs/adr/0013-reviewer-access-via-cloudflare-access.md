# 0013. Reviewer access through Cloudflare Access identity, verified in the Worker

- **Status:** Proposed (behind gate G-C)
- **Date:** 2026-10-26
- **Deciders:** Chamrong (to confirm)

## Context
Review by someone other than the owner may become necessary (open question Q6). [ADR 0003](0003-single-admin-sealed-session.md) deliberately has no user management. Adding passwords, resets and MFA for a second person would be a large, security-sensitive build.

## Decision
Do not add accounts. Put Cloudflare Access in front of the admin, let it authenticate the reviewer by email and one-time code, and have the Worker **verify the Access JWT itself** (signature, issuer, audience, expiry) before trusting the email. A small allow-list secret grants the `reviewer` role, which can read drafts and approve or send back articles that are in review, and nothing else.

## Consequences
- No password storage, reset or MFA code in our app.
- A dependency on Cloudflare Access's free-plan limits and behaviour (to verify).
- The verification code is security-critical and needs tests with forged, expired and wrong-audience tokens.
- The owner's own sign-in is unchanged.

## Alternatives considered
- **Our own accounts:** full control, large build and risk.
- **Share the owner's password:** rejected outright.
- **Trust the `Cf-Access-Authenticated-User-Email` header without verifying the JWT:** unsafe if Access is ever mis-scoped; rejected.

## Links
[FS-ADMIN-02](../flows/admin/fs_admin_02_reviewer_access.md) · [FS-CONTENT-04](../flows/content/fs_content_04_review_and_publish.md)
