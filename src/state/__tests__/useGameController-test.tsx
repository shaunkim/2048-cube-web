import { act, renderHook, waitFor } from '@testing-library/react-native';
import { monotonicIdSource } from '../../game/runtime';
import { scoreMultiplierFor } from '../../game/coordinator';
import type {
  BoardState,
  Cell,
  GameState,
  IdSource,
  RandomSource,
  ScoreRecords,
  StoredDocumentV1,
  Tile,
} from '../../game/model';
import { STORAGE_KEY, type KeyValueStore } from '../../storage/gameStorage';
import { useGameController } from '../useGameController';

jest.mock('../../storage/platformStore', () => ({
  platformStore: {
    getItem: async () => null,
    setItem: async () => undefined,
  },
}));

function repeatingRandom(values: readonly number[]): RandomSource {
  let index = 0;
  return { next: () => values[index++ % values.length] ?? 0 };
}

function incrementingIds(prefix: string): IdSource {
  let index = 1;
  return { next: () => `${prefix}-${index++}` };
}

function memoryStore(initial: string | null = null): KeyValueStore {
  let value = initial;
  return {
    getItem: async () => value,
    setItem: async (_key, next) => {
      value = next;
    },
  };
}

function trackedMemoryStore(initial: string | null = null): KeyValueStore & { writeCount(): number } {
  let value = initial;
  let writes = 0;
  return {
    getItem: async () => value,
    setItem: async (_key, next) => {
      writes += 1;
      value = next;
    },
    writeCount: () => writes,
  };
}

function tile(id: string, value: number): Tile {
  return { id, value };
}

function emptyBoard(): BoardState {
  return {
    cells: Array.from({ length: 16 }, () => null),
    score: 0,
    completed2048: false,
    frozen: false,
  };
}

function deadBoard(prefix: string): BoardState {
  const values = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  return { ...emptyBoard(), cells: values.map((value, index) => tile(`${prefix}-${index}`, value)) };
}

function strictGameOver(): GameState {
  const top = deadBoard('top');
  return {
    schemaVersion: 1,
    faces: {
      top: {
        ...top,
        cells: [tile('top-complete', 2048), ...top.cells.slice(1)],
        score: 128,
        completed2048: true,
      },
      left: {
        ...emptyBoard(),
        cells: [tile('left', 2), ...Array.from({ length: 15 }, () => null)],
        score: 8,
      },
      right: {
        ...emptyBoard(),
        cells: [tile('right', 4), ...Array.from({ length: 15 }, () => null)],
        score: 16,
      },
    },
    mode: 'strict',
    status: 'gameOver',
    victoryReached: false,
    turn: 7,
  };
}

function document(activeRun: GameState, records: ScoreRecords, mode: 'strict' | 'continue' = 'strict') {
  return JSON.stringify({ version: 1, activeRun, records, preferences: { mode } } satisfies StoredDocumentV1);
}

async function waitForHydration(result: { current: ReturnType<typeof useGameController> }) {
  await waitFor(() => expect(result.current.hydrated).toBe(true));
}

async function waitForStoredDocument(
  store: KeyValueStore,
  matches: (document: StoredDocumentV1) => boolean = () => true,
): Promise<StoredDocumentV1> {
  let stored: string | null = null;
  await waitFor(async () => {
    stored = await store.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(matches(JSON.parse(stored ?? '') as StoredDocumentV1)).toBe(true);
  });
  return JSON.parse(stored ?? '') as StoredDocumentV1;
}

afterEach(() => {
  jest.useRealTimers();
});

it('locks one changed global turn, saves its exact next state, then unlocks after 180ms', async () => {
  jest.useFakeTimers();
  const store = memoryStore();
  const { result } = renderHook(() => useGameController({
    random: repeatingRandom([0, 0]),
    ids: incrementingIds('test'),
    store,
    animationMs: 180,
  }));

  await waitForHydration(result);

  act(() => {
    result.current.move('down');
    result.current.move('up');
  });
  expect(result.current.locked).toBe(true);
  expect(result.current.game.turn).toBe(1);

  const saved = await waitForStoredDocument(store, (candidate) => candidate.activeRun.turn === 1);
  expect(saved.activeRun).toEqual(result.current.game);

  await act(async () => jest.advanceTimersByTimeAsync(180));
  expect(result.current.locked).toBe(false);
});

