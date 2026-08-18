import { describe, expect, it } from 'vitest';
import defaultConfig from '../../../../../defaultConfig.js';
import themes from '../../../../../themes/index.js';
import type { SVGGroup } from '../../../../../diagram-api/types.js';
import { XYChartBuilder } from '../../index.js';
import type { RectElem, XYChartConfig, XYChartData, XYChartThemeConfig } from '../../interfaces.js';

const chartConfig = {
  ...defaultConfig.xyChart,
  showLegend: false,
} satisfies XYChartConfig;

const chartThemeConfig = themes.default.getThemeVariables().xyChart as XYChartThemeConfig;

/** One bar series. Values are laid out over the categories in order. */
function bar(title: string, group: string, fill: string, values: number[]) {
  return {
    type: 'bar' as const,
    title,
    fill,
    group,
    data: values.map((v, i) => [`Q${i + 1}`, v] as [string, number]),
  };
}

/** Builds a chart and returns every bar rectangle, flattened in plot order. */
function barRects(plots: XYChartData['plots'], min = 0, max = 30): RectElem[] {
  const data: XYChartData = {
    title: '',
    xAxis: { type: 'band', title: '', categories: ['Q1'] },
    yAxis: { type: 'linear', title: '', min, max },
    plots,
  };
  const drawables = XYChartBuilder.build(
    chartConfig,
    data,
    chartThemeConfig,
    undefined as unknown as SVGGroup
  );
  return drawables
    .filter((d) => d.type === 'rect' && d.groupTexts[0] === 'plot')
    .flatMap((d) => d.data as RectElem[]);
}

/** Asserts a rect's geometry, tolerant of floating-point dust. */
function expectRect(rect: RectElem, expected: Pick<RectElem, 'x' | 'y' | 'width' | 'height'>) {
  expect(rect.x).toBeCloseTo(expected.x, 3);
  expect(rect.y).toBeCloseTo(expected.y, 3);
  expect(rect.width).toBeCloseTo(expected.width, 3);
  expect(rect.height).toBeCloseTo(expected.height, 3);
}

describe('BasePlot bar geometry', () => {
  // A single bar has groupTotal === 1, which zeroes groupOffset and makes barWidth
  // the full slot -- the grouped/stacked math collapses back to the original
  // upstream behaviour. These coordinates are the upstream output, frozen so that
  // any future change to plain bar charts has to be deliberate.
  const soloBar = { x: 269.425, y: 310.333, width: 206.15, height: 158.667 };

  it('draws a lone bar across the full slot, anchored to the axis floor', () => {
    const rects = barRects([bar('solo', 'g0', '#0f0', [10])]);

    expect(rects).toHaveLength(1);
    expectRect(rects[0], soloBar);
  });

  it('splits one slot evenly between two side-by-side groups', () => {
    const rects = barRects([bar('a', 'g0', '#0f0', [10]), bar('b', 'g1', '#00f', [20])]);
    expect(rects).toHaveLength(2);
    const [left, right] = rects;

    // Even split, and the two bars touch without gap or overlap.
    expect(left.width).toBeCloseTo(right.width, 6);
    expect(left.x + left.width).toBeCloseTo(right.x, 6);

    // Together the groups occupy exactly the slot a lone bar would have used,
    // centred on the same tick.
    expect(right.x + right.width - left.x).toBeCloseTo(soloBar.width, 3);
    expect((left.x + right.x + right.width) / 2).toBeCloseTo(soloBar.x + soloBar.width / 2, 3);
  });

  it('stacks series of one group contiguously within a single slot', () => {
    const rects = barRects([bar('lower', 'g0', '#0f0', [10]), bar('upper', 'g0', '#00f', [5])]);
    expect(rects).toHaveLength(2);
    const [lower, upper] = rects;

    // A stack is one slot wide -- it does not divide the tick space.
    expect(lower.x).toBeCloseTo(soloBar.x, 3);
    expect(lower.width).toBeCloseTo(soloBar.width, 3);
    expect(upper.x).toBeCloseTo(lower.x, 6);
    expect(upper.width).toBeCloseTo(lower.width, 6);

    // The upper segment's bottom edge meets the lower segment's top edge exactly.
    expect(upper.y + upper.height).toBeCloseTo(lower.y, 3);
  });

  // Frozen so that reworking the baseline bookkeeping cannot silently move an
  // ordinary positive stack by a pixel.
  it('keeps an all-positive stack at its established coordinates', () => {
    const rects = barRects([bar('lower', 'g0', '#0f0', [10]), bar('upper', 'g0', '#00f', [5])]);

    expectRect(rects[0], { x: 269.425, y: 310.333, width: 206.15, height: 158.667 });
    expectRect(rects[1], { x: 269.425, y: 234.5, width: 206.15, height: 75.833 });
  });

  it('never produces a negative height when a stack mixes positive and negative values', () => {
    // Axis spans zero so both directions are on-chart.
    const rects = barRects(
      [bar('up', 'g0', '#0f0', [10]), bar('down', 'g0', '#00f', [-5])],
      -10,
      30
    );

    expect(rects).toHaveLength(2);
    for (const rect of rects) {
      // A negative height is an invalid <rect>: the browser draws nothing.
      expect(rect.height).toBeGreaterThanOrEqual(0);
    }
  });
});
