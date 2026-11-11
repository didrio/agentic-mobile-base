# New app checklist

From this base to your own app. The `new-app` agent skill walks through the same steps.

## 1. Create it

```bash
# once: your reverse-DNS prefix for bundle IDs
npm pkg set config.bundleIdPrefix=com.yourname

# from the base repo: a new folder with a fresh git history and dependencies installed
npm run create-app -- ../habit-tracker --name "Habit Tracker"

# …or, if you already cloned/copied the base into the new repo:
npm run new-app -- --name "Habit Tracker" --id com.yourname.habittracker
```

This sets the name, slug, URL scheme, iOS bundle ID and Android package (`app.json`), the package name, and the
README title, removes any EAS project link inherited from the base, and starts a fresh `TICKETS.md`. Then open
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
