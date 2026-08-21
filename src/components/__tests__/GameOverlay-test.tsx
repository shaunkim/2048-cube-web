import { render, screen } from '@testing-library/react-native';

import { GameOverlay } from '../GameOverlay';
import type { BoardState, GameState, GlobalTurnResult } from '../../game/model';

const board = (completed2048 = false): BoardState => ({
  cells: Array.from({ length: 16 }, () => null),
  score: 0,
  completed2048,
  frozen: false,
});

function celebration(completed: number): GlobalTurnResult {
  const state: GameState = {
    schemaVersion: 1,
    faces: {
      top: board(completed > 0),
      left: board(completed > 1),
      right: board(completed > 2),
    },
    mode: 'continue',
    status: 'playing',
    victoryReached: completed === 3,
    turn: 1,
  };
  return {
    state,
    changed: true,
    faces: [],
    completedFacesStarted: [completed === 1 ? 'top' : completed === 2 ? 'left' : 'right'],
    victoryStarted: completed === 3,
    gameOverStarted: false,
  };
}

it('never presents blocked-face or game-over interruption copy', () => {
  render(<GameOverlay celebration={null} />);
  expect(screen.queryByText(/Face blocked|Keep playing|Game Over/)).toBeNull();
});

it.each([
  [1, 'SCORE ×2'],
  [2, 'SCORE ×4'],
  [3, '2048³ complete! SCORE ×8'],
] as const)('announces the new multiplier for %i completed faces', (completed, copy) => {
  render(<GameOverlay celebration={celebration(completed)} />);
  expect(screen.getByText(copy)).toBeTruthy();
});
