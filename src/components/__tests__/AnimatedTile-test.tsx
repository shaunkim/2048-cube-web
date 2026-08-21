import { render, screen, within } from '@testing-library/react-native';

import { CubeBoard } from '../CubeBoard';
import {
  TILE_ANIMATION_SCALES,
  TILE_ANIMATION_TIMINGS,
  tileMotionOffsets,
} from '../AnimatedTile';
import type { BoardState, Cell, GlobalTurnResult, Tile } from '../../game/model';

const tile = (id: string, value: number): Tile => ({ id, value });
const emptyCells = (): Cell[] => Array.from({ length: 16 }, () => null);

function board(cells: Cell[]): BoardState {
  return { cells, score: 0, completed2048: false, frozen: false };
}

it('renders semantic turn layers only for the two targeted faces', () => {
  jest.useFakeTimers();
  const topCells = emptyCells();
  topCells[0] = tile('motion-existing-id', 2);
  topCells[1] = tile('merge-result-id', 8);
  topCells[2] = tile('spawn-spawn-id', 2);
  const leftCells = emptyCells();
  leftCells[4] = tile('left-existing-id', 4);
  const rightCells = emptyCells();
  rightCells[0] = tile('right-static-id', 16);

  const result: GlobalTurnResult = {
    state: {
      schemaVersion: 1,
      faces: { top: board(topCells), left: board(leftCells), right: board(rightCells) },
      mode: 'strict',
      status: 'playing',
      victoryReached: false,
      turn: 1,
    },
    changed: true,
    completedFacesStarted: [],
    faces: [
      {
        face: 'top',
        direction: 'left',
        board: board(topCells),
        changed: true,
        completed2048Started: false,
        motions: [
          { tileId: 'motion-existing-id', value: 2, from: 3, to: 0 },
          { tileId: 'merge-source-a', value: 4, from: 5, to: 1 },
          { tileId: 'merge-source-b', value: 4, from: 6, to: 1 },
        ],
        merges: [
          {
            sourceIds: ['merge-source-a', 'merge-source-b'],
            result: tile('merge-result-id', 8),
            at: 1,
          },
        ],
        spawn: { tile: tile('spawn-spawn-id', 2), at: 2 },
      },
      {
        face: 'left',
        direction: 'up',
        board: board(leftCells),
        changed: true,
        completed2048Started: false,
        motions: [{ tileId: 'left-existing-id', value: 4, from: 12, to: 4 }],
        merges: [],
      },
    ],
    victoryStarted: false,
    gameOverStarted: false,
  };

  const view = render(<CubeBoard state={result.state} animation={result} />);
  try {
    expect(screen.getByTestId('motion-existing-id')).toBeTruthy();
    expect(screen.getByTestId('merge-source-a')).toBeTruthy();
    expect(screen.getByTestId('merge-source-b')).toBeTruthy();
    expect(screen.getByTestId('merge-result-id')).toBeTruthy();
    expect(screen.getByTestId('spawn-spawn-id')).toBeTruthy();
    expect(within(screen.getByTestId('face-left')).getByTestId('left-existing-id')).toBeTruthy();
    const rightFace = within(screen.getByTestId('face-right'));
    [
      'motion-existing-id',
      'merge-source-a',
      'merge-source-b',
      'merge-result-id',
      'spawn-spawn-id',
      'left-existing-id',
    ].forEach((testID) => expect(rightFace.queryByTestId(testID)).toBeNull());
  } finally {
    view.unmount();
    jest.useRealTimers();
  }
});

it.each(['move', 'mergeSource', 'mergeResult', 'spawn'] as const)(
  'finishes the %s visual timeline strictly before the controller unlocks',
  (kind) => {
    const timing = TILE_ANIMATION_TIMINGS[kind];

    expect(timing.delay + timing.duration).toBeLessThan(180);
  },
);

it('uses the classic overshoot merge and zoom-in spawn keyframes', () => {
  expect(TILE_ANIMATION_TIMINGS).toEqual({
    move: { delay: 0, duration: 80 },
    mergeSource: { delay: 0, duration: 80 },
    mergeResult: { delay: 0, duration: 130 },
    spawn: { delay: 10, duration: 120 },
  });
  expect(TILE_ANIMATION_SCALES.mergeResult).toEqual({ inputRange: [0, 0.55, 1], outputRange: [1, 1.18, 1] });
  expect(TILE_ANIMATION_SCALES.spawn).toEqual({ inputRange: [0, 1], outputRange: [0.15, 1] });
});

it.each([
  ['move', { x: 18, y: 24 }, { x: 6, y: 9 }, { startX: 12, startY: 15 }],
  ['mergeSource', { x: 18, y: 24 }, { x: 6, y: 9 }, { startX: 12, startY: 15 }],
  ['spawn', { x: 18, y: 24 }, { x: 6, y: 9 }, { startX: 0, startY: 0 }],
  ['mergeResult', { x: 18, y: 24 }, { x: 6, y: 9 }, { startX: 0, startY: 0 }],
] as const)('%s uses only its approved positional offset', (kind, source, destination, expected) => {
  expect(tileMotionOffsets(kind, source, destination)).toEqual(expected);
});

it('never attaches positional animation props to spawn and merge-result layers', () => {
  jest.useFakeTimers();
  const topCells = emptyCells();
  topCells[1] = tile('merge-result-id', 8);
  topCells[2] = tile('spawn-id', 2);
  const result: GlobalTurnResult = {
    state: {
      schemaVersion: 1,
      faces: { top: board(topCells), left: board(emptyCells()), right: board(emptyCells()) },
      mode: 'strict',
      status: 'playing',
      victoryReached: false,
      turn: 1,
    },
    changed: true,
    completedFacesStarted: [],
    faces: [{
      face: 'top',
      direction: 'left',
      board: board(topCells),
      changed: true,
      completed2048Started: false,
      motions: [],
      merges: [{
        sourceIds: ['source-a', 'source-b'],
        result: tile('merge-result-id', 8),
        at: 1,
      }],
      spawn: { tile: tile('spawn-id', 2), at: 2 },
    }],
    victoryStarted: false,
    gameOverStarted: false,
  };

  const view = render(<CubeBoard state={result.state} animation={result} />);
  try {
    for (const testID of ['merge-result-id-motion', 'spawn-id-motion']) {
      expect(screen.getByTestId(testID).props.translateX).toBeUndefined();
      expect(screen.getByTestId(testID).props.translateY).toBeUndefined();
    }
  } finally {
    view.unmount();
    jest.useRealTimers();
  }
});
