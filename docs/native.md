# Native code, libraries and capabilities

You can use virtually any native iOS/Android capability from this app. This page explains how without ever
maintaining Xcode/Gradle projects by hand.

## Continuous Native Generation (CNG)

`ios/` and `android/` are **generated** by `npx expo prebuild` from `app.json` + config plugins + installed
native packages, and are git-ignored. To change native behavior you change the inputs, never the outputs:

| You want to…                                 | Do this                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| Add a native library                         | `npx expo install <pkg>` (+ its config plugin in `app.json` if it has one) |
| Add a permission / usage description         | the library's plugin options, or `ios.infoPlist` / `android.permissions`   |
| Add entitlements (push, iCloud, App Groups…) | `ios.entitlements` in `app.json` (or the library's plugin)                 |
| Change something no plugin covers            | write a config plugin in `plugins/` (below)                                |
| Write your own Swift/Kotlin                  | a local Expo module in `modules/` (below)                                  |

After any of these: `npm run native:clean && npm run ios` (or `android`). Native changes also change the
runtime fingerprint, so they ship to users via a new store build, not an OTA update.

## Expo Go vs development builds

|                                 | Expo Go                     | Development build                       |
| ------------------------------- | --------------------------- | --------------------------------------- |
| Setup                           | none (install from store)   | Xcode / Android SDK, or EAS cloud build |
| Native modules                  | Expo SDK + a fixed set only | anything                                |
| App icon, name, splash, plugins | Expo Go's                   | yours                                   |
| Push notifications, deep links  | limited                     | full                                    |
| Use for                         | quick UI work, demos        | real development and testing            |

`expo-dev-client` is installed, so `npm start` serves development builds; `npm run start:go` serves Expo Go.

## Common capabilities

| Capability                                    | Package (all via `npx expo install`)                               | Works in Expo Go                  |
| --------------------------------------------- | ------------------------------------------------------------------ | --------------------------------- |
| Camera / barcode scanning                     | `expo-camera`                                                      | yes                               |
| Photo picker                                  | `expo-image-picker`                                                | yes                               |
| Location / geofencing                         | `expo-location` (+ `expo-task-manager`)                            | yes (foreground)                  |
| Maps                                          | `expo-maps` (Apple Maps / Google Maps)                             | check docs                        |
| Notifications (local / push)                  | `expo-notifications`                                               | local yes; push needs a dev build |
| Biometrics                                    | `expo-local-authentication`                                        | yes                               |
| Secure storage                                | `expo-secure-store`                                                | yes                               |
| Files / sharing                               | `expo-file-system`, `expo-sharing`                                 | yes                               |
| Audio / video                                 | `expo-audio`, `expo-video`                                         | yes                               |
| Contacts / calendar                           | `expo-contacts`, `expo-calendar`                                   | yes                               |
| Sensors                                       | `expo-sensors`                                                     | yes                               |
| Background work                               | `expo-background-task`                                             | dev build                         |
| SwiftUI / Compose UI                          | `@expo/ui` (installed)                                             | yes                               |
| In-app purchases                              | `react-native-purchases` (RevenueCat) or `expo-iap`                | no                                |
| Auth (Apple / Google)                         | `expo-apple-authentication`, `expo-auth-session` or a provider SDK | partly                            |
| HealthKit / Health Connect, BLE, NFC, widgets | community libraries or a local module                              | no                                |

Always check the SDK 58 docs for the exact API: https://docs.expo.dev/versions/v58.0.0/ and
https://reactnative.directory for third-party libraries (filter: New Architecture support).

## Writing a config plugin

For native settings no library covers, add a plugin file and reference it from `app.json`:

```js
// plugins/with-background-audio.js
const { withInfoPlist } = require('expo/config-plugins');

module.exports = function withBackgroundAudio(config) {
  return withInfoPlist(config, (cfg) => {
    const modes = new Set(cfg.modResults.UIBackgroundModes ?? []);
    modes.add('audio');
    cfg.modResults.UIBackgroundModes = [...modes];
    return cfg;
  });
};
```

```json
"plugins": ["./plugins/with-background-audio"]
```

Inspect the result without building: `npx expo config --type introspect`, or run
`npx expo prebuild --clean --no-install` and look at the generated files (they're regenerated anyway).

## Writing your own native code (local Expo module)

```bash
npx create-expo-module@latest --local      # creates modules/<name>/ with Swift + Kotlin + TS
```

The Expo Modules API lets you expose Swift/Kotlin functions, events and even native views to TypeScript with very
little boilerplate. Local modules are autolinked — rebuild the app and import from `modules/<name>`. Use this for
platform APIs without a good library, performance-critical code, or wrapping a vendor SDK.

## Escape hatches

If an integration truly needs direct native project edits, prefer a config plugin with dangerous mods
(`withDangerousMod`) that applies the change during prebuild, so CNG keeps working. Committing `ios/`/`android/`
("bare" workflow) is a one-way door — avoid it unless there's no alternative.
