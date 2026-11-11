import { fireEvent, render, screen } from '@testing-library/react-native';
import { Appearance } from 'react-native';

import { storage } from '@/lib/storage';

import { useAppearanceStore } from './appearance-store';
import { SettingsScreen } from './settings-screen';

describe('SettingsScreen', () => {
  beforeEach(() => {
    useAppearanceStore.setState({ preference: 'system' });
  });

  it('shows the current appearance preference', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).not.toBeChecked();
  });

  it('changes and persists the appearance preference', async () => {
    const setColorScheme = jest.spyOn(Appearance, 'setColorScheme');
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(useAppearanceStore.getState().preference).toBe('dark');
    expect(storage.getString('settings.appearance')).toContain('"preference":"dark"');
    // Not applied by the screen itself — `initAppearance()` (root layout) owns that side effect.
    expect(setColorScheme).not.toHaveBeenCalled();
  });

  it('shows app version info', async () => {
    await render(<SettingsScreen />);
    expect(screen.getByText('Version')).toBeOnTheScreen();
    expect(screen.getByText('Variant')).toBeOnTheScreen();
  });
});
