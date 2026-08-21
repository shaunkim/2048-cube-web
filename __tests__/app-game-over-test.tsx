import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('../src/storage/platformStore', () => ({
  platformStore: { getItem: async () => null, setItem: async () => undefined },
}));

import App from '../App';
import type { BoardState, IdSource, RandomSource, StoredDocumentV1 } from '../src/game/model';
import type { KeyValueStore } from '../src/storage/gameStorage';

function deadBoard(prefix: string): BoardState {
  const values = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  return { cells: values.map((value, index) => ({ id: `${prefix}-${index}`, value })), score: 100, completed2048: false, frozen: true };
}

it('replaces an ended cube with results and starts over from Try Again', async () => {
  const activeRun = {
    schemaVersion: 1 as const,
    faces: { top: deadBoard('top'), left: deadBoard('left'), right: deadBoard('right') },
    mode: 'continue' as const,
    status: 'gameOver' as const,
    victoryReached: false,
    turn: 42,
  };
  const stored: StoredDocumentV1 = {
    version: 1,
    activeRun,
    records: { bestTotalScore: 900, bestFaceScores: { top: 300, left: 300, right: 300 } },
    preferences: { mode: 'continue' },
  };
  const store: KeyValueStore = { getItem: async () => JSON.stringify(stored), setItem: async () => undefined };
  const random: RandomSource = { next: () => 0 };
  let id = 0;
  const ids: IdSource = { next: () => `retry-${++id}` };
  const view = render(<App controllerDependencies={{ store, random, ids, animationMs: 180 }} />);

  await waitFor(() => expect(screen.getByText('Game Over!')).toBeTruthy());
  expect(screen.getByText('300')).toBeTruthy();
  expect(screen.getByText('Best 900')).toBeTruthy();
  expect(screen.getByTestId('share-card')).toBeTruthy();
  expect(screen.getByTestId('cube-board')).toBeTruthy();

  fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(screen.getByText('2048³')).toBeTruthy());
  expect(screen.getByText('Build every face. Complete the cube!')).toBeTruthy();
  view.unmount();
});
