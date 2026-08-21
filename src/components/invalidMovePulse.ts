import { Animated } from 'react-native';

export function startInvalidMovePulse(opacity: Animated.Value): Animated.CompositeAnimation {
  opacity.setValue(1);
  return Animated.sequence([
    Animated.timing(opacity, { toValue: 0.72, duration: 50, useNativeDriver: false }),
    Animated.timing(opacity, { toValue: 1, duration: 50, useNativeDriver: false }),
  ]);
}
