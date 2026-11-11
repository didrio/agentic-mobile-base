# Getting started

Everything you need to run the app on your Mac, a simulator/emulator, or your own phone.

```bash
npm install
npm run doctor     # shows exactly which of the options below this Mac can do right now
```

Node 22.13+ is required (24 recommended — see `.nvmrc`).

## Option A — Your phone in two minutes (Expo Go)

No Xcode, no Android Studio, no accounts.

1. Install **Expo Go** from the App Store / Google Play.
2. `npm run start:go`
3. Scan the QR code — iPhone: with the Camera app; Android: from inside Expo Go.

Phone and Mac must be on the same Wi-Fi. If they can't see each other (corporate/hotel Wi-Fi, VPN), use
`npm run start:go -- --tunnel`.

**Limits:** Expo Go contains a fixed set of native modules (all Expo SDK modules, Reanimated, Gesture Handler,
SVG, …) and only runs the **latest** Expo SDK. As soon as the app uses a library with other native code, switch
to a development build (B–D). The app tells you where it's running on its Home screen.

## Option B — iOS Simulator

1. Install **Xcode** from the Mac App Store and open it once (accept the license; install the iOS platform when
   prompted, or later via Xcode → Settings → Components).
2. `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
3. `bash scripts/setup-mac.sh ios` (Watchman + CocoaPods)
4. `npm run ios` — builds the development app, installs it on a simulator and starts the bundler.
   The first build takes several minutes; after that it's incremental.

**Choosing the simulator.** `npm run ios` uses the simulator that's already booted; if none is, the saved
default. To pick one explicitly: `npm run ios -- --device "iPhone 18 Pro"` (names from
`xcrun simctl list devices available`). To change the default:

```bash
xcrun simctl list devices available                                   # copy the device's ID
defaults write com.apple.iphonesimulator CurrentDeviceUDID <device-id>
```

On Xcode 27+ the simulator window app is **DeviceHub** (Simulator.app no longer exists): open a specific device
with `open "devices://device/open?id=<device-id>"`. Creating a device doesn't start it — boot it with
`xcrun simctl boot <device-id>` (or from DeviceHub).

## Option C — Android emulator

1. `bash scripts/setup-mac.sh android` — installs JDK 17, the Android SDK (headless, no Android Studio needed), the NDK/CMake/build-tools Gradle would otherwise download on the first build, and
   creates a Pixel emulator. Add the printed `export` lines to `~/.zshrc` and open a new terminal.
   (Prefer a GUI? Install Android Studio instead and create a device in its Device Manager.)
2. `npm run android` — boots the emulator, builds, installs and starts the bundler.

## Option D — Your real phone with a development build

A development build is your own app with the dev tools built in. It supports **any** native library.

- **iPhone over USB:** add your Apple ID in Xcode → Settings → Accounts (a free account works for your own
  devices; builds then expire after 7 days), enable Developer Mode on the phone (Settings → Privacy & Security),
  plug it in and run `npm run ios:device`.
- **Android over USB:** enable Developer options + USB debugging on the phone, plug it in, `npm run android:device`.
- **Without a local toolchain (cloud):** after `npx eas-cli@latest init`:
  - Android: `npm run build:dev -- --platform android` → open the link/QR on the phone to install the APK.
  - iPhone (paid Apple Developer account): register the device with `npx eas-cli@latest device:create`, then
    `npm run build:dev -- --platform ios`.
  - iOS Simulator build from the cloud: `npm run build:dev:sim` (reuses a previous build when native code hasn't
    changed).

Once a development build is installed, day-to-day you only need `npm start` and to open the app.

## The daily loop

- `npm start` (or `npm run ios` / `npm run android`), edit code → Fast Refresh updates instantly.
- Dev menu: shake the device, or ⌘D (iOS Simulator) / ⌘M (Android emulator). Press `j` in the terminal for
  the React Native DevTools debugger.
- `npm run check` before committing (CI runs the same).
- Added a native package or changed `app.json` plugins/permissions? `npm run native:clean && npm run ios`.

## Troubleshooting

| Symptom                                                                          | Fix                                                                                                                                                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Expo Go says the project is incompatible                                         | Update Expo Go from the store (it only supports the latest SDK).                                                                                                               |
| "Cannot find native module …" / "… doesn't exist in Expo Go"                     | That library needs a development build (Options B–D).                                                                                                                          |
| Changes to `app.json` / native packages don't show up                            | `npm run native:clean` then rebuild (`npm run ios` / `android`).                                                                                                               |
| Strange bundler errors after switching branches                                  | `npm start -- --clear`                                                                                                                                                         |
| Phone can't connect to the bundler                                               | Same Wi-Fi? Otherwise `-- --tunnel`.                                                                                                                                           |
| iOS build fails on signing                                                       | Open Xcode → Settings → Accounts, add your Apple ID, retry.                                                                                                                    |
| `adb devices` shows a phantom offline `emulator-55xx`; Maestro finds "0 devices" | Another app listens on adb's emulator ports (e.g. Native Instruments NTKDaemon on 5563). Add `export ADB_LOCAL_TRANSPORT_MAX_PORT=5561` to `~/.zshrc`, then `adb kill-server`. |
| Something else                                                                   | `npm run doctor` and `npm run doctor:expo`.                                                                                                                                    |
