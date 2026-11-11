#!/usr/bin/env node
/**
 * Captures the screen of the running iOS Simulator or Android emulator/device and prints the
 * absolute path of the PNG. Built for coding agents: run it, then open the image to *see* the app.
 *
 *   npm run screenshot                 # auto-detect (booted iOS Simulator first, then Android)
 *   npm run screenshot -- ios [name]
 *   npm run screenshot -- android [name]
 *
 * Files go to .artifacts/screenshots/ (git-ignored).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [platformArg, nameArg] = process.argv.slice(2);

function tryRun(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

const adb = process.env.ANDROID_HOME ? `${process.env.ANDROID_HOME}/platform-tools/adb` : 'adb';

function iosBooted() {
  return /\(Booted\)/.test(tryRun('xcrun', ['simctl', 'list', 'devices', 'booted']) ?? '');
}

function androidConnected() {
  const out = tryRun(adb, ['devices']) ?? '';
  return out
    .split('\n')
    .slice(1)
    .some((line) => /\tdevice$/.test(line.trim()) || /\sdevice$/.test(line));
}

let platform = platformArg;
if (!platform) {
  if (iosBooted()) platform = 'ios';
  else if (androidConnected()) platform = 'android';
  else {
    console.error(
      'No booted iOS Simulator or connected Android device found. Start one with `npm run ios` / `npm run android`.',
    );
    process.exit(1);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = resolve('.artifacts/screenshots');
mkdirSync(dir, { recursive: true });
const file = resolve(dir, `${platform}-${nameArg ?? stamp}.png`);

try {
  if (platform === 'ios') {
    execFileSync('xcrun', ['simctl', 'io', 'booted', 'screenshot', file], { stdio: 'ignore' });
  } else if (platform === 'android') {
    const png = execFileSync(adb, ['exec-out', 'screencap', '-p'], {
      maxBuffer: 64 * 1024 * 1024,
    });
    writeFileSync(file, png);
  } else {
    console.error(`Unknown platform "${platform}". Use ios or android.`);
    process.exit(1);
  }
} catch (error) {
  console.error(`Screenshot failed on ${platform}: ${error.message}`);
  process.exit(1);
}

console.log(file);
