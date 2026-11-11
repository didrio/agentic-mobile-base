#!/usr/bin/env node
/**
 * Checks this Mac for everything needed to run the app on each target, and says what's missing.
 *
 *   npm run doctor          # human-readable report
 *   npm run doctor -- --json
 *
 * Exit code is 0 as long as the minimum (Node) is present: missing simulators are reported, not
 * fatal, because you can always run on a real phone with Expo Go.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const asJson = process.argv.includes('--json');

function run(cmd, args = []) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function which(cmd) {
  return run('/usr/bin/which', [cmd]);
}

const androidHome =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (existsSync(join(homedir(), 'Library/Android/sdk'))
    ? join(homedir(), 'Library/Android/sdk')
    : null);

function androidTool(relPath, name) {
  if (androidHome && existsSync(join(androidHome, relPath))) return join(androidHome, relPath);
  return which(name);
}

const checks = [];
function check(id, label, ok, detail, fix, { required = false } = {}) {
  checks.push({ id, label, ok: Boolean(ok), detail: detail ?? '', fix: ok ? '' : fix, required });
}

// --- Core -----------------------------------------------------------------------------------
const [major, minor] = process.versions.node.split('.').map(Number);
const nodeOk = major > 22 || (major === 22 && minor >= 13);
check(
  'node',
  'Node.js ≥ 22.13',
  nodeOk,
  `v${process.versions.node}`,
  'brew install node@24 (or use nvm: nvm install)',
  {
    required: true,
  },
);
check(
  'deps',
  'npm dependencies installed',
  existsSync('node_modules/expo/package.json'),
  '',
  'npm install',
  { required: true },
);
const watchman = run('watchman', ['--version']);
check('watchman', 'Watchman (faster file watching)', watchman, watchman, 'brew install watchman');

// --- iOS --------------------------------------------------------------------------------------
const devDir = run('xcode-select', ['-p']);
const xcodeVersion = run('xcodebuild', ['-version'])?.split('\n')[0];
check(
  'xcode',
  'Xcode (iOS builds + Simulator)',
  xcodeVersion,
  xcodeVersion ?? (devDir ? `active dir: ${devDir}` : ''),
  'Install Xcode from the Mac App Store, open it once, then: sudo xcode-select -s /Applications/Xcode.app',
);
const runtimes = xcodeVersion ? run('xcrun', ['simctl', 'list', 'runtimes']) : null;
const iosRuntime = runtimes?.split('\n').find((l) => l.startsWith('iOS'));
check(
  'ios-sim',
  'iOS Simulator runtime',
  iosRuntime,
  iosRuntime?.replace(/ \(.*$/, ''),
  'Xcode → Settings → Components → install an iOS Simulator runtime (or: xcodebuild -downloadPlatform iOS)',
);
const pod = run('pod', ['--version']);
check('cocoapods', 'CocoaPods', pod, pod, 'brew install cocoapods');

// --- Android ----------------------------------------------------------------------------------
check(
  'android-sdk',
  'Android SDK',
  androidHome && existsSync(androidHome),
  androidHome ?? '',
  'bash scripts/setup-mac.sh android   (or install Android Studio and run its setup wizard)',
);
const javaHome = run('/usr/libexec/java_home', ['-v', '17']);
check('jdk', 'JDK 17 (Android builds)', javaHome, javaHome ?? '', 'brew install --cask zulu@17');
const adb = androidTool('platform-tools/adb', 'adb');
check('adb', 'adb (platform-tools)', adb, adb ?? '', 'bash scripts/setup-mac.sh android');
const emulator = androidTool('emulator/emulator', 'emulator');
const avds = emulator ? run(emulator, ['-list-avds'])?.split('\n').filter(Boolean) : [];
check(
  'avd',
  'Android emulator + virtual device',
  emulator && avds?.length,
  avds?.length ? avds.join(', ') : '',
  'bash scripts/setup-mac.sh android   (creates a Pixel emulator)',
);

// --- Testing / delivery ---------------------------------------------------------------------
const maestro =
  which('maestro') ??
  (existsSync(join(homedir(), '.maestro/bin/maestro'))
    ? join(homedir(), '.maestro/bin/maestro')
    : null);
check('maestro', 'Maestro (E2E tests)', maestro, maestro ?? '', 'bash scripts/setup-mac.sh tools');

let easLinked = false;
try {
  easLinked = Boolean(JSON.parse(readFileSync('app.json', 'utf8')).expo?.extra?.eas?.projectId);
} catch {
  // ignore
}
check(
  'eas',
  'EAS project linked (cloud builds, store submit, OTA updates)',
  easLinked,
  easLinked ? 'extra.eas.projectId set' : '',
  'npx eas-cli@latest login && npx eas-cli@latest init',
);

// --- Report -----------------------------------------------------------------------------------
const has = (id) => checks.find((c) => c.id === id)?.ok;
const targets = [
  { label: 'Real phone via Expo Go (npm run start:go)', ok: has('node') && has('deps') },
  { label: 'iOS Simulator (npm run ios)', ok: has('xcode') && has('ios-sim') },
  { label: 'Real iPhone dev build (npm run ios:device)', ok: has('xcode') },
  {
    label: 'Android Emulator (npm run android)',
    ok: has('android-sdk') && has('jdk') && has('avd'),
  },
  {
    label: 'Real Android dev build (npm run android:device)',
    ok: has('android-sdk') && has('jdk') && has('adb'),
  },
  { label: 'Cloud builds & store delivery (npm run build:*, release)', ok: has('eas') },
  { label: 'E2E tests (npm run e2e)', ok: has('maestro') },
];

if (asJson) {
  console.log(JSON.stringify({ checks, targets }, null, 2));
} else {
  const green = (s) => `\x1b[32m${s}\x1b[0m`;
  const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
  const red = (s) => `\x1b[31m${s}\x1b[0m`;
  const dim = (s) => `\x1b[2m${s}\x1b[0m`;

  console.log('\nTooling\n');
  for (const c of checks) {
    const mark = c.ok ? green('✓') : c.required ? red('✗') : yellow('○');
    console.log(`  ${mark} ${c.label}${c.detail ? dim(`  ${c.detail}`) : ''}`);
    if (!c.ok) console.log(`      ${dim('→')} ${c.fix}`);
  }
  console.log('\nWhat you can run right now\n');
  for (const t of targets) console.log(`  ${t.ok ? green('✓') : yellow('○')} ${t.label}`);
  console.log(
    dim(
      '\nMissing pieces are optional — install what you need. `bash scripts/setup-mac.sh` installs everything except Xcode.\n',
    ),
  );
}

process.exit(checks.some((c) => c.required && !c.ok) ? 1 : 0);
