import type { GlobalDirection } from '../game/model';

const ROOT_THREE_OVER_TWO = Math.sqrt(3) / 2;
const RAYS: readonly { direction: GlobalDirection; x: number; y: number }[] = [
  { direction: 'up', x: 0, y: -1 },
  { direction: 'upRight', x: ROOT_THREE_OVER_TWO, y: -0.5 },
  { direction: 'downRight', x: ROOT_THREE_OVER_TWO, y: 0.5 },
  { direction: 'down', x: 0, y: 1 },
  { direction: 'downLeft', x: -ROOT_THREE_OVER_TWO, y: 0.5 },
  { direction: 'upLeft', x: -ROOT_THREE_OVER_TWO, y: -0.5 },
];

export function classifySwipe(dx: number, dy: number, minimumDistance = 24): GlobalDirection | null {
  const length = Math.hypot(dx, dy);
  if (length < minimumDistance) return null;

  const x = dx / length;
  const y = dy / length;
  return RAYS.reduce((best, ray) =>
    ray.x * x + ray.y * y > best.x * x + best.y * y ? ray : best,
  ).direction;
}

const KEY_DIRECTIONS: Readonly<Record<string, GlobalDirection>> = {
  q: 'upLeft', w: 'up', e: 'upRight',
  a: 'downLeft', s: 'down', d: 'downRight',
};

export function directionForKey(key: string): GlobalDirection | null {
  return KEY_DIRECTIONS[key.toLowerCase()] ?? null;
}
