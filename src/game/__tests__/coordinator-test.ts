import {
  DIRECTION_TARGETS,
  applyGlobalMove,
  normalizeSingleModeGame,
  scoreMultiplierFor,
  startGame,
} from '../coordinator';
import type {
  BoardState,
  Cell,
  GameMode,
  GameState,
  IdSource,
  RandomSource,
  Tile,
} from '../model';

const tile = (id: string, value: number): Tile => ({ id, value });
const emptyCells = (): Cell[] => Array.from({ length: 16 }, () => null);

function random(...values: number[]): RandomSource {
  let index = 0;
  return { next: () => values[index++] ?? 0 };
}

function ids(...values: string[]): IdSource {
  let index = 0;
  return { next: () => values[index++] ?? `generated-${index}` };
}

function face(
  cells: BoardState['cells'],
  options: Partial<Omit<BoardState, 'cells'>> = {},
): BoardState {
  return {
    cells,
    score: 0,
    completed2048: false,
    frozen: false,
    ...options,
  };
}

function game(
  faces: GameState['faces'],
  options: Partial<Omit<GameState, 'faces'>> = {},
): GameState {
  return {
    schemaVersion: 1,
    faces,
    mode: 'strict',
    status: 'playing',
    victoryReached: false,
    turn: 0,
    ...options,
  };
}

function deadCells(prefix: string): Cell[] {
  const values = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  return values.map((value, index) => tile(`${prefix}-${index}`, value));
}

describe('six-direction mapping', () => {
  it('maps every global direction to exactly two local face moves', () => {
    expect(DIRECTION_TARGETS).toEqual({
      up: [
        { face: 'left', direction: 'up' },
        { face: 'right', direction: 'up' },
      ],
      down: [
        { face: 'left', direction: 'down' },
        { face: 'right', direction: 'down' },
      ],
      upLeft: [
        { face: 'top', direction: 'up' },
        { face: 'left', direction: 'left' },
      ],
      downRight: [
        { face: 'top', direction: 'down' },
        { face: 'left', direction: 'right' },
      ],
      upRight: [
        { face: 'top', direction: 'right' },
        { face: 'right', direction: 'right' },
      ],
      downLeft: [
        { face: 'top', direction: 'left' },
        { face: 'right', direction: 'left' },
      ],
    });
  });
});