it('keeps a first-completion celebration after input unlock and clears it at 400ms', async () => {
  jest.useFakeTimers();
  const leftCells = Array.from({ length: 16 }, () => null) as Cell[];
  leftCells[0] = tile('left-a', 1024);
  leftCells[4] = tile('left-b', 1024);
  const activeRun: GameState = {
    schemaVersion: 1,
    faces: {
      top: emptyBoard(),
      left: { ...emptyBoard(), cells: leftCells },
      right: emptyBoard(),
    },
    mode: 'continue',
    status: 'playing',
    victoryReached: false,
    turn: 0,
  };
  const store = memoryStore(document(activeRun, {
    bestTotalScore: 0,
    bestFaceScores: { top: 0, left: 0, right: 0 },
  }, 'continue'));
  const { result } = renderHook(() => useGameController({
    random: repeatingRandom([0, 0]),
    ids: incrementingIds('celebrate'),
    store,
    animationMs: 180,
  }));

  await waitForHydration(result);
  act(() => result.current.move('up'));
  expect(result.current.celebration?.completedFacesStarted).toEqual(['left']);
  expect(result.current.locked).toBe(true);

  await act(async () => jest.advanceTimersByTimeAsync(180));
  expect(result.current.locked).toBe(false);
  expect(result.current.celebration).not.toBeNull();

  await act(async () => jest.advanceTimersByTimeAsync(219));
  expect(result.current.celebration).not.toBeNull();

  await act(async () => jest.advanceTimersByTimeAsync(1));
  expect(result.current.celebration).toBeNull();
});

it('counts an unchanged direction without locking, turning, or saving', async () => {
  const store = trackedMemoryStore();
  const { result } = renderHook(() => useGameController({
    random: repeatingRandom([0, 0]),
    ids: incrementingIds('test'),
    store,
    animationMs: 180,
  }));

  await waitForHydration(result);
  await waitFor(() => expect(store.writeCount()).toBe(1));
  act(() => result.current.move('up'));

  expect(result.current.invalidMoveCount).toBe(1);
  expect(result.current.locked).toBe(false);
  expect(result.current.game.turn).toBe(0);
  expect(store.writeCount()).toBe(1);
});

it('checkpoints a fresh hydrated run so an immediate reload restores that exact run', async () => {
  const store = memoryStore();
  const first = renderHook(() => useGameController({
    random: repeatingRandom([0, 0]),
    ids: incrementingIds('first'),
    store,
  }));

  await waitForHydration(first.result);
  const hydratedGame = first.result.current.game;
  await waitForStoredDocument(store);
  first.unmount();

  const second = renderHook(() => useGameController({
    random: repeatingRandom([0.99, 0.95]),
    ids: incrementingIds('second'),
    store,
  }));
  await waitForHydration(second.result);

  expect(second.result.current.game).toEqual(hydratedGame);
  second.unmount();
});

it('durably replaces an invalid active run while retaining valid records and preferences', async () => {
  const records = { bestTotalScore: 200, bestFaceScores: { top: 128, left: 8, right: 16 } };
  const store = memoryStore(JSON.stringify({
    version: 1,
    activeRun: { schemaVersion: 1, faces: {} },
    records,
    preferences: { mode: 'continue' },
  }));
  const first = renderHook(() => useGameController({
    random: repeatingRandom([0, 0]),
    ids: incrementingIds('recovered'),
    store,
  }));

  await waitForHydration(first.result);
  const recoveredGame = first.result.current.game;
  const recoveredDocument = await waitForStoredDocument(
    store,
    (candidate) => JSON.stringify(candidate.activeRun) === JSON.stringify(recoveredGame),
  );
  expect(recoveredDocument).toEqual({
    version: 1,
    activeRun: recoveredGame,
    records,
    preferences: { mode: 'continue' },
  });
  first.unmount();

  const second = renderHook(() => useGameController({
    random: repeatingRandom([0.99, 0.95]),
    ids: incrementingIds('different'),
    store,
  }));
  await waitForHydration(second.result);

  expect(second.result.current.game).toEqual(recoveredGame);
  expect(second.result.current.records).toEqual(records);
  expect(second.result.current.preferences).toEqual({ mode: 'continue' });
  second.unmount();
});

