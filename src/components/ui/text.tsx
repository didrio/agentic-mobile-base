import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type ColorName, type TypographyVariant } from '@/theme';

export type TextProps = RNTextProps & {
  /** Type style from the design tokens. Defaults to `body`. */
  variant?: TypographyVariant;
  /** Semantic color from the theme. Defaults to `text`. */
  color?: ColorName;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
};

/** Themed text. Use this instead of React Native's `Text` everywhere in the app. */
export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[
        theme.typography[variant],
        { color: theme.colors[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
