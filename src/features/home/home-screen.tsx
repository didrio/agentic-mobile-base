import { Image } from 'expo-image';
import { View } from 'react-native';

import { Card, Icon, Screen, Text } from '@/components/ui';
import { appInfo, runtimeLabels, type AppRuntime } from '@/lib/app-info';
import { makeStyles } from '@/theme';

const runtimeHints: Record<AppRuntime, string> = {
  'expo-go':
    'Great for fast UI work. Libraries with custom native code need a development build instead (npm run ios / npm run android).',
  'development-build':
    'Any native library works here. Shake the device, or press ⌘D (iOS) / ⌘M (Android) in a simulator, to open the dev menu.',
  'release-build': 'This is what testers and App Store / Play Store users get.',
};

const nextSteps = [
  'Describe your app idea to your coding agent',
  'Edit src/features/home/home-screen.tsx',
  'Read AGENTS.md for how this project is organized',
];

export function HomeScreen() {
  const styles = useStyles();
  return (
    <Screen>
      <View style={styles.hero}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.appIcon}
          accessibilityIgnoresInvertColors
        />
        <Text variant="title" align="center">
          {appInfo.name}
        </Text>
        <Text color="textSecondary" align="center">
          Your next app starts here.
        </Text>
      </View>

      <Card>
        <View style={styles.row}>
          <Icon name={{ ios: 'iphone', android: 'smartphone' }} color="primary" />
          <Text variant="headline">{runtimeLabels[appInfo.runtime]}</Text>
        </View>
        <Text variant="subheadline" color="textSecondary">
          {runtimeHints[appInfo.runtime]}
        </Text>
      </Card>

      <Card>
        <Text variant="headline">Start building</Text>
        {nextSteps.map((step, index) => (
          <View key={step} style={styles.row}>
            <Text variant="subheadline" color="primary" style={styles.stepNumber}>
              {index + 1}
            </Text>
            <Text variant="subheadline" color="textSecondary" style={styles.stepText}>
              {step}
            </Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  hero: {
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingVertical: t.spacing.xl,
  },
  appIcon: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: t.spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  stepNumber: { width: 16, fontWeight: '700' },
  stepText: { flex: 1 },
}));
