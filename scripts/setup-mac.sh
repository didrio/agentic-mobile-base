#!/usr/bin/env bash
# Installs the native toolchain for running the app on simulators/emulators and real devices.
# Safe to re-run: every step skips what's already installed.
#
#   bash scripts/setup-mac.sh            # everything below
#   bash scripts/setup-mac.sh ios        # Watchman + CocoaPods (Xcode itself comes from the App Store)
#   bash scripts/setup-mac.sh android    # JDK 17 + Android SDK (headless, no Android Studio needed) + emulator
#   bash scripts/setup-mac.sh tools      # Watchman + Maestro (E2E)
#
# Requires Homebrew (https://brew.sh). Prints the shell config it needs at the end.
set -euo pipefail

ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
ANDROID_API="${ANDROID_API:-36}" # system image API level for the emulator
AVD_NAME="${AVD_NAME:-Pixel_API_${ANDROID_API}}"

# compileSdk / build-tools: whatever this project's React Native version asks for (fallbacks otherwise).
RN_VERSIONS="node_modules/react-native/gradle/libs.versions.toml"
toml_value() { [ -f "$RN_VERSIONS" ] && sed -n "s/^$1 = \"\(.*\)\"/\1/p" "$RN_VERSIONS" | head -1; }
ANDROID_COMPILE_SDK="${ANDROID_COMPILE_SDK:-$(toml_value compileSdk)}"
ANDROID_COMPILE_SDK="${ANDROID_COMPILE_SDK:-37}"
ANDROID_BUILD_TOOLS="${ANDROID_BUILD_TOOLS:-$(toml_value buildTools)}"
ANDROID_BUILD_TOOLS="${ANDROID_BUILD_TOOLS:-37.0.0}"

step() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }

if ! have brew; then
  echo "Homebrew is required: https://brew.sh" >&2
  exit 1
fi

brew_install() { brew list "$1" >/dev/null 2>&1 || brew install "$@"; }
cask_install() { brew list --cask "$1" >/dev/null 2>&1 || brew install --cask "$1"; }

setup_tools() {
  step "Watchman"
  brew_install watchman
  step "Maestro (E2E testing)"
  if ! have maestro && [ ! -x "$HOME/.maestro/bin/maestro" ]; then
    brew tap mobile-dev-inc/tap
    brew_install mobile-dev-inc/tap/maestro
  fi
}

setup_ios() {
  step "Watchman + CocoaPods"
  brew_install watchman
  brew_install cocoapods
  if ! xcodebuild -version >/dev/null 2>&1; then
    cat <<'EOF'

  Xcode is not installed (or not selected). It must come from the Mac App Store:
    1. Install "Xcode" from the App Store and open it once (accept the license, install the iOS platform).
    2. sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
    3. npm run doctor
EOF
  fi
}

setup_android() {
  step "JDK 17 (Azul Zulu)"
  cask_install zulu@17
  export JAVA_HOME="$(/usr/libexec/java_home -v 17)"

  step "Android command-line tools"
  # Homebrew's copy only bootstraps the SDK: its avdmanager is tied to Homebrew's own SDK folder, so we also
  # install "cmdline-tools;latest" into $ANDROID_HOME (the standard layout) and use that avdmanager below.
  cask_install android-commandlinetools
  local sdkmanager avdmanager
  sdkmanager="$(brew --prefix)/share/android-commandlinetools/cmdline-tools/latest/bin/sdkmanager"
  avdmanager="$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager"

  local arch="arm64-v8a"
  [ "$(uname -m)" = "x86_64" ] && arch="x86_64"
  local image="system-images;android-${ANDROID_API};google_apis_playstore;${arch}"

  step "Android SDK packages → $ANDROID_HOME"
  echo "(sdkmanager prints deprecation warnings in favor of the new 'android' CLI — expected, safe to ignore)"
  mkdir -p "$ANDROID_HOME"
  yes | "$sdkmanager" --sdk_root="$ANDROID_HOME" --licenses >/dev/null 2>&1 || true

  # Package names change over time (API 37+ platforms are "android-37.0", "android-37.1"…), so resolve each
  # wanted package against what the SDK repository actually offers.
  local available
  available="$("$sdkmanager" --sdk_root="$ANDROID_HOME" --list 2>/dev/null | awk '{print $1}' | sort -u)"
  pick() {
    local candidate
    for candidate in "$@"; do
      if grep -qxF "$candidate" <<<"$available"; then
        echo "$candidate"
        return
      fi
    done
  }
  local platform build_tools packages=("platform-tools" "emulator" "cmdline-tools;latest")
  platform="$(pick "platforms;android-${ANDROID_COMPILE_SDK}" "platforms;android-${ANDROID_COMPILE_SDK}.0")"
  build_tools="$(pick "build-tools;${ANDROID_BUILD_TOOLS}")"
  if [ -z "$(pick "$image")" ]; then
    echo "System image $image is not available. Pick another with ANDROID_API=<level> (see: sdkmanager --list)." >&2
    exit 1
  fi
  packages+=("$image")
  # Missing platform/build-tools aren't fatal: Gradle downloads what it needs on the first Android build.
  if [ -n "$platform" ]; then packages+=("$platform"); else echo "Note: no platform package for SDK ${ANDROID_COMPILE_SDK}; Gradle will fetch it."; fi
  if [ -n "$build_tools" ]; then packages+=("$build_tools"); else echo "Note: build-tools ${ANDROID_BUILD_TOOLS} not listed; Gradle will fetch it."; fi

  echo "Installing: ${packages[*]}"
  "$sdkmanager" --sdk_root="$ANDROID_HOME" "${packages[@]}"

  step "Emulator: $AVD_NAME"
  local emulator="$ANDROID_HOME/emulator/emulator"
  if "$emulator" -list-avds | grep -qx "$AVD_NAME"; then
    echo "already exists"
  else
    # Newest Pixel phone profile this avdmanager knows about.
    local profiles device=""
    profiles="$("$avdmanager" list device -c 2>/dev/null)"
    for candidate in pixel_10 pixel_9 pixel_8 pixel_7; do
      if grep -qx "$candidate" <<<"$profiles"; then
        device="$candidate"
        break
      fi
    done
    echo "no" | "$avdmanager" create avd --name "$AVD_NAME" --package "$image" ${device:+--device "$device"}
    if ! "$emulator" -list-avds | grep -qx "$AVD_NAME"; then
      echo "Failed to create the emulator $AVD_NAME. Create one in Android Studio's Device Manager instead." >&2
      exit 1
    fi
    echo "created ($device)"
  fi
}

target="${1:-all}"
case "$target" in
  ios) setup_ios ;;
  android) setup_android ;;
  tools) setup_tools ;;
  all) setup_tools; setup_ios; setup_android ;;
  *) echo "Unknown target: $target (use ios | android | tools | all)" >&2; exit 1 ;;
esac

cat <<EOF

$(printf '\033[1m')Done.$(printf '\033[0m') If you haven't already, add this to ~/.zshrc and open a new terminal:

  export JAVA_HOME=\$(/usr/libexec/java_home -v 17 2>/dev/null)
  export ANDROID_HOME="$ANDROID_HOME"
  export PATH="\$PATH:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/emulator:\$HOME/.maestro/bin"

Then run: npm run doctor
EOF
