import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking, Platform } from 'react-native';

jest.mock('../src/storage/platformStore', () => ({
  platformStore: { getItem: async () => null, setItem: async () => undefined },
}));

import App from '../App';
import type { IdSource, RandomSource, StoredDocumentV1 } from '../src/game/model';
import type { KeyValueStore } from '../src/storage/gameStorage';

const random: RandomSource = { next: () => 0 };
let id = 0;
const ids: IdSource = { next: () => `menu-${++id}` };
const originalPlatform = Platform.OS;
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

function blankCells() {
  return Array.from({ length: 16 }, () => null);
}

function storedRun(): StoredDocumentV1 {
  return {
    version: 1,
    activeRun: {
      schemaVersion: 1,
      faces: {
        top: { cells: blankCells(), score: 40, completed2048: false, frozen: false },
        left: { cells: blankCells(), score: 30, completed2048: false, frozen: false },
        right: { cells: blankCells(), score: 20, completed2048: false, frozen: false },
      },
      mode: 'continue',
      status: 'playing',
      victoryReached: false,
      turn: 6,
    },
    records: { bestTotalScore: 90, bestFaceScores: { top: 40, left: 30, right: 20 } },
    preferences: { mode: 'continue' },
  };
}

function dependencies(document?: StoredDocumentV1) {
  const store: KeyValueStore = {
    getItem: async () => document ? JSON.stringify(document) : null,
    setItem: async () => undefined,
  };
  return { store, random, ids, animationMs: 180 };
}

function setWeb() {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  window.addEventListener = jest.fn();
  window.removeEventListener = jest.fn();
}

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  window.addEventListener = originalAddEventListener;
  window.removeEventListener = originalRemoveEventListener;
  jest.restoreAllMocks();
});

it('locks input in Menu and Tutorial, then resumes the unchanged run', async () => {
  setWeb();
  const view = render(<App controllerDependencies={dependencies(storedRun())} />);
  await waitFor(() => expect(screen.getByLabelText('SCORE 90')).toBeTruthy());

  fireEvent.press(screen.getAllByRole('button', { name: 'Menu' }).at(-1)!);
  screen.getAllByRole('button', { name: /Move / }).forEach((button) => expect(button).toBeDisabled());
  fireEvent.press(screen.getByRole('button', { name: 'Tutorial' }));
  expect(screen.getByText('SWIPE IN SIX DIRECTIONS')).toBeTruthy();
  fireEvent.press(screen.getAllByRole('button', { name: 'Menu' }).at(-1)!);
  expect(screen.getByLabelText('Game menu')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Resume' }));
  expect(screen.getByLabelText('SCORE 90')).toBeTruthy();
  view.unmount();
});

it('returns directly to gameplay from the final tutorial page', async () => {
  setWeb();
  render(<App controllerDependencies={dependencies()} />);
  await waitFor(() => expect(screen.getByText('2048³')).toBeTruthy());
  fireEvent.press(screen.getByRole('button', { name: 'Menu' }));
  fireEvent.press(screen.getByRole('button', { name: 'Tutorial' }));
  for (let page = 1; page < 6; page += 1) {
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  }
  fireEvent.press(screen.getByRole('button', { name: "Let's Play" }));
  expect(screen.queryByLabelText('Tutorial')).toBeNull();
  expect(screen.getByTestId('cube-stage')).toBeTruthy();
});

it('starts a new game immediately without confirmation', async () => {
  setWeb();
  render(<App controllerDependencies={dependencies(storedRun())} />);
  await waitFor(() => expect(screen.getByLabelText('SCORE 90')).toBeTruthy());
  expect(screen.getByText('Get a 2048 tile on all three faces!')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Menu' }));
  fireEvent.press(screen.getByRole('button', { name: 'New Game' }));

  await waitFor(() => expect(screen.getByLabelText('SCORE 0')).toBeTruthy());
  expect(screen.getByText('Build every face. Complete the cube!')).toBeTruthy();
  expect(screen.queryByText('Restart this run?')).toBeNull();
  expect(screen.queryByLabelText('Game menu')).toBeNull();
});

it('opens the public issue tracker for feedback', async () => {
  setWeb();
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
  render(<App controllerDependencies={dependencies()} />);
  await waitFor(() => expect(screen.getByText('2048³')).toBeTruthy());
  fireEvent.press(screen.getByRole('button', { name: 'Menu' }));
  fireEvent.press(screen.getByRole('button', { name: 'Feedback and support' }));
  expect(openURL).toHaveBeenCalledWith('https://github.com/shaunkim/2048-cube-web/issues');
});

it('still opens the leaderboard placeholder', async () => {
  setWeb();
  const view = render(<App controllerDependencies={dependencies()} />);
  await waitFor(() => expect(screen.getByText('2048³')).toBeTruthy());
  fireEvent.press(screen.getByRole('button', { name: 'Leaderboard' }));
  expect(screen.getByText('Leaderboard coming soon')).toBeTruthy();
  view.unmount();
});
