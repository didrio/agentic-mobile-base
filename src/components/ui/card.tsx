import { View, type ViewProps } from 'react-native';

import { makeStyles } from '@/theme';

/** A rounded surface for grouping related content. */
export function Card({ style, ...rest }: ViewProps) {
  const styles = useStyles();
  return <View style={[styles.card, style]} {...rest} />;
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    gap: t.spacing.sm,
    borderCurve: 'continuous',
  },
}));
