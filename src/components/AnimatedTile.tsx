import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { G, Path, Text as SvgText } from 'react-native-svg';

import type { FaceId } from '../game/model';
import { cellCenter, roundedPolygonPath, tilePolygon } from '../geometry/cubeGeometry';
import { gameTheme, tileStyle } from '../theme/gameTheme';

export type TileMotionKind = 'move' | 'mergeSource' | 'mergeResult' | 'spawn';

export interface AnimatedTileProps {
  readonly face: FaceId;
  readonly index: number;
  readonly value: number;
  readonly kind: TileMotionKind;
  readonly fromIndex?: number;
  readonly testID: string;
}

const AnimatedGroup = Animated.createAnimatedComponent(G);

export const TILE_ANIMATION_TIMINGS = {
  move: { delay: 0, duration: 80 },
  mergeSource: { delay: 0, duration: 80 },
  mergeResult: { delay: 0, duration: 130 },
  spawn: { delay: 10, duration: 120 },
} as const satisfies Readonly<Record<TileMotionKind, {
  readonly delay: number;
  readonly duration: number;
}>>;

export const TILE_ANIMATION_SCALES = {
  mergeResult: { inputRange: [0, 0.55, 1], outputRange: [1, 1.18, 1] },
  spawn: { inputRange: [0, 1], outputRange: [0.15, 1] },
};

type Point = Readonly<{ readonly x: number; readonly y: number }>;

export function tileMotionOffsets(kind: TileMotionKind, source: Point, destination: Point) {
  if (kind !== 'move' && kind !== 'mergeSource') {
    return { startX: 0, startY: 0 } as const;
  }

  return {
    startX: source.x - destination.x,
    startY: source.y - destination.y,
  } as const;
}

function relativeTo(center: Point, point: Point) {
  return { x: point.x - center.x, y: point.y - center.y };
}

function timingFor(kind: TileMotionKind, progress: Animated.Value): Animated.CompositeAnimation {
  const timing = TILE_ANIMATION_TIMINGS[kind];
  const animation = Animated.timing(progress, {
    toValue: 1,
    duration: timing.duration,
    useNativeDriver: false,
  });
  if (timing.delay > 0) {
    return Animated.sequence([
      Animated.delay(timing.delay),
      animation,
    ]);
  }

  return animation;
}

export function AnimatedTile({ face, index, value, kind, fromIndex, testID }: AnimatedTileProps) {
  if ((kind === 'move' || kind === 'mergeSource') && fromIndex === undefined) {
    throw new Error(`${kind} tiles require a source cell index`);
  }

  const [progress] = useState(() => new Animated.Value(0));
  const row = Math.floor(index / 4);
  const column = index % 4;
  const sourceIndex = fromIndex ?? index;
  const sourceCenter = cellCenter(face, Math.floor(sourceIndex / 4), sourceIndex % 4);
  const destinationCenter = cellCenter(face, row, column);
  const style = tileStyle(value, face);
  const offsets = tileMotionOffsets(kind, sourceCenter, destinationCenter);
  const movesBetweenCells = kind === 'move' || kind === 'mergeSource';

  useEffect(() => {
    progress.setValue(0);
    const animation = timingFor(kind, progress);
    animation.start();
    return () => animation.stop();
  }, [kind, progress]);

  const motionProps = movesBetweenCells
    ? {
        translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [offsets.startX, 0] }),
        translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [offsets.startY, 0] }),
      }
    : {};
  const scale =
    kind === 'mergeResult'
      ? progress.interpolate(TILE_ANIMATION_SCALES.mergeResult)
      : kind === 'spawn'
        ? progress.interpolate(TILE_ANIMATION_SCALES.spawn)
        : 1;
  const opacity =
    kind === 'mergeSource'
      ? progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] })
      : 1;

  const localTile = tilePolygon(face, row, column).map((point) => relativeTo(destinationCenter, point));

  return (
    <G testID={testID} transform={`translate(${destinationCenter.x} ${destinationCenter.y})`}>
      <AnimatedGroup
        testID={`${testID}-motion`}
        {...motionProps}
        opacity={opacity}
      >
        <AnimatedGroup testID={`${testID}-appearance`} scale={scale}>
          <Path d={roundedPolygonPath(localTile)} fill={style.fill} />
          <SvgText
            accessibilityLabel={String(value)}
            x={0}
            y={0}
            fill={style.text}
            fontFamily={gameTheme.fonts.bold}
            fontSize={style.fontSize}
            fontWeight="700"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {value}
          </SvgText>
        </AnimatedGroup>
      </AnimatedGroup>
    </G>
  );
}
