import type { BoardState, GameState } from '../../game/model';
import { progressMessage } from '../progressMessage';

function board(completed2048: boolean, maximum = 0): BoardState {
  return {
    cells: Array.from({ length: 16 }, (_, index) =>
      index === 0 && maximum > 0 ? { id: `tile-${maximum}`, value: maximum } : null),
    score: 0,
    completed2048,
    frozen: false,
  };
}

function game(completed: number, turn: number, maxima: readonly [number, number, number] = [0, 0, 0]): GameState {
  return {
    schemaVersion: 1,
    faces: {
      top: board(completed > 0, maxima[0]),
      left: board(completed > 1, maxima[1]),
      right: board(completed > 2, maxima[2]),
    },
    mode: 'continue',
    status: 'playing',
    victoryReached: completed === 3,
    turn,
  };
}

it.each([0, 1, 2, 3])('provides zero-face encouragement for message cycle %i', (messageCycle) => {
  expect(progressMessage(game(0, 0), messageCycle)).toMatch(/2048|cube|faces|swipe/i);
});

it.each([
  [1, /second|two to go|another face/i],
  [2, /final|one face left|finish the cube/i],
])('uses progress-specific encouragement for %i completed faces', (completed, expected) => {
  expect(progressMessage(game(completed, 0), 0)).toMatch(expected);
});

it('keeps a message stable when only the turn changes', () => {
  expect(progressMessage(game(0, 0), 0)).toBe(progressMessage(game(0, 99), 0));
});

it('rotates messages when the game message cycle advances', () => {
  for (const completed of [0, 1, 2, 3]) {
    const current = progressMessage(game(completed, 6, [4096, 4096, 4096]), 0);
    const next = progressMessage(game(completed, 6, [4096, 4096, 4096]), 1);
    expect(next).not.toBe(current);
  }
});

it.each([
  [[2048, 2048, 4096], '4096'],
  [[4096, 8192, 4096], '8192'],
])('advances from the shared completed milestone %j', (maxima, target) => {
  expect(progressMessage(game(3, 8, maxima as [number, number, number]), 0)).toContain(target);
});
