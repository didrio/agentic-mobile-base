#!/usr/bin/env node
/**
 * Merges later improvements from the base into this app (apps made by `npm run create-app` share the base's
 * git history and have it as the `base` remote). Stops before committing so you can review, resolve
 * conflicts and run the checks first. Agent playbook: .claude/skills/sync-base/SKILL.md
 *
 *   npm run sync-base -- --dry-run          # what would come in (commits + files), changes nothing
 *   npm run sync-base                       # merge base/main, keep app-owned files, don't commit
 *   npm run sync-base -- --base ../base     # add / change the `base` remote first (path or git URL)
 *
 * Options: --dry-run, --ref <branch> (default main), --base <path|url>
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

/** Files that belong to the app, never the base: the app's version is always kept. */
const APP_OWNED = ['TICKETS.md'];
/** Changes to these may need a native rebuild. */
const NATIVE_INPUTS = ['app.json', 'app.config.ts', 'package.json'];

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    ref: { type: 'string', default: 'main' },
    base: { type: 'string' },
  },
});

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

let root;
try {
  root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
} catch {
  fail('Not inside a git repository.');
}

/** Runs git in the repo root; returns trimmed stdout, or null on failure when `allowFail` is set. */
function git(args, { allowFail = false, inherit = false } = {}) {
  try {
    const out = execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    });
    return (out ?? '').trim();
  } catch (error) {
    if (allowFail) return null;
    fail(`git ${args.join(' ')} failed${error.stderr ? `:\n${error.stderr}` : ''}`);
  }
}

const lines = (text) => (text ? text.split('\n').filter(Boolean) : []);

// 1. Preconditions
if (git(['rev-parse', '-q', '--verify', 'MERGE_HEAD'], { allowFail: true }) !== null) {
  fail(
    'A merge is already in progress. Finish it (`git commit`) or undo it (`git merge --abort`).',
  );
}
if (git(['status', '--porcelain'])) {
  fail('The working tree has uncommitted changes. Commit or stash them first.');
}

if (values.base) {
  const url = existsSync(values.base) ? resolve(values.base) : values.base;
  const hasRemote = git(['remote', 'get-url', 'base'], { allowFail: true }) !== null;
  git(['remote', hasRemote ? 'set-url' : 'add', 'base', url]);
  console.log(`✓ base remote → ${url}`);
}
const baseUrl = git(['remote', 'get-url', 'base'], { allowFail: true });
if (baseUrl === null) {
  fail(
    'No `base` remote. Apps made with `npm run create-app` have one; otherwise add it with\n' +
      '  npm run sync-base -- --base <path-to-base-or-git-url>\n' +
      '(Inside the base repository itself there is nothing to sync.)',
  );
}

// 2. Fetch and check that the histories are related
console.log(`Fetching the base (${baseUrl})…`);
git(['fetch', '--no-tags', '--quiet', 'base'], { inherit: true });
const ref = `base/${values.ref}`;
if (git(['rev-parse', '-q', '--verify', `refs/remotes/${ref}`], { allowFail: true }) === null) {
  fail(`The base has no branch "${values.ref}".`);
}
if (git(['merge-base', 'HEAD', ref], { allowFail: true }) === null) {
  fail(
    'This app does not share git history with the base (it was not made with `npm run create-app`).\n' +
      '  See "Keep up with the base" in docs/new-app-checklist.md for the one-time fix.',
  );
}

// 3. What's coming in
const pending = lines(git(['log', '--oneline', '--no-decorate', `HEAD..${ref}`]));
if (pending.length === 0) {
  console.log(`✓ Already up to date with ${ref}.`);
  process.exit(0);
}
const touched = lines(git(['diff', '--name-only', `HEAD...${ref}`]));
console.log(`\n${pending.length} base commit(s) to merge:`);
for (const commit of pending) console.log(`  ${commit}`);

if (values['dry-run']) {
  console.log(`\nFiles the base changed since the last sync:`);
  console.log(` ${git(['diff', '--stat', `HEAD...${ref}`])}`);
  const skipped = touched.filter((file) => APP_OWNED.includes(file));
  if (skipped.length) console.log(`\nAlways kept as the app's version: ${skipped.join(', ')}`);
  console.log('\nDry run: nothing changed. Run `npm run sync-base` to merge.');
  process.exit(0);
}

// 4. Merge without committing
const from = git(['rev-parse', '--short', git(['merge-base', 'HEAD', ref])]);
const to = git(['rev-parse', '--short', ref]);
const merge = spawnSync('git', ['merge', '--no-ff', '--no-commit', ref], {
  cwd: root,
  encoding: 'utf8',
});
if (git(['rev-parse', '-q', '--verify', 'MERGE_HEAD'], { allowFail: true }) === null) {
  fail(`The merge did not start:\n${merge.stdout}${merge.stderr}`);
}
// Our own message for `git commit --no-edit` (git's default lists "# Conflicts", which --no-edit keeps).
writeFileSync(
  resolve(root, git(['rev-parse', '--git-path', 'MERGE_MSG'])),
  `Sync with base (${from}..${to})\n\n${pending.map((commit) => `- ${commit}`).join('\n')}\n`,
);

// 5. App-owned files: always keep the app's version
const kept = [];
for (const file of APP_OWNED) {
  if (!touched.includes(file)) continue;
  if (git(['cat-file', '-e', `HEAD:${file}`], { allowFail: true }) !== null) {
    git(['checkout', 'HEAD', '--', file]);
  } else {
    git(['rm', '-q', '-f', '--ignore-unmatch', '--', file]);
  }
  kept.push(file);
}

// 6. Lockfile conflict: take the base's lockfile and let npm reconcile it with the merged package.json
const conflicted = () => lines(git(['diff', '--name-only', '--diff-filter=U']));
let lockNote = null;
if (conflicted().includes('package-lock.json') && !conflicted().includes('package.json')) {
  git(['checkout', '--theirs', '--', 'package-lock.json']);
  console.log('Regenerating package-lock.json from the merged package.json…');
  const npm = spawnSync('npm', ['install', '--package-lock-only', '--no-audit', '--no-fund'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (npm.status === 0) {
    git(['add', '--', 'package-lock.json']);
    lockNote = 'package-lock.json conflicted: regenerated from the merged package.json';
  } else {
    lockNote =
      'package-lock.json conflicted and `npm install --package-lock-only` failed: fix by hand';
  }
}

// 7. Report
const remaining = conflicted();
console.log(
  `\n${remaining.length ? '!' : '✓'} Merged ${pending.length} base commit(s), not committed yet.`,
);
if (kept.length) console.log(`  Kept the app's version of: ${kept.join(', ')}`);
if (lockNote) console.log(`  ${lockNote}`);
if (remaining.length) {
  console.log(`\nConflicts to resolve (${remaining.length}):`);
  for (const file of remaining) console.log(`  ${file}`);
}

const steps = [];
if (remaining.length)
  steps.push(
    'Resolve the conflicts above (rules: .claude/skills/sync-base/SKILL.md), then `git add` them',
  );
if (touched.some((file) => file === 'package.json' || file === 'package-lock.json'))
  steps.push('Dependencies changed: `npm install`, then `npx expo install --check`');
if (touched.some((file) => NATIVE_INPUTS.includes(file)))
  steps.push(
    'Native inputs may have changed: `npm run native:clean` before the next `npm run ios` / `android`',
  );
steps.push('Review: `git diff --cached` · run `npm run check`');
steps.push('Commit: `git commit --no-edit` (or undo everything: `git merge --abort`)');
console.log('\nNext:');
steps.forEach((step, index) => console.log(`  ${index + 1}. ${step}`));
