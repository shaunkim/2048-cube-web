import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { BoardState, GameState } from '../../game/model';
import { GameOverScreen } from '../GameOverScreen';

const finalBoard = (prefix: string): BoardState => ({
  cells: Array.from({ length: 16 }, (_, index) => ({ id: `${prefix}-${index}`, value: index % 2 === 0 ? 2 : 4 })),
  score: 100,
  completed2048: false,
  frozen: true,
});

const finalGame: GameState = {
  schemaVersion: 1,
  faces: { top: finalBoard('top'), left: finalBoard('left'), right: finalBoard('right') },
  mode: 'continue',
  status: 'gameOver',
  victoryReached: false,
  turn: 42,
};

it('shows final records and starts a fresh run', () => {
  const onTryAgain = jest.fn();
  render(<GameOverScreen game={finalGame} score={2828} best={35960} onTryAgain={onTryAgain} shareResult={jest.fn()} />);
  expect(screen.getByText('Game Over!')).toBeTruthy();
  expect(screen.getByText('2828')).toBeTruthy();
  expect(screen.getByText('Best 35960')).toBeTruthy();
  expect(screen.getByTestId('share-card')).toBeTruthy();
  expect(screen.getByText('I scored 2,828 points in 2048³!')).toBeTruthy();
  expect(screen.getByTestId('cube-board')).toBeTruthy();
  expect(screen.getByTestId('face-top').props.opacity).toBe(1);
  expect(screen.getByTestId('face-outline-top').props.fill).toEqual({ type: 0, payload: 0xffd8ccbe });
  fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(onTryAgain).toHaveBeenCalledTimes(1);
});

it('shares the total and reports success accessibly', async () => {
  const shareResult = jest.fn(async () => 'shared' as const);
  render(<GameOverScreen game={finalGame} score={2828} best={35960} onTryAgain={jest.fn()} shareResult={shareResult} />);
  fireEvent.press(screen.getByRole('button', { name: 'Share score' }));
  await waitFor(() => expect(screen.getByTestId('share-status')).toHaveTextContent('Score shared.'));
  expect(shareResult).toHaveBeenCalledWith('I scored 2,828 points in 2048³!');
});

it('uses the browser share sheet when it is available', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const share = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { share } });

  try {
    render(<GameOverScreen game={finalGame} score={2828} best={35960} onTryAgain={jest.fn()} />);
    fireEvent.press(screen.getByRole('button', { name: 'Share score' }));

    await waitFor(() => expect(screen.getByTestId('share-status')).toHaveTextContent('Score shared.'));
    expect(share).toHaveBeenCalledWith({ text: 'I scored 2,828 points in 2048³!' });
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else delete (globalThis as { navigator?: Navigator }).navigator;
  }
});

it('copies the score when the browser share sheet is unavailable', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText } } });

  try {
    render(<GameOverScreen game={finalGame} score={2828} best={35960} onTryAgain={jest.fn()} />);
    fireEvent.press(screen.getByRole('button', { name: 'Share score' }));

    await waitFor(() => expect(screen.getByTestId('share-status')).toHaveTextContent('Score copied.'));
    expect(writeText).toHaveBeenCalledWith('I scored 2,828 points in 2048³!');
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else delete (globalThis as { navigator?: Navigator }).navigator;
  }
});
