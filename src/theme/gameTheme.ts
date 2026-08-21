import type { FaceId } from '../game/model';

const VALUE_COLORS: Readonly<Record<number, string>> = {
  2: '#EEE4DA',
  4: '#EDE0C8',
  8: '#F2B179',
  16: '#F59563',
  32: '#F67C5F',
  64: '#F65E3B',
  128: '#EDCF72',
  256: '#EDCC61',
  512: '#EDC850',
  1024: '#EDC53F',
  2048: '#EDC22E',
};

const FACE_INTENSITY: Readonly<Record<FaceId, number>> = {
  top: 1,
  right: 0.94,
  left: 0.88,
};

function shade(hex: string, intensity: number): string {
  const channels = [1, 3, 5].map((offset) =>
    Math.round(Number.parseInt(hex.slice(offset, offset + 2), 16) * intensity),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export const gameTheme = {
  background: '#FAF8EF',
  ink: '#776E65',
  mutedInk: '#8F857A',
  board: '#BBADA0',
  emptyCell: '#CDC1B4',
  grid: '#9F9285',
  logo: '#F9C900',
  action: '#F2A05B',
  lightText: '#F9F6F2',
  fonts: { regular: 'ClearSans-Regular', medium: 'ClearSans-Medium', bold: 'ClearSans-Bold' },
  faces: { top: '#D8CCBE', right: '#BFB2A3', left: '#AFA294' },
} as const;

export function faceStyle(face: FaceId, frozen: boolean) {
  return frozen
    ? { fill: '#979797', grid: '#777777', opacity: 0.78 }
    : { fill: gameTheme.faces[face], grid: gameTheme.grid, opacity: 1 };
}

export function tileStyle(value: number, face: FaceId = 'top', frozen = false) {
  const canonical = VALUE_COLORS[value] ?? '#3C3A32';
  const fill = frozen ? '#777777' : shade(canonical, FACE_INTENSITY[face]);
  return {
    fill,
    text: frozen || value > 4 ? gameTheme.lightText : gameTheme.ink,
    fontSize: value < 100 ? 19 : value < 1000 ? 16 : value < 10000 ? 13 : 11,
  } as const;
}
