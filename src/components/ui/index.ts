/**
 * Design-system primitives. Build screens from these before reaching for raw React Native views,
 * so styling, theming and accessibility stay consistent. Add new primitives here when a pattern
 * repeats in 2+ features.
 */
export { Button, type ButtonProps, type ButtonVariant } from './button';
export { Card } from './card';
export { Icon, type IconName, type IconProps } from './icon';
export { ListRow, ListSection, type ListRowProps, type ListSectionProps } from './list';
export { Screen, type ScreenProps } from './screen';
export {
  SegmentedControl,
  type SegmentedControlOption,
  type SegmentedControlProps,
} from './segmented-control';
export { Text, type TextProps } from './text';
