import { fireEvent, render, screen } from '@testing-library/react-native';

import { MenuSheet } from '../MenuSheet';

it('shows exactly the four approved actions and invokes them in order', () => {
  const callbacks = {
    onResume: jest.fn(),
    onNewGame: jest.fn(),
    onTutorial: jest.fn(),
    onFeedback: jest.fn(),
  };
  render(<MenuSheet visible {...callbacks} />);

  const buttons = screen.getAllByRole('button');
  expect(buttons.map((button) => button.props.accessibilityLabel)).toEqual([
    'Resume',
    'New Game',
    'Tutorial',
    'Feedback and support',
  ]);
  for (const name of ['Resume', 'New Game', 'Tutorial', 'Feedback and support']) {
    fireEvent.press(screen.getByRole('button', { name }));
  }
  expect(callbacks.onResume).toHaveBeenCalledTimes(1);
  expect(callbacks.onNewGame).toHaveBeenCalledTimes(1);
  expect(callbacks.onTutorial).toHaveBeenCalledTimes(1);
  expect(callbacks.onFeedback).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/Sound|Challenges|Restart Run|Strict|Continue/i)).toBeNull();
});

it('labels the web feedback action clearly', () => {
  render(
    <MenuSheet
      visible
      onResume={jest.fn()}
      onNewGame={jest.fn()}
      onTutorial={jest.fn()}
      onFeedback={jest.fn()}
    />,
  );

  expect(screen.getByText('FEEDBACK')).toBeTruthy();
  expect(screen.getByLabelText('Game menu')).toBeTruthy();
});
