import { classifySwipe, directionForKey } from '../direction';

describe('six-way input classification', () => {
  it.each([
    [0, -100, 'up'],
    [0, 100, 'down'],
    [-87, -50, 'upLeft'],
    [87, -50, 'upRight'],
    [-87, 50, 'downLeft'],
    [87, 50, 'downRight'],
  ] as const)('classifies displacement (%s,%s)', (dx, dy, expected) => {
    expect(classifySwipe(dx, dy)).toBe(expected);
  });

  it('ignores a displacement shorter than 24 logical pixels', () => {
    expect(classifySwipe(10, 10)).toBeNull();
  });

  it.each([
    ['q', 'upLeft'], ['w', 'up'], ['e', 'upRight'],
    ['a', 'downLeft'], ['s', 'down'], ['d', 'downRight'],
  ] as const)('maps key %s', (key, direction) => {
    expect(directionForKey(key)).toBe(direction);
    expect(directionForKey(key.toUpperCase())).toBe(direction);
  });

  it.each([
    [-61, 'up'], [-59, 'upRight'],
    [-1, 'upRight'], [1, 'downRight'],
    [59, 'downRight'], [61, 'down'],
    [119, 'down'], [121, 'downLeft'],
    [179, 'downLeft'], [-179, 'upLeft'],
    [-121, 'upLeft'], [-119, 'up'],
  ] as const)('classifies angle %s degrees on the expected side of a sector boundary', (degrees, expected) => {
    const radians = degrees * Math.PI / 180;

    expect(classifySwipe(Math.cos(radians) * 100, Math.sin(radians) * 100)).toBe(expected);
  });
});
