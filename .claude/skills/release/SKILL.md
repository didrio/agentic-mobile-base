---
name: release
description: Ship the app — link EAS, make builds for testers (TestFlight, internal APK), submit to the App Store / Google Play, publish over-the-air (OTA) updates, bump versions, and set up release automation. Use for any build, distribute, TestFlight, store, submit, publish, OTA, hotfix, or "send to testers" request.
---

# Release

Read `docs/releasing.md` for the full picture. These steps publish things to Apple/Google/Expo — **confirm with
the user before running anything that submits to a store or publishes a production update**, and show them
exactly what will happen.

## 0. Preconditions (check, don't assume)

- `npm run check` passes and the change was verified on a device/simulator.
- EAS linked: `app.json` has `expo.extra.eas.projectId`. If not: `npx eas-cli@latest login` then
  `npx eas-cli@latest init` (writes owner + projectId into app.json), then `npx eas-cli@latest update:configure`
  (adds `updates.url`). Commit those changes.
  `update:configure` also rewrites `eas.json` (adds a stray `development-simulator` channel): run
  `git checkout eas.json` afterwards and keep only the `app.json` change.
- Bundle ID in `app.json` is final (not `com.example…`) before anything goes to a store. Internal preview builds
  work fine with `com.example…`.
- The app has never had a preview build? Walk the user through "First preview build (once per app)" in
  `docs/releasing.md` first. Tell them up front which steps need them at the keyboard (`device:create`, the
  first iOS build's Apple login) and have them run those in their own terminal; the agent can run the
  Android build, installs on emulators, and `update:preview` itself. Use `--no-wait` for builds (free-plan
  Android builds can take an hour including the queue), and publish the test update only after both builds
  have finished: a build ignores updates older than its own bundle.
- Apple: paid Apple Developer account. Google: Play Console account; the **first** Android upload must be done
  manually in Play Console (Google requirement) — after that `eas submit` works with a service-account key.

## 1. Choose the path

| Situation                                                    | Command                                                                                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Testers on their own devices, no store review                | `npm run build:preview -- --platform all` (internal distribution; iOS devices must be registered with `npx eas-cli@latest device:create`) |
| TestFlight + Play internal testing (and later store release) | `npm run release` (production build for both + auto-submit)                                                                               |
| JS/asset-only fix for users already on the store build       | `npm run update:production -- --message "Fix …"`                                                                                          |
| Same, for preview testers                                    | `npm run update:preview -- --message "…"`                                                                                                 |
| Let CI decide build-vs-update by native fingerprint          | `npm run deploy` (runs `.eas/workflows/deploy-production.yml`)                                                                            |

**OTA vs new build:** the runtime version uses the `fingerprint` policy. If anything native changed (new native
package, app.json plugins/permissions/icons, SDK upgrade), an OTA update won't reach existing builds — make a new
build. When unsure, `npm run deploy` decides automatically.

## 2. Versions

- Build numbers auto-increment remotely (`appVersionSource: remote`, `autoIncrement` on production).
- The user-facing version is `expo.version` in `app.json` — bump it (semver) for each store release.

## 3. After submitting

- iOS: the build appears in App Store Connect → TestFlight after processing (~10–30 min). Store release needs
  metadata, screenshots, privacy details, and review — guided by `docs/releasing.md`.
- Android: build lands on the internal testing track; promote in Play Console.
- Check status any time: `npx eas-cli@latest status` (or the Expo MCP server's build/submission tools).
