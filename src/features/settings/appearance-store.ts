import { Appearance } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';

export type AppearancePreference = 'system' | 'light' | 'dark';

type AppearanceState = {
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
};

/**
 * The user's light/dark preference, persisted across launches.
 * Reference example of a persisted zustand store — copy this shape for other client state.
 */
export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: 'settings.appearance',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ preference: state.preference }),
    },
  ),
);

function apply(preference: AppearancePreference) {
  // Overrides the color scheme for the whole app (incl. native headers, tab bars and alerts).
  Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
}

/**
 * Applies the saved preference and keeps it applied. Called once from the root layout.
 * Storage is synchronous, so the persisted value is already hydrated at this point and the first
 * frame renders in the right scheme.
 */
export function initAppearance(): () => void {
  apply(useAppearanceStore.getState().preference);
  return useAppearanceStore.subscribe((state, previous) => {
    if (state.preference !== previous.preference) apply(state.preference);
  });
}
