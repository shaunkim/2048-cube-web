import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

jest.mock('../src/storage/platformStore', () => ({
  platformStore: {
    getItem: async () => null,
    setItem: async () => undefined,
  },
}));

import App from '../App';
import type { IdSource, RandomSource } from '../src/game/model';
import type { KeyValueStore } from '../src/storage/gameStorage';

function memoryStore(): KeyValueStore {
  let value: string | null = null;
  return {
    getItem: async () => value,
    setItem: async (_key, next) => {
      value = next;
    },
  };
}

function random(values: readonly number[]): RandomSource {
  let index = 0;
  return { next: () => values[index++ % values.length] ?? 0 };
}

function ids(): IdSource {
  let index = 0;
  return { next: () => `test-${++index}` };
}

const originalPlatform = Platform.OS;
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

describe('<App />', () => {
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    jest.useRealTimers();
  });

  it('renders hydrated faces and locks all directional controls for each changed move', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
    const view = render(
      <App
        controllerDependencies={{
          store: memoryStore(),
          random: random([
            0.99, 0, 0.99, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
          ]),
          ids: ids(),
          animationMs: 180,
        }}
      />,
    );

    await waitFor(() => expect(screen.getByText('2048³')).toBeTruthy());
    expect(screen.getByTestId('safe-area-root')).toBeTruthy();
    expect(screen.getByTestId('face-top')).toBeTruthy();
    expect(screen.getByTestId('face-left')).toBeTruthy();
    expect(screen.getByTestId('face-right')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Move / })).toHaveLength(6);
    jest.useFakeTimers();

    fireEvent.press(screen.getByRole('button', { name: 'Move down' }));
    screen.getAllByRole('button', { name: /Move / }).forEach((button) => {
      expect(button).toBeDisabled();
    });

    await act(async () => jest.advanceTimersByTimeAsync(180));
    screen.getAllByRole('button', { name: /Move / }).forEach((button) => {
      expect(button).not.toBeDisabled();
    });
    expect(screen.getByTestId('face-top')).toBeTruthy();
    expect(screen.getByTestId('face-left')).toBeTruthy();
    expect(screen.getByTestId('face-right')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Move up-left' }));
    screen.getAllByRole('button', { name: /Move / }).forEach((button) => {
      expect(button).toBeDisabled();
    });
    await act(async () => jest.advanceTimersByTimeAsync(180));
    view.unmount();
    jest.useRealTimers();
  });

});
