import {
  createFreshDocument,
  loadGameData,
  saveGameData,
  updateScoreRecords,
  type KeyValueStore,
} from '../gameStorage';
import type { BoardState, Cell, GameState, Tile } from '../../game/model';

function memoryStore(initial: string | null = null): KeyValueStore {
  let value = initial;
  return {
    getItem: async () => value,
    setItem: async (_key, next) => {
      value = next;
    },
  };
}

function validFixtureGame(): GameState {
  const board = (): BoardState => ({
    cells: Array.from({ length: 16 }, () => null),
    score: 0,
    completed2048: false,
    frozen: false,
  });
  return {
    schemaVersion: 1,
    faces: { top: board(), left: board(), right: board() },
    mode: 'continue',
    status: 'playing',
    victoryReached: false,
    turn: 0,
  };
}

function tile(id: string, value: number): Tile {
  return { id, value };
}

function withCells(game: GameState, cells: readonly Cell[]): GameState {
  return {
    ...game,
    faces: {
      ...game.faces,
      top: { ...game.faces.top, cells },
    },
  };
}

function withTopTile(game: GameState, value: number, completed2048 = false): GameState {
  return {
    ...game,
    faces: {
      ...game.faces,
      top: {
        ...game.faces.top,
        cells: [tile('top-tile', value), ...Array.from({ length: 15 }, () => null)],
        completed2048,
      },
    },
  };
}

function withDeadTopBoard(game: GameState, frozen = false): GameState {
  const values = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  return {
    ...game,
    faces: {
      ...game.faces,
      top: {
        ...game.faces.top,
        cells: values.map((value, index) => tile(`dead-${index}`, value)),
        frozen,
      },
    },
  };
}

function serializedWithInvalidRun(invalidRun: unknown): string {
  return JSON.stringify({
    version: 1,
    activeRun: invalidRun,
    records: { bestTotalScore: 99, bestFaceScores: { top: 10, left: 20, right: 30 } },
    preferences: { mode: 'continue' },
  });
}

it('round-trips a version-one document', async () => {
  const game = validFixtureGame();
  const document = createFreshDocument(game);
  const store = memoryStore();

  await saveGameData(store, document);

  await expect(loadGameData(store, game)).resolves.toEqual(document);
});

it('replaces an invalid active run but preserves valid records and preferences', async () => {
  const fallback = validFixtureGame();
  const malformed = serializedWithInvalidRun({ schemaVersion: 1, faces: {} });

  const loaded = await loadGameData(memoryStore(malformed), fallback);

  expect(loaded.activeRun).toEqual(fallback);
  expect(loaded.records).toEqual({
    bestTotalScore: 99,
    bestFaceScores: { top: 10, left: 20, right: 30 },
  });
  expect(loaded.preferences).toEqual({ mode: 'continue' });
});

it.each([
  [
    'within one face',
    {
      ...validFixtureGame(),
      faces: {
        ...validFixtureGame().faces,
        top: {
          ...validFixtureGame().faces.top,
          cells: [
            tile('duplicate', 2),
            tile('duplicate', 4),
            ...Array.from({ length: 14 }, () => null),
          ],
        },
      },
    },
  ],
  [
    'across two faces',
    {
      ...validFixtureGame(),
      faces: {
        ...validFixtureGame().faces,
        top: {
          ...validFixtureGame().faces.top,
          cells: [tile('duplicate', 2), ...Array.from({ length: 15 }, () => null)],
        },
        left: {
          ...validFixtureGame().faces.left,
          cells: [tile('duplicate', 4), ...Array.from({ length: 15 }, () => null)],
        },
      },
    },
  ],
])('rejects duplicate tile IDs %s across the active run', async (_description, invalidRun) => {
  const fallback = validFixtureGame();

  const loaded = await loadGameData(
    memoryStore(serializedWithInvalidRun(invalidRun)),
    fallback,
  );

  expect(loaded.activeRun).toEqual(fallback);
  expect(loaded.records.bestTotalScore).toBe(99);
  expect(loaded.preferences).toEqual({ mode: 'continue' });
});

it('keeps a run containing a large power-of-two tile', async () => {
  const fallback = validFixtureGame();
  const run = withTopTile(fallback, 2147483648, true);
  const stored = JSON.stringify({
    version: 1,
    activeRun: run,
    records: { bestTotalScore: 0, bestFaceScores: { top: 0, left: 0, right: 0 } },
    preferences: { mode: 'strict' },
  });

  await expect(loadGameData(memoryStore(stored), fallback)).resolves.toEqual(
    expect.objectContaining({ activeRun: run }),
  );
});

it('restores historical face completion after the original 2048 is gone', async () => {
  const fallback = validFixtureGame();
  const run = {
    ...fallback,
    faces: {
      ...fallback.faces,
      top: {
        ...fallback.faces.top,
        cells: [tile('after-2048', 4), ...Array.from({ length: 15 }, () => null)],
        completed2048: true,
      },
    },
  };
  const stored = JSON.stringify({
    version: 1,
    activeRun: run,
    records: { bestTotalScore: 0, bestFaceScores: { top: 0, left: 0, right: 0 } },
    preferences: { mode: 'continue' },
  });

  await expect(loadGameData(memoryStore(stored), fallback)).resolves.toEqual(
    expect.objectContaining({ activeRun: run }),
  );
});

it('rejects a current 2048 tile whose face is not marked completed', async () => {
  const fallback = validFixtureGame();
  const impossibleRun = withTopTile(fallback, 2048, false);

  const loaded = await loadGameData(
    memoryStore(serializedWithInvalidRun(impossibleRun)),
    fallback,
  );

  expect(loaded.activeRun).toEqual(fallback);
});

