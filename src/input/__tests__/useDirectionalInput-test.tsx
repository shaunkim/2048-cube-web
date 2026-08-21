import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { useDirectionalInput } from '../useDirectionalInput';
import type { GlobalDirection } from '../../game/model';

function swipeEvent(dx: number, dy: number) {
  return {
    touchHistory: {
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: 1,
      numberActiveTouches: 1,
      touchBank: [{
        currentPageX: dx,
        currentPageY: dy,
        currentTimeStamp: 1,
        previousPageX: 0,
        previousPageY: 0,
        touchActive: true,
      }],
    },
  };
}

it('dispatches a recognized swipe at the threshold before release and only once', () => {
  const onDirection = jest.fn();
  const { result, rerender } = renderHook<ReturnType<typeof useDirectionalInput>, { locked: boolean }>(
    ({ locked }) => useDirectionalInput(onDirection, locked),
    { initialProps: { locked: false } },
  );

  const event = swipeEvent(0, -60);
  act(() => {
    result.current.onResponderGrant?.(event as never);
    result.current.onResponderMove?.(event as never);
    result.current.onResponderMove?.(event as never);
  });

  expect(onDirection).toHaveBeenCalledTimes(1);
  expect(onDirection).toHaveBeenCalledWith('up');

  act(() => result.current.onResponderRelease?.(event as never));
  expect(onDirection).toHaveBeenCalledTimes(1);

  rerender({ locked: true });
  act(() => {
    const event = swipeEvent(0, 60);
    result.current.onResponderGrant?.(event as never);
    result.current.onResponderMove?.(event as never);
  });

  expect(onDirection).toHaveBeenCalledTimes(1);
});

it('does not dispatch a movement shorter than the swipe threshold', () => {
  const onDirection = jest.fn();
  const { result } = renderHook(() => useDirectionalInput(onDirection, false));
  const event = swipeEvent(0, -12);

  act(() => {
    result.current.onResponderGrant?.(event as never);
    result.current.onResponderMove?.(event as never);
    result.current.onResponderRelease?.(event as never);
  });

  expect(onDirection).not.toHaveBeenCalled();
});

it('resets the one-shot guard after responder termination', () => {
  const onDirection = jest.fn();
  const { result } = renderHook(() => useDirectionalInput(onDirection, false));
  const event = swipeEvent(0, -60);

  act(() => {
    result.current.onResponderGrant?.(event as never);
    result.current.onResponderMove?.(event as never);
    result.current.onResponderTerminate?.(event as never);
    result.current.onResponderGrant?.(event as never);
    result.current.onResponderMove?.(event as never);
  });

  expect(onDirection).toHaveBeenCalledTimes(2);
});

it('keeps the one-shot guard across a parent rerender during a held gesture', () => {
  const firstHandler = jest.fn();
  const secondHandler = jest.fn();
  const { result, rerender } = renderHook<
    ReturnType<typeof useDirectionalInput>,
    { handler: (direction: GlobalDirection) => void }
  >(
    ({ handler }) => useDirectionalInput(handler, false),
    { initialProps: { handler: firstHandler } },
  );
  const event = swipeEvent(0, -60);

  act(() => {
    result.current.onResponderGrant?.(event as never);
    result.current.onResponderMove?.(event as never);
  });
  rerender({ handler: secondHandler });
  act(() => result.current.onResponderMove?.(event as never));

  expect(firstHandler).toHaveBeenCalledTimes(1);
  expect(secondHandler).not.toHaveBeenCalled();
});

describe('web keyboard listener', () => {
  let keydownHandler: ((event: KeyboardEvent) => void) | undefined;

  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'web');
    Object.defineProperty(window, 'addEventListener', {
      configurable: true,
      value: jest.fn((type: string, listener: (event: KeyboardEvent) => void) => {
        if (type === 'keydown') keydownHandler = listener;
      }),
    });
    Object.defineProperty(window, 'removeEventListener', {
      configurable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    keydownHandler = undefined;
    jest.restoreAllMocks();
  });

  it('dispatches and prevents the browser default for an unmodified game key', () => {
    const onDirection = jest.fn();
    renderHook(() => useDirectionalInput(onDirection, false));
    const event = {
      key: 'q',
      repeat: false,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      preventDefault: jest.fn(),
    } as unknown as KeyboardEvent;

    act(() => keydownHandler?.(event));

    expect(onDirection).toHaveBeenCalledWith('upLeft');
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['meta', { metaKey: true }],
    ['control', { ctrlKey: true }],
    ['alt', { altKey: true }],
  ] as const)('preserves %s-key browser shortcuts', (_description, modifier) => {
    const onDirection = jest.fn();
    renderHook(() => useDirectionalInput(onDirection, false));
    const event = {
      key: 'q',
      repeat: false,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      preventDefault: jest.fn(),
      ...modifier,
    } as unknown as KeyboardEvent;

    act(() => keydownHandler?.(event));

    expect(onDirection).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
