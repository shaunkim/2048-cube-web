import type {
  BoardState,
  Cell,
  FaceId,
  GameMode,
  GamePreferences,
  GameState,
  GameStatus,
  ScoreRecords,
  StoredDocumentV1,
  Tile,
} from '../game/model';
import { normalizeSingleModeGame } from '../game/coordinator';

export const STORAGE_KEY = '2048-cube:game:v1';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export type LoadedGameData = StoredDocumentV1;

const FACE_IDS = ['top', 'left', 'right'] as const satisfies readonly FaceId[];
const EMPTY_RECORDS: ScoreRecords = {
  bestTotalScore: 0,
  bestFaceScores: { top: 0, left: 0, right: 0 },
};
const DEFAULT_PREFERENCES: GamePreferences = { mode: 'continue' };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function isGameMode(value: unknown): value is GameMode {
  return value === 'strict' || value === 'continue';
}

function isGameStatus(value: unknown): value is GameStatus {
  return value === 'playing' || value === 'gameOver';
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveSafePowerOfTwo(value: number): boolean {
  if (!Number.isSafeInteger(value) || value <= 0) return false;

  let remaining = value;
  while (remaining > 1) {
    if (remaining % 2 !== 0) return false;
    remaining /= 2;
  }
  return true;
}

function isTile(value: unknown): value is Tile {
  if (!isObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.value === 'number' &&
    isPositiveSafePowerOfTwo(value.value)
  );
}

function isCell(value: unknown): value is Cell {
  return value === null || isTile(value);
}

function highestTile(board: BoardState): number {
  return board.cells.reduce((highest, cell) => Math.max(highest, cell?.value ?? 0), 0);
}

function hasLegalMove(board: BoardState): boolean {
  for (let index = 0; index < 16; index += 1) {
    const tile = board.cells[index];
    if (!tile) return true;

    const right = index % 4 === 3 ? undefined : board.cells[index + 1];
    const down = index >= 12 ? undefined : board.cells[index + 4];
    if (right?.value === tile.value || down?.value === tile.value) return true;
  }
  return false;
}

function asBoard(value: unknown): BoardState | null {
  if (!isObject(value) || !Array.isArray(value.cells) || value.cells.length !== 16) return null;
  if (!value.cells.every(isCell)) return null;
  if (!isNonNegativeFiniteNumber(value.score)) return null;
  if (typeof value.completed2048 !== 'boolean' || typeof value.frozen !== 'boolean') return null;

  const board: BoardState = {
    cells: value.cells,
    score: value.score,
    completed2048: value.completed2048,
    frozen: value.frozen,
  };
  return highestTile(board) >= 2048 && !board.completed2048 ? null : board;
}

function asFaces(value: unknown): GameState['faces'] | null {
  if (!isObject(value) || !hasExactlyKeys(value, FACE_IDS)) return null;

  const top = asBoard(value.top);
  const left = asBoard(value.left);
  const right = asBoard(value.right);
  return top && left && right ? { top, left, right } : null;
}

function hasUniqueTileIds(faces: GameState['faces']): boolean {
  const ids = new Set<string>();

  for (const face of FACE_IDS) {
    for (const tile of faces[face].cells) {
      if (!tile) continue;
      if (ids.has(tile.id)) return false;
      ids.add(tile.id);
    }
  }

  return true;
}

function hasValidStatusInvariants(
  faces: GameState['faces'],
  mode: GameMode,
  status: GameStatus,
): boolean {
  const boards = FACE_IDS.map((face) => faces[face]);
  const dead = boards.map((board) => !hasLegalMove(board));

  if (mode === 'strict') {
    return boards.every((board) => !board.frozen) === true &&
      (status === 'gameOver') === dead.some(Boolean);
  }

  return boards.every((board, index) => board.frozen === dead[index]) &&
    (status === 'gameOver') === boards.every((board) => board.frozen);
}

function asGameState(value: unknown): GameState | null {
  if (!isObject(value) || value.schemaVersion !== 1 || !isGameMode(value.mode)) return null;
  if (!isGameStatus(value.status) || typeof value.victoryReached !== 'boolean') return null;
  if (typeof value.turn !== 'number' || !Number.isInteger(value.turn) || value.turn < 0) return null;

  const faces = asFaces(value.faces);
  if (!faces || !hasUniqueTileIds(faces)) return null;

  const victoryReached = FACE_IDS.every((face) => faces[face].completed2048);
  if (value.victoryReached !== victoryReached) return null;
  if (!hasValidStatusInvariants(faces, value.mode, value.status)) return null;

  return {
    schemaVersion: 1,
    faces,
    mode: value.mode,
    status: value.status,
    victoryReached: value.victoryReached,
    turn: value.turn,
  };
}

function asScoreRecords(value: unknown): ScoreRecords | null {
  if (!isObject(value) || !isNonNegativeFiniteNumber(value.bestTotalScore)) return null;
  if (!isObject(value.bestFaceScores) || !hasExactlyKeys(value.bestFaceScores, FACE_IDS)) return null;

  const { top, left, right } = value.bestFaceScores;
  if (
    !isNonNegativeFiniteNumber(top) ||
    !isNonNegativeFiniteNumber(left) ||
    !isNonNegativeFiniteNumber(right)
  ) {
    return null;
  }

  return {
    bestTotalScore: value.bestTotalScore,
    bestFaceScores: { top, left, right },
  };
}

function asVersionOneDocument(value: unknown): Record<string, unknown> | null {
  return isObject(value) && value.version === 1 ? value : null;
}

export function createFreshDocument(game: GameState): StoredDocumentV1 {
  const activeRun = normalizeSingleModeGame(game);
  return {
    version: 1,
    activeRun,
    records: EMPTY_RECORDS,
    preferences: DEFAULT_PREFERENCES,
  };
}

export async function saveGameData(store: KeyValueStore, document: StoredDocumentV1): Promise<void> {
  await store.setItem(STORAGE_KEY, JSON.stringify(document));
}

export async function loadGameData(
  store: KeyValueStore,
  fallbackGame: GameState,
): Promise<LoadedGameData> {
  const stored = await store.getItem(STORAGE_KEY);
  if (stored === null) return createFreshDocument(fallbackGame);

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return createFreshDocument(fallbackGame);
  }

  const document = asVersionOneDocument(parsed);
  if (!document) return createFreshDocument(fallbackGame);

  const activeRun = asGameState(document.activeRun);
  return {
    version: 1,
    activeRun: normalizeSingleModeGame(activeRun ?? fallbackGame),
    records: asScoreRecords(document.records) ?? EMPTY_RECORDS,
    preferences: DEFAULT_PREFERENCES,
  };
}

export function updateScoreRecords(records: ScoreRecords, game: GameState): ScoreRecords {
  const scores = game.faces;
  return {
    bestTotalScore: Math.max(
      records.bestTotalScore,
      scores.top.score + scores.left.score + scores.right.score,
    ),
    bestFaceScores: {
      top: Math.max(records.bestFaceScores.top, scores.top.score),
      left: Math.max(records.bestFaceScores.left, scores.left.score),
      right: Math.max(records.bestFaceScores.right, scores.right.score),
    },
  };
}
