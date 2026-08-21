import { useCallback, useEffect, useRef, useState } from 'react';

import {
  applyGlobalMove,
  normalizeSingleModeGame,
  startGame,
} from '../game/coordinator';
import type {
  GamePreferences,
  GameState,
  GlobalDirection,
  GlobalTurnResult,
  IdSource,
  RandomSource,
  ScoreRecords,
  StoredDocumentV1,
} from '../game/model';
import {
  mathRandomSource,
  monotonicIdSource,
  reservePersistedTileIds,
} from '../game/runtime';
import {
  loadGameData,
  saveGameData,
  updateScoreRecords,
  type KeyValueStore,
} from '../storage/gameStorage';
import { platformStore } from '../storage/platformStore';

export interface GameControllerDependencies {
  readonly random: RandomSource;
  readonly ids: IdSource;
  readonly store: KeyValueStore;
  readonly animationMs: number;
}

export interface GameControllerApi {
  readonly game: GameState;
  readonly records: ScoreRecords;
  readonly preferences: GamePreferences;
  readonly hydrated: boolean;
  readonly locked: boolean;
  readonly animation: GlobalTurnResult | null;
  readonly celebration: GlobalTurnResult | null;
  readonly invalidMoveCount: number;
  move(direction: GlobalDirection): void;
  restart(): void;
}

const EMPTY_RECORDS: ScoreRecords = {
  bestTotalScore: 0,
  bestFaceScores: { top: 0, left: 0, right: 0 },
};
const DEFAULT_PREFERENCES: GamePreferences = { mode: 'continue' };
export const FACE_COMPLETION_CELEBRATION_MS = 400;

function restoredTileIds(game: GameState): string[] {
  return Object.values(game.faces).flatMap((board) =>
    board.cells.flatMap((tile) => (tile ? [tile.id] : [])),
  );
}

function warnAboutStorage(error: unknown): void {
  if (__DEV__) console.warn('Unable to save 2048 Cube state', error);
}

export function useGameController(
  dependencies?: Partial<GameControllerDependencies>,
): GameControllerApi {
  const [resolvedDependencies] = useState<GameControllerDependencies>(
    () => ({
      random: dependencies?.random ?? mathRandomSource,
      ids: dependencies?.ids ?? monotonicIdSource,
      store: dependencies?.store ?? platformStore,
      animationMs: dependencies?.animationMs ?? 100,
    }),
  );

  const [fallbackGame] = useState(() =>
    startGame('continue', resolvedDependencies.random, resolvedDependencies.ids),
  );
  const [game, setGame] = useState<GameState>(fallbackGame);
  const [records, setRecords] = useState<ScoreRecords>(EMPTY_RECORDS);
  const [preferences, setPreferences] = useState<GamePreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);
  const [locked, setLocked] = useState(false);
  const [animation, setAnimation] = useState<GlobalTurnResult | null>(null);
  const [celebration, setCelebration] = useState<GlobalTurnResult | null>(null);
  const [invalidMoveCount, setInvalidMoveCount] = useState(0);

  const gameRef = useRef(game);
  const recordsRef = useRef(records);
  const preferencesRef = useRef(preferences);
  const hydratedRef = useRef(false);
  const lockedRef = useRef(false);
  const invalidMoveCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeQueueRef = useRef(Promise.resolve());

  const save = useCallback((document: StoredDocumentV1): void => {
    writeQueueRef.current = writeQueueRef.current
      .then(() => saveGameData(resolvedDependencies.store, document))
      .catch(warnAboutStorage);
  }, [resolvedDependencies.store]);

  const clearAnimationLock = (): void => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lockedRef.current = false;
    setLocked(false);
    setAnimation(null);
  };

  useEffect(() => {
    let disposed = false;

    void loadGameData(resolvedDependencies.store, fallbackGame)
      .then((document) => {
        if (disposed) return;

        const normalizedGame = normalizeSingleModeGame(document.activeRun);
        const normalizedDocument: StoredDocumentV1 = {
          ...document,
          activeRun: normalizedGame,
          preferences: DEFAULT_PREFERENCES,
        };
        reservePersistedTileIds(restoredTileIds(normalizedGame));
        gameRef.current = normalizedGame;
        recordsRef.current = document.records;
        preferencesRef.current = DEFAULT_PREFERENCES;
        hydratedRef.current = true;
        setGame(normalizedGame);
        setRecords(document.records);
        setPreferences(DEFAULT_PREFERENCES);
        setHydrated(true);
        save(normalizedDocument);
      })
      .catch((error: unknown) => {
        if (disposed) return;

        warnAboutStorage(error);
        hydratedRef.current = true;
        setHydrated(true);
      });

    return () => {
      disposed = true;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (celebrationTimerRef.current !== null) clearTimeout(celebrationTimerRef.current);
    };
  }, [fallbackGame, resolvedDependencies.store, save]);

  const move = (direction: GlobalDirection): void => {
    if (!hydratedRef.current || lockedRef.current || gameRef.current.status === 'gameOver') return;

    const result = applyGlobalMove(
      gameRef.current,
      direction,
      resolvedDependencies.random,
      resolvedDependencies.ids,
    );
    if (!result.changed) {
      invalidMoveCountRef.current += 1;
      setInvalidMoveCount(invalidMoveCountRef.current);
      return;
    }

    const nextRecords = updateScoreRecords(recordsRef.current, result.state);
    const document: StoredDocumentV1 = {
      version: 1,
      activeRun: result.state,
      records: nextRecords,
      preferences: preferencesRef.current,
    };

    gameRef.current = result.state;
    recordsRef.current = nextRecords;
    lockedRef.current = true;
    setGame(result.state);
    setRecords(nextRecords);
    setAnimation(result);
    setLocked(true);
    save(document);

    if (result.completedFacesStarted.length > 0) {
      if (celebrationTimerRef.current !== null) clearTimeout(celebrationTimerRef.current);
      setCelebration(result);
      celebrationTimerRef.current = setTimeout(() => {
        celebrationTimerRef.current = null;
        setCelebration(null);
      }, FACE_COMPLETION_CELEBRATION_MS);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      lockedRef.current = false;
      setAnimation(null);
      setLocked(false);
    }, resolvedDependencies.animationMs);
  };

  const restart = (): void => {
    if (!hydratedRef.current) return;

    const nextGame = startGame(
      'continue',
      resolvedDependencies.random,
      resolvedDependencies.ids,
    );
    const document: StoredDocumentV1 = {
      version: 1,
      activeRun: nextGame,
      records: recordsRef.current,
      preferences: preferencesRef.current,
    };

    clearAnimationLock();
    if (celebrationTimerRef.current !== null) {
      clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = null;
    }
    setCelebration(null);
    gameRef.current = nextGame;
    invalidMoveCountRef.current = 0;
    setGame(nextGame);
    setInvalidMoveCount(0);
    save(document);
  };

  return {
    game,
    records,
    preferences,
    hydrated,
    locked,
    animation,
    celebration,
    invalidMoveCount,
    move,
    restart,
  };
}
