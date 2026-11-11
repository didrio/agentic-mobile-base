---
name: new-app
description: Start a brand-new app from this base — set its identity (name, bundle ID), clear the starter content, and turn the user's app idea into a first working version. Use when the user describes a new app idea, says "start a new app/project", or asks to rename/rebrand this base.
---

# Start a new app from the base

Goal: in one session, go from "app idea" to a running, testable first version that still follows the base's conventions.

## 1. Pin down the identity (ask only for what's missing)

- **Display name** (under the icon, ≤ ~12 chars looks best).
- **Bundle ID** = iOS bundle identifier + Android package, reverse-DNS, e.g. `com.yourname.habittracker`.
  Letters/digits only per segment (no hyphens), and it's permanent once on a store. If the user doesn't care, use
  `npm pkg get config.bundleIdPrefix` (or `com.example`) + the slug, and flag that `com.example` must change before release.

## 2. Apply it

Pick the case that matches where you are:

- **Already in the new app's own folder/repo** (cloned or "Use this template"):
  `npm run new-app -- --name "Habit Tracker" --id com.yourname.habittracker`
- **Inside the base repo itself, making a sibling project:**
  `npm run create-app -- ../habit-tracker --name "Habit Tracker" --id com.yourname.habittracker`
  (copies tracked files, fresh git history, `npm ci`). Then continue working in the new folder.

Both update `app.json`, `package.json`, `package-lock.json`, the README title, and unlink any EAS project.
Never edit the bundle ID by hand in more than one place — `app.json` is the single source; `app.config.ts`
derives the `.dev` / `.preview` variants.

## 3. Shape the starter content

- Keep: `src/theme`, `src/components/ui`, `src/lib`, the Settings tab (appearance + About is useful in every app).
- Replace the Home feature (`src/features/home`) with the app's first real screen. Update its test.
- Add tabs / stacks the idea needs (see the `add-feature` skill). Remove a tab by deleting its folder in
  `src/app/(tabs)/` and its `NativeTabs.Trigger`.
- Rebrand: change `brand` / `primary` colors in `src/theme/tokens.ts`. Placeholder icon & splash live in
  `assets/` — list them for the user as a TODO (see docs/new-app-checklist.md); don't invent artwork.

## 4. Plan before building

Write a short plan in the conversation: screens, data (local only? backend? auth?), native capabilities needed
(camera, location, notifications, purchases…). For each native capability, check whether it works in Expo Go
(see `add-native-capability`). Tell the user early if the app will need a development build.

## 5. Build the first slice and verify

Implement the smallest end-to-end slice, then run the full verification loop from AGENTS.md
(`npm run check`, then run/screenshot on a simulator if available). Update `.maestro/smoke.yaml` so it asserts the
new home screen instead of "Start building".

## 6. Hand off

Tell the user: how to open it on their phone (`npm run start:go` → scan QR with Expo Go, or `npm run ios`),
what's placeholder (icon, splash, `com.example`), and the next step for distribution (`npx eas-cli@latest init`,
see the `release` skill).