describe('global turns', () => {
  it.each([
    [0, 1],
    [1, 2],
    [2, 4],
    [3, 8],
  ] as const)('derives multiplier %i after %i completed faces', (completed, multiplier) => {
    const faces = {
      top: face(emptyCells(), { completed2048: completed > 0 }),
      left: face(emptyCells(), { completed2048: completed > 1 }),
      right: face(emptyCells(), { completed2048: completed > 2 }),
    };

    expect(scoreMultiplierFor(faces)).toBe(multiplier);
  });

  it.each([
    [0, 4],
    [1, 8],
    [2, 16],
    [3, 32],
  ] as const)('uses completed-face multiplier for future merges (%i completed)', (
    completed,
    expectedDelta,
  ) => {
    const leftCells = emptyCells();
    leftCells[0] = tile('left-a', 2);
    leftCells[4] = tile('left-b', 2);
    const state = game({
      top: face(emptyCells(), { completed2048: completed > 0 }),
      left: face(leftCells, { completed2048: completed > 1 }),
      right: face(emptyCells(), { completed2048: completed > 2 }),
    });

    const result = applyGlobalMove(
      state,
      'up',
      random(0, 0),
      ids('merge', 'spawn'),
    );

    expect(result.state.faces.left.score).toBe(expectedDelta);
  });

  it('uses the start-of-move multiplier when that move completes the first face', () => {
    const leftCells = emptyCells();
    leftCells[0] = tile('left-a', 1024);
    leftCells[4] = tile('left-b', 1024);
    const state = game({
      top: face(emptyCells()),
      left: face(leftCells, { score: 20_000 }),
      right: face(emptyCells()),
    });

    const result = applyGlobalMove(
      state,
      'up',
      random(0, 0),
      ids('merge', 'spawn'),
    );

    expect(result.state.faces.left.score).toBe(22_048);
    expect(result.state.faces.left.completed2048).toBe(true);
    expect(result.completedFacesStarted).toEqual(['left']);
    expect(scoreMultiplierFor(result.state.faces)).toBe(2);
  });

  it('does not count an already-completed face twice', () => {
    const leftCells = emptyCells();
    leftCells[0] = tile('left-a', 1024);
    leftCells[4] = tile('left-b', 1024);
    const state = game({
      top: face(emptyCells()),
      left: face(leftCells, { completed2048: true }),
      right: face(emptyCells()),
    });

    const result = applyGlobalMove(
      state,
      'up',
      random(0, 0),
      ids('merge', 'spawn'),
    );

    expect(result.completedFacesStarted).toEqual([]);
    expect(scoreMultiplierFor(result.state.faces)).toBe(2);
  });
  it.each(['strict', 'continue'] as const)('initializes all faces in %s mode', (mode) => {
    const result = startGame(
      mode,
      random(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
      ids('a', 'b', 'c', 'd', 'e', 'f'),
    );

    expect(result).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        mode,
        status: 'playing',
        victoryReached: false,
        turn: 0,
      }),
    );
    expect(Object.values(result.faces).map((board) => board.cells.filter(Boolean))).toEqual([
      [tile('a', 2), tile('b', 2)],
      [tile('c', 2), tile('d', 2)],
      [tile('e', 2), tile('f', 2)],
    ]);
  });

  it('never changes the unselected top face object on an up move', () => {
    const top = face([tile('top', 8), ...emptyCells().slice(1)]);
    const leftCells = emptyCells();
    leftCells[4] = tile('left', 2);

    const result = applyGlobalMove(
      game({ top, left: face(leftCells), right: face(emptyCells()) }),
      'up',
      random(0, 0),
      ids('left-spawn'),
    );

    expect(result.state.faces.top).toBe(top);
  });

  it('spawns only on the target face that can move', () => {
    const leftCells = emptyCells();
    leftCells[4] = tile('left', 2);
    const rightCells = emptyCells();
    rightCells[0] = tile('right', 2);

    const result = applyGlobalMove(
      game({ top: face(emptyCells()), left: face(leftCells), right: face(rightCells) }),
      'up',
      random(0, 0),
      ids('left-spawn'),
    );

    expect(result.faces[0]).toEqual(
      expect.objectContaining({
        face: 'left',
        direction: 'up',
        spawn: { tile: tile('left-spawn', 2), at: 1 },
      }),
    );
    expect(result.faces[1]).toEqual(expect.objectContaining({ face: 'right', direction: 'up' }));
    expect(result.faces[1]?.spawn).toBeUndefined();
  });

  it('retires one dead face without ending the run', () => {
    const leftCells = emptyCells();
    leftCells[4] = tile('left', 2);

    const result = applyGlobalMove(
      game({
        top: face(deadCells('top')),
        left: face(leftCells),
        right: face(emptyCells()),
      }),
      'up',
      random(0, 0),
      ids('left-spawn'),
    );

    expect(result.changed).toBe(true);
    expect(result.state.faces.top.frozen).toBe(true);
    expect(result.state.mode).toBe('continue');
    expect(result.state.status).toBe('playing');
    expect(result.gameOverStarted).toBe(false);
  });

  it('normalizes a legacy strict game without changing board data and freezes dead faces', () => {
    const top = face(deadCells('top'), { score: 128, completed2048: true });
    const left = face([tile('left', 2), ...emptyCells().slice(1)], { score: 8 });
    const right = face([tile('right', 4), ...emptyCells().slice(1)], { score: 16 });
    const state = game(
      { top, left, right },
      { mode: 'strict', status: 'gameOver', victoryReached: true, turn: 7 },
    );

    const result = normalizeSingleModeGame(state);

    expect(result).toEqual({
      ...state,
      mode: 'continue',
      status: 'playing',
      faces: {
        top: { ...top, frozen: true },
        left: { ...left, frozen: false },
        right: { ...right, frozen: false },
      },
    });
  });

  it('ends continue mode only after all three faces are frozen', () => {
    const state = game(
      {
        top: face(deadCells('top')),
        left: face(deadCells('left')),
        right: face(deadCells('right')),
      },
      { mode: 'continue' as GameMode },
    );

    const result = applyGlobalMove(state, 'up', random(), ids());

    expect(result.state.faces).toEqual({
      top: { ...state.faces.top, frozen: true },
      left: { ...state.faces.left, frozen: true },
      right: { ...state.faces.right, frozen: true },
    });
    expect(result.state.status).toBe('gameOver');
    expect(result.gameOverStarted).toBe(true);
  });

  it('records victory and keeps playing when the third face completes', () => {
    const rightCells = emptyCells();
    rightCells[0] = tile('a', 1024);
    rightCells[1] = tile('b', 1024);

    const result = applyGlobalMove(
      game({
        top: face(deadCells('top'), { completed2048: true }),
        left: face([tile('left', 2), ...emptyCells().slice(1)], { completed2048: true }),
        right: face(rightCells),
      }),
      'upRight',
      random(0, 0),
      ids('winner', 'spawn'),
    );

    expect(result.victoryStarted).toBe(true);
    expect(result.state.victoryReached).toBe(true);
    expect(result.state.status).toBe('playing');
    expect(result.gameOverStarted).toBe(false);
  });
});
