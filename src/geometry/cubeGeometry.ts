import type { FaceId } from '../game/model';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface FaceGeometry {
  readonly origin: Point;
  readonly column: Point;
  readonly row: Point;
}

export interface SvgViewport {
  readonly minX: number;
  readonly minY: number;
  readonly width: number;
  readonly height: number;
}

export const DEFAULT_CUBE_VIEWPORT: SvgViewport = { minX: 0, minY: 0, width: 520, height: 450 };

export const FACE_GEOMETRY: Readonly<Record<FaceId, FaceGeometry>> = {
  top: {
    origin: { x: 72, y: 118 },
    column: { x: 47, y: -21 },
    row: { x: 47, y: 21 },
  },
  left: {
    origin: { x: 72, y: 118 },
    column: { x: 47, y: 21 },
    row: { x: 0, y: 50.5 },
  },
  right: {
    origin: { x: 260, y: 202 },
    column: { x: 47, y: -21 },
    row: { x: 0, y: 50.5 },
  },
};

const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (point: Point, amount: number): Point => ({
  x: point.x * amount,
  y: point.y * amount,
});

export function gridPoint(face: FaceId, row: number, column: number): Point {
  const geometry = FACE_GEOMETRY[face];
  return add(geometry.origin, add(scale(geometry.column, column), scale(geometry.row, row)));
}

export function facePolygon(face: FaceId): readonly Point[] {
  return [
    gridPoint(face, 0, 0),
    gridPoint(face, 0, 4),
    gridPoint(face, 4, 4),
    gridPoint(face, 4, 0),
  ];
}

export function cellPolygon(face: FaceId, row: number, column: number): readonly Point[] {
  return [
    gridPoint(face, row, column),
    gridPoint(face, row, column + 1),
    gridPoint(face, row + 1, column + 1),
    gridPoint(face, row + 1, column),
  ];
}

export function cellCenter(face: FaceId, row: number, column: number): Point {
  const points = cellPolygon(face, row, column);
  return {
    x: (points[0]!.x + points[2]!.x) / 2,
    y: (points[0]!.y + points[2]!.y) / 2,
  };
}

export function tilePolygon(face: FaceId, row: number, column: number): readonly Point[] {
  const center = cellCenter(face, row, column);
  return cellPolygon(face, row, column).map((point) => ({
    x: center.x + (point.x - center.x) * 0.82,
    y: center.y + (point.y - center.y) * 0.82,
  }));
}

export function boundsForPolygons(polygons: readonly (readonly Point[])[]): SvgViewport {
  const points = polygons.flat();
  if (points.length === 0) throw new Error('Cannot calculate bounds without points');

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

const format = (value: number) => Number(value.toFixed(2));

export function roundedPolygonPath(points: readonly Point[], cornerRatio = 0.15): string {
  if (points.length < 3) throw new Error('A rounded polygon requires at least three points');

  const corners = points.map((current, index) => {
    const previous = points[(index - 1 + points.length) % points.length]!;
    const next = points[(index + 1) % points.length]!;
    return {
      current,
      entry: {
        x: current.x + (previous.x - current.x) * cornerRatio,
        y: current.y + (previous.y - current.y) * cornerRatio,
      },
      exit: {
        x: current.x + (next.x - current.x) * cornerRatio,
        y: current.y + (next.y - current.y) * cornerRatio,
      },
    };
  });

  const first = corners[0]!;
  const commands = [`M ${format(first.exit.x)} ${format(first.exit.y)}`];
  for (let index = 1; index < corners.length; index += 1) {
    const corner = corners[index]!;
    commands.push(
      `L ${format(corner.entry.x)} ${format(corner.entry.y)}`,
      `Q ${format(corner.current.x)} ${format(corner.current.y)} ${format(corner.exit.x)} ${format(corner.exit.y)}`,
    );
  }
  commands.push(
    `L ${format(first.entry.x)} ${format(first.entry.y)}`,
    `Q ${format(first.current.x)} ${format(first.current.y)} ${format(first.exit.x)} ${format(first.exit.y)}`,
    'Z',
  );
  return commands.join(' ');
}
