import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme, type ColorName } from '@/theme';

type PlatformSymbolNames = Exclude<SymbolViewProps['name'], string>;

/**
 * A native system icon: an SF Symbol on iOS and a Material Symbol on Android.
 * Both names are required so icons never silently disappear on one platform.
 *
 * - iOS names: https://developer.apple.com/sf-symbols/ (e.g. `gearshape`, `house.fill`)
 * - Android names: https://fonts.google.com/icons (snake_case, e.g. `settings`, `home`)
 */
export type IconName = {
  ios: NonNullable<PlatformSymbolNames['ios']>;
  android: NonNullable<PlatformSymbolNames['android']>;
};

export type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorName;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 20, color = 'text', style }: IconProps) {
  const theme = useTheme();
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={theme.colors[color]}
      style={[{ width: size, height: size }, style]}
    />
  );
}
