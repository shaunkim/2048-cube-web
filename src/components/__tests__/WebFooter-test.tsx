import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { DESTINATIONS, SOURCE_URL, WebFooter } from '../WebFooter';

it('shows one GitHub link and two non-link store placeholders', () => {
  render(<WebFooter />);

  expect(screen.getByRole('link', { name: 'GitHub repository' })).toBeTruthy();
  expect(screen.queryByRole('link', { name: 'App Store' })).toBeNull();
  expect(screen.queryByRole('link', { name: 'Google Play' })).toBeNull();
  expect(screen.getByText('App Store')).toBeTruthy();
  expect(screen.getByText('Google Play')).toBeTruthy();
  expect(screen.getAllByText('Coming soon')).toHaveLength(2);
});

it('opens only the live GitHub destination when pressed', () => {
  const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

  render(<WebFooter />);

  fireEvent.press(screen.getByRole('link', { name: 'GitHub repository' }));

  expect(openUrl).toHaveBeenCalledTimes(1);
  expect(openUrl).toHaveBeenCalledWith(SOURCE_URL);
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
