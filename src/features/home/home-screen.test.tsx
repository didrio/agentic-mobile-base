import { render, screen } from '@testing-library/react-native';

import { appInfo } from '@/lib/app-info';

import { HomeScreen } from './home-screen';

describe('HomeScreen', () => {
  it('greets with the app name and shows next steps', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText(appInfo.name)).toBeOnTheScreen();
    expect(screen.getByText('Start building')).toBeOnTheScreen();
  });
});
