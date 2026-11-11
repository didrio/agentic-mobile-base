/**
 * Finding the simulator / emulator / device to talk to. Shared by scripts/screenshot.mjs and scripts/e2e.mjs.
 */
import { execFileSync } from 'node:child_process';

function tryRun(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

export const adb = process.env.ANDROID_HOME
  ? `${process.env.ANDROID_HOME}/platform-tools/adb`
  : 'adb';

/** UDID of the booted iOS Simulator, or null. */
export function bootedIosSimulator() {
  const match = tryRun('xcrun', ['simctl', 'list', 'devices', 'booted']).match(
    /\(([0-9A-F-]{36})\) \(Booted\)/,
  );
  return match?.[1] ?? null;
}

/**
 * Serials adb lists as "offline". A phantom `emulator-55xx` that never comes online is usually another app
 * listening on a port in adb's emulator scan range (5555–5585), e.g. Native Instruments' NTKDaemon on 5563.
 * Maestro then reports "0 devices connected".
 */
export function offlineAndroidEntries() {
  return tryRun(adb, ['devices'])
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === 'offline')
    .map(([serial]) => serial);
}

/**
 * Serial of the Android device to use: $ANDROID_SERIAL, else the first online emulator, else the first online
 * device. (`adb devices` can list stale "offline" entries, and a USB phone may sit next to an emulator.)
 */
export function androidSerial() {
  if (process.env.ANDROID_SERIAL) return process.env.ANDROID_SERIAL;
  const online = tryRun(adb, ['devices'])
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === 'device')
    .map(([serial]) => serial);
  return online.find((serial) => serial.startsWith('emulator-')) ?? online[0] ?? null;
}
