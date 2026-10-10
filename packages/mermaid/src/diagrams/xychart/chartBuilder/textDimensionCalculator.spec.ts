import { describe, expect, it, vi } from 'vitest';
import type { SVGGroup } from '../../../diagram-api/types.js';
import { TextDimensionCalculatorWithFont } from './textDimensionCalculator.js';

vi.mock('../../../rendering-util/createText.js', () => ({
  computeDimensionOfText: () => ({ width: 6, height: 3 }),
}));

const createGroup = (screenScale: number | undefined, screenScaleY = screenScale) => {
  const elem = {
    attr: () => elem,
    remove: vi.fn(),
    node: () => ({
      getScreenCTM: () => (screenScale === undefined ? null : { a: screenScale, d: screenScaleY }),
    }),
  };
  return { append: () => elem } as unknown as SVGGroup;
};

describe('TextDimensionCalculatorWithFont', () => {
  it('returns text dimensions in SVG user units when the SVG is scaled down', () => {
    // A 4000px wide chart shown in an 800px container is drawn at 1/5 scale;
    // the measured screen size must be converted back to viewBox units.
    const calculator = new TextDimensionCalculatorWithFont(createGroup(0.2));
    const dimension = calculator.getMaxDimension(['CPU'], 14);
    expect(dimension.width).toBeCloseTo(30);
    expect(dimension.height).toBeCloseTo(15);
  });

  it('converts width and height with their own axis scale', () => {
    const calculator = new TextDimensionCalculatorWithFont(createGroup(0.2, 0.5));
    const dimension = calculator.getMaxDimension(['CPU'], 14);
    expect(dimension.width).toBeCloseTo(30);
    expect(dimension.height).toBeCloseTo(6);
  });

  it('returns the measured dimensions when no screen scale is available', () => {
    for (const scale of [undefined, 0]) {
      const calculator = new TextDimensionCalculatorWithFont(createGroup(scale));
      expect(calculator.getMaxDimension(['CPU'], 14)).toEqual({ width: 6, height: 3 });
    }
  });
});
