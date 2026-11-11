/**
 * Facts about the running binary: which variant, version and runtime it is.
 * Shown in Settings → About, and handy for bug reports and debugging update issues.
 */
import * as Application from 'expo-application';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Updates from 'expo-updates';

export const APP_VARIANTS = ['development', 'preview', 'production'] as const;
export type AppVariant = (typeof APP_VARIANTS)[number];

/** Where the JS is running: Expo Go, a development build, or a release (store/internal) build. */
export type AppRuntime = 'expo-go' | 'development-build' | 'release-build';

function readVariant(): AppVariant {
  const value: unknown = Constants.expoConfig?.extra?.appVariant;
  return APP_VARIANTS.find((v) => v === value) ?? 'production';
}

function readRuntime(): AppRuntime {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return 'expo-go';
  return __DEV__ ? 'development-build' : 'release-build';
}

const runtime = readRuntime();

export const appInfo = {
  name: Constants.expoConfig?.name ?? 'App',
  variant: readVariant(),
  runtime,
  /** Marketing version, e.g. "1.2.0". In Expo Go, the native version would be Expo Go's own. */
  version:
    (runtime === 'expo-go' ? null : Application.nativeApplicationVersion) ??
    Constants.expoConfig?.version ??
    '0.0.0',
  /** Build number (iOS CFBundleVersion / Android versionCode). `null` in Expo Go. */
  buildNumber: runtime === 'expo-go' ? null : Application.nativeBuildVersion,
  /** OTA update info (EAS Update). `updateId` is null when running the embedded bundle. */
  updates: {
    enabled: Updates.isEnabled,
    channel: Updates.channel,
    runtimeVersion: Updates.runtimeVersion,
    updateId: Updates.updateId,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  },
} as const;

export const runtimeLabels: Record<AppRuntime, string> = {
  'expo-go': 'Expo Go',
  'development-build': 'Development build',
  'release-build': 'Release build',
};
