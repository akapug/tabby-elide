## Admin Guide (MVP)

- Sign in via Google OAuth (Internal app). Enforce hd claim and email_verified.
- Create pages, sections, tiles in the Admin UI (placeholder in this scaffold).
- Publish: creates an immutable release with version, etag, sig, payload_url.
- Clients fetch `/api/v1/releases/{tenant}/latest` and verify against JWKS.

