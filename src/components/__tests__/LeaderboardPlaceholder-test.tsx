import { fireEvent, render, screen } from '@testing-library/react-native';

import { LeaderboardPlaceholder } from '../LeaderboardPlaceholder';

it('explains that the independent leaderboard is not submitting scores yet', () => {
  const onClose = jest.fn();
  render(<LeaderboardPlaceholder visible onClose={onClose} />);

  expect(screen.getByText('Leaderboard coming soon')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /submit/i })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Close leaderboard' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
