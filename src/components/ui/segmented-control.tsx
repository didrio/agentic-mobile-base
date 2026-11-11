import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { makeStyles } from '@/theme';

import { Text } from './text';

export type SegmentedControlOption<T extends string> = { value: T; label: string };

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
};

/** A compact single-choice picker. Each segment is exposed to assistive tech as a radio button. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const styles = useStyles();
  return (
    <View
      style={styles.track}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              void Haptics.selectionAsync();
              onChange(option.value);
            }}
            style={[styles.segment, selected && styles.selected]}>
            <Text
              variant="subheadline"
              color={selected ? 'text' : 'textSecondary'}
              style={selected && styles.selectedLabel}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: {
    flexDirection: 'row',
    padding: t.spacing.xxs,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfacePressed,
  },
  segment: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.md - 2,
  },
  selected: {
    backgroundColor: t.scheme === 'dark' ? t.colors.textTertiary : t.colors.surface,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  },
  selectedLabel: { fontWeight: '600' },
}));
