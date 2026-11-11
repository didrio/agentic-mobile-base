---
name: add-native-capability
description: Add a device/native capability or native library — camera, photos, location, maps, notifications, biometrics, contacts, calendar, Bluetooth, HealthKit, in-app purchases, background tasks, widgets, a third-party native SDK, or custom Swift/Kotlin code. Use whenever a feature needs a native module, a permission, Info.plist/AndroidManifest changes, or a config plugin.
---

# Add a native capability

The app uses Continuous Native Generation: `ios/` and `android/` are generated from `app.json` + config plugins
and are git-ignored. **Never hand-edit them** — changes are lost on the next prebuild. Full background:
`docs/native.md`.

## 1. Pick the library (in this order)

1. An **Expo SDK module** (`expo-camera`, `expo-location`, `expo-notifications`, `expo-image-picker`,
   `expo-local-authentication`, `expo-contacts`, `expo-calendar`, `expo-sensors`, `expo-audio`, `expo-video`,
   `expo-maps`, `expo-background-task`, `expo-secure-store`, `@expo/ui` for SwiftUI/Compose views…). Check the
   versioned docs for SDK 58: https://docs.expo.dev/versions/v58.0.0/ — and the Expo plugin skills
   (`expo-module`, `expo-ui`, `expo-native-ui`, …) if available.
2. A well-maintained community library that supports the **New Architecture** and ships a config plugin
   (check https://reactnative.directory).
3. Your own **local Expo module** in Swift/Kotlin: `npx create-expo-module@latest --local` → `modules/<name>/`.

## 2. Install

```bash
npx expo install <package>      # never plain `npm install` for runtime deps — picks SDK-compatible versions
```

## 3. Configure natively via app.json

- If the package has a config plugin, add it to `expo.plugins` in `app.json` with its options — that's where
  permission strings usually go:
  `["expo-camera", { "cameraPermission": "Allow $(PRODUCT_NAME) to scan receipts." }]`
- Otherwise use `expo.ios.infoPlist`, `expo.ios.entitlements`, `expo.android.permissions` in `app.json`.
- Something no plugin covers → write a small config plugin in `plugins/<name>.js` (see `docs/native.md`) and
  reference it as `"./plugins/<name>"`.
- Permission strings must explain the user-facing reason — App Review rejects vague ones.

## 4. Rebuild the native app (JS reload is NOT enough)

- Check if it runs in **Expo Go**: Expo SDK modules generally do; most third-party native libraries and all
  local modules do **not**. If it doesn't, tell the user plainly: "this feature needs a development build;
  Expo Go will show an error for it".
- Local rebuild: `npm run native:clean && npm run ios` (and/or `npm run android`).
- No Xcode/Android SDK on the machine: `npm run build:dev:sim` (iOS simulator build in the cloud) or
  `npm run build:dev -- --platform android` (installable APK) — needs an EAS project.
- Also note: native changes alter the runtime fingerprint, so production users need a **new store build**, not
  an OTA update.

## 5. Use it safely in code

- Wrap the capability in a small module (`src/lib/<capability>.ts` or inside the feature) that requests
  permission, handles "denied" and "undetermined" states, and exposes a typed API to the UI.
- Always design the denied path (explain + link to Settings via `Linking.openSettings()`).
- Mock the native module at the boundary in `jest.setup.ts` (or per test) so unit tests run.

## 6. Verify

`npm run check`, `npx expo prebuild --no-install --clean` in a scratch copy if you changed plugins (or just
`npx expo config --type introspect` to inspect the generated Info.plist/manifest), then run on a simulator or
device and exercise the permission prompt. Real hardware is needed for some capabilities (camera, Bluetooth,
NFC, push notifications on iOS) — say so when you can't test them.
