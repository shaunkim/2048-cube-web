import { faceStyle, gameTheme, tileStyle } from '../gameTheme';

it('uses the approved classic 2048 color tokens', () => {
  expect(gameTheme).toMatchObject({
    background: '#FAF8EF',
    ink: '#776E65',
    board: '#BBADA0',
    emptyCell: '#CDC1B4',
    grid: '#9F9285',
    logo: '#F9C900',
    action: '#F2A05B',
    lightText: '#F9F6F2',
    fonts: { regular: 'ClearSans-Regular', medium: 'ClearSans-Medium', bold: 'ClearSans-Bold' },
  });
  expect(tileStyle(2, 'top')).toMatchObject({ fill: '#EEE4DA', text: '#776E65' });
  expect(tileStyle(2048, 'top')).toMatchObject({ fill: '#EDC22E', text: '#F9F6F2' });
});

it('keeps the top brightest and shades the right and left faces progressively darker', () => {
  expect(gameTheme.faces).toEqual({ top: '#D8CCBE', right: '#BFB2A3', left: '#AFA294' });
  expect(tileStyle(8, 'top').fill).toBe('#F2B179');
  expect(tileStyle(8, 'right').fill).not.toBe(tileStyle(8, 'top').fill);
  expect(tileStyle(8, 'left').fill).not.toBe(tileStyle(8, 'right').fill);
});

it('turns a retired face grayscale while keeping its values readable', () => {
  expect(faceStyle('left', true)).toEqual({ fill: '#979797', grid: '#777777', opacity: 0.78 });
  expect(tileStyle(64, 'left', true)).toMatchObject({ fill: '#777777', text: '#F9F6F2' });
});
