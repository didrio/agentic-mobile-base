/**
 * Typed, validated public environment variables.
 *
 * - Only `EXPO_PUBLIC_*` variables reach the app, and they are inlined into the JS bundle at
 *   build time, so never put secrets in them.
 * - Each variable must be read as a literal `process.env.EXPO_PUBLIC_X` (no destructuring or
 *   dynamic keys) or the bundler won't inline it.
 * - Local values live in `.env` / `.env.local` (see `.env.example`). For EAS cloud builds/updates,
 *   set them with `eas env:create` or in the `env` block of the profile in `eas.json`.
 *
 * To add a variable: add it to `.env.example`, to `schema`, and to the object passed to `parse`.
 */
import { z } from 'zod';

const schema = z.object({
  /** Base URL for the app's backend API. Optional until the app has a backend. */
  EXPO_PUBLIC_API_URL: z.url().optional(),
});

const result = schema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || undefined,
});

if (!result.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
}

export const env = result.data;
