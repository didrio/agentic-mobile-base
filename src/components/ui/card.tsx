import { View, type ViewProps } from 'react-native';

import { makeStyles } from '@/theme';

/**
 * A rounded, filled panel for grouping related content on a plain `Screen`.
 * On grouped screens (`<Screen grouped>`) use `ListSection` instead.
 */
export function Card({ style, ...rest }: ViewProps) {
  const styles = useStyles();
  return <View style={[styles.card, style]} {...rest} />;
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surfaceMuted,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    gap: t.spacing.sm,
    borderCurve: 'continuous',
  },
}));
