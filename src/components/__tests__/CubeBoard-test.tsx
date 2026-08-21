import { render, screen } from '@testing-library/react-native';
import { Path } from 'react-native-svg';

import { CubeBoard } from '../CubeBoard';
import type { BoardState, GameState, GlobalTurnResult } from '../../game/model';

const blank = (): BoardState => ({
  cells: Array.from({ length: 16 }, () => null),
  score: 0,
  completed2048: false,
  frozen: false,
});

it('renders three aligned faces and all occupied values', () => {
  const top = blank();
  const state: GameState = {
    schemaVersion: 1,
    faces: {
      top: { ...top, cells: [{ id: 'top-2', value: 2 }, ...top.cells.slice(1)] },
      left: blank(),
      right: blank(),
    },
    mode: 'strict',
    status: 'playing',
    victoryReached: false,
    turn: 0,
  };

  render(<CubeBoard state={state} />);

  expect(screen.getByTestId('face-top')).toBeTruthy();
  expect(screen.getByTestId('face-left')).toBeTruthy();
  expect(screen.getByTestId('face-right')).toBeTruthy();
  const outlines = screen.getAllByTestId(/face-outline-/);
  expect(outlines).toHaveLength(3);
  outlines.forEach((outline) => {
    expect(outline.props.stroke).toEqual({ type: 0, payload: 0xff9f9285 });
    expect(outline.props.strokeWidth).toBe(1.5);
  });
  expect(screen.getAllByTestId(/cell-/)).toHaveLength(48);
  expect(screen.getByLabelText('2')).toBeTruthy();
});

it('marks only frozen faces with the retired grayscale presentation', () => {
  const state: GameState = {
    schemaVersion: 1,
    faces: { top: blank(), left: { ...blank(), frozen: true }, right: blank() },
    mode: 'continue',
    status: 'playing',
    victoryReached: false,
    turn: 4,
  };

  render(<CubeBoard state={state} />);

  expect(screen.getByTestId('face-top').props.opacity).toBe(1);
  expect(screen.getByTestId('face-left').props.opacity).toBe(0.78);
  expect(screen.getByTestId('face-right').props.opacity).toBe(1);
  expect(screen.getByTestId('face-outline-left').props.fill).toEqual({ type: 0, payload: 0xff979797 });
});

it('keeps a completed live face at full opacity with its normal colors', () => {
  const state: GameState = {
    schemaVersion: 1,
    faces: { top: { ...blank(), completed2048: true }, left: blank(), right: blank() },
    mode: 'continue',
    status: 'playing',
    victoryReached: false,
    turn: 4,
  };

  render(<CubeBoard state={state} />);

  expect(screen.getByTestId('face-top').props.opacity).toBe(1);
  expect(screen.getByTestId('face-outline-top').props.fill).toEqual({ type: 0, payload: 0xffd8ccbe });
});

it('keeps a completed dead face half-dimmed in color rather than grayscale', () => {
  const state: GameState = {
    schemaVersion: 1,
    faces: {
      top: { ...blank(), completed2048: true, frozen: true },
      left: blank(),
      right: blank(),
    },
    mode: 'continue',
    status: 'playing',
    victoryReached: false,
    turn: 9,
  };

  render(<CubeBoard state={state} />);

  expect(screen.getByTestId('face-top').props.opacity).toBe(0.5);
  expect(screen.getByTestId('face-outline-top').props.fill).toEqual({ type: 0, payload: 0xffd8ccbe });
});

it('pulses every occupied tile on a newly completed face from its own center', () => {
  jest.useFakeTimers();
  const top = {
    ...blank(),
    cells: [
      { id: 'new-2048', value: 2048 },
      { id: 'existing-4', value: 4 },
      { id: 'spawn', value: 2 },
      ...blank().cells.slice(3),
    ],
    completed2048: true,
    score: 2048,
  };
  const state: GameState = {
    schemaVersion: 1,
    faces: { top, left: blank(), right: blank() },
    mode: 'continue',
    status: 'playing',
    victoryReached: false,
    turn: 1,
  };
  const celebration: GlobalTurnResult = {
    state,
    changed: true,
    completedFacesStarted: ['top'],
    victoryStarted: false,
    gameOverStarted: false,
    faces: [{
      face: 'top',
      direction: 'left',
      board: top,
      changed: true,
      completed2048Started: true,
      motions: [],
      merges: [{ sourceIds: ['a', 'b'], result: { id: 'new-2048', value: 2048 }, at: 0 }],
      spawn: { tile: { id: 'spawn', value: 2 }, at: 1 },
    }],
  };

  const view = render(<CubeBoard state={state} celebration={celebration} />);
  expect(screen.getByTestId('completion-tile-new-2048')).toBeTruthy();
  expect(screen.getByTestId('completion-tile-existing-4')).toBeTruthy();
  expect(screen.getByTestId('completion-tile-spawn')).toBeTruthy();
  expect(screen.queryByTestId('completion-face-left')).toBeNull();
  view.unmount();
  jest.useRealTimers();
});

it('restores face and tile colors when a frozen cube is rendered for sharing', () => {
  const left = blank();
  const state: GameState = {
    schemaVersion: 1,
    faces: {
      top: blank(),
      left: { ...left, cells: [{ id: 'left-2', value: 2 }, ...left.cells.slice(1)], frozen: true },
      right: blank(),
    },
    mode: 'continue',
    status: 'gameOver',
    victoryReached: false,
    turn: 8,
  };

  render(<CubeBoard state={state} forceFullColor />);

  expect(screen.getByTestId('face-left').props.opacity).toBe(1);
  expect(screen.getByTestId('face-outline-left').props.fill).toEqual({ type: 0, payload: 0xffafa294 });
  expect(screen.UNSAFE_getAllByType(Path).map((path) => path.props.fill)).toContain('#D1C9C0');
});
