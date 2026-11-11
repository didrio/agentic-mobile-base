#!/usr/bin/env node
/**
 * Gives THIS checkout a new app identity (use after cloning the base / "Use this template").
 *
 *   npm run new-app -- --name "Habit Tracker" --id com.yourname.habittracker
 *   npm run new-app                       # prompts for anything missing
 *
 * Options: --name, --id (iOS bundle ID + Android package), --slug (defaults to the name, kebab-case)
 * To create a separate copy in a new folder instead, use `npm run create-app`.
 */
import { parseArgs } from 'node:util';

import { applyIdentity, printNextSteps, resolveIdentity } from './lib/identity.mjs';

const { values } = parseArgs({
  options: {
    name: { type: 'string' },
    id: { type: 'string' },
    slug: { type: 'string' },
  },
});

try {
  const root = process.cwd();
  const identity = await resolveIdentity(root, values);
  applyIdentity(root, identity);
  printNextSteps(identity);
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exit(1);
}
