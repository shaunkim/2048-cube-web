import { useEffect, useMemo } from 'react';
import { PanResponder, Platform, type PanResponderInstance } from 'react-native';

import type { GlobalDirection } from '../game/model';
import { classifySwipe, directionForKey } from './direction';

class GestureDispatchGuard {
  private dispatched = false;

  reset() {
    this.dispatched = false;
  }

  claim(): boolean {
    if (this.dispatched) return false;
    this.dispatched = true;
    return true;
  }
}

export function useDirectionalInput(
  onDirection: (direction: GlobalDirection) => void,
  locked: boolean,
): PanResponderInstance['panHandlers'] {
  const dispatchGuard = useMemo(() => new GestureDispatchGuard(), []);
  const responder = useMemo(
    () => {
      return PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dispatchGuard.reset();
        },
        onPanResponderMove: (_event, gesture) => {
          if (locked) return;
          const direction = classifySwipe(gesture.dx, gesture.dy);
          if (!direction) return;
          if (!dispatchGuard.claim()) return;
          onDirection(direction);
        },
        onPanResponderRelease: () => {
          dispatchGuard.reset();
        },
        onPanResponderTerminate: () => {
          dispatchGuard.reset();
        },
      });
    },
    [dispatchGuard, locked, onDirection],
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;

      const direction = directionForKey(event.key);
      if (!direction) return;

      event.preventDefault();
      if (!locked) onDirection(direction);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [locked, onDirection]);

  return responder.panHandlers;
}
