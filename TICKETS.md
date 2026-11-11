# Tickets — Base

Living, ordered backlog for the **base template itself** (apps created from it get a fresh file from
`scripts/templates/TICKETS.md`). One ticket per session: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture ideas
any time with `/ticket`.

**Next:** T3 — Pull base improvements into existing apps · Opus · high effort · plan mode on

## In progress

_None._

## Up next

### T3 — Pull base improvements into existing apps

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** Decide and implement how apps created from the base receive later base improvements (tooling,
  skills, scripts, design-system fixes, SDK upgrades) without clobbering app-specific work.
- **Done when:**
  - [ ] Approach chosen with the user and recorded in `docs/decisions.md`.
  - [ ] Implemented (script and/or `create-app` change) and documented in `docs/new-app-checklist.md` + AGENTS.md.
  - [ ] Tried end-to-end: create an app, change the base, bring the change into the app.
- **Context:** Today `scripts/create-app.mjs` copies tracked files and starts a **fresh git history**, so a plain
  `git merge` from the base isn't possible. Options to weigh: (a) keep the base history in new apps and add the
  base as a `base` remote → `git fetch base && git merge base/main` (simple, but merges touch app files such as
  `src/features/home`, `TICKETS.md`, `app.json`); (b) fresh history + `git format-patch`/`git am` or cherry-pick of
  selected base commits; (c) a `npm run sync-base` script that updates only "owned by base" paths (`.claude/`,
  `scripts/`, `docs/`, `eslint.config.js`, …) from a base checkout. Decide this before creating many apps.

### T4 — Verify cloud delivery end to end

- **Status:** ready (iOS parts need a paid Apple Developer account)
- **Session:** Opus · high effort · plan mode off
- **Goal:** Prove the delivery path works for real: preview builds install on devices and receive OTA updates.
- **Done when:**
  - [ ] `npm run build:preview -- --platform android` → APK installs on the emulator/phone via the EAS link.
  - [ ] A small JS change shipped with `npm run update:preview -- --message "…"` shows up in that build after a
        restart.
  - [ ] iOS preview build (if the Apple account is ready), else marked blocked with what's needed.
  - [ ] Surprises documented in `docs/releasing.md`.
- **Context:** The project is linked to EAS (`owner` + `extra.eas.projectId` in app.json). Workflow files in
  `.eas/workflows/` validate. Updates aren't configured yet: run `npx eas-cli@latest update:configure` first
  (writes `updates.url`). The user must be present for Apple/Google credential prompts.

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
- A neutral placeholder icon/splash for the base (currently Expo's template artwork).
- `scripts/setup-mac.sh android`: also pre-install what the first Gradle build fetched on its own (NDK
  27.1.12297006, CMake 3.22.1, build-tools 36.0.0; read versions from the project rather than hard-coding) so
  the first `npm run android` is faster.

## Done

- T1 — Base setup — 2026-11-11 — Expo SDK 58 base: routing, design system, data layer, variants, EAS, tooling,
  agent docs and skills (2d83d7f).
- T2 — Device verification — 2026-11-11 — built and ran on the iOS 27.2 simulator and Android 16 emulator; fixed the
  card fill, the update rows, E2E launch on dev builds, multi-device scripts; added the ticket workflow.
