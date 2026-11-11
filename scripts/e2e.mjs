#!/usr/bin/env node
/**
 * Runs the Maestro E2E flows in .maestro/ against the app on a simulator/emulator/device.
 *
 *   npm run e2e                                  # development build (needs `npm start` running)
 *   npm run e2e -- --platform android
 *   npm run e2e -- --variant preview             # a preview/production build, no bundler needed
 *   npm run e2e -- --flow .maestro/smoke.yaml    # a single flow
 *
 * The app ID is derived from app.json + the variant suffix, so flows stay identity-agnostic.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    platform: { type: 'string' },
    variant: { type: 'string', default: 'development' },
    flow: { type: 'string', default: '.maestro' },
  },
});

const suffix = { development: '.dev', preview: '.preview', production: '' }[values.variant];
if (suffix === undefined) {
  console.error(`Unknown --variant "${values.variant}" (development | preview | production)`);
  process.exit(1);
}

const maestro = [join(homedir(), '.maestro/bin/maestro'), 'maestro'].find((bin) => {
  try {
    execFileSync(bin, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
});
if (!maestro) {
  console.error('Maestro is not installed. Run: bash scripts/setup-mac.sh tools');
  process.exit(1);
}

const { expo } = JSON.parse(readFileSync('app.json', 'utf8'));
const platform =
  values.platform ??
  (/\(Booted\)/.test(safe('xcrun', ['simctl', 'list', 'devices', 'booted'])) ? 'ios' : 'android');
const baseId = platform === 'ios' ? expo.ios.bundleIdentifier : expo.android.package;
const appId = `${baseId}${suffix}`;

// Development builds load JS from the local bundler through the dev client's deep link.
let devClientUrl = '';
if (values.variant === 'development') {
  const status = safe('curl', ['-s', '--max-time', '2', 'http://localhost:8081/status']);
  if (!status.includes('packager-status:running')) {
    console.error('The bundler is not running. Start it in another terminal with `npm start`.');
    process.exit(1);
  }
  if (platform === 'android') {
    const adb = process.env.ANDROID_HOME ? `${process.env.ANDROID_HOME}/platform-tools/adb` : 'adb';
    safe(adb, ['reverse', 'tcp:8081', 'tcp:8081']);
  }
  devClientUrl = `exp+${expo.slug}://expo-development-client/?url=${encodeURIComponent('http://localhost:8081')}`;
}

if (!existsSync(values.flow)) {
  console.error(`No flow found at ${values.flow}`);
  process.exit(1);
}

console.log(`Maestro → ${platform} · ${appId}${devClientUrl ? ' · dev client' : ''}\n`);
const result = spawnSync(
  maestro,
  ['test', '-e', `APP_ID=${appId}`, '-e', `DEV_CLIENT_URL=${devClientUrl}`, values.flow],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);

function safe(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}
