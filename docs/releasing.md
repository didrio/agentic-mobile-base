# Releasing: testers, stores and OTA updates

Delivery runs on **EAS** (Expo Application Services): cloud builds (no Xcode needed), automatic code-signing
credentials, store submission, over-the-air updates, and workflows. The free plan covers a solo developer's
regular builds; check expo.dev/pricing for current limits.

## Concepts

| Variant (`APP_VARIANT`) | EAS build profile                      | Bundle ID      | Installed as     | Update channel |
| ----------------------- | -------------------------------------- | -------------- | ---------------- | -------------- |
| `development`           | `development`, `development-simulator` | `<id>.dev`     | "<Name> Dev"     | `development`  |
| `preview`               | `preview` (internal distribution, APK) | `<id>.preview` | "<Name> Preview" | `preview`      |
| `production`            | `production` (store)                   | `<id>`         | "<Name>"         | `production`   |

All three can be installed side by side on one phone.

- **Runtime version = native fingerprint.** An OTA update only reaches builds whose native layer matches. Change
  anything native (packages with native code, `app.json` plugins/permissions/icons, SDK upgrade) → new build.
- **Versions:** `expo.version` in `app.json` is the user-facing version (bump it per store release). Build numbers
  are managed remotely by EAS and auto-incremented for production builds.

## One-time setup

1. Expo account: `npx eas-cli@latest login`
2. Link the project: `npx eas-cli@latest init` (writes `owner` and `extra.eas.projectId` into `app.json`)
3. Enable OTA updates: `npx eas-cli@latest update:configure` (writes `updates.url`)
4. Commit `app.json`.
5. **Apple** (iOS): enroll in the Apple Developer Program (paid, yearly). On your first iOS build, EAS logs into
   your Apple account and creates/stores certificates and provisioning profiles for you. On first submit it can
   create the App Store Connect app record.
6. **Google** (Android): create a Google Play Console account (one-time fee) and the app. Google requires the
   **first** upload to be done manually: run `npm run build:production -- --platform android`, download the
   `.aab`, upload it in Play Console. Then create a service account key for automated submissions and add it to
   EAS (`npx eas-cli@latest credentials` → Android → Google Service Account), or set
   `submit.production.android.serviceAccountKeyPath` in `eas.json` (keep the JSON file out of git).

## Everyday recipes

```bash
# Testers install directly (no review). iOS devices must be registered first: npx eas-cli@latest device:create
npm run build:preview -- --platform all

# TestFlight + Google Play internal testing (builds both, submits both)
npm run release

# JS-only fix to people already on the production build
npm run update:production -- --message "Fix crash on empty list"

# Let EAS decide: new native fingerprint → build + submit; otherwise → OTA update
npm run deploy

# What's happening?
npx eas-cli@latest status
```

Roll back a bad OTA update: `npx eas-cli@latest update:rollback` (or republish a previous update with
`update:republish`).

## Store release checklist

**Both stores**

- [ ] Final bundle ID / package (not `com.example…`) — it can never change after the first upload.
- [ ] App icon and splash (see `docs/new-app-checklist.md`).
- [ ] Privacy policy URL (required by both stores, even for apps without accounts).
- [ ] Screenshots (iPhone 6.9" required; iPad if you support tablets; Android phone).
- [ ] If users can create accounts: in-app account deletion is required.
- [ ] If you offer third-party sign-in (Google, Facebook…) on iOS, also offer Sign in with Apple.

**App Store Connect**: description, keywords, support URL, age rating, App Privacy ("nutrition label"), review
notes + demo account if login is required. Export compliance is pre-answered (`usesNonExemptEncryption: false`
in `app.json`; change it if you add custom encryption).

**Play Console**: store listing, Data safety form, content rating questionnaire, target audience, app access
(demo credentials), and for new personal developer accounts a closed test with testers before production access.

Optional: manage App Store listing text as code with EAS Metadata (`store.config.json`, `eas metadata:push`).

## Automation

- **GitHub Actions** (`.github/workflows/ci.yml`): `npm run check` + bundle both platforms on every push/PR.
- **EAS Workflows** (`.eas/workflows/`), run on Expo's infrastructure:
  - `create-development-builds.yml` — dev builds for Android, iOS device and iOS simulator.
  - `create-preview-builds.yml` — internal tester builds.
  - `deploy-production.yml` — fingerprint → build + submit **or** OTA update. Run with `npm run deploy`.

  Run any of them with `npx eas-cli@latest workflow:run .eas/workflows/<file>.yml`. Whenever you edit them,
  check them with `npx eas-cli@latest workflow:validate .eas/workflows/<file>.yml` (needs an Expo login). To
  trigger them from GitHub pushes, connect the repo in the project's GitHub settings on expo.dev and uncomment
  the `on:` block.

**One EAS project per app.** The base may be linked to its own EAS project (handy for trying builds and
workflows on the base itself); `create-app` / `new-app` remove that link (`owner`, `extra.eas`, `updates.url`)
so each new app gets its own project via `npx eas-cli@latest init`.
