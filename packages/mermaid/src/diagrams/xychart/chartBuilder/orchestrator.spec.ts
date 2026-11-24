import { describe, expect, it } from 'vitest';
import defaultConfig from '../../../defaultConfig.js';
import themes from '../../../themes/index.js';
import type { SVGGroup } from '../../../diagram-api/types.js';
import { XYChartBuilder } from './index.js';
import type { DrawableElem, XYChartConfig, XYChartData, XYChartThemeConfig } from './interfaces.js';

const chartThemeConfig = themes.default.getThemeVariables().xyChart as XYChartThemeConfig;

const tmpSVGGroup = undefined as unknown as SVGGroup;

const sparklineData: XYChartData = {
  title: '',
  xAxis: {
    type: 'band',
    title: '',
    categories: ['0', '1', '2', '3', '4', '5', '6', '7'],
  },
  yAxis: {
    type: 'linear',
    title: '',
    min: 5000,
    max: 11000,
  },
  plots: [
    {
      type: 'line',
      title: '',
      strokeFill: '#f00',
      strokeWidth: 2,
      data: [
        ['0', 5000],
        ['1', 9000],
        ['2', 7500],
        ['3', 6200],
        ['4', 9500],
        ['5', 5500],
        ['6', 11000],
        ['7', 8200],
      ],
    },
  ],
};

/**
 * Builds the chart with the given xyChart config overrides and returns only
 * the drawable elements emitted for the axes.
 */
function buildAxisDrawables(config: Partial<XYChartConfig>): DrawableElem[] {
  const chartConfig = {
    ...defaultConfig.xyChart,
    ...config,
  } as XYChartConfig;
  const drawables = XYChartBuilder.build(chartConfig, sparklineData, chartThemeConfig, tmpSVGGroup);
  return drawables.filter((drawable) => drawable.groupTexts[0].endsWith('-axis'));
}

function pathCoordinates(drawables: DrawableElem[]): [number, number][] {
  const coords: [number, number][] = [];
  for (const drawable of drawables) {
    if (drawable.type !== 'path') {
      continue;
    }
    for (const { path } of drawable.data) {
      const numbers = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
      for (let i = 0; i + 1 < numbers.length; i += 2) {
        coords.push([numbers[i], numbers[i + 1]]);
      }
    }
  }
  return coords;
}

describe('Orchestrator axis space reservation', () => {
  describe('sparkline charts (plotReservedSpacePercent close to 100)', () => {
    it('does not emit axis geometry when no space is reserved for the axes', () => {
      // Issue #7600: width 200, height 20, plotReservedSpacePercent 100 leaves
      // no room for the axes, so no axis line, tick or label may be drawn.
      const axisDrawables = buildAxisDrawables({
        width: 200,
        height: 20,
        plotReservedSpacePercent: 100,
      });

      expect(axisDrawables).toEqual([]);
    });

    it('does not emit a partial axis when the leftover space cannot fit the axis line and ticks', () => {
      // plotReservedSpacePercent 98 on a 200x20 canvas leaves a 4px sliver for
      // the y-axis: enough for the axis line but not for the line and the tick
      // marks together. The leftover must not render a partial axis (a lone
      // axis line) squeezed against the plot.
      const axisDrawables = buildAxisDrawables({
        width: 200,
        height: 20,
        plotReservedSpacePercent: 98,
      });

      expect(axisDrawables).toEqual([]);
    });

    it('keeps every emitted coordinate inside the tiny chart boundary', () => {
      const drawables = XYChartBuilder.build(
        {
          ...defaultConfig.xyChart,
          width: 200,
          height: 20,
          plotReservedSpacePercent: 100,
        } as XYChartConfig,
        sparklineData,
        chartThemeConfig,
        tmpSVGGroup
      );

      for (const [x, y] of pathCoordinates(drawables)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(200);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(20);
      }
    });
  });

  it('still draws both axes when the chart reserves enough space for them', () => {
    const axisDrawables = buildAxisDrawables({
      width: 700,
      height: 500,
      plotReservedSpacePercent: 50,
    });
    const axisGroups = axisDrawables.map((drawable) => drawable.groupTexts);

    expect(axisGroups).toContainEqual(['bottom-axis', 'axis-line']);
    expect(axisGroups).toContainEqual(['bottom-axis', 'ticks']);
    expect(axisGroups).toContainEqual(['left-axis', 'axisl-line']);
    expect(axisGroups).toContainEqual(['left-axis', 'ticks']);
    expect(axisGroups).toContainEqual(['left-axis', 'label']);
  });
});
