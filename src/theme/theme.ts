import { useColorScheme } from 'react-native';

import {
  darkColors,
  lightColors,
  maxContentWidth,
  radius,
  spacing,
  typography,
  type ThemeColors,
} from './tokens';

export type ColorScheme = 'light' | 'dark';

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  maxContentWidth: number;
};

const shared = { spacing, radius, typography, maxContentWidth } as const;

/** Both themes are built once at startup, so `useTheme()` returns a stable object per scheme. */
export const themes: Record<ColorScheme, Theme> = {
  light: { scheme: 'light', colors: lightColors, ...shared },
  dark: { scheme: 'dark', colors: darkColors, ...shared },
};

/**
 * The active theme. Follows the OS appearance, or the user's override from Settings
 * (applied app-wide via `Appearance.setColorScheme`, see `features/settings`).
 */
export function useTheme(): Theme {
  return themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
