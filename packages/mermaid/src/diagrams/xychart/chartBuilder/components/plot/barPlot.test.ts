import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BarPlot } from './barPlot.js';
import type { BarPlotData, BoundingRect } from '../../interfaces.js';
import type { Axis } from '../axis/index.js';

describe('BarPlot', () => {
  let mockXAxis: Axis;
  let mockYAxis: Axis;
  let boundingRect: BoundingRect;

  beforeEach(() => {
    mockXAxis = {
      getScaleValue: vi.fn((val: string) => parseInt(val, 10)),
      getAxisOuterPadding: vi.fn(() => 10),
      getTickDistance: vi.fn(() => 50),
    } as unknown as Axis;

    mockYAxis = {
      getScaleValue: vi.fn((val: number) => val * 10),
    } as unknown as Axis;

    boundingRect = { x: 0, y: 0, width: 200, height: 100 };
  });

  it('should use customBarWidth when provided', () => {
    const barData: BarPlotData = {
      type: 'bar',
      fill: 'blue',
      data: [
        ['1', 10],
        ['2', 20],
      ],
    };

    const barPlot = new BarPlot(barData, boundingRect, mockXAxis, mockYAxis, 'vertical', 0, 15);
    const elements = barPlot.getDrawableElement();

    if (elements[0].type === 'rect') {
      expect(elements[0].data[0].width).toBe(15); // Check custom bar width
    } else {
      throw new Error('Unexpected element type, expected "rect".');
    }
  });

  it('should calculate bar width when customBarWidth is 0', () => {
    const barData: BarPlotData = {
      type: 'bar',
      fill: 'blue',
      data: [
        ['1', 10],
        ['2', 20],
      ],
    };

    const barPlot = new BarPlot(barData, boundingRect, mockXAxis, mockYAxis, 'vertical', 0);
    const elements = barPlot.getDrawableElement();

    if (elements[0].type === 'rect') {
      const calculatedWidth =
        Math.min(mockXAxis.getAxisOuterPadding() * 2, mockXAxis.getTickDistance()) * 0.95; // Assuming barPaddingPercent = 0.05

      expect(elements[0].data[0].width).toBeCloseTo(calculatedWidth); // Check calculated bar width
    } else {
      throw new Error('Unexpected element type, expected "rect".');
    }
  });
});
