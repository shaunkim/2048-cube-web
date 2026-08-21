import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { G, Path, Text as SvgText } from 'react-native-svg';

import type { BoardState, FaceId } from '../game/model';
import {
  cellCenter,
  roundedPolygonPath,
  tilePolygon,
} from '../geometry/cubeGeometry';
import { gameTheme, tileStyle } from '../theme/gameTheme';

const AnimatedGroup = Animated.createAnimatedComponent(G);

function relativeTo(
  center: Readonly<{ readonly x: number; readonly y: number }>,
  point: Readonly<{ readonly x: number; readonly y: number }>,
) {
  return { x: point.x - center.x, y: point.y - center.y };
}

export interface FaceCompletionPulseProps {
  readonly face: FaceId;
  readonly board: BoardState;
}

export const FACE_COMPLETION_PULSE_MS = 600;

export function FaceCompletionPulse({ face, board }: FaceCompletionPulseProps) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: FACE_COMPLETION_PULSE_MS,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [board, progress]);

  const tileScale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.5, 1],
  });

  return (
    <G pointerEvents="none">
      {board.cells.map((tile, index) => {
        if (!tile) return null;
        const row = Math.floor(index / 4);
        const column = index % 4;
        const center = cellCenter(face, row, column);
        const localTile = tilePolygon(face, row, column).map((point) => relativeTo(center, point));
        const style = tileStyle(tile.value, face);

        return (
          <G
            key={tile.id}
            testID={`completion-tile-${tile.id}`}
            transform={`translate(${center.x} ${center.y})`}
          >
            <AnimatedGroup scale={tileScale}>
              <Path d={roundedPolygonPath(localTile)} fill={style.fill} />
              <SvgText
                x={0}
                y={0}
                fill={style.text}
                fontFamily={gameTheme.fonts.bold}
                fontSize={style.fontSize}
                fontWeight="700"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {tile.value}
              </SvgText>
            </AnimatedGroup>
          </G>
        );
      })}
    </G>
  );
}
