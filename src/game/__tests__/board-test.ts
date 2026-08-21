import { applyBoardMove, createInitialBoard, hasLegalMove } from '../board';
import type { BoardState, Cell, IdSource, RandomSource, Tile } from '../model';

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

function board(
  cells: BoardState['cells'],
  options: Partial<Omit<BoardState, 'cells'>> = {},
): BoardState {
  return { cells, score: 0, completed2048: false, frozen: false, ...options };
}

describe('independent board turns', () => {
  it('moves, merges, scores, and spawns once after a changed move', () => {
    const cells = emptyCells();
    cells[0] = tile('a', 2);
    cells[2] = tile('b', 2);

    const result = applyBoardMove(board(cells), 'left', random(0, 0.95), ids('merge', 'spawn'));

    expect(result.board.cells[0]).toEqual(tile('merge', 4));
    expect(result.board.cells[1]).toEqual(tile('spawn', 4));
    expect(result.board.score).toBe(4);
    expect(result.spawn).toEqual({ tile: tile('spawn', 4), at: 1 });
  });

  it('does not spawn when the requested direction changes nothing', () => {
    const cells = emptyCells();
    cells[0] = tile('a', 2);

    const result = applyBoardMove(board(cells), 'left', random(0, 0), ids('unused'));

    expect(result.changed).toBe(false);
    expect(result.spawn).toBeUndefined();
    expect(result.board).toEqual(board(cells));
  });

  it('marks 2048 completion permanently', () => {
    const cells = emptyCells();
    cells[0] = tile('a', 1024);
    cells[1] = tile('b', 1024);

    const result = applyBoardMove(board(cells), 'left', random(0, 0), ids('win', 'spawn'));

    expect(result.board.completed2048).toBe(true);
    expect(result.completed2048Started).toBe(true);
  });

  it('multiplies only newly earned merge points', () => {
    const cells = emptyCells();
    cells[0] = tile('a', 2);
    cells[1] = tile('b', 2);

    const result = applyBoardMove(
      board(cells, { score: 20_000 }),
      'left',
      random(0, 0),
      ids('merge', 'spawn'),
      4,
    );

    expect(result.board.score).toBe(20_016);
  });

  it('keeps completion after 2048 merges into 4096 without celebrating again', () => {
    const cells = emptyCells();
    cells[0] = tile('a', 2048);
    cells[1] = tile('b', 2048);

    const result = applyBoardMove(
      board(cells, { completed2048: true }),
      'left',
      random(0, 0),
      ids('merge', 'spawn'),
    );

    expect(result.board.completed2048).toBe(true);
    expect(result.completed2048Started).toBe(false);
    expect(result.board.cells[0]?.value).toBe(4096);
  });

  it('distinguishes a full mergeable board from a dead board', () => {
    const mergeable = board(Array.from({ length: 16 }, (_, index) => tile(`m${index}`, index < 2 ? 2 : 4)));
    const deadValues = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
    const dead = board(deadValues.map((value, index) => tile(`d${index}`, value)));

    expect(hasLegalMove(mergeable)).toBe(true);
    expect(hasLegalMove(dead)).toBe(false);
  });

  it('creates a new face with exactly two tiles', () => {
    const result = createInitialBoard(random(0, 0, 0.5, 0.95), ids('first', 'second'));

    expect(result.cells.filter(Boolean)).toHaveLength(2);
    expect(result.cells[0]).toEqual(tile('first', 2));
    expect(result.cells[8]).toEqual(tile('second', 4));
  });

  it.each([
    ['left', 5, 4],
    ['right', 5, 7],
    ['up', 5, 1],
    ['down', 5, 13],
  ] as const)('moves a tile %s using the local board orientation', (direction, start, destination) => {
    const cells = emptyCells();
    cells[start] = tile('moving', 2);

    const result = applyBoardMove(board(cells), direction, random(0, 0), ids('spawn'));

    expect(result.board.cells[destination]).toEqual(tile('moving', 2));
    expect(result.changed).toBe(true);
  });

  it.each([
    [0.899999, 2],
    [0.9, 4],
  ] as const)('spawns the 90/10 boundary value for random %s', (valueRandom, expected) => {
    const cells = emptyCells();
    cells[1] = tile('moving', 2);

    const result = applyBoardMove(board(cells), 'left', random(0, valueRandom), ids('spawn'));

    expect(result.spawn?.tile.value).toBe(expected);
  });
});
