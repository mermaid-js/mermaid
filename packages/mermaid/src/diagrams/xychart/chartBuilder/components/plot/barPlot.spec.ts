import { describe, expect, it } from 'vitest';
import type { Axis } from '../axis/index.js';
import type { BarPlotData, BoundingRect, DrawableElem, RectElem } from '../../interfaces.js';
import { BarPlot } from './barPlot.js';

/**
 * Minimal Axis fake: a linear map from data values to SVG coordinates,
 * mirroring the d3 scaleLinear range that LinearAxis builds from
 * BaseAxis.getRange() — inset by outerPadding on both ends.
 */
function createAxisFake(
  scale: (value: string | number) => number,
  opts: { outerPadding?: number; tickDistance?: number } = {}
): Axis {
  const { outerPadding = 0, tickDistance = 50 } = opts;
  return {
    getScaleValue: scale,
    getAxisOuterPadding: () => outerPadding,
    getTickDistance: () => tickDistance,
    setAxisPosition: () => {
      // No-op: BarPlot never positions axes.
    },
    recalculateOuterPaddingToDrawBar: () => {
      // No-op: BarPlot never recalculates axis padding.
    },
    setRange: () => {
      // No-op: the fake's scale is fixed at creation.
    },
    calculateSpace: () => ({ width: 0, height: 0 }),
    setBoundingBoxXY: () => {
      // No-op: BarPlot never moves axes.
    },
    getDrawableElements: () => [],
  };
}

function createLinearAxisFake(opts: {
  domain: [number, number];
  range: [number, number];
  reverseDomain?: boolean;
  outerPadding?: number;
}): Axis {
  const { domain, range, reverseDomain = false, outerPadding = 0 } = opts;
  const [d0, d1] = reverseDomain ? [domain[1], domain[0]] : domain;
  // Mirror BaseAxis.getRange(): the scale range is inset by outerPadding.
  const [r0, r1] = [range[0] + outerPadding, range[1] - outerPadding];
  return createAxisFake((value) => r0 + ((Number(value) - d0) / (d1 - d0)) * (r1 - r0), {
    outerPadding,
  });
}

const boundingRect: BoundingRect = { x: 60, y: 20, width: 400, height: 300 };
const plotBottom = boundingRect.y + boundingRect.height;
const plotRight = boundingRect.x + boundingRect.width;

function createBarPlot(
  data: BarPlotData['data'],
  xAxis: Axis,
  yAxis: Axis,
  orientation: 'vertical' | 'horizontal' = 'vertical'
): BarPlot {
  return new BarPlot(
    { type: 'bar', title: '', fill: '#000', data },
    boundingRect,
    xAxis,
    yAxis,
    orientation,
    0
  );
}

function getFirstRect(elems: DrawableElem[]): RectElem {
  const [elem] = elems;
  if (elem.type !== 'rect') {
    throw new Error('Expected BarPlot to return a rect element');
  }
  return elem.data[0];
}

describe('BarPlot zero baseline', () => {
  it('vertical: bars end at the scaled zero line, not at the plot bottom', () => {
    const categoryAxis = createAxisFake(() => 200, { outerPadding: 10, tickDistance: 60 });
    // y axis: domain [0, 10], SVG range [20, 320], reversed (position left),
    // inset by outerPadding 15, so scaled zero sits 15px above the plot bottom.
    const valueAxis = createLinearAxisFake({
      domain: [0, 10],
      range: [boundingRect.y, plotBottom],
      reverseDomain: true,
      outerPadding: 15,
    });
    const zeroLine = valueAxis.getScaleValue(0);
    expect(zeroLine).toBeLessThan(plotBottom);

    const rect = getFirstRect(
      createBarPlot([['a', 1.77]], categoryAxis, valueAxis).getDrawableElement()
    );
    expect(rect.y + rect.height).toBeCloseTo(zeroLine);
    expect(rect.y + rect.height).toBeLessThan(plotBottom);
  });

  it('vertical: negative bars hang from the zero line', () => {
    const categoryAxis = createAxisFake(() => 200, { outerPadding: 10, tickDistance: 60 });
    const valueAxis = createLinearAxisFake({
      domain: [-5, 10],
      range: [boundingRect.y, plotBottom],
      reverseDomain: true,
      outerPadding: 15,
    });
    const zeroLine = valueAxis.getScaleValue(0);

    const rect = getFirstRect(
      createBarPlot([['a', -2]], categoryAxis, valueAxis).getDrawableElement()
    );
    expect(rect.y).toBeCloseTo(zeroLine);
    expect(rect.height).toBeCloseTo(valueAxis.getScaleValue(-2) - zeroLine);
  });

  it('vertical: zero below the domain clamps the baseline to the plot bottom', () => {
    const categoryAxis = createAxisFake(() => 200, { outerPadding: 10, tickDistance: 60 });
    const valueAxis = createLinearAxisFake({
      domain: [10, 20],
      range: [boundingRect.y, plotBottom],
      reverseDomain: true,
      outerPadding: 15,
    });
    // Zero extrapolates past the plot bottom, so bars keep the old behaviour.
    expect(valueAxis.getScaleValue(0)).toBeGreaterThan(plotBottom);

    const rect = getFirstRect(
      createBarPlot([['a', 15]], categoryAxis, valueAxis).getDrawableElement()
    );
    expect(rect.y + rect.height).toBeCloseTo(plotBottom);
  });

  it('horizontal: bars start at the scaled zero line, not at the plot edge', () => {
    const categoryAxis = createAxisFake(() => 200, { outerPadding: 10, tickDistance: 60 });
    // Value axis drawn horizontally (position top, not reversed), inset by
    // outerPadding 15, so scaled zero sits 15px right of the plot edge.
    const valueAxis = createLinearAxisFake({
      domain: [0, 10],
      range: [boundingRect.x, plotRight],
      outerPadding: 15,
    });
    const zeroLine = valueAxis.getScaleValue(0);
    expect(zeroLine).toBeGreaterThan(boundingRect.x);

    const rect = getFirstRect(
      createBarPlot([['a', 4]], categoryAxis, valueAxis, 'horizontal').getDrawableElement()
    );
    expect(rect.x).toBeCloseTo(zeroLine);
    expect(rect.x + rect.width).toBeCloseTo(valueAxis.getScaleValue(4));
  });

  it('horizontal: negative bars extend left from the zero line', () => {
    const categoryAxis = createAxisFake(() => 200, { outerPadding: 10, tickDistance: 60 });
    const valueAxis = createLinearAxisFake({
      domain: [-5, 10],
      range: [boundingRect.x, plotRight],
      outerPadding: 15,
    });
    const zeroLine = valueAxis.getScaleValue(0);

    const rect = getFirstRect(
      createBarPlot([['a', -2]], categoryAxis, valueAxis, 'horizontal').getDrawableElement()
    );
    expect(rect.x + rect.width).toBeCloseTo(zeroLine);
    expect(rect.width).toBeCloseTo(zeroLine - valueAxis.getScaleValue(-2));
  });
});
