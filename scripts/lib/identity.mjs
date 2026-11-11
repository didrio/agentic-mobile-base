/**
 * Shared helpers for giving a copy of this base its own identity (name, IDs, scheme).
 * Used by scripts/new-app.mjs (in place) and scripts/create-app.mjs (copy to a new folder).
 *
 * Two modes:
 * - fresh: a copy that is still the base (its TICKETS.md is the base's own backlog). It becomes a new app:
 *   new identity, version 1.0.0, no EAS link, a fresh TICKETS.md and an app README intro.
 * - rename: an existing app. Only the identity fields you pass change; the backlog, version and EAS link stay.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';

// Java keywords can't be used as Android package segments.
const JAVA_KEYWORDS = new Set(
  'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null'.split(
    ' ',
  ),
);

/** First line of the base's own TICKETS.md; apps get `# Tickets — <App name>` from the template. */
const BASE_TICKETS_TITLE = '# Tickets — Base';

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
      prefix = readJson(join(root, 'package.json')).config?.bundleIdPrefix;
    } catch {
      // ignore
    }
  }
  return `${prefix || 'com.example'}.${slug.replace(/-/g, '')}`;
}

/**
 * True while `root` is still the base (or a plain clone of it): TICKETS.md is missing or is the base's own
 * backlog, so the backlog, EAS link and version belong to the base and must be replaced. False in an app.
 */
export function isFreshCopyOfBase(root) {
  const tickets = join(root, 'TICKETS.md');
  return !existsSync(tickets) || readFileSync(tickets, 'utf8').startsWith(BASE_TICKETS_TITLE);
}

/**
 * Resolves name / slug / bundle ID from CLI values. Fresh copies prompt for anything missing when attached to
 * a terminal; renames never prompt and keep the current value of anything not passed. Throws with a helpful
 * message otherwise.
 */
export async function resolveIdentity(root, { name, slug, id }, { fresh = true } = {}) {
  if (!fresh) return resolveRename(root, { name, slug, id });

  const interactive = process.stdin.isTTY && process.stdout.isTTY;
  const rl = interactive ? createInterface({ input: process.stdin, output: process.stdout }) : null;
  try {
    if (!name) {
      if (!rl) throw new Error('Missing --name "My App"');
      name = (await rl.question('App name (shown under the icon): ')).trim();
      if (!name) throw new Error('An app name is required.');
    }
    slug ||= slugify(name);
    if (!id) {
      const suggestion = defaultBundleId(root, slug);
      if (rl) {
        id = (await rl.question(`Bundle ID / package name [${suggestion}]: `)).trim() || suggestion;
      } else {
        id = suggestion;
      }
    }
    return validated({ name, slug, id });
  } finally {
    rl?.close();
  }
}

function resolveRename(root, values) {
  const { expo } = readJson(join(root, 'app.json'));
  const name = values.name || expo.name;
  const slug = values.slug || expo.slug;
  const id = values.id || expo.ios?.bundleIdentifier;
  if (name === expo.name && slug === expo.slug && id === expo.ios?.bundleIdentifier) {
    throw new Error(
      `Nothing to change: this app is already ${expo.name} (${id}). Pass --name, --id and/or --slug.`,
    );
  }
  if (expo.extra?.eas?.projectId && slug !== expo.slug) {
    throw new Error(
      `The slug "${expo.slug}" is tied to this app's EAS project, so it can't change here. ` +
        'Rename without --slug (the display name and bundle ID can still change).',
    );
  }
  return validated({ name, slug, id });
}

function validated({ name, slug, id }) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error(`Invalid slug "${slug}" (use a-z, 0-9, -)`);
  }
  const error = bundleIdError(id);
  if (error) throw new Error(`Invalid bundle ID "${id}": ${error}`);
  return { name, slug, id, scheme: slug };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** The README intro an app starts with, replacing the base-only blocks of the base's README. */
function appReadmeIntro(name) {
  return [
    `_What ${name} is and who it's for: written during T1._`,
    '',
    'Created from the base template; `npm run sync-base` pulls in later base improvements (see',
    '[docs/new-app-checklist.md](docs/new-app-checklist.md)).',
  ].join('\n');
}

/**
 * Writes the identity into app.json / package.json / README. Fresh copies also get version 1.0.0, lose the
 * base's EAS link, and start a new TICKETS.md and README intro.
 */
