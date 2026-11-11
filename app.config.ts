/**
 * Dynamic app config, layered on top of the static `app.json`.
 *
 * - `app.json` holds the app's identity and static settings. Edit it for name, bundle ID, icons,
 *   plugins, permissions… CLI tools (`eas init`, `eas update:configure`, `npx expo install`)
 *   write there too, which works because this file passes `config` through.
 * - This file only derives per-variant values so dev, preview and production builds can be
 *   installed side by side on one device, each with its own name, bundle ID and URL scheme.
 *
 * The variant comes from the APP_VARIANT env var: the npm scripts set it for local work and
 * eas.json sets it for cloud builds. Unset means `production` (the safe default for `eas update`).
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

const VARIANTS = {
  development: { nameSuffix: ' Dev', idSuffix: '.dev', schemeSuffix: '-dev' },
  preview: { nameSuffix: ' Preview', idSuffix: '.preview', schemeSuffix: '-preview' },
  production: { nameSuffix: '', idSuffix: '', schemeSuffix: '' },
} as const;

type AppVariant = keyof typeof VARIANTS;

function isVariant(value: string): value is AppVariant {
  return Object.hasOwn(VARIANTS, value);
}

function getVariant(): AppVariant {
  const value = process.env.APP_VARIANT || 'production';
  if (!isVariant(value)) {
    throw new Error(
      `Unknown APP_VARIANT "${value}". Expected one of: ${Object.keys(VARIANTS).join(', ')}.`,
    );
  }
  return value;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = getVariant();
  const { nameSuffix, idSuffix, schemeSuffix } = VARIANTS[variant];
  const { name, slug, scheme, ios, android } = config;

  if (!name || !slug || typeof scheme !== 'string' || !ios?.bundleIdentifier || !android?.package) {
    throw new Error(
      'app.json must define expo.name, expo.slug, expo.scheme, expo.ios.bundleIdentifier and expo.android.package.',
    );
  }

  return {
    ...config,
    name: `${name}${nameSuffix}`,
    slug,
    scheme: `${scheme}${schemeSuffix}`,
    ios: { ...ios, bundleIdentifier: `${ios.bundleIdentifier}${idSuffix}` },
    android: { ...android, package: `${android.package}${idSuffix}` },
    extra: { ...config.extra, appVariant: variant },
  };
};
