/**
 * Global test setup. Mocks here replace native modules that don't exist in Jest.
 * Prefer mocking at this boundary (native modules, network) over mocking our own code.
 */

// In-memory replacement for the SQLite-backed key-value store used by `@/lib/storage`.
jest.mock('expo-sqlite/kv-store', () => {
  const data = new Map<string, string>();
  const Storage = {
    getItemSync: (key: string) => data.get(key) ?? null,
    setItemSync: (key: string, value: string | ((prev: string | null) => string)) => {
      data.set(key, typeof value === 'function' ? value(data.get(key) ?? null) : value);
    },
    removeItemSync: (key: string) => data.delete(key),
    getAllKeysSync: () => [...data.keys()],
    clearSync: () => {
      data.clear();
      return true;
    },
  };
  return { __esModule: true, Storage, AsyncStorage: Storage, default: Storage };
});

// Haptics are fire-and-forget side effects; make them no-ops in tests.
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
