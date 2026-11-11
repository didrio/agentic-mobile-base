#!/usr/bin/env node
/**
 * Gives THIS checkout an app identity.
 *
 * - A fresh copy of the base (cloned, "Use this template"): becomes a new app — name, bundle ID, version
 *   1.0.0, no EAS link, a fresh TICKETS.md and README intro.
 *     npm run new-app -- --name "Habit Tracker" --id com.yourname.habittracker
 *     npm run new-app                       # prompts for anything missing
 * - An existing app: renames it. Only what you pass changes; TICKETS.md, the version and the EAS link stay.
 *     npm run new-app -- --name "Habits"    # display name only
 *     npm run new-app -- --id com.yourname.habits
 *
 * Options: --name, --id (iOS bundle ID + Android package), --slug (defaults to the name, kebab-case)
 * To create a separate copy in a new folder instead, use `npm run create-app` (from the base).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import {
  applyIdentity,
  isFreshCopyOfBase,
  printNextSteps,
  resolveIdentity,
} from './lib/identity.mjs';

const { values } = parseArgs({
  options: {
    name: { type: 'string' },
    id: { type: 'string' },
    slug: { type: 'string' },
  },
});

try {
  const root = process.cwd();
  const fresh = isFreshCopyOfBase(root);
  const before = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
  const identity = await resolveIdentity(root, values, { fresh });
  applyIdentity(root, identity, { fresh });

  if (fresh) {
    printNextSteps(identity, { root });
  } else {
    console.log(`✓ Renamed to ${identity.name} (${identity.id}), slug ${identity.slug}.`);
    console.log('  Kept: TICKETS.md (title updated), the version, and the EAS link.');
    if (identity.id !== before.ios?.bundleIdentifier && before.extra?.eas?.projectId) {
      console.log(
        '! New bundle ID: the next iOS build creates a new App ID and provisioning profile, and an app\n' +
          '  already on a store cannot change its ID. Rebuild native: npm run native:clean.',
      );
    }
  }
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exit(1);
}
