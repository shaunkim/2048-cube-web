import { monotonicIdSource, reservePersistedTileIds } from '../runtime';

function suffix(id: string): number {
  return Number(id.replace('tile-', ''));
}

describe('production tile ID reservation', () => {
  it('advances beyond a valid restored suffix', () => {
    const before = suffix(monotonicIdSource.next());

    reservePersistedTileIds([`tile-${before + 100}`]);

    expect(suffix(monotonicIdSource.next())).toBe(before + 101);
  });

  it('ignores an unsafe huge suffix without saturating or repeating production IDs', () => {
    const before = suffix(monotonicIdSource.next());

    reservePersistedTileIds(['tile-9007199254740992']);

    expect(suffix(monotonicIdSource.next())).toBe(before + 1);
    expect(suffix(monotonicIdSource.next())).toBe(before + 2);
  });

  it('ignores an absurdly long decimal suffix without changing the sequence', () => {
    const before = suffix(monotonicIdSource.next());

    reservePersistedTileIds([`tile-${'9'.repeat(10_000)}`]);

    expect(suffix(monotonicIdSource.next())).toBe(before + 1);
  });

  it('skips an occupied unsafe frontier ID after reserving its safe predecessor', () => {
    reservePersistedTileIds([
      'custom-player-tile',
      'tile-9007199254740991',
      'tile-9007199254740992',
    ]);

    const first = monotonicIdSource.next();
    const second = monotonicIdSource.next();

    expect(first).toBe('tile-9007199254740993');
    expect(second).toBe('tile-9007199254740994');
    expect(JSON.stringify([first, second])).toBe(
      '["tile-9007199254740993","tile-9007199254740994"]',
    );
  });
});
