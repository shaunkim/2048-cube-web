import { collapseLine } from '../line';
import type { IdSource, Tile } from '../model';

const tile = (id: string, value: number): Tile => ({ id, value });

function ids(...values: string[]): IdSource {
  let index = 0;
  return {
    next: () => {
      const value = values[index];
      if (value === undefined) throw new Error('ID fixture exhausted');
      index += 1;
      return value;
    },
  };
}

describe('collapseLine', () => {
  it('compresses gaps toward index zero without replacing tile IDs', () => {
    const result = collapseLine([null, tile('a', 2), null, tile('b', 4)], ids());

    expect(result.cells).toEqual([tile('a', 2), tile('b', 4), null, null]);
    expect(result.motions).toEqual([
      { tileId: 'a', value: 2, from: 1, to: 0 },
      { tileId: 'b', value: 4, from: 3, to: 1 },
    ]);
    expect(result.changed).toBe(true);
  });

  it('merges 2,2,2,2 into 4,4 and never chains a result', () => {
    const result = collapseLine(
      [tile('a', 2), tile('b', 2), tile('c', 2), tile('d', 2)],
      ids('m1', 'm2'),
    );

    expect(result.cells).toEqual([tile('m1', 4), tile('m2', 4), null, null]);
    expect(result.scoreDelta).toBe(8);
    expect(result.merges.map((merge) => merge.sourceIds)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it.each([
    [
      [tile('a', 2), tile('b', 2), tile('c', 2), null],
      [tile('first-pair', 4), tile('c', 2), null, null],
      [['a', 'b']],
    ],
    [
      [tile('a', 2), null, tile('b', 2), tile('c', 2)],
      [tile('first-pair', 4), tile('c', 2), null, null],
      [['a', 'b']],
    ],
  ] as const)('merges the leading pair first for three equal tiles %#', (cells, expected, sources) => {
    const result = collapseLine(cells, ids('first-pair'));

    expect(result.cells).toEqual(expected);
    expect(result.merges.map((merge) => merge.sourceIds)).toEqual(sources);
  });

  it('reports an unchanged line without consuming an ID', () => {
    const result = collapseLine([tile('a', 2), tile('b', 4), null, null], {
      next: () => {
        throw new Error('must not allocate');
      },
    });

    expect(result.changed).toBe(false);
    expect(result.scoreDelta).toBe(0);
  });
});