it('normalizes a valid legacy strict game-over document to single-mode play', async () => {
  const fallback = validFixtureGame();
  const strictGameOver = {
    ...withDeadTopBoard(fallback),
    mode: 'strict' as const,
    status: 'gameOver' as const,
  };
  const stored = JSON.stringify({
    version: 1,
    activeRun: strictGameOver,
    records: { bestTotalScore: 12, bestFaceScores: { top: 12, left: 0, right: 0 } },
    preferences: { mode: 'strict' },
  });

  const loaded = await loadGameData(memoryStore(stored), fallback);

  expect(loaded.activeRun).toEqual({
    ...strictGameOver,
    mode: 'continue',
    status: 'playing',
    faces: {
      ...strictGameOver.faces,
      top: { ...strictGameOver.faces.top, frozen: true },
    },
  });
  expect(loaded.preferences).toEqual({ mode: 'continue' });
});

it('recovers from a Number.MAX_VALUE tile while preserving valid independent sections', async () => {
  const fallback = validFixtureGame();
  const loaded = await loadGameData(
    memoryStore(serializedWithInvalidRun(withTopTile(fallback, Number.MAX_VALUE, true))),
    fallback,
  );

  expect(loaded.activeRun).toEqual(fallback);
  expect(loaded.records).toEqual({
    bestTotalScore: 99,
    bestFaceScores: { top: 10, left: 20, right: 30 },
  });
  expect(loaded.preferences).toEqual({ mode: 'continue' });
});

it.each([
  [
    'a non-power-of-two tile',
    withCells(validFixtureGame(), [tile('odd', 3), ...Array.from({ length: 15 }, () => null)]),
  ],
  [
    'a large non-power-of-two tile',
    withTopTile(validFixtureGame(), 4294967297, true),
  ],
  [
    'a negative score',
    {
      ...validFixtureGame(),
      faces: { ...validFixtureGame().faces, top: { ...validFixtureGame().faces.top, score: -1 } },
    },
  ],
  ['an unknown mode', { ...validFixtureGame(), mode: 'arcade' }],
  ['inconsistent victory flags', { ...validFixtureGame(), victoryReached: true }],
  [
    'a strict frozen face',
    {
      ...validFixtureGame(),
      faces: { ...validFixtureGame().faces, top: { ...validFixtureGame().faces.top, frozen: true } },
    },
  ],
  [
    'a continue live frozen face',
    {
      ...validFixtureGame(),
      mode: 'continue',
      faces: { ...validFixtureGame().faces, top: { ...validFixtureGame().faces.top, frozen: true } },
    },
  ],
  ['a strict playing run with a dead face', withDeadTopBoard(validFixtureGame())],
  ['a strict game-over run with only live faces', { ...validFixtureGame(), status: 'gameOver' }],
  [
    'a continue dead-but-unfrozen face',
    { ...withDeadTopBoard(validFixtureGame()), mode: 'continue' },
  ],
])('recovers from %s without discarding valid independent sections', async (_description, invalidRun) => {
  const fallback = validFixtureGame();

  const loaded = await loadGameData(memoryStore(serializedWithInvalidRun(invalidRun)), fallback);

  expect(loaded.activeRun).toEqual(fallback);
  expect(loaded.records.bestTotalScore).toBe(99);
  expect(loaded.records.bestFaceScores).toEqual({ top: 10, left: 20, right: 30 });
  expect(loaded.preferences).toEqual({ mode: 'continue' });
});

it.each([
  ['invalid JSON', '{', 'malformed JSON'],
  [
    'an older version',
    JSON.stringify({
      version: 0,
      activeRun: validFixtureGame(),
      records: { bestTotalScore: 99, bestFaceScores: { top: 10, left: 20, right: 30 } },
      preferences: { mode: 'continue' },
    }),
    'unsupported version',
  ],
])('uses a fresh document for %s', async (_description, stored) => {
  const fallback = validFixtureGame();

  await expect(loadGameData(memoryStore(stored), fallback)).resolves.toEqual(
    createFreshDocument(fallback),
  );
});

it.each([
  [
    'invalid records',
    { bestTotalScore: -1, bestFaceScores: { top: 0, left: 0, right: 0 } },
    { mode: 'continue' },
    { bestTotalScore: 0, bestFaceScores: { top: 0, left: 0, right: 0 } },
    { mode: 'continue' },
  ],
  [
    'invalid preferences',
    { bestTotalScore: 10, bestFaceScores: { top: 1, left: 2, right: 3 } },
    { mode: 'unknown' },
    { bestTotalScore: 10, bestFaceScores: { top: 1, left: 2, right: 3 } },
    { mode: 'continue' },
  ],
])('defaults %s without discarding other valid sections', async (
  _description,
  records,
  preferences,
  expectedRecords,
  expectedPreferences,
) => {
  const game = validFixtureGame();
  const stored = JSON.stringify({
    version: 1,
    activeRun: game,
    records,
    preferences,
  });

  const loaded = await loadGameData(memoryStore(stored), game);

  expect(loaded.activeRun).toEqual(game);
  expect(loaded.records).toEqual(expectedRecords);
  expect(loaded.preferences).toEqual(expectedPreferences);
});

it('retains the highest total and per-face score records', () => {
  const game = {
    ...validFixtureGame(),
    faces: {
      top: { ...validFixtureGame().faces.top, score: 50 },
      left: { ...validFixtureGame().faces.left, score: 20 },
      right: { ...validFixtureGame().faces.right, score: 40 },
    },
  };

  expect(
    updateScoreRecords(
      { bestTotalScore: 100, bestFaceScores: { top: 60, left: 10, right: 45 } },
      game,
    ),
  ).toEqual({ bestTotalScore: 110, bestFaceScores: { top: 60, left: 20, right: 45 } });
});
