#!/usr/bin/env node
/**
 * Creates a brand-new app from this base in another folder: clones the base (committed state, with its
 * history), sets the new identity, commits it and installs dependencies. The base stays reachable as the
 * `base` remote, so `npm run sync-base` in the app can merge later base improvements.
 *
 *   npm run create-app -- ../habit-tracker --name "Habit Tracker" --id com.yourname.habittracker
 *   npm run create-app -- ../habit-tracker          # prompts for name / ID
 *
 * Options: --name, --id, --slug, --no-install
 * The default ID is `config.bundleIdPrefix` (package.json) + the slug; change the prefix there and commit it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { applyIdentity, printNextSteps, resolveIdentity, slugify } from './lib/identity.mjs';

const BASE_BRANCH = 'main';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    name: { type: 'string' },
    id: { type: 'string' },
    slug: { type: 'string' },
    'no-install': { type: 'boolean', default: false },
  },
});

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

let source;
try {
  source = git(['rev-parse', '--show-toplevel'], process.cwd());
} catch {
  fail('Run this from inside the base repository (a git checkout).');
}

const targetArg = positionals[0];
if (!targetArg)
  fail('Usage: npm run create-app -- <folder> [--name "My App"] [--id com.you.myapp]');
const target = resolve(process.cwd(), targetArg);

if (existsSync(target) && readdirSync(target).length > 0)
  fail(`${target} already exists and is not empty.`);

// Which base the app starts from: the release tag (e.g. v1.0.0, v1.0.0-3-gabc1234) or the commit.
let baseVersion;
try {
  baseVersion = git(['describe', '--tags', '--always', `refs/heads/${BASE_BRANCH}`], source);
} catch {
  fail(`The base has no "${BASE_BRANCH}" branch to create the app from.`);
}

if (git(['status', '--porcelain'], source)) {
  console.warn(
    `! The base has uncommitted changes. They are NOT included (the app is cloned from ${BASE_BRANCH} @ ${baseVersion}).\n` +
      '  Commit them in the base and run `npm run sync-base` in the app to bring them over later.',
  );
}

let identity;
try {
  identity = await resolveIdentity(
    source,
    { ...values, slug: values.slug ?? (values.name ? undefined : slugify(basename(target))) },
    { fresh: true },
  );
} catch (error) {
  fail(error.message);
}

const run = (cmd, args) => execFileSync(cmd, args, { cwd: target, stdio: 'inherit' });

console.log(`Cloning the base (${BASE_BRANCH} @ ${baseVersion}) → ${target}`);
execFileSync(
  'git',
  ['clone', '--quiet', '--origin', 'base', '--branch', BASE_BRANCH, source, target],
  { stdio: 'inherit' },
);
// `git pull` must not merge the base behind sync-base's back; the app's own `origin` comes later.
run('git', ['branch', '--quiet', '--unset-upstream']);

applyIdentity(target, identity, { fresh: true });

run('git', ['add', '-A']);
try {
  execFileSync(
    'git',
    ['commit', '--quiet', '-m', `Create ${identity.name} from base (${baseVersion})`],
    {
      cwd: target,
      stdio: 'ignore',
    },
  );
  console.log('✓ Committed the new identity on top of the base history');
} catch {
  console.log('✓ Identity applied (files staged; commit when ready)');
}

if (!values['no-install']) {
  console.log('Installing dependencies…');
  run('npm', ['ci', '--no-audit', '--no-fund']);
}

const relativeTarget = relative(process.cwd(), target);
printNextSteps(identity, {
  root: target,
  cdPath: relativeTarget.startsWith('../..') ? target : relativeTarget || '.',
});
