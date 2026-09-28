import { describe, expect, it } from 'vitest';
import defaultConfig from '../../../../defaultConfig.js';
import themes from '../../../../themes/index.js';
import type { SVGGroup } from '../../../../diagram-api/types.js';
import { XYChartBuilder } from '../index.js';
import type {
  DrawableElem,
  XYChartConfig,
  XYChartData,
  XYChartThemeConfig,
} from '../interfaces.js';

const chartConfig = {
  ...defaultConfig.xyChart,
  showLegend: false,
} satisfies XYChartConfig;

const chartThemeConfig = themes.default.getThemeVariables().xyChart as XYChartThemeConfig;

const makeChartData = (title: string, plotTitle = ''): XYChartData => ({
  title,
  xAxis: { type: 'band', title: '', categories: ['a', 'b', 'c'] },
  yAxis: { type: 'linear', title: 'A fairly wide y-axis title', min: 0, max: 100000 },
  plots: [
    {
      type: 'bar',
      title: plotTitle,
      fill: '#0f0',
      data: [
        ['a', 10],
        ['b', 20],
        ['c', 30],
      ],
    },
  ],
});

const build = (config: XYChartConfig, data: XYChartData) =>
  XYChartBuilder.build(config, data, chartThemeConfig, undefined as unknown as SVGGroup);

const findGroup = (drawables: DrawableElem[], group: string) =>
  drawables.find((d) => d.groupTexts.join('.') === group);

const titleX = (drawables: DrawableElem[]) => {
  const title = findGroup(drawables, 'chart-title');
  if (title?.type !== 'text') {
    throw new Error('chart title was not rendered');
  }
  return title.data[0].x;
};

/** Start x of the axis that runs along the plot's width. */
const plotStartX = (drawables: DrawableElem[], axisGroup: string) => {
  const line = findGroup(drawables, `${axisGroup}.axis-line`);
  if (line?.type !== 'path') {
    throw new Error(`${axisGroup} line was not rendered`);
  }
  return Number(/^M ([\d.]+),/.exec(line.data[0].path)![1]);
};

describe('ChartTitle placement', () => {
  it('centres the title over the plot area in a vertical chart', () => {
    const drawables = build(chartConfig, makeChartData('Title'));
    const start = plotStartX(drawables, 'bottom-axis');

    expect(start).toBeGreaterThan(0);
    expect(titleX(drawables)).toBeCloseTo((start + chartConfig.width) / 2);
  });

  it('centres the title over the plot area in a horizontal chart', () => {
    const drawables = build({ ...chartConfig, chartOrientation: 'horizontal' }, makeChartData('T'));
    const start = plotStartX(drawables, 'top-axis');

    expect(start).toBeGreaterThan(0);
    expect(titleX(drawables)).toBeCloseTo((start + chartConfig.width) / 2);
  });

  it('excludes the legend from the area the title is centred over', () => {
    const drawables = build({ ...chartConfig, showLegend: true }, makeChartData('T', 'series'));
    const start = plotStartX(drawables, 'bottom-axis');
    const marker = findGroup(drawables, 'legend.markers');
    if (marker?.type !== 'rect') {
      throw new Error('legend marker was not rendered');
    }
    const end = marker.data[0].x - chartConfig.legendPadding;

    expect(end).toBeLessThan(chartConfig.width);
    expect(titleX(drawables)).toBeCloseTo((start + end) / 2);
  });

  it('keeps a title wider than the plot inside the chart', () => {
    // Without an SVG group, text is measured as length * fontSize: 32 * 20 = 640px.
    const title = 'x'.repeat(32);
    const titleWidth = title.length * chartConfig.titleFontSize;
    const drawables = build(chartConfig, makeChartData(title));
    const start = plotStartX(drawables, 'bottom-axis');

    expect((start + chartConfig.width) / 2).toBeGreaterThan(chartConfig.width - titleWidth / 2);
    expect(titleX(drawables)).toBeCloseTo(chartConfig.width - titleWidth / 2);
  });

  it('centres a title wider than the chart on the chart', () => {
    const drawables = build(chartConfig, makeChartData('x'.repeat(40)));

    expect(titleX(drawables)).toBeCloseTo(chartConfig.width / 2);
  });
});
