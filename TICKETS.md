# Tickets — Base

Living, ordered backlog for the **base template itself** (apps created from it get a fresh file from
`scripts/templates/TICKETS.md`). One ticket per session: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture ideas
any time with `/ticket`.

**Next:** none queued. Pick from Backlog or add tickets with `/ticket`.

## In progress

_None._

## Up next

_None._

## Backlog

- Run Maestro flows in CI on EAS Workflows (simulator/emulator jobs) once there are flows worth gating on.
- Exercise `npm run sync-base` on a real Expo SDK upgrade (base upgraded first, then one app) and note
  surprises in the `sync-base` skill. Only meaningful once an app exists and the next SDK ships.
- A neutral placeholder icon/splash for the base (currently Expo's template artwork).
- `npm run build:preview:local` (`eas build --local`) as a documented fallback for long EAS queues when testing
  only on your own devices (~10 min on this Mac vs ~1 h for free-plan Android). Trade-offs are in
  `docs/releasing.md` ("What to expect").

## Done

- T1 — Base setup — 2026-11-11 — Expo SDK 58 base: routing, design system, data layer, variants, EAS, tooling,
  agent docs and skills (2d83d7f).
- T2 — Device verification — 2026-11-11 — built and ran on the iOS 27.2 simulator and Android 16 emulator; fixed the
  card fill, the update rows, E2E launch on dev builds, multi-device scripts; added the ticket workflow.
- T3 — Base updates for apps — 2026-11-11 — `create-app` clones the base history (`base` remote); new
  `npm run sync-base` + `sync-base` skill merge base improvements (keeps TICKETS.md, regenerates lockfile); tried
  end to end on a scratch copy.
- T4 — Cloud delivery verified — 2026-11-11 — Android + iOS (ad hoc) preview builds installed on emulator and
  real phones, OTA via `update:preview` received on both; `updates.url` set; findings in `docs/releasing.md`
  ("First preview build"), `release` skill, and a "First preview build" ticket in every new app (`new-app`).
- T5 — Expo MCP tried — 2026-11-11 — docs search, EAS status and router sitemap are useful; local device automation failed ("No platform found"), so the screenshot + Maestro loop stays; documented in `run-app` and AGENTS.md.
- T6 — Android build tools in setup-mac — 2026-11-11 — setup installs NDK (from RN catalog), CMake 3.22.1 and build-tools 36.0.0 (AGP defaults, env-overridable) so the first Gradle build is faster.
