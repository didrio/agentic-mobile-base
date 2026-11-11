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

This is ticket T1 in the new app's `TICKETS.md` ("Shape the app"). Agree on a short plan with the user: screens
and navigation, data (local only? backend? auth?), and native capabilities (camera, location, notifications,
purchases…). For each native capability, check whether it works in Expo Go (see `add-native-capability`), and
tell the user early if the app will need a development build.

## 5. Build the first slice and verify

Implement the smallest end-to-end slice, then run the verification loop from AGENTS.md (`npm run check`, then
run and screenshot on a simulator if one is available). Update `.maestro/smoke.yaml` so it checks the new first
screen instead of "Start building".

## 6. Write the backlog

Turn the rest of the plan into tickets T2, T3, … in `TICKETS.md`, ordered by what to build next. Each one should
be session-sized and detailed enough to start cold, with a **Session** recommendation (table in the `wrap` skill).
Put placeholders (icon, splash, `com.example`, `npx eas-cli@latest init` for the app's own EAS project) on a
ticket too, so they aren't forgotten. Then suggest `/wrap`.
