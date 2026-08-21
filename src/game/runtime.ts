import type { IdSource, RandomSource } from './model';

export const mathRandomSource: RandomSource = {
  next: () => Math.random(),
};

let nextTileId = 1n;
const MAX_SAFE_PERSISTED_SUFFIX = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_SAFE_SUFFIX_LENGTH = String(Number.MAX_SAFE_INTEGER).length;
const reservedTileIds = new Set<string>();

export const monotonicIdSource: IdSource = {
  next: () => {
    while (true) {
      const candidate = `tile-${nextTileId++}`;
      if (!reservedTileIds.delete(candidate)) return candidate;
    }
  },
};

export function reservePersistedTileIds(ids: readonly string[]): void {
  reservedTileIds.clear();
  const highest = ids.reduce((maximum, id) => {
    reservedTileIds.add(id);
    if (!id.startsWith('tile-')) return maximum;

    const suffixLength = id.length - 'tile-'.length;
    if (suffixLength < 1 || suffixLength > MAX_SAFE_SUFFIX_LENGTH) return maximum;

    const suffixText = id.slice('tile-'.length);
    if (!/^\d+$/.test(suffixText)) return maximum;

    const suffix = BigInt(suffixText);
    return suffix >= 1n && suffix <= MAX_SAFE_PERSISTED_SUFFIX && suffix > maximum
      ? suffix
      : maximum;
  }, 0n);
  nextTileId = nextTileId > highest ? nextTileId : highest + 1n;
}
