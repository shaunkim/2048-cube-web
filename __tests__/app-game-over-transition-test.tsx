import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

jest.mock('../src/storage/platformStore', () => ({
  platformStore: { getItem: async () => null, setItem: async () => undefined },
}));

import App from '../App';
import type { BoardState, IdSource, RandomSource, StoredDocumentV1 } from '../src/game/model';
import type { KeyValueStore } from '../src/storage/gameStorage';

const originalPlatform = Platform.OS;
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

function setPlatform(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
}

function board(prefix: string, values: readonly number[]): BoardState {
  return {
    cells: values.map((value, index) => ({ id: `${prefix}-${index}`, value })),
    score: 100,
    completed2048: false,
    frozen: false,
  };
}

const deadValues = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
const finalMoveValues = [2, 2, 8, 16, 2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4];

afterEach(() => {
  setPlatform(originalPlatform);
  window.addEventListener = originalAddEventListener;
  window.removeEventListener = originalRemoveEventListener;
  jest.useRealTimers();
});

it('keeps the final cube visible for 0.5 seconds before showing Game Over', async () => {
  setPlatform('web');
  window.addEventListener = jest.fn();
  window.removeEventListener = jest.fn();
  const stored: StoredDocumentV1 = {
    version: 1,
    activeRun: {
      schemaVersion: 1,
      faces: {
        top: { ...board('top', deadValues), frozen: true },
        left: board('left', finalMoveValues),
        right: { ...board('right', deadValues), frozen: true },
      },
      mode: 'continue',
      status: 'playing',
      victoryReached: false,
      turn: 9,
    },
    records: { bestTotalScore: 0, bestFaceScores: { top: 0, left: 0, right: 0 } },
    preferences: { mode: 'continue' },
  };
  const store: KeyValueStore = {
    getItem: async () => JSON.stringify(stored),
    setItem: async () => undefined,
  };
  const random: RandomSource = { next: () => 0 };
  let id = 0;
  const ids: IdSource = { next: () => `spawn-${++id}` };
  const view = render(<App controllerDependencies={{ store, random, ids, animationMs: 180 }} />);

  await waitFor(() => expect(screen.getByText('2048³')).toBeTruthy());
  jest.useFakeTimers();
  fireEvent.press(screen.getByRole('button', { name: 'Move up-left' }));

  expect(screen.getByTestId('cube-board')).toBeTruthy();
  expect(screen.queryByTestId('game-over-screen')).toBeNull();

  await act(async () => jest.advanceTimersByTimeAsync(499));
  expect(screen.getByTestId('cube-board')).toBeTruthy();
  expect(screen.queryByTestId('game-over-screen')).toBeNull();

  await act(async () => jest.advanceTimersByTimeAsync(1));
  expect(screen.getByTestId('game-over-screen')).toBeTruthy();
  view.unmount();
});