it('normalizes a strict game-over run during hydration without changing progress', async () => {
  const game = strictGameOver();
  const records = { bestTotalScore: 200, bestFaceScores: { top: 128, left: 8, right: 16 } };
  const store = memoryStore(document(game, records));
  const { result } = renderHook(() => useGameController({ store }));

  await waitForHydration(result);

  expect(result.current.game).toEqual({
    ...game,
    mode: 'continue',
    status: 'playing',
    faces: { ...game.faces, top: { ...game.faces.top, frozen: true } },
  });
  expect(result.current.records).toEqual(records);
  expect(result.current).not.toHaveProperty('continueRun');
  expect(result.current).not.toHaveProperty('setPreferredMode');
});

it('restarts with two tiles on each face while preserving records and preferences', async () => {
  const records = { bestTotalScore: 200, bestFaceScores: { top: 128, left: 8, right: 16 } };
  const store = memoryStore(document(strictGameOver(), records, 'continue'));
  const { result } = renderHook(() => useGameController({
    random: repeatingRandom([0, 0]),
    ids: incrementingIds('restart'),
    store,
  }));

  await waitForHydration(result);
  act(() => result.current.restart());

  expect(result.current.game.mode).toBe('continue');
  expect(result.current.game.turn).toBe(0);
  expect(Object.values(result.current.game.faces).map((board) => board.cells.filter(Boolean))).toHaveLength(3);
  expect(Object.values(result.current.game.faces).every((board) => board.cells.filter(Boolean).length === 2)).toBe(true);
  expect(Object.values(result.current.game.faces).every((board) => !board.completed2048)).toBe(true);
  expect(scoreMultiplierFor(result.current.game.faces)).toBe(1);
  expect(result.current.records).toEqual(records);
  expect(result.current.preferences).toEqual({ mode: 'continue' });
});

it('leaves the latest restart document stored when an older turn write settles last', async () => {
  let stored: string | null = null;
  let releaseFirstWrite: (() => void) | null = null;
  const store: KeyValueStore = {
    getItem: async () => stored,
    setItem: async (_key, value) => {
      if (releaseFirstWrite === null) {
        await new Promise<void>((resolve) => {
          releaseFirstWrite = () => {
            stored = value;
            resolve();
          };
        });
        return;
      }
      stored = value;
    },
  };
  const { result } = renderHook(() => useGameController({
    random: repeatingRandom([0, 0]),
    ids: incrementingIds('queued'),
    store,
  }));

  await waitForHydration(result);
  act(() => result.current.move('down'));
  act(() => result.current.restart());
  await waitFor(() => expect(releaseFirstWrite).not.toBeNull());
  act(() => releaseFirstWrite?.());

  await waitFor(async () => {
    const stored = await store.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const saved = JSON.parse(stored ?? '') as StoredDocumentV1;
    expect(saved.activeRun).toEqual(result.current.game);
  });
});

it('reserves restored production tile IDs before a next ID can be requested', async () => {
  const restored = {
    ...strictGameOver(),
    faces: {
      ...strictGameOver().faces,
      left: {
        ...strictGameOver().faces.left,
        cells: [tile('tile-999', 2), ...Array.from({ length: 15 }, () => null)] as Cell[],
      },
    },
    status: 'gameOver' as const,
  };
  const store = memoryStore(document(restored, { bestTotalScore: 0, bestFaceScores: { top: 0, left: 0, right: 0 } }));
  const { result } = renderHook(() => useGameController({ store }));

  await waitForHydration(result);
  expect(Number(monotonicIdSource.next().replace('tile-', ''))).toBeGreaterThanOrEqual(1000);
});

it('keeps a committed move in memory and continues later saves when persistence rejects', async () => {
  let writeCount = 0;
  let stored: string | null = null;
  const store: KeyValueStore = {
    getItem: async () => null,
    setItem: async (_key, value) => {
      if (writeCount++ === 0) throw new Error('disk unavailable');
      stored = value;
    },
  };
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const { result } = renderHook(() => useGameController({
    random: repeatingRandom([0, 0]),
    ids: incrementingIds('test'),
    store,
  }));

  await waitForHydration(result);
  act(() => result.current.move('down'));

  expect(result.current.game.turn).toBe(1);
  expect(result.current.locked).toBe(true);
  act(() => result.current.restart());
  await waitFor(() => expect(warning).toHaveBeenCalled());
  await waitFor(async () => {
    expect(stored).not.toBeNull();
    const saved = JSON.parse(stored ?? '') as StoredDocumentV1;
    expect(saved.preferences).toEqual({ mode: 'continue' });
    expect(saved.activeRun).toEqual(result.current.game);
  });
  warning.mockRestore();
});
