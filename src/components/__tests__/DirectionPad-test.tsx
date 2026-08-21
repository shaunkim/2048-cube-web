import { fireEvent, render, screen } from '@testing-library/react-native';

import { DirectionPad } from '../DirectionPad';

it('offers and dispatches all six named directions in two fixed rows', () => {
  const onDirection = jest.fn();
  render(<DirectionPad onDirection={onDirection} disabled={false} />);

  fireEvent.press(screen.getByRole('button', { name: 'Move up-left' }));
  fireEvent.press(screen.getByRole('button', { name: 'Move down-right' }));

  expect(screen.getAllByRole('button')).toHaveLength(6);
  expect(screen.getAllByTestId('direction-row')).toHaveLength(2);
  screen.getAllByRole('button').forEach((button) => {
    expect(button).toHaveStyle({ width: 56 });
  });
  ['↖ Q', '↑ W', 'E ↗', '↙ A', '↓ S', 'D ↘'].forEach((label) => {
    expect(screen.getByText(label).props.numberOfLines).toBe(1);
  });
  expect(onDirection).toHaveBeenNthCalledWith(1, 'upLeft');
  expect(onDirection).toHaveBeenNthCalledWith(2, 'downRight');
});
