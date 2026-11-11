import { Link } from 'expo-router';

import { Screen, Text } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Text variant="title2">This screen doesn&apos;t exist.</Text>
      <Link href="/" replace>
        <Text color="primary">Go to the home screen</Text>
      </Link>
    </Screen>
  );
}
