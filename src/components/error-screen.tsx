import type { ErrorBoundaryProps } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles } from '@/theme';

import { Button, Icon, Text } from './ui';

/**
 * Shown when a route throws during render. Expo Router uses it for any route (or layout) that
 * exports it as `ErrorBoundary` — the root layout does, so it catches everything below it.
 * This is also the place to report errors to a crash reporter (e.g. Sentry) once one is added.
 */
export function ErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Icon
          name={{ ios: 'exclamationmark.triangle', android: 'warning' }}
          size={40}
          color="warning"
        />
        <Text variant="title2" align="center">
          Something went wrong
        </Text>
        <Text color="textSecondary" align="center">
          {__DEV__ ? error.message : 'An unexpected error occurred. Please try again.'}
        </Text>
        <Button title="Try again" onPress={() => void retry()} style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.lg,
    padding: t.spacing.xl,
  },
  button: { alignSelf: 'stretch', marginTop: t.spacing.lg },
}));
