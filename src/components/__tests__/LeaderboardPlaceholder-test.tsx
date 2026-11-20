import { Linking } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LeaderboardPlaceholder } from '../LeaderboardPlaceholder';

it('offers store links and explains that leaderboards are mobile-only', () => {
  const onClose = jest.fn();
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
  render(<LeaderboardPlaceholder visible onClose={onClose} />);

  expect(screen.getByText('Leaderboards are only available on iOS and Android.')).toBeTruthy();
  expect(screen.queryByText(/coming soon/i)).toBeNull();
  fireEvent.press(screen.getByRole('link', { name: 'App Store' }));
  fireEvent.press(screen.getByRole('link', { name: 'Google Play' }));
  expect(openURL).toHaveBeenNthCalledWith(1, 'https://apps.apple.com/us/app/2048/id6803536487');
  expect(openURL).toHaveBeenNthCalledWith(
    2,
    'https://play.google.com/store/apps/details?id=com.shaunkim.game2048cube',
  );
  expect(screen.queryByRole('button', { name: /submit/i })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Close leaderboard' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
