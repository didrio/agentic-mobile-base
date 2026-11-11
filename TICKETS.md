# Tickets — Base

Living, ordered backlog for the **base template itself** (apps created from it get a fresh file from
`scripts/templates/TICKETS.md`). One ticket per session: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture ideas
any time with `/ticket`.

**Next:** T5 — Try Expo's MCP tools for agents · Sonnet · medium effort · plan mode off

## In progress

_None._

## Up next

### T5 — Try Expo's MCP tools for agents

- **Status:** ready
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Decide whether Expo's MCP server (docs search, EAS status) and local capabilities (`npm run start:mcp`:
  screenshots, taps, logs) should be part of the default agent loop.
- **Done when:**
  - [ ] `/mcp` authenticated; tools listed and tried against the running dev build.
  - [ ] Compared with the current loop (`npm run screenshot` + Maestro) on speed and token cost.
  - [ ] AGENTS.md / `run-app` skill updated with the recommendation (or a note on why not).
- **Context:** `expo-mcp` is a dev dependency; `start:mcp` sets `EXPO_UNSTABLE_MCP_SERVER=1`. Needs `npx expo login`.

## Backlog

- Run Maestro flows in CI on EAS Workflows (simulator/emulator jobs) once there are flows worth gating on.
- Exercise `npm run sync-base` on a real Expo SDK upgrade (base upgraded first, then one app) and note
  surprises in the `sync-base` skill. Only meaningful once an app exists and the next SDK ships.
- A neutral placeholder icon/splash for the base (currently Expo's template artwork).
- `scripts/setup-mac.sh android`: also pre-install what the first Gradle build fetched on its own (NDK
  27.1.12297006, CMake 3.22.1, build-tools 36.0.0; read versions from the project rather than hard-coding) so
  the first `npm run android` is faster.
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
