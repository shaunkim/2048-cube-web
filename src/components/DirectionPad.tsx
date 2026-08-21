import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import type { GlobalDirection } from '../game/model';
import { gameTheme } from '../theme/gameTheme';

interface DirectionButton {
  readonly direction: GlobalDirection;
  readonly label: string;
  readonly visibleLabel: string;
  readonly diagonal?: true;
  readonly row: 1 | 2;
}

const DIRECTION_BUTTONS: readonly DirectionButton[] = [
  { direction: 'upLeft', label: 'up-left', visibleLabel: 'Q', diagonal: true, row: 1 },
  { direction: 'up', label: 'up', visibleLabel: '↑ W', row: 1 },
  { direction: 'upRight', label: 'up-right', visibleLabel: 'E', diagonal: true, row: 1 },
  { direction: 'downLeft', label: 'down-left', visibleLabel: 'A', diagonal: true, row: 2 },
  { direction: 'down', label: 'down', visibleLabel: '↓ S', row: 2 },
  { direction: 'downRight', label: 'down-right', visibleLabel: 'D', diagonal: true, row: 2 },
];

export function DirectionPad({
  onDirection,
  disabled,
  compact = false,
}: {
  readonly onDirection: (direction: GlobalDirection) => void;
  readonly disabled: boolean;
  readonly compact?: boolean;
}) {
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {[1, 2].map((row) => (
        <View key={row} testID="direction-row" style={[styles.row, compact && styles.compactRow]}>
          {DIRECTION_BUTTONS.filter((button) => button.row === row).map((button) => (
            <Pressable
              key={button.direction}
              accessibilityRole="button"
              accessibilityLabel={`Move ${button.label}`}
              disabled={disabled}
              onPress={() => onDirection(button.direction)}
              style={[styles.button, compact && styles.compactButton]}
            >
              {button.diagonal ? <DiagonalArrow direction={button.direction} /> : null}
              <Text numberOfLines={1} style={styles.label}>{button.visibleLabel}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function DiagonalArrow({ direction }: { readonly direction: GlobalDirection }) {
  const points = {
    upLeft: { line: [15, 15, 4, 4], head: 'M4 10V4h6' },
    upRight: { line: [3, 15, 14, 4], head: 'M8 4h6v6' },
    downLeft: { line: [15, 3, 4, 14], head: 'M4 8v6h6' },
    downRight: { line: [3, 3, 14, 14], head: 'M14 8v6H8' },
  } as const;
  const arrow = points[direction as keyof typeof points];

  if (!arrow) return null;

  return (
    <Svg testID="diagonal-direction-arrow" width={17} height={17} viewBox="0 0 18 18">
      <Line x1={arrow.line[0]} y1={arrow.line[1]} x2={arrow.line[2]} y2={arrow.line[3]} stroke={gameTheme.ink} strokeWidth={2} />
      <Path d={arrow.head} fill="none" stroke={gameTheme.ink} strokeWidth={2} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  compactContainer: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  compactRow: {
    gap: 4,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
    paddingVertical: 10,
    width: 56,
  },
  compactButton: {
    paddingVertical: 6,
  },
  label: {
    color: gameTheme.ink,
    fontFamily: gameTheme.fonts.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
});
