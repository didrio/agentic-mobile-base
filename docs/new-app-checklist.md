# New app checklist

From this base to your own app. The `new-app` agent skill walks through the same steps.

## 1. Create it

```bash
# once: your reverse-DNS prefix for bundle IDs
npm pkg set config.bundleIdPrefix=com.yourname

# from the base repo: clones the base (with its history) into a new folder, renames it, installs dependencies
npm run create-app -- ../habit-tracker --name "Habit Tracker"

# …or, if you already cloned the base into the new repo:
npm run new-app -- --name "Habit Tracker" --id com.yourname.habittracker
```

This sets the name, slug, URL scheme, iOS bundle ID and Android package (`app.json`), the package name, and the
README title, removes any EAS project link inherited from the base, and starts a fresh `TICKETS.md`.
`create-app` commits that on top of the base's history and keeps the base as the `base` remote, so the app can
pull later base improvements (section 5). Only committed base changes are included. Then open
the folder in Claude Code (Opus, high effort, plan mode on) and run `/start T1`: that session works through
the rest of this checklist with you.

## 2. Make it yours

- [ ] **Brand colors**: `brand` / `primary` in `src/theme/tokens.ts` (light + dark).
- [ ] **iOS icon** (iOS 26+ layered icon): design it in Apple's **Icon Composer** and replace `assets/app.icon/`.
- [ ] **Fallback / Android-legacy icon**: `assets/images/icon.png`, 1024×1024 PNG, no transparency.
- [ ] **Android adaptive icon**: `assets/images/android-icon-foreground.png` (+ `-background`, `-monochrome`),
      1024×1024, keep the artwork inside the central ~66% safe zone; set `android.adaptiveIcon.backgroundColor`.
- [ ] **Splash**: `assets/images/splash-icon.png` (a centered logo, transparent background) and the light/dark
      background colors in the `expo-splash-screen` plugin in `app.json`.
- [ ] **Home screen**: replace `src/features/home` with your first real screen; update its test and
      `.maestro/smoke.yaml`.
- [ ] **README**: one paragraph on what the app is.
- [ ] **Orientation / tablets**: `orientation` in `app.json`; add `"ios": { "supportsTablet": true }` only if you
      design for iPad (it adds iPad screenshot requirements).

## 3. Connect services

- [ ] `npx eas-cli@latest init` and `npx eas-cli@latest update:configure` (see `docs/releasing.md`).
- [ ] Backend: set `EXPO_PUBLIC_API_URL` in `.env` (copy `.env.example`) and for EAS (`eas env:create`).
- [ ] Optional: crash reporting (Sentry), analytics, auth provider — add when the app needs them.

## 4. Before the first store submission

Follow the store checklist in `docs/releasing.md`.

## 5. Keep up with the base

The base keeps improving (agent skills, scripts, docs, design-system fixes, SDK upgrades). Because an app made
with `create-app` shares the base's git history, those improvements arrive with a normal git merge:

```bash
npm run sync-base -- --dry-run   # which base commits and files would come in
npm run sync-base                # merge base/main; stops before committing
npm run check && git commit --no-edit
```

- **What's protected:** `TICKETS.md` always stays the app's. Everything else is a 3-way merge: base changes to
  files the app never touched apply cleanly, and real overlaps (e.g. `app.json`, a screen the app replaced) show
  up as conflicts. A lockfile-only conflict is regenerated automatically. Agents resolve with the `sync-base`
  skill (`.claude/skills/sync-base/SKILL.md`); `git merge --abort` undoes a sync.
- **When:** whenever the base has something you want, and before starting a big feature. Sync an Expo SDK
  upgrade in its own session.
- **Fix it in the base:** a fix every app needs goes into the base first and then into each app with
  `sync-base`. Shared history also lets you cherry-pick a clean app commit into the base:
  `git fetch ../habit-tracker main && git cherry-pick <sha>` (run in the base).
- **Base moved to GitHub?** `git remote set-url base git@github.com:you/base.git` in each app.
- **App made without `create-app`** (e.g. cloned the base, then `new-app`): add the remote once with
  `npm run sync-base -- --base <path-or-url>`. If the app has a fresh history (GitHub "Use this template", a
  copy), connect it once to the base commit it was created from, without changing any files:
  `git fetch base && git merge -s ours --allow-unrelated-histories -m "Adopt base history" <base-sha>`. After that,
  `sync-base` brings in only what changed in the base since then.
