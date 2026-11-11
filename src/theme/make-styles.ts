import { StyleSheet } from 'react-native';

import { themes, useTheme, type ColorScheme, type Theme } from './theme';

/** Whatever `StyleSheet.create` accepts (a map of named view/text/image styles). */
type Styles = Parameters<typeof StyleSheet.create>[0];

/**
 * The one styling pattern used across the app: a themed `StyleSheet`.
 *
 * Styles are created once per color scheme at module load (no per-render allocation),
 * and the hook returns the set matching the active theme.
 *
 * @example
 * const useStyles = makeStyles((t) => ({
 *   card: { backgroundColor: t.colors.surface, padding: t.spacing.lg, borderRadius: t.radius.lg },
 * }));
 *
 * function Card() {
 *   const styles = useStyles();
 *   return <View style={styles.card} />;
 * }
 */
export function makeStyles<S extends Styles>(
  factory: (theme: Theme) => S & Styles,
): () => Readonly<S> {
  const sheets: Record<ColorScheme, Readonly<S>> = {
    light: StyleSheet.create(factory(themes.light)),
    dark: StyleSheet.create(factory(themes.dark)),
  };
  return function useStyles() {
    return sheets[useTheme().scheme];
  };
}
