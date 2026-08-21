import { cubeWidthFor } from '../App';

it('expands the desktop cube to the wide content area while preserving phone margins', () => {
  expect(cubeWidthFor(1280)).toBe(1120);
  expect(cubeWidthFor(390)).toBe(366);
});
