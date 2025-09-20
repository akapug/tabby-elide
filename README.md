# Tabby: Chrome New Tab intranet (Elide/Ktor + MV3 React/TS)

Enterprise-ready Chrome MV3 extension that overrides the New Tab page and renders tenant-branded intranet content. A Kotlin/Ktor control plane (Elide-based) serves signed release bundles and dev JWKS; the extension verifies RS256, caches offline, and renders widgets (Announcements, Links, App launchers).

This repo contains documentation to get you running quickly on a new machine. Source code is assumed to be on your local workspace; if not, clone and replace the extension/control-plane paths below accordingly.

## What you get
- Control plane: Kotlin/Ktor app with routes
  - GET /healthz
  - GET /.well-known/tabby/keys.json (dev JWKS)
  - GET /api/v1/releases/{tenant}/latest (signed release metadata)
  - GET /dev/payload.json (dev payload used by the release route)
- Chrome MV3 extension (React/TypeScript + Vite)
  - New Tab override, background sync alarm → boot()
  - RS256 signature verification against JWKS
  - ETag + offline cache fallback
  - Basic widgets: Announcement, Link, App
  - Managed storage schema wired (managed_schema.json)

## Quickstart (Windows-friendly)

Prereqs:
- JDK 17 (Java 17)
- Node.js 18+ (npm)
- Git

Control plane (from repo root):

```
./gradlew :control-plane:app:run --no-daemon --console=plain --stacktrace
```

Notes:
- The app auto-selects a free low port under 8080 (prefers 7777, then 7070, 7007, 6502, ...). It logs the chosen port.
- To force a port (e.g., 4321):
  - PowerShell: `$env:PORT=4321; ./gradlew :control-plane:app:run`
  - CMD: `set PORT=4321 && gradlew :control-plane:app:run`

Verify endpoints (replace 7777 with your selected port):

```
http://127.0.0.1:7777/healthz
http://127.0.0.1:7777/.well-known/tabby/keys.json
http://127.0.0.1:7777/api/v1/releases/dev/latest
```

Extension build (from extension/):

```
npm install
npm run build:ext
```

Load in Chrome:
- Navigate to chrome://extensions
- Enable Developer mode
- Load unpacked → select `extension/dist`
- Open a new tab to see the tiles

## Dev details
- CORS is enabled on the Ktor app (`Access-Control-Allow-Origin: *`) for local dev
- Extension auto-discovers whichever low port the server chose by probing `/healthz`
- Background service worker is an ES module (MV3 requirement for our imports)
- `managed_schema.json` is copied into `dist/` during build (Chrome checks for it)
- Host permissions include `http://localhost/*` and `http://127.0.0.1/*` for dev

## Troubleshooting
- Port in use: set `PORT` to a specific free port and re-run the app
- CORS blocked: ensure you’re hitting the Ktor app we started (it returns `Access-Control-Allow-Origin: *`)
- Extension not updating: open DevTools on New Tab, check Network for the `latest` and `payload.json` requests; clear `chrome.storage.local` keys `etag`/`version` if needed

More detailed notes are in `docs/DEVELOPMENT.md`.