export function applyIdentity(root, { name, slug, id, scheme }, { fresh = true } = {}) {
  const appJsonPath = join(root, 'app.json');
  const appJson = readJson(appJsonPath);
  const expo = appJson.expo;
  expo.name = name;
  expo.slug = slug;
  expo.scheme = scheme;
  expo.ios = { ...expo.ios, bundleIdentifier: id };
  expo.android = { ...expo.android, package: id };
  if (fresh) {
    expo.version = '1.0.0';
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
  }
  writeJson(appJsonPath, appJson);

  const pkgPath = join(root, 'package.json');
  const pkg = readJson(pkgPath);
  pkg.name = slug;
  if (fresh) pkg.version = '1.0.0';
  writeJson(pkgPath, pkg);

  const lockPath = join(root, 'package-lock.json');
  if (existsSync(lockPath)) {
    const lock = readJson(lockPath);
    lock.name = slug;
    if (lock.packages?.['']) lock.packages[''].name = slug;
    if (fresh) {
      lock.version = '1.0.0';
      if (lock.packages?.['']) lock.packages[''].version = '1.0.0';
    }
    writeJson(lockPath, lock);
  }

  const readmePath = join(root, 'README.md');
  if (existsSync(readmePath)) {
    let readme = readFileSync(readmePath, 'utf8').replace(/^# .*$/m, `# ${name}`);
    if (fresh) {
      // The first base-only block (the intro) becomes the app's intro; the others are removed.
      let first = true;
      readme = readme.replace(/<!-- base-only:start -->[\s\S]*?<!-- base-only:end -->\n*/g, () => {
        const replacement = first ? `${appReadmeIntro(name)}\n\n` : '';
        first = false;
        return replacement;
      });
    }
    writeFileSync(readmePath, readme);
  }

  const ticketsPath = join(root, 'TICKETS.md');
  if (fresh) {
    // A new app starts its own backlog (the base's TICKETS.md is about the base itself).
    const ticketsTemplate = join(root, 'scripts/templates/TICKETS.md');
    if (existsSync(ticketsTemplate)) {
      const today = new Date().toISOString().slice(0, 10);
      const tickets = readFileSync(ticketsTemplate, 'utf8')
        .replaceAll('{{APP_NAME}}', name)
        .replaceAll('{{DATE}}', today);
      writeFileSync(ticketsPath, tickets);
    }
  } else if (existsSync(ticketsPath)) {
    writeFileSync(
      ticketsPath,
      readFileSync(ticketsPath, 'utf8').replace(/^# Tickets — .*$/m, `# Tickets — ${name}`),
    );
  }
}

function gitOutput(root, args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

/** What to do after a fresh copy: GitHub repo, open in Claude Code, /start T1, and what the human does. */
export function printNextSteps({ name, id, slug }, { root, cdPath } = {}) {
  const origin = root ? gitOutput(root, ['remote', 'get-url', 'origin']) : null;
  const steps = [];
  if (!origin) {
    // create-app prints this from the base folder, so the command starts by moving into the app.
    const cd =
      cdPath && cdPath !== '.' ? `cd ${/\s/.test(cdPath) ? `"${cdPath}"` : cdPath} && ` : '';
    steps.push(
      'Recommended: a private GitHub repo (CI + backup; /wrap pushes every session once it exists):\n' +
        `     ${cd}gh repo create ${slug} --private --source . --remote origin && git push -u origin main`,
    );
  }
  steps.push(
    `Open ${cdPath ?? 'this folder'} in your editor with Claude Code`,
    'Model: Opus · Effort: high · Plan mode: on',
    '/start T1 — Shape the app (describe your idea; the agent plans it and writes the next tickets)',
  );

  const lines = ['', `✓ ${name} (${id}) is ready.`, ''];
  if (origin) {
    lines.push(
      `! This checkout pushes to ${origin}. If that is the base's repository, run`,
      '    git remote rename origin base && git branch --unset-upstream',
      "  so /wrap doesn't push the app into the base (then `npm run sync-base` uses it as the base).",
      '',
    );
  }
  lines.push(
    'Next steps:',
    ...steps.map((step, index) => `  ${index + 1}. ${step}`),
    '',
    "You'll be needed for: the app idea, icon/splash artwork, and the Apple login on the first iOS build.",
    'Who does what, and the full checklist: docs/new-app-checklist.md',
    '',
  );
  console.log(lines.join('\n'));
}
