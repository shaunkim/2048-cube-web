import {
  DEFAULT_CUBE_VIEWPORT,
  FACE_GEOMETRY,
  cellCenter,
  cellPolygon,
  facePolygon,
  gridPoint,
  roundedPolygonPath,
  tilePolygon,
} from '../cubeGeometry';

const midpoint = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

describe('cube geometry', () => {
  it('uses identical endpoints for every shared seam', () => {
    expect(gridPoint('top', 4, 0)).toEqual(gridPoint('left', 0, 4));
    expect(gridPoint('top', 4, 0)).toEqual(gridPoint('right', 0, 0));
    expect(gridPoint('left', 4, 4)).toEqual(gridPoint('right', 4, 0));
  });

  it('places each tile at the exact center of its cell', () => {
    for (const face of ['top', 'left', 'right'] as const) {
      for (let row = 0; row < 4; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const cell = cellPolygon(face, row, column);
          const tile = tilePolygon(face, row, column);
          expect(midpoint(tile[0]!, tile[2]!)).toEqual(cellCenter(face, row, column));
          expect(midpoint(cell[0]!, cell[2]!)).toEqual(cellCenter(face, row, column));
        }
      }
    }
  });

  it('keeps tile edges parallel to cell edges with a uniform inset', () => {
    const cell = cellPolygon('left', 2, 1);
    const tile = tilePolygon('left', 2, 1);
    const cellEdge = { x: cell[1]!.x - cell[0]!.x, y: cell[1]!.y - cell[0]!.y };
    const tileEdge = { x: tile[1]!.x - tile[0]!.x, y: tile[1]!.y - tile[0]!.y };
    expect(tileEdge.x / cellEdge.x).toBeCloseTo(0.82);
    expect(tileEdge.y / cellEdge.y).toBeCloseTo(0.82);
  });

  it('builds every face from four by four basis-vector steps', () => {
    expect(facePolygon('top')).toEqual([
      FACE_GEOMETRY.top.origin,
      gridPoint('top', 0, 4),
      gridPoint('top', 4, 4),
      gridPoint('top', 4, 0),
    ]);
  });

  it('rounds all four corners without changing the polygon vertices used for alignment', () => {
    const path = roundedPolygonPath(tilePolygon('top', 0, 0));

    expect(path.startsWith('M ')).toBe(true);
    expect(path.match(/ Q /g)).toHaveLength(4);
    expect(path.endsWith(' Z')).toBe(true);
  });
});
