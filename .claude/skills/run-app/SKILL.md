---
name: run-app
description: Launch this app on an iOS Simulator, Android emulator, real device or Expo Go, then see and drive it — screenshots, logs, and Maestro E2E flows. Use when asked to run, start, open, preview, screenshot, test on device, or confirm a change works in the real app.
---

# Run the app and verify it visually

## 0. Know what this machine can do

```bash
npm run doctor        # ✓/○ per target: Expo Go, iOS Simulator, Android emulator, devices, EAS, Maestro
```

## 1. Launch

| Target                        | Command                                                                       | Notes                                                                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS Simulator (dev build)     | `npm run ios` (specific device: `npm run ios -- --device "iPhone 18 Pro"`)    | Uses the booted simulator, else the saved default. First run compiles natively (several minutes). Xcode 27+: the simulator app is DeviceHub — `open "devices://device/open?id=<udid>"`. |
| Android emulator (dev build)  | `npm run android`                                                             | Boots the emulator if none is running.                                                                                                                                                  |
| Real iPhone (USB, dev build)  | `npm run ios:device`                                                          | Needs Xcode signing (free Apple ID works for personal devices).                                                                                                                         |
| Real Android (USB, dev build) | `npm run android:device`                                                      | USB debugging enabled.                                                                                                                                                                  |
| Real phone, zero setup        | `npm run start:go` → user scans the QR with **Expo Go**                       | Only Expo Go-compatible modules. Phone and Mac on the same Wi-Fi (else `-- --tunnel`).                                                                                                  |
| Dev build already installed   | `npm start` → press `i` / `a`                                                 | Just starts the bundler.                                                                                                                                                                |
| No local toolchain            | `npm run build:dev:sim` (iOS sim) / `npm run build:dev -- --platform android` | Cloud build via EAS; needs `eas init`.                                                                                                                                                  |

Run long-lived commands (`npm start`, `npm run ios`) in the background and poll their output; the bundler must
keep running while you test. After native changes (new native package, app.json plugins/permissions), rebuild
with `npm run native:clean && npm run ios|android`. JS/TS changes hot-reload automatically; press `r` in the
bundler terminal for a full reload.

## 2. See it

```bash
npm run screenshot            # prints the PNG path → open it with your image-reading tool
npm run screenshot -- ios home-dark
```

Check both light and dark mode (Settings tab → Appearance) and, for layout work, both platforms.

## 3. Drive it

- Maestro flows in `.maestro/` (YAML: `tapOn`, `inputText`, `assertVisible`, `takeScreenshot`).
  `npm run e2e` (needs `npm start` running for dev builds) or `npm run e2e -- --flow .maestro/<flow>.yaml`.
  Screenshots from flows land in `.artifacts/maestro/`.
- Optional, richer agent control: `npm run start:mcp` starts the bundler with Expo's local MCP capabilities
  (screenshot/tap/find view/logs) — requires `npx expo login` and the Expo MCP server connected in the client.

## 4. Logs

- JS logs and errors stream in the bundler output. Red-box errors show in the app.
- iOS native: `xcrun simctl spawn booted log stream --predicate 'process == "<AppName>"' --level error`.
- Android native: `adb logcat '*:E' | grep -i <package>`.

## 5. Report honestly

If no simulator/emulator/device is available, say so and fall back to `npm run check` plus a bundling check:
`npx expo export --platform ios --platform android --output-dir /tmp/export`. Don't claim visual verification
you couldn't do.
