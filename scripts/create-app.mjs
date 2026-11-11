#!/usr/bin/env node
/**
 * Creates a brand-new app from this base in another folder: copies the repo (tracked files only),
 * sets the new identity, starts a fresh git history and installs dependencies.
 *
 *   npm run create-app -- ../habit-tracker --name "Habit Tracker" --id com.yourname.habittracker
 *   npm run create-app -- ../habit-tracker          # prompts for name / ID
 *
 * Options: --name, --id, --slug, --no-install, --no-git
 * Tip: set your default ID prefix once with `npm pkg set config.bundleIdPrefix=com.yourname`.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { applyIdentity, printNextSteps, resolveIdentity, slugify } from './lib/identity.mjs';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    name: { type: 'string' },
    id: { type: 'string' },
    slug: { type: 'string' },
    'no-install': { type: 'boolean', default: false },
    'no-git': { type: 'boolean', default: false },
  },
});

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const source = process.cwd();
const targetArg = positionals[0];
if (!targetArg)
  fail('Usage: npm run create-app -- <folder> [--name "My App"] [--id com.you.myapp]');
const target = resolve(source, targetArg);

if (existsSync(target) && readdirSync(target).length > 0)
  fail(`${target} already exists and is not empty.`);

let identity;
try {
  identity = await resolveIdentity(source, {
    ...values,
    slug: values.slug ?? (values.name ? undefined : slugify(basename(target))),
  });
} catch (error) {
  fail(error.message);
}

// Copy everything git knows about (tracked + new, minus ignored): no node_modules, ios/, android/…
const files = execFileSync(
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
  {
    cwd: source,
    encoding: 'utf8',
  },
)
  .split('\0')
  .filter((file) => file && existsSync(join(source, file)));

console.log(`Copying ${files.length} files → ${target}`);
for (const file of files) {
  const destination = join(target, file);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(join(source, file), destination);
}

applyIdentity(target, identity);

const run = (cmd, args) => execFileSync(cmd, args, { cwd: target, stdio: 'inherit' });

if (!values['no-git']) {
  run('git', ['init', '--quiet', '--initial-branch=main']);
  run('git', ['add', '-A']);
  try {
    execFileSync('git', ['commit', '--quiet', '-m', `Create ${identity.name} from base`], {
      cwd: target,
      stdio: 'ignore',
    });
    console.log('✓ Initialized git repository with an initial commit');
  } catch {
    console.log('✓ Initialized git repository (files staged; commit when ready)');
  }
}

if (!values['no-install']) {
  console.log('Installing dependencies…');
  run('npm', ['ci', '--no-audit', '--no-fund']);
}

const relativeTarget = relative(process.cwd(), target);
printNextSteps(identity, {
  cdPath: relativeTarget.startsWith('../..') ? target : relativeTarget || '.',
});
