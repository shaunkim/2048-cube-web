import { fireEvent, render, screen } from '@testing-library/react-native';

import type { BoardState, GameState, ScoreRecords } from '../../game/model';
import { GameHud } from '../GameHud';

const board = (score: number, completed2048 = false, maximum = 0): BoardState => ({
  cells: Array.from({ length: 16 }, (_, index) => index === 0 && maximum > 0 ? { id: `tile-${score}`, value: maximum } : null),
  score,
  completed2048,
  frozen: false,
});

const records: ScoreRecords = {
  bestTotalScore: 35960,
  bestFaceScores: { top: 128, left: 80, right: 256 },
};

function game(completed: number): GameState {
  return {
    schemaVersion: 1,
    faces: {
      top: board(100, completed > 0),
      left: board(160, completed > 1),
      right: board(200, completed > 2),
    },
    mode: 'continue',
    status: 'playing',
    victoryReached: completed === 3,
    turn: 4,
  };
}

function completedGame(maximum: number): GameState {
  return {
    ...game(3),
    faces: {
      top: board(100, true, maximum),
      left: board(160, true, maximum),
      right: board(200, true, maximum),
    },
  };
}

it('renders the web dashboard composition', () => {
  render(<GameHud game={game(0)} messageCycle={0} records={records} onMenu={jest.fn()} onLeaderboard={jest.fn()} />);

  expect(screen.getByTestId('standard-dashboard')).toBeTruthy();
});

it('shows the classic brand, score cards, and primary actions without prototype controls', () => {
  const onMenu = jest.fn();
  const onLeaderboard = jest.fn();
  render(<GameHud game={game(0)} messageCycle={0} records={records} onMenu={onMenu} onLeaderboard={onLeaderboard} />);

  expect(screen.getByText('2048³')).toBeTruthy();
  expect(screen.getByText('SCORE')).toBeTruthy();
  expect(screen.getByText('460')).toBeTruthy();
  expect(screen.getByText('BEST')).toBeTruthy();
  expect(screen.getByText('35960')).toBeTruthy();
  expect(screen.queryByText(/Strict|Continue|Prefer|Top 100|Restart/)).toBeNull();

  fireEvent.press(screen.getByRole('button', { name: 'Menu' }));
  fireEvent.press(screen.getByRole('button', { name: 'Leaderboard' }));
  expect(onMenu).toHaveBeenCalledTimes(1);
  expect(onLeaderboard).toHaveBeenCalledTimes(1);
});

it.each([
  [0, null],
  [1, '×2'],
  [2, '×4'],
  [3, '×8'],
] as const)('shows the future-score multiplier after %i completed faces', (completed, copy) => {
  render(<GameHud game={game(completed)} messageCycle={0} records={records} onMenu={jest.fn()} onLeaderboard={jest.fn()} />);

  if (copy === null) {
    expect(screen.queryByText(/×[1-4]/)).toBeNull();
  } else {
    expect(screen.getByText(copy)).toBeTruthy();
  }
});

it.each([
  [0, 'Get a 2048 tile on all three faces!'],
  [1, 'One face complete—two to go!'],
  [2, 'Two faces complete—finish the cube!'],
])('shows progress copy for %i completed faces', (completed, copy) => {
  render(<GameHud game={game(completed)} messageCycle={0} records={records} onMenu={jest.fn()} onLeaderboard={jest.fn()} />);
  expect(screen.getByText(copy)).toBeTruthy();
});

it.each([
  [2048, 'Cube complete! Your next goal is the 4096 tile!'],
  [4096, 'Cube complete! Your next goal is the 8192 tile!'],
])('advances the endless-play goal after all faces reach %i', (maximum, copy) => {
  render(<GameHud game={completedGame(maximum)} messageCycle={0} records={records} onMenu={jest.fn()} onLeaderboard={jest.fn()} />);
  expect(screen.getByText(copy)).toBeTruthy();
});
