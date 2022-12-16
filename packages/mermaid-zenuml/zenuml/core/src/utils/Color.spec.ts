import { brightnessIgnoreAlpha } from '../utils/Color';
describe('Color', () => {
  it.each([
    ['rgb(255, 255, 255)', 255],
    ['rgb(255, 255, 0)', 225.93],
    ['rgb(255, 0, 0)', 76.245],
  ])('should get the brightnessIgnoreAlpha for rgba values', (color, brightnessValue) => {
    expect(brightnessIgnoreAlpha(color)).toEqual(brightnessValue);
  });
});
