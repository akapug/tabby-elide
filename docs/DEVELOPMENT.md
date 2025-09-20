# Development & Verification Guide

This document captures the end-to-end local dev workflow we validated, including ports, builds, and what to expect in Chrome.

## Prerequisites
- Java 17 (JDK 17)
- Node.js 18+ (npm)
- Chrome/Chromium (for MV3)

## Project layout (high level)
- control-plane/ (Kotlin/Ktor app)
  - app: main Ktor application
  - modules:
    - release: `/api/v1/releases/{tenant}/latest` (signed metadata)
    - admin-ui: placeholder
    - auth-google: placeholder
- extension/ (Chrome MV3 React/TS + Vite)
  - src/newtab: New Tab React app
  - src/background: Service worker (ES module)
  - src/lib/boot.ts: fetch, verify RS256, cache, return payload
  - scripts/: icon generation and static copy

## Control plane: run locally
From repo root:

```
./gradlew :control-plane:app:run --no-daemon --console=plain --stacktrace
```

Behavior:
- Auto-selects a free low port under 8080 (pref: 7777, 7070, 7007, 6502, 6123, 5555, 5234, 5005, 4321, 3456, 2345, 1234)
- Logs the chosen port and prints: `Responding at http://127.0.0.1:<port>`
- CORS: `Access-Control-Allow-Origin: *` for dev

Override port:
- PowerShell: `$env:PORT=4321; ./gradlew :control-plane:app:run`
- CMD: `set PORT=4321 && gradlew :control-plane:app:run`

Endpoints (replace 7777):
```
http://127.0.0.1:7777/healthz
http://127.0.0.1:7777/.well-known/tabby/keys.json
http://127.0.0.1:7777/api/v1/releases/dev/latest
http://127.0.0.1:7777/dev/payload.json
```

## Extension: build & load
From `extension/`:

```
npm install
npm run build:ext
```

- `build:ext` generates placeholder icons and copies `manifest.json` and `managed_schema.json` into `dist/`.
- Background worker is an ES module: `"background": { "type": "module" }`.
- Host permissions include `http://localhost/*` and `http://127.0.0.1/*`.

Load in Chrome:
- chrome://extensions  Enable Developer mode
- Load unpacked  select `extension/dist`
- Open a new tab

What you should see:
- Header with Tabby branding
- A grid with demo Announcement, Link, and App tiles (from the dev payload)

## How it works (dev loop)
1. Extension starts, background alarm sync calls `boot({ headless: true })` periodically
2. New Tab React app imports `boot({ headless: false })` on mount
3. `boot`:
   - Reads managed storage (optional `updateUrl`, `tenantId`)
   - Auto-discovers base URL by probing `/healthz` on candidate ports, unless overridden by `managed.updateUrl`
   - GET `/api/v1/releases/{tenant}/latest` with ETag; if 304, reads cached payload
   - Downloads payload, verifies RS256 using JWKS; on success, updates Cache API + `chrome.storage.local` (etag/version)
   - Returns `{ from: 'network'|'cache', payload }`

## Troubleshooting
- Port conflict: set `PORT` explicitly and re-run
- CORS errors: ensure youre hitting the started app; curl shows `Access-Control-Allow-Origin: *`
- Stuck on cache: clear `chrome.storage.local` (keys `etag`, `version`) or bump dev version server-side
- Service worker errors: confirm manifest has `{ "type": "module" }` and Chrome shows the worker active

## Security (dev mode)
- JWKS includes an ephemeral `dev-*` key; the extension currently accepts this for rapid local iteration. For production, remove the dev bypass and use a stable keypair. The verification path already supports strict RS256.

## Next steps
- Replace placeholder icons in `extension/icons` with branded artwork (16/48/128)
- Implement real admin UI and Google Workspace domain restriction
- Wire CI to run Gradle tests and extension lint/build
