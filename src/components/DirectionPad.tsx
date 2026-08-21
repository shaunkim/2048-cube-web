import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GlobalDirection } from '../game/model';
import { gameTheme } from '../theme/gameTheme';

interface DirectionButton {
  readonly direction: GlobalDirection;
  readonly label: string;
  readonly visibleLabel: string;
  readonly row: 1 | 2;
}

const DIRECTION_BUTTONS: readonly DirectionButton[] = [
  { direction: 'upLeft', label: 'up-left', visibleLabel: '↖ Q', row: 1 },
  { direction: 'up', label: 'up', visibleLabel: '↑ W', row: 1 },
  { direction: 'upRight', label: 'up-right', visibleLabel: 'E ↗', row: 1 },
  { direction: 'downLeft', label: 'down-left', visibleLabel: '↙ A', row: 2 },
  { direction: 'down', label: 'down', visibleLabel: '↓ S', row: 2 },
  { direction: 'downRight', label: 'down-right', visibleLabel: 'D ↘', row: 2 },
];

export function DirectionPad({
  onDirection,
  disabled,
}: {
  readonly onDirection: (direction: GlobalDirection) => void;
  readonly disabled: boolean;
}) {
  return (
    <View style={styles.container}>
      {[1, 2].map((row) => (
        <View key={row} testID="direction-row" style={styles.row}>
          {DIRECTION_BUTTONS.filter((button) => button.row === row).map((button) => (
            <Pressable
              key={button.direction}
              accessibilityRole="button"
              accessibilityLabel={`Move ${button.label}`}
              disabled={disabled}
              onPress={() => onDirection(button.direction)}
              style={styles.button}
            >
              <Text numberOfLines={1} style={styles.label}>{button.visibleLabel}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    width: 56,
  },
  label: {
    color: gameTheme.ink,
    fontFamily: gameTheme.fonts.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
});
