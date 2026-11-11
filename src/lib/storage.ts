/**
 * Small, synchronous key-value storage for preferences and lightweight app state.
 *
 * Backed by `expo-sqlite/kv-store` (works in Expo Go and dev builds, persists across launches).
 *
 * What goes where:
 * - Preferences, flags, small cached JSON  → `storage` (this file) / `zustandStorage`
 * - Secrets (auth tokens, API keys)        → `expo-secure-store` (Keychain / Keystore)
 * - Structured or large data, queries      → `expo-sqlite` database (see the expo-sqlite skill)
 */
import { Storage } from 'expo-sqlite/kv-store';
import type { z } from 'zod';
import type { StateStorage } from 'zustand/middleware';

export const storage = {
  getString(key: string): string | null {
    return Storage.getItemSync(key);
  },
  setString(key: string, value: string): void {
    Storage.setItemSync(key, value);
  },
  /** Reads JSON and validates it; returns `null` if missing, unparsable or invalid. */
  getJSON<T>(key: string, schema: z.ZodType<T>): T | null {
    const raw = Storage.getItemSync(key);
    if (raw == null) return null;
    try {
      const result = schema.safeParse(JSON.parse(raw));
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  },
  setJSON(key: string, value: unknown): void {
    Storage.setItemSync(key, JSON.stringify(value));
  },
  remove(key: string): void {
    Storage.removeItemSync(key);
  },
  clearAll(): void {
    Storage.clearSync();
  },
};

/** Adapter for zustand's `persist` middleware: `createJSONStorage(() => zustandStorage)`. */
export const zustandStorage: StateStorage = {
  getItem: (name) => Storage.getItemSync(name),
  setItem: (name, value) => Storage.setItemSync(name, value),
  removeItem: (name) => {
    Storage.removeItemSync(name);
  },
};
