export const BOARD_SIZE = 4 as const;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

export type FaceId = 'top' | 'left' | 'right';
export type LocalDirection = 'up' | 'down' | 'left' | 'right';
export type GlobalDirection =
  | 'up'
  | 'down'
  | 'upLeft'
  | 'downRight'
  | 'upRight'
  | 'downLeft';

export interface Tile {
  readonly id: string;
  readonly value: number;
}

export type Cell = Tile | null;

export interface RandomSource {
  next(): number;
}

export interface IdSource {
  next(): string;
}

export interface LineMotion {
  readonly tileId: string;
  readonly value: number;
  readonly from: number;
  readonly to: number;
}

export interface LineMerge {
  readonly sourceIds: readonly [string, string];
  readonly result: Tile;
  readonly at: number;
}

export interface CollapseLineResult {
  readonly cells: readonly Cell[];
  readonly changed: boolean;
  readonly scoreDelta: number;
  readonly motions: readonly LineMotion[];
  readonly merges: readonly LineMerge[];
}

export interface BoardState {
  readonly cells: readonly Cell[];
  readonly score: number;
  readonly completed2048: boolean;
  readonly frozen: boolean;
}

export interface BoardMotion extends LineMotion {
  readonly from: number;
  readonly to: number;
}

export interface BoardMerge {
  readonly sourceIds: readonly [string, string];
  readonly result: Tile;
  readonly at: number;
}

export interface SpawnEvent {
  readonly tile: Tile;
  readonly at: number;
}

export interface BoardTurnResult {
  readonly board: BoardState;
  readonly changed: boolean;
  readonly completed2048Started: boolean;
  readonly motions: readonly BoardMotion[];
  readonly merges: readonly BoardMerge[];
  readonly spawn?: SpawnEvent;
}

export type GameMode = 'strict' | 'continue';
export type GameStatus = 'playing' | 'gameOver';
export type ScoreMultiplier = 1 | 2 | 4 | 8;

export interface GameState {
  readonly schemaVersion: 1;
  readonly faces: Readonly<Record<FaceId, BoardState>>;
  readonly mode: GameMode;
  readonly status: GameStatus;
  readonly victoryReached: boolean;
  readonly turn: number;
}

export interface ScoreRecords {
  readonly bestTotalScore: number;
  readonly bestFaceScores: Readonly<Record<FaceId, number>>;
}

export interface GamePreferences {
  readonly mode: GameMode;
}

export interface StoredDocumentV1 {
  readonly version: 1;
  readonly activeRun: GameState;
  readonly records: ScoreRecords;
  readonly preferences: GamePreferences;
}

export interface FaceTurnEvent extends BoardTurnResult {
  readonly face: FaceId;
  readonly direction: LocalDirection;
}

export interface GlobalTurnResult {
  readonly state: GameState;
  readonly changed: boolean;
  readonly faces: readonly FaceTurnEvent[];
  readonly completedFacesStarted: readonly FaceId[];
  readonly victoryStarted: boolean;
  readonly gameOverStarted: boolean;
}
