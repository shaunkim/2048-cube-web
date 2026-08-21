import { cubeWidthFor } from '../App';

it('expands the desktop cube to the wide content area and gives phones a full-bleed canvas', () => {
  expect(cubeWidthFor(1280)).toBe(1120);
  expect(cubeWidthFor(390)).toBe(438);
});
