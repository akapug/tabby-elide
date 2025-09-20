## Google OAuth Internal App Setup

- Create OAuth client (Web) in Google Cloud Console.
- Restrict to Internal and your primary Workspace domain.
- Set redirect URI to `/api/v1/admin/oauth/callback`.
- Configure the control-plane with `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.

