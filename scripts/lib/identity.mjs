/**
 * Shared helpers for giving a copy of this base its own identity (name, IDs, scheme).
 * Used by scripts/new-app.mjs (rename in place) and scripts/create-app.mjs (copy to a new folder).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';

// Java keywords can't be used as Android package segments.
const JAVA_KEYWORDS = new Set(
  'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null'.split(
    ' ',
  ),
);

export function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Returns an error message, or null if `id` works as both an iOS bundle ID and Android package. */
export function bundleIdError(id) {
  const segments = id.split('.');
  if (segments.length < 2) return 'needs at least two dot-separated parts, e.g. com.yourname.myapp';
  for (const segment of segments) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(segment)) {
      return `"${segment}" must start with a letter and contain only letters, digits or _ (no hyphens)`;
    }
    if (JAVA_KEYWORDS.has(segment)) return `"${segment}" is a reserved word on Android`;
  }
  return null;
}

export function defaultBundleId(root, slug) {
  let prefix = process.env.BUNDLE_ID_PREFIX;
  if (!prefix) {
    try {
      prefix = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).config?.bundleIdPrefix;
    } catch {
      // ignore
    }
  }
  return `${prefix || 'com.example'}.${slug.replace(/-/g, '')}`;
}

/**
 * Resolves name / slug / bundle ID from CLI values, prompting for anything missing when attached
 * to a terminal. Throws with a helpful message otherwise.
 */
export async function resolveIdentity(root, { name, slug, id }) {
  const interactive = process.stdin.isTTY && process.stdout.isTTY;
  const rl = interactive ? createInterface({ input: process.stdin, output: process.stdout }) : null;
  try {
    if (!name) {
      if (!rl) throw new Error('Missing --name "My App"');
      name = (await rl.question('App name (shown under the icon): ')).trim();
      if (!name) throw new Error('An app name is required.');
    }
    slug ||= slugify(name);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug))
      throw new Error(`Invalid slug "${slug}" (use a-z, 0-9, -)`);
    if (!id) {
      const suggestion = defaultBundleId(root, slug);
      if (rl) {
        id = (await rl.question(`Bundle ID / package name [${suggestion}]: `)).trim() || suggestion;
      } else {
        id = suggestion;
      }
    }
    const error = bundleIdError(id);
    if (error) throw new Error(`Invalid bundle ID "${id}": ${error}`);
    return { name, slug, id, scheme: slug };
  } finally {
    rl?.close();
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** Writes the identity into app.json / package.json / README and unlinks the base's EAS project. */
export function applyIdentity(root, { name, slug, id, scheme }) {
  const appJsonPath = join(root, 'app.json');
  const appJson = readJson(appJsonPath);
  const expo = appJson.expo;
  expo.name = name;
  expo.slug = slug;
  expo.scheme = scheme;
  expo.version = '1.0.0';
  expo.ios = { ...expo.ios, bundleIdentifier: id };
  expo.android = { ...expo.android, package: id };
  // A new app gets its own EAS project: drop links that belong to the base.
  delete expo.owner;
  if (expo.extra) {
    delete expo.extra.eas;
    // Derived at config time (app.config.ts / expo-router plugin); EAS CLI sometimes persists them.
    delete expo.extra.appVariant;
    delete expo.extra.router;
    if (Object.keys(expo.extra).length === 0) delete expo.extra;
  }
  if (expo.updates) {
    delete expo.updates.url;
    if (Object.keys(expo.updates).length === 0) delete expo.updates;
  }
  writeJson(appJsonPath, appJson);

  const pkgPath = join(root, 'package.json');
  const pkg = readJson(pkgPath);
  pkg.name = slug;
  pkg.version = '1.0.0';
  writeJson(pkgPath, pkg);

  const lockPath = join(root, 'package-lock.json');
  if (existsSync(lockPath)) {
    const lock = readJson(lockPath);
    lock.name = slug;
    lock.version = '1.0.0';
    if (lock.packages?.['']) {
      lock.packages[''].name = slug;
      lock.packages[''].version = '1.0.0';
    }
    writeJson(lockPath, lock);
  }

  const readmePath = join(root, 'README.md');
  if (existsSync(readmePath)) {
    const readme = readFileSync(readmePath, 'utf8');
    writeFileSync(readmePath, readme.replace(/^# .*$/m, `# ${name}`));
  }

  // A new app starts its own backlog (the base's TICKETS.md is about the base itself).
  const ticketsTemplate = join(root, 'scripts/templates/TICKETS.md');
  if (existsSync(ticketsTemplate)) {
    const today = new Date().toISOString().slice(0, 10);
    const tickets = readFileSync(ticketsTemplate, 'utf8')
      .replaceAll('{{APP_NAME}}', name)
      .replaceAll('{{DATE}}', today);
    writeFileSync(join(root, 'TICKETS.md'), tickets);
  }
}

export function printNextSteps({ name, id }, { cdPath } = {}) {
  const lines = [
    '',
    `✓ ${name} (${id}) is ready.`,
    '',
    'Next steps:',
    `  1. Open ${cdPath ?? 'this folder'} in your editor with Claude Code`,
    '  2. Model: Opus · Effort: high · Plan mode: on',
    '  3. /start T1 — Shape the app (describe your idea; the agent plans it and writes the next tickets)',
    '',
    'Handy along the way: npm run doctor · npm run ios / android · npx eas-cli@latest init (own EAS project)',
    '',
  ];
  console.log(lines.join('\n'));
}
