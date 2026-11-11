import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { queryClient } from '@/lib/query-client';
import { themes, useTheme, type ColorScheme, type Theme } from '@/theme';

type NavigationTheme = typeof DefaultTheme;

function toNavigationTheme(base: NavigationTheme, theme: Theme): NavigationTheme {
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
}

/** Our design tokens mapped onto React Navigation's theme (headers, tab bars, backgrounds). */
const navigationThemes: Record<ColorScheme, NavigationTheme> = {
  light: toNavigationTheme(DefaultTheme, themes.light),
  dark: toNavigationTheme(DarkTheme, themes.dark),
};

/** Global providers. Add app-wide providers (auth, analytics, i18n…) here, not in screens. */
export function AppProviders({ children }: PropsWithChildren) {
  const { scheme } = useTheme();
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navigationThemes[scheme]}>
          {children}
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
