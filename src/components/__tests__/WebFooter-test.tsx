import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { DESTINATIONS, SOURCE_URL, WebFooter } from '../WebFooter';

it('shows three favicon-only destinations with live GitHub and App Store links', () => {
  render(<WebFooter />);

  expect(screen.getByRole('link', { name: 'GitHub repository' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'App Store' })).toBeTruthy();
  expect(screen.queryByRole('link', { name: 'Google Play' })).toBeNull();
  expect(screen.getByText('<>')).toBeTruthy();
  expect(screen.getByText('')).toBeTruthy();
  expect(screen.getByText('▶')).toBeTruthy();
  expect(screen.queryByText('GitHub')).toBeNull();
  expect(screen.queryByText('App Store')).toBeNull();
  expect(screen.queryByText('Google Play')).toBeNull();
  expect(screen.queryByText('Coming soon')).toBeNull();
});

it('opens the live GitHub and App Store destinations when pressed', () => {
  const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

  render(<WebFooter />);

  fireEvent.press(screen.getByRole('link', { name: 'GitHub repository' }));
  fireEvent.press(screen.getByRole('link', { name: 'App Store' }));

  expect(openUrl).toHaveBeenCalledTimes(2);
  expect(openUrl).toHaveBeenCalledWith(SOURCE_URL);
  expect(openUrl).toHaveBeenCalledWith('https://apps.apple.com/us/app/2048/id6803536487');
  openUrl.mockRestore();
});

it('makes a store destination an accessible link when its URL is configured', () => {
  const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const appStoreUrl = 'https://store.example.test/2048-cube';

  render(
    <WebFooter
      destinations={{
        ...DESTINATIONS,
        appStore: { ...DESTINATIONS.appStore, url: appStoreUrl },
      }}
    />,
  );

  fireEvent.press(screen.getByRole('link', { name: 'App Store' }));

  expect(openUrl).toHaveBeenCalledWith(appStoreUrl);
  openUrl.mockRestore();
});
