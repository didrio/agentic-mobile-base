---
name: add-feature
description: Add a screen, tab, flow or feature to the app following this project's conventions (thin routes in src/app, code in src/features, design-system components, makeStyles, zustand/TanStack Query, colocated tests). Use for any "add a screen / page / tab / feature / form / list" request.
---

# Add a feature

Read `docs/architecture.md` once if you haven't this session. Then:

## 1. Decide where it lives

| Need                              | Do this                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New screen inside an existing tab | `src/app/(tabs)/<tab>/<screen>.tsx` (push navigation inside the tab's Stack)                                                                                       |
| New tab                           | `src/app/(tabs)/<tab>/_layout.tsx` (Stack) + `index.tsx`, add a `NativeTabs.Trigger`                                                                               |
| Modal / sheet over everything     | `src/app/<name>.tsx` + `<Stack.Screen name="<name>" options={{ presentation: 'modal' }} />` in `src/app/_layout.tsx` (or `'formSheet'` with `sheetAllowedDetents`) |
| Dynamic route                     | `src/app/(tabs)/<tab>/[id].tsx`, read with `useLocalSearchParams<{ id: string }>()`                                                                                |

Route files stay thin — just re-export the screen:

```tsx
// src/app/(tabs)/(home)/[id].tsx
export { ItemDetailScreen as default } from '@/features/items/item-detail-screen';
```

Set titles/options in the tab's `_layout.tsx` (`<Stack.Screen name="[id]" options={{ title: 'Item' }} />`)
or from the screen with `<Stack.Screen options={...} />` when they depend on data.
Typed routes are on: `router.push('/items/42')` and `<Link href=...>` are type-checked. The route types
(`.expo/types`) regenerate while the dev server runs — if `tsc` says a new route doesn't exist, start `npm start`
briefly and re-run the typecheck.

## 2. Feature folder

```
src/features/<feature>/
  <feature>-screen.tsx        # screen component (named export)
  <feature>-screen.test.tsx   # at least one render/interaction test
  components/                 # feature-only components (optional)
  api.ts                      # zod schemas + request functions (if it talks to a backend)
  queries.ts                  # useQuery/useMutation hooks wrapping api.ts (optional)
  <feature>-store.ts          # zustand store for client state (only if needed)
```

Files are kebab-case; components PascalCase named exports; import across folders with `@/…`.

## 3. Build the UI from the design system

- Containers: `Screen` (scrolling, insets handled), `Card`, `ListSection`/`ListRow`.
- Text: `Text` with `variant` + semantic `color`. Icons: `Icon` with `{ ios, android }` names.
- Actions: `Button` (variants: primary / secondary / plain / destructive), `SegmentedControl`.
- Styles: `const useStyles = makeStyles((t) => ({ ... }))` using `t.spacing`, `t.radius`, `t.colors`. No hex
  values or raw numbers for spacing in features. If a pattern repeats in 2+ features, promote it to
  `src/components/ui/` and export it from the barrel.
- Lists of unknown length: `FlatList` (or install `@shopify/flash-list` via `npx expo install` for big lists),
  with `contentInsetAdjustmentBehavior="automatic"`.
- Forms: controlled `TextInput` + zod validation for small forms; `react-hook-form` + `@hookform/resolvers/zod`
  if a form has many fields.

## 4. Data

- Server data → TanStack Query (`useQuery({ queryKey, queryFn })`) calling functions from `api.ts`, which use
  `api.get(path, zodSchema)` from `@/lib/api-client`. Never put server data in zustand.
- Client/UI state shared across screens → zustand store (persist with `zustandStorage` only if it must survive
  restarts). Local component state → `useState`.
- Secrets/tokens → `expo-secure-store`. Structured offline data → `expo-sqlite`.

## 5. Test and verify

- Test with RNTL v14 (async!): `await render(<Screen />)`, `await fireEvent.press(...)`, query by role/text.
  Read `node_modules/@testing-library/react-native/docs/guides/llm-guidelines.md` if unsure.
- Screens using TanStack Query need a `QueryClientProvider` wrapper in the test (new `QueryClient` per test,
  `retry: false`).
- `npm run check`, then the visual loop from AGENTS.md (run, `npm run screenshot`, look at it). Add or extend a
  Maestro flow in `.maestro/` for important user journeys.
