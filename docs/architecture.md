# Architecture

How the code is organized and the patterns every feature follows. Short version: **routes are thin, features
own their code, the design system owns the look, `lib/` owns infrastructure.**

```
           ┌──────────────── src/app (Expo Router: URLs, layouts, navigation) ───────────────┐
           │  _layout.tsx → AppProviders → Stack → (tabs) NativeTabs → per-tab Stack → route │
           └────────────────────────────────────┬────────────────────────────────────────────┘
                                                │ re-exports screens
           ┌──────────────── src/features/<feature> (screens, components, hooks, api, stores) ┐
           └──────────┬──────────────────────────────┬───────────────────────────────────────┘
                      │ UI                           │ data
           src/components/ui + src/theme      src/lib (api-client, query-client, storage, env, app-info)
```

Dependencies point downward only: features may import `components/`, `theme/`, `lib/`; never the other way, and
features don't import from each other's internals (share via `components/ui` or `lib/` instead).

## Navigation (Expo Router)

- Every file in `src/app/` is a route; `_layout.tsx` files define navigators. Groups in parentheses (`(tabs)`,
  `(home)`) organize files without affecting the URL. `src/app/(tabs)/(home)/index.tsx` is `/`;
  `src/app/(tabs)/settings/index.tsx` is `/settings`.
- The root is a `Stack` containing the native tab bar. Each tab is its own `Stack`, so screens push within a tab
  and get native headers (large titles on iOS).
- Navigate with `<Link href="/settings">` or `router.push('/items/42')` — both type-checked (typed routes).
- Deep links work automatically via the app's scheme (`base://…`, `base-dev://…` for the dev variant).
- Modals: add `src/app/<name>.tsx` and register it in the root layout with `presentation: 'modal'` (or
  `'formSheet'`).
- Auth-gated apps: use `Stack.Protected guard={isSignedIn}` in a layout to hide routes from signed-out users.

## UI and styling

- `src/theme/tokens.ts` — semantic colors (light + dark), spacing scale, radii, type scale. Change these to
  rebrand.
- `makeStyles((t) => ({…}))` — themed `StyleSheet`, built once per scheme, zero per-render cost. The only styling
  API in the app.
- `src/components/ui/` — primitives: `Text`, `Button`, `Screen`, `Card`, `Icon`, `ListSection`/`ListRow`,
  `SegmentedControl`. Build screens from these; add new primitives when a pattern repeats.
- Light/dark: follows the OS, overridable in Settings (`features/settings/appearance-store.ts` calls
  `Appearance.setColorScheme`, so native headers, tab bars and alerts follow too).
- Native platform UI is available when you want it: `@expo/ui` (SwiftUI / Jetpack Compose components),
  `expo-glass-effect` (Liquid Glass), `expo-symbols` (SF Symbols / Material Symbols).

## State and data

| Kind of state           | Tool                                        | Example                                 |
| ----------------------- | ------------------------------------------- | --------------------------------------- |
| Data from a server      | TanStack Query (`@/lib/query-client`)       | lists, details, mutations               |
| Shared client state     | zustand store in the feature                | appearance preference, onboarding flags |
| Persisted preferences   | zustand `persist` + `zustandStorage`        | see `appearance-store.ts`               |
| Secrets                 | `expo-secure-store`                         | auth tokens                             |
| Structured/offline data | `expo-sqlite` (optionally with Drizzle ORM) | notes, cached records, queues           |
| Component-local state   | `useState` / `useReducer`                   | form inputs, toggles                    |

### Data fetching pattern

```ts
// src/features/todos/api.ts
import { z } from 'zod';
import { api } from '@/lib/api-client';

export const Todo = z.object({ id: z.number(), title: z.string(), completed: z.boolean() });
export type Todo = z.infer<typeof Todo>;

export const getTodos = () => api.get('/todos', z.array(Todo));
export const createTodo = (title: string) => api.post('/todos', Todo, { body: { title } });
```

```tsx
// src/features/todos/todos-screen.tsx
const { data, isPending, error, refetch } = useQuery({ queryKey: ['todos'], queryFn: getTodos });
const queryClient = useQueryClient();
const add = useMutation({
  mutationFn: createTodo,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
});
```

Every response is validated with zod, so a backend change surfaces as a clear `ApiResponseError` instead of an
`undefined is not an object` crash three screens later. Attach auth headers via `createApiClient({ getHeaders })`.

Queries refetch when the app returns to the foreground (configured in `query-client.ts`).

## Configuration and environments

- `app.json`: identity and static native config. `app.config.ts`: derives the `development` / `preview` /
  `production` variants (name, bundle ID, scheme) from `APP_VARIANT`.
- Runtime facts (variant, version, Expo Go vs dev build vs release, OTA update ID): `@/lib/app-info`.
- Public env vars: `EXPO_PUBLIC_*` in `.env` / `.env.local` locally, `eas env:create` (or `eas.json` profile `env`)
  for cloud builds. Read only through `@/lib/env` (zod-validated).

## Errors

- Render errors in any route are caught by the root `ErrorBoundary` (`components/error-screen.tsx`) with a retry
  button. That's the place to hook up a crash reporter (Sentry: `npx expo install @sentry/react-native` + its
  config plugin) when an app needs one.
- Query errors are values (`error` from `useQuery`) — render them, don't throw.

## Testing strategy

| Layer              | Tool                             | What to test                                    |
| ------------------ | -------------------------------- | ----------------------------------------------- |
| Logic              | Jest                             | pure functions, stores, api client              |
| Components/screens | React Native Testing Library v14 | renders, interactions, accessibility roles      |
| User journeys      | Maestro (`.maestro/*.yaml`)      | launch → navigate → assert, on a real simulator |

- Tests live next to the code (`foo-screen.test.tsx`). Query by role/text like a user would.
- Native modules are mocked once in `jest.setup.ts`; prefer that over mocking your own modules.
- RNTL v14: `await render(...)`, `await fireEvent.press(...)`.

## Performance defaults

- New Architecture + Hermes + **React Compiler** (automatic memoization — don't hand-optimize with
  `useMemo`/`useCallback` unless profiling says so).
- Native navigation (native stack + native tabs) and `expo-image` (cached, decoded off the JS thread).
- Animations: Reanimated 4 (runs on the UI thread) — CSS-style transitions/animations or worklets.
- Long lists: `FlatList`, or `@shopify/flash-list` for very long/complex lists.
- Keep heavy work off the JS thread; for CPU-heavy native work write a local Expo module (see `docs/native.md`).
