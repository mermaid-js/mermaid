import { describe, expect, it } from 'vitest';
import defaultConfig from '../../../../defaultConfig.js';
import themes from '../../../../themes/index.js';
import type { SVGGroup } from '../../../../diagram-api/types.js';
import { ChartTitle, getChartTitleComponent } from './chartTitle.js';
import type { XYChartConfig, XYChartData, XYChartThemeConfig } from '../interfaces.js';
import type { TextDimensionCalculator } from '../textDimensionCalculator.js';

const textDimensionCalculator: TextDimensionCalculator = {
  getMaxDimension: (texts, fontSize) => ({
    width: Math.max(...texts.map((text) => text.length)) * fontSize,
    height: fontSize,
  }),
};

const chartConfig = {
  ...defaultConfig.xyChart,
  showTitle: true,
  titleFontSize: 16,
  titlePadding: 10,
} satisfies XYChartConfig;

const chartThemeConfig = {
  ...(themes.default.getThemeVariables().xyChart as XYChartThemeConfig),
  titleColor: '#333',
} satisfies XYChartThemeConfig;

const chartData: XYChartData = {
  title: 'Test Chart Title',
  xAxis: {
    type: 'band',
    title: '',
    categories: ['A', 'B'],
  },
  yAxis: {
    type: 'linear',
    title: '',
    min: 0,
    max: 100,
  },
  plots: [],
};

describe('chartTitle', () => {
  it('calculates space and generates drawable elements when space is sufficient', () => {
    const title = new ChartTitle(textDimensionCalculator, chartConfig, chartData, chartThemeConfig);
    // title length = 16, fontSize = 16 => width = 256. height = 16 + 2 * 10 = 36.
    const space = title.calculateSpace({ width: 500, height: 100 });
    expect(space).toEqual({
      width: 500,
      height: 36,
    });

    title.setBoundingBoxXY({ x: 0, y: 0 });
    const elements = title.getDrawableElements();
    expect(elements).toEqual([
      {
        groupTexts: ['chart-title'],
        type: 'text',
        data: [
          {
            fontSize: 16,
            text: 'Test Chart Title',
            verticalPos: 'middle',
            horizontalPos: 'center',
            x: 250,
            y: 18,
            fill: '#333',
            rotation: 0,
          },
        ],
      },
    ]);
  });

  it('gracefully hides title when available height is less than required', () => {
    const title = new ChartTitle(textDimensionCalculator, chartConfig, chartData, chartThemeConfig);
    // heightRequired is 36, but only 30 is available
    const space = title.calculateSpace({ width: 500, height: 30 });
    expect(space).toEqual({
      width: 0,
      height: 0,
    });
    expect(title.getDrawableElements()).toEqual([]);
  });

  it('gracefully hides title when available width is less than required', () => {
    const title = new ChartTitle(textDimensionCalculator, chartConfig, chartData, chartThemeConfig);
    // text width is 256, but only 200 is available
    const space = title.calculateSpace({ width: 200, height: 100 });
    expect(space).toEqual({
      width: 0,
      height: 0,
    });
    expect(title.getDrawableElements()).toEqual([]);
  });

  it('does not render when showTitle is false', () => {
    const title = new ChartTitle(
      textDimensionCalculator,
      { ...chartConfig, showTitle: false },
      chartData,
      chartThemeConfig
    );
    expect(title.calculateSpace({ width: 500, height: 100 })).toEqual({
      width: 0,
      height: 0,
    });
    expect(title.getDrawableElements()).toEqual([]);
  });

  it('does not render when title is empty', () => {
    const title = new ChartTitle(
      textDimensionCalculator,
      chartConfig,
      { ...chartData, title: '' },
      chartThemeConfig
    );
    expect(title.calculateSpace({ width: 500, height: 100 })).toEqual({
      width: 0,
      height: 0,
    });
    expect(title.getDrawableElements()).toEqual([]);
  });

  it('creates title component via factory function', () => {
    const title = getChartTitleComponent(
      chartConfig,
      chartData,
      chartThemeConfig,
      undefined as unknown as SVGGroup
    );
    expect(title.calculateSpace({ width: 500, height: 100 })).toEqual({
      width: 500,
      height: 36,
    });
  });
});
