import { applyBoardMove, createInitialBoard, hasLegalMove } from './board';
import type {
  BoardState,
  FaceId,
  FaceTurnEvent,
  GameMode,
  GameState,
  GameStatus,
  GlobalDirection,
  GlobalTurnResult,
  IdSource,
  LocalDirection,
  RandomSource,
  ScoreMultiplier,
} from './model';

export const DIRECTION_TARGETS = {
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
} as const satisfies Record<
  GlobalDirection,
  readonly [
    { readonly face: FaceId; readonly direction: LocalDirection },
    { readonly face: FaceId; readonly direction: LocalDirection },
  ]
>;

const FACE_IDS: readonly FaceId[] = ['top', 'left', 'right'];

export function completedFaceCount(faces: GameState['faces']): number {
  return FACE_IDS.filter((face) => faces[face].completed2048).length;
}

export function scoreMultiplierFor(faces: GameState['faces']): ScoreMultiplier {
  return 2 ** completedFaceCount(faces) as ScoreMultiplier;
}

function faceEvents(
  state: GameState,
  direction: GlobalDirection,
  random: RandomSource,
  ids: IdSource,
  scoreMultiplier: ScoreMultiplier,
): readonly FaceTurnEvent[] {
  return DIRECTION_TARGETS[direction].map(({ face, direction: localDirection }) => ({
    ...applyBoardMove(state.faces[face], localDirection, random, ids, scoreMultiplier),
    face,
    direction: localDirection,
  }));
}

function withFrozenDeadFaces(
  faces: GameState['faces'],
): Readonly<Record<FaceId, BoardState>> {
  let nextFaces = faces;

  for (const face of FACE_IDS) {
    const board = nextFaces[face];
    const frozen = board.frozen || !hasLegalMove(board);
    if (frozen !== board.frozen) {
      nextFaces = { ...nextFaces, [face]: { ...board, frozen } };
    }
  }

  return nextFaces;
}

function allFacesCompleted(faces: GameState['faces']): boolean {
  return FACE_IDS.every((face) => faces[face].completed2048);
}

function allFacesFrozen(faces: GameState['faces']): boolean {
  return FACE_IDS.every((face) => faces[face].frozen);
}

export function startGame(mode: GameMode, random: RandomSource, ids: IdSource): GameState {
  return {
    schemaVersion: 1,
    faces: {
      top: createInitialBoard(random, ids),
      left: createInitialBoard(random, ids),
      right: createInitialBoard(random, ids),
    },
    mode,
    status: 'playing',
    victoryReached: false,
    turn: 0,
  };
}

export function applyGlobalMove(
  state: GameState,
  direction: GlobalDirection,
  random: RandomSource,
  ids: IdSource,
): GlobalTurnResult {
  if (state.status !== 'playing') {
    return {
      state,
      changed: false,
      faces: [],
      completedFacesStarted: [],
      victoryStarted: false,
      gameOverStarted: false,
    };
  }

  const scoreMultiplier = scoreMultiplierFor(state.faces);
  const faces = faceEvents(state, direction, random, ids, scoreMultiplier);
  const completedFacesStarted = faces
    .filter((face) => face.completed2048Started)
    .map((face) => face.face);
  const changed = faces.some((face) => face.changed);
  let nextFaces: GameState['faces'] = state.faces;

  for (const face of faces) {
    if (face.changed) {
      nextFaces = { ...nextFaces, [face.face]: face.board };
    }
  }

  const victoryReached = state.victoryReached || allFacesCompleted(nextFaces);
  const victoryStarted = victoryReached && !state.victoryReached;
  nextFaces = withFrozenDeadFaces(nextFaces);
  const status: GameStatus = allFacesFrozen(nextFaces) ? 'gameOver' : 'playing';

  const gameOverStarted = status === 'gameOver';
  const nextState: GameState = {
    ...state,
    faces: nextFaces,
    mode: 'continue',
    status,
    victoryReached,
    turn: changed ? state.turn + 1 : state.turn,
  };

  return {
    state: nextState,
    changed,
    faces,
    completedFacesStarted,
    victoryStarted,
    gameOverStarted,
  };
}

export function continueAfterStrictGameOver(state: GameState): GameState {
  return normalizeSingleModeGame(state);
}

export function normalizeSingleModeGame(state: GameState): GameState {
  const faces = withFrozenDeadFaces(state.faces);
  return {
    ...state,
    faces,
    mode: 'continue',
    status: allFacesFrozen(faces) ? 'gameOver' : 'playing',
  };
}
