import type {
  Cell,
  CollapseLineResult,
  IdSource,
  LineMerge,
  LineMotion,
} from './model';

export function collapseLine(
  cells: readonly Cell[],
  ids: IdSource,
): CollapseLineResult {
  if (cells.length !== 4) throw new Error('A 2048 line must contain four cells');

  const occupied = cells.flatMap((tile, index) => (tile ? [{ tile, index }] : []));
  const output: Cell[] = [];
  const motions: LineMotion[] = [];
  const merges: LineMerge[] = [];
  let scoreDelta = 0;

  for (let source = 0; source < occupied.length; source += 1) {
    const current = occupied[source];
    if (!current) throw new Error('Occupied index invariant failed');
    const next = occupied[source + 1];
    const destination = output.length;

    if (next && next.tile.value === current.tile.value) {
      const result = { id: ids.next(), value: current.tile.value * 2 };
      output.push(result);
      motions.push(
        { tileId: current.tile.id, value: current.tile.value, from: current.index, to: destination },
        { tileId: next.tile.id, value: next.tile.value, from: next.index, to: destination },
      );
      merges.push({ sourceIds: [current.tile.id, next.tile.id], result, at: destination });
      scoreDelta += result.value;
      source += 1;
      continue;
    }

    output.push(current.tile);
    if (current.index !== destination) {
      motions.push({
        tileId: current.tile.id,
        value: current.tile.value,
        from: current.index,
        to: destination,
      });
    }
  }

  while (output.length < 4) output.push(null);

  return {
    cells: output,
    changed: motions.length > 0 || merges.length > 0,
    scoreDelta,
    motions,
    merges,
  };
}
