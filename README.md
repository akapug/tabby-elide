# Tabby (Elide)

Enterprise Chrome new-tab intranet for Google Workspace, with an Elide-based control plane.

## Structure

- control-plane/: Kotlin/Netty app (Ktor) with modules: auth-google, config, release, cdn, telemetry, admin-ui, packager
- extension/: Chrome MV3 React/TS extension overriding the new tab
- docs/: Guides for admin, Chrome policy, OAuth setup, security
- infrastructure/: Helm/Terraform stubs

## Dev quickstart

Control plane (Ktor):
- Ensure JDK 21 installed
- Build/run: `./gradlew :control-plane:app:run`

Extension (Vite):
- `pnpm i && pnpm dev`
- Load unpacked from `extension/` output for development

See docs/ for policy setup and OAuth config.

