import { G, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';

import type { BoardState, FaceId, FaceTurnEvent } from '../game/model';
import {
  cellCenter,
  cellPolygon,
  facePolygon,
  gridPoint,
  roundedPolygonPath,
  tilePolygon,
} from '../geometry/cubeGeometry';
import { faceStyle, gameTheme, tileStyle } from '../theme/gameTheme';
import { AnimatedTile } from './AnimatedTile';
import { FaceCompletionPulse } from './FaceCompletionPulse';

const polygonPoints = (points: readonly { readonly x: number; readonly y: number }[]) =>
  points.map(({ x, y }) => `${x},${y}`).join(' ');

interface FaceGridProps {
  readonly face: FaceId;
  readonly board: BoardState;
  readonly event?: FaceTurnEvent | undefined;
  readonly celebrationEvent?: FaceTurnEvent | undefined;
  readonly forceFullColor?: boolean;
}

export function FaceGrid({
  face,
  board,
  event,
  celebrationEvent,
  forceFullColor = false,
}: FaceGridProps) {
  const useFrozenPalette = board.frozen && !board.completed2048 && !forceFullColor;
  const surface = faceStyle(face, useFrozenPalette);
  const opacity = board.frozen && board.completed2048 && !forceFullColor ? 0.5 : surface.opacity;
  const mergeSourceIds = new Set(event?.merges.flatMap((merge) => merge.sourceIds) ?? []);
  const movingTiles = event?.motions.filter((motion) => !mergeSourceIds.has(motion.tileId)) ?? [];
  const movingTileIds = new Set(movingTiles.map((motion) => motion.tileId));
  const mergeResultIds = new Set(event?.merges.map((merge) => merge.result.id) ?? []);
  const spawnId = event?.spawn?.tile.id;
  const celebrateCompletion = celebrationEvent?.completed2048Started === true;

  return (
    <G testID={`face-${face}`} accessibilityLabel={`${face} face`} opacity={opacity}>
      <Polygon
        testID={`face-outline-${face}`}
        points={polygonPoints(facePolygon(face))}
        fill={surface.fill}
        stroke={surface.grid}
        strokeWidth={1.5}
      />
      {[1, 2, 3].map((row) => {
        const start = gridPoint(face, row, 0);
        const end = gridPoint(face, row, 4);
        return <Line key={`row-${row}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={surface.grid} />;
      })}
      {[1, 2, 3].map((column) => {
        const start = gridPoint(face, 0, column);
        const end = gridPoint(face, 4, column);
        return <Line key={`column-${column}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={surface.grid} />;
      })}
      {board.cells.map((cell, index) => {
        const row = Math.floor(index / 4);
        const column = index % 4;
        const center = cellCenter(face, row, column);
        const cellPath = roundedPolygonPath(cellPolygon(face, row, column), 0);
        const style = cell ? tileStyle(cell.value, face, useFrozenPalette) : undefined;

        return (
          <G key={index}>
            <Path testID={`cell-${face}-${index}`} d={cellPath} fill="transparent" />
            {cell && !movingTileIds.has(cell.id) && !mergeResultIds.has(cell.id) && cell.id !== spawnId && (
              <>
                <Path d={roundedPolygonPath(tilePolygon(face, row, column))} fill={style!.fill} />
                <SvgText
                  accessibilityLabel={String(cell.value)}
                  x={center.x}
                  y={center.y}
                  fill={style!.text}
                  fontFamily={gameTheme.fonts.bold}
                  fontSize={style!.fontSize}
                  fontWeight="700"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {cell.value}
                </SvgText>
              </>
            )}
          </G>
        );
      })}
      {event && (
        <>
          {movingTiles.map((motion) => (
            <AnimatedTile
              key={`move-${motion.tileId}`}
              face={face}
              index={motion.to}
              fromIndex={motion.from}
              value={motion.value}
              kind="move"
              testID={motion.tileId}
            />
          ))}
          {event.motions
            .filter((motion) => mergeSourceIds.has(motion.tileId))
            .map((motion) => (
              <AnimatedTile
                key={`merge-source-${motion.tileId}`}
                face={face}
                index={motion.to}
                fromIndex={motion.from}
                value={motion.value}
                kind="mergeSource"
                testID={motion.tileId}
              />
            ))}
          {event.merges.map((merge) => (
            <AnimatedTile
              key={`merge-result-${merge.result.id}`}
              face={face}
              index={merge.at}
              value={merge.result.value}
              kind="mergeResult"
              testID={merge.result.id}
            />
          ))}
          {event.spawn && (
            <AnimatedTile
              face={face}
              index={event.spawn.at}
              value={event.spawn.tile.value}
              kind="spawn"
              testID={event.spawn.tile.id}
            />
          )}
        </>
      )}
      {celebrateCompletion && <FaceCompletionPulse face={face} board={board} />}
    </G>
  );
}
