import { View } from 'react-native';

import { ListRow, ListSection, Screen, SegmentedControl } from '@/components/ui';
import { appInfo, runtimeLabels } from '@/lib/app-info';
import { makeStyles } from '@/theme';

import { useAppearanceStore, type AppearancePreference } from './appearance-store';

const appearanceOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: AppearancePreference; label: string }[];

export function SettingsScreen() {
  const styles = useStyles();
  const preference = useAppearanceStore((state) => state.preference);
  const setPreference = useAppearanceStore((state) => state.setPreference);
  const { updates } = appInfo;

  return (
    <Screen grouped>
      <ListSection title="Appearance" footer="System follows your device's light/dark setting.">
        <View style={styles.segmentRow}>
          <SegmentedControl
            accessibilityLabel="Appearance"
            options={appearanceOptions}
            value={preference}
            onChange={setPreference}
          />
        </View>
      </ListSection>

      <ListSection title="About">
        <ListRow
          title="Version"
          value={
            appInfo.buildNumber ? `${appInfo.version} (${appInfo.buildNumber})` : appInfo.version
          }
        />
        <ListRow title="Variant" value={appInfo.variant} />
        <ListRow title="Runtime" value={runtimeLabels[appInfo.runtime]} />
        {updates.enabled ? <ListRow title="Update channel" value={updates.channel ?? '—'} /> : null}
        {updates.enabled ? (
          <ListRow
            title="Update"
            value={updates.isEmbeddedLaunch ? 'Embedded bundle' : updates.updateId}
            selectable
          />
        ) : null}
      </ListSection>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  segmentRow: { padding: t.spacing.md },
}));
