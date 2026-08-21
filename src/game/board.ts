import { collapseLine } from './line';
import { CELL_COUNT } from './model';
import type {
  BoardMerge,
  BoardMotion,
  BoardState,
  BoardTurnResult,
  IdSource,
  LocalDirection,
  RandomSource,
  ScoreMultiplier,
  SpawnEvent,
} from './model';

const LEFT_LINES = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
] as const;

const UP_LINES = [
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
] as const;

function linesFor(direction: LocalDirection): readonly (readonly number[])[] {
  if (direction === 'left') return LEFT_LINES;
  if (direction === 'right') return LEFT_LINES.map((line) => [...line].reverse());
  if (direction === 'up') return UP_LINES;
  return UP_LINES.map((line) => [...line].reverse());
}

function boardIndex(line: readonly number[], lineIndex: number): number {
  const index = line[lineIndex];
  if (index === undefined) throw new Error('Line index invariant failed');
  return index;
}

function spawnTile(
  board: BoardState,
  random: RandomSource,
  ids: IdSource,
): { board: BoardState; event: SpawnEvent } {
  const empty = board.cells.flatMap((cell, index) => (cell ? [] : [index]));
  if (empty.length === 0) throw new Error('Cannot spawn on a full board');

  const emptyOffset = Math.floor(random.next() * empty.length);
  const at = empty[Math.min(emptyOffset, empty.length - 1)];
  if (at === undefined) throw new Error('Empty-cell selection failed');
  const tile = { id: ids.next(), value: random.next() < 0.9 ? 2 : 4 };
  const cells = [...board.cells];
  cells[at] = tile;

  return { board: { ...board, cells }, event: { tile, at } };
}

export function createInitialBoard(random: RandomSource, ids: IdSource): BoardState {
  const emptyBoard: BoardState = {
    cells: Array.from({ length: CELL_COUNT }, () => null),
    score: 0,
    completed2048: false,
    frozen: false,
  };
  const first = spawnTile(emptyBoard, random, ids);
  return spawnTile(first.board, random, ids).board;
}

export function applyBoardMove(
  board: BoardState,
  direction: LocalDirection,
  random: RandomSource,
  ids: IdSource,
  scoreMultiplier: ScoreMultiplier = 1,
): BoardTurnResult {
  if (board.frozen) {
    return { board, changed: false, completed2048Started: false, motions: [], merges: [] };
  }

  const cells = [...board.cells];
  const motions: BoardMotion[] = [];
  const merges: BoardMerge[] = [];
  let changed = false;
  let scoreDelta = 0;

  for (const line of linesFor(direction)) {
    const result = collapseLine(line.map((index) => board.cells[index] ?? null), ids);
    changed ||= result.changed;
    scoreDelta += result.scoreDelta;

    result.cells.forEach((cell, index) => {
      cells[boardIndex(line, index)] = cell;
    });

    motions.push(
      ...result.motions.map((motion) => ({
        ...motion,
        from: boardIndex(line, motion.from),
        to: boardIndex(line, motion.to),
      })),
    );
    merges.push(
      ...result.merges.map((merge) => {
        return { ...merge, at: boardIndex(line, merge.at) };
      }),
    );
  }

  if (!changed) {
    return { board, changed: false, completed2048Started: false, motions: [], merges: [] };
  }

  const collapsedBoard: BoardState = {
    ...board,
    cells,
    score: board.score + scoreDelta * scoreMultiplier,
  };
  const spawned = spawnTile(collapsedBoard, random, ids);
  const nextBoard: BoardState = {
    ...spawned.board,
    completed2048: board.completed2048 || highestTile(spawned.board) >= 2048,
  };
  const completed2048Started = nextBoard.completed2048 && !board.completed2048;

  return {
    board: nextBoard,
    changed: true,
    completed2048Started,
    motions,
    merges,
    spawn: spawned.event,
  };
}

export function hasLegalMove(board: BoardState): boolean {
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const tile = board.cells[index];
    if (!tile) return true;

    const right = index % 4 === 3 ? undefined : board.cells[index + 1];
    const down = index >= 12 ? undefined : board.cells[index + 4];
    if (right?.value === tile.value || down?.value === tile.value) return true;
  }
  return false;
}

export function highestTile(board: BoardState): number {
  return board.cells.reduce((highest, tile) => Math.max(highest, tile?.value ?? 0), 0);
}
