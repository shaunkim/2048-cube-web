import { act } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { startInvalidMovePulse } from '../invalidMovePulse';

it('restarts a repeated invalid-input pulse from full opacity', async () => {
  jest.useFakeTimers();
  const opacity = new Animated.Value(1);
  let visibleOpacity = 1;
  const listener = opacity.addListener(({ value }) => {
    visibleOpacity = value;
  });
  const firstPulse = startInvalidMovePulse(opacity);
  let secondPulse: Animated.CompositeAnimation | undefined;

  try {
    firstPulse.start();
    await act(async () => jest.advanceTimersByTimeAsync(25));
    expect(visibleOpacity).toBeLessThan(1);
    expect(visibleOpacity).toBeGreaterThan(0.72);

    firstPulse.stop();
    secondPulse = startInvalidMovePulse(opacity);
    secondPulse.start();
    expect(visibleOpacity).toBe(1);

    await act(async () => jest.advanceTimersByTimeAsync(100));
    expect(visibleOpacity).toBe(1);
  } finally {
    firstPulse.stop();
    secondPulse?.stop();
    opacity.removeListener(listener);
    jest.useRealTimers();
  }
});
