/**
 * TanStack Query client — the single place for server-state caching.
 *
 * Use `useQuery` / `useMutation` with functions from a feature's `api.ts`; don't store server
 * data in zustand. See docs/architecture.md → "Data fetching".
 */
import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

// React Native has no window focus events: refetch stale queries when the app returns to the
// foreground instead.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
    handleFocus(status === 'active');
  });
  return () => subscription.remove();
});
