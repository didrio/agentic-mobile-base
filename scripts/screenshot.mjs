#!/usr/bin/env node
/**
 * Captures the screen of the running iOS Simulator or Android emulator/device and prints the
 * absolute path of the PNG. Built for coding agents: run it, then open the image to *see* the app.
 *
 *   npm run screenshot                 # auto-detect (booted iOS Simulator first, then Android)
 *   npm run screenshot -- ios [name]
 *   npm run screenshot -- android [name]   # ANDROID_SERIAL=… to pick a specific Android device
 *
 * Files go to .artifacts/screenshots/ (git-ignored).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { adb, androidSerial, bootedIosSimulator } from './lib/devices.mjs';

const [platformArg, nameArg] = process.argv.slice(2);

let platform = platformArg;
if (!platform) {
  if (bootedIosSimulator()) platform = 'ios';
  else if (androidSerial()) platform = 'android';
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
    const serial = androidSerial();
    if (!serial) throw new Error('no online Android device (check `adb devices`)');
    const png = execFileSync(adb, ['-s', serial, 'exec-out', 'screencap', '-p'], {
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
