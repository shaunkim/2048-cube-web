import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import App from '../App';
import type { BoardState, GameState, StoredDocumentV1 } from '../src/game/model';

jest.mock('../src/storage/platformStore', () => ({
  platformStore: { getItem: async () => null, setItem: async () => undefined },
}));

function progressedDocument(): StoredDocumentV1 {
  const board = (score: number): BoardState => ({
    cells: Array.from({ length: 16 }, () => null),
    score,
    completed2048: false,
    frozen: false,
  });
  const activeRun: GameState = {
    schemaVersion: 1,
    faces: { top: board(40), left: board(30), right: board(20) },
    mode: 'continue',
    status: 'playing',
    victoryReached: false,
    turn: 3,
  };
  return {
    version: 1,
    activeRun,
    records: { bestTotalScore: 90, bestFaceScores: { top: 40, left: 30, right: 20 } },
    preferences: { mode: 'continue' },
  };
}

it('starts a progressed browser run immediately', async () => {
  const document = progressedDocument();
  const store = {
    getItem: async () => JSON.stringify(document),
    setItem: async () => undefined,
  };
  const ids = { next: (() => { let id = 0; return () => `restart-${++id}`; })() };
  const view = render(<App controllerDependencies={{ store, ids, random: { next: () => 0 }, animationMs: 180 }} />);

  await waitFor(() => expect(screen.getByLabelText('SCORE 90')).toBeTruthy());
  fireEvent.press(screen.getByRole('button', { name: 'Menu' }));
  fireEvent.press(screen.getByRole('button', { name: 'New Game' }));
  await waitFor(() => expect(screen.getByLabelText('SCORE 0')).toBeTruthy());
  view.unmount();
});
