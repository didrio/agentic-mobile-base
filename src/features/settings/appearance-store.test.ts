import { Appearance } from 'react-native';

import { initAppearance, useAppearanceStore } from './appearance-store';

describe('initAppearance', () => {
  it('applies the saved preference immediately and on every change', () => {
    const setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
    useAppearanceStore.setState({ preference: 'light' });

    const unsubscribe = initAppearance();
    expect(setColorScheme).toHaveBeenLastCalledWith('light');

    useAppearanceStore.getState().setPreference('system');
    expect(setColorScheme).toHaveBeenLastCalledWith('auto');

    unsubscribe();
    useAppearanceStore.getState().setPreference('dark');
    expect(setColorScheme).toHaveBeenCalledTimes(2);
  });
});
