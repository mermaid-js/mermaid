import { describe, expect, it } from 'vitest';
import defaultConfig from '../../../../defaultConfig.js';
import themes from '../../../../themes/index.js';
import type { SVGGroup } from '../../../../diagram-api/types.js';
import { XYChartBuilder } from '../index.js';
import { ChartLegend } from './legend.js';
import { getChartLegendComponent } from './legend.js';
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
  showLegend: true,
} satisfies XYChartConfig;

const chartThemeConfig = {
  ...(themes.default.getThemeVariables().xyChart as XYChartThemeConfig),
  legendTextColor: '#333',
} satisfies XYChartThemeConfig;

const chartData: XYChartData = {
  title: 'Latency',
  xAxis: {
    type: 'band',
    title: '',
    categories: ['90d', '60d'],
  },
  yAxis: {
    type: 'linear',
    title: 'Seconds',
    min: 0,
    max: 100,
  },
  plots: [
    {
      type: 'line',
      title: 'avg',
      strokeFill: '#f00',
      strokeWidth: 2,
      data: [
        ['90d', 40],
        ['60d', 50],
      ],
    },
    {
      type: 'bar',
      title: 'p95',
      fill: '#0f0',
      data: [
        ['90d', 80],
        ['60d', 90],
      ],
    },
    {
      type: 'line',
      title: '',
      strokeFill: '#00f',
      strokeWidth: 2,
      data: [
        ['90d', 30],
        ['60d', 35],
      ],
    },
  ],
};

describe('ChartLegend', () => {
  it('renders marker and label drawables for named line and bar plots', () => {
    const legend = new ChartLegend(
      textDimensionCalculator,
      chartConfig,
      chartData,
      chartThemeConfig
    );

    expect(legend.calculateSpace({ width: 200, height: 200 })).toEqual({
      width: 77.4,
      height: 55,
    });

    legend.setBoundingBoxXY({ x: 100, y: 50 });
    const drawables = legend.getDrawableElements();

    expect(drawables).toHaveLength(3);
    expect(drawables[0]).toMatchObject({
      groupTexts: ['legend', 'markers'],
      type: 'rect',
      data: [
        {
          x: 110,
          y: 81,
          width: 10.5,
          height: 10.5,
          fill: '#0f0',
          strokeFill: '#0f0',
          strokeWidth: 0,
        },
      ],
    });
    expect(drawables[1]).toMatchObject({
      groupTexts: ['legend', 'markers'],
      type: 'path',
      data: [
        {
          path: 'M 110,65.25 L 120.5,65.25',
          strokeFill: '#f00',
          strokeWidth: 2,
        },
      ],
    });
    expect(drawables[2]).toMatchObject({
      groupTexts: ['legend', 'label'],
      type: 'text',
      data: [
        {
          text: 'avg',
          x: 125.4,
          y: 65.25,
          fill: '#333',
          fontSize: 14,
          rotation: 0,
          verticalPos: 'middle',
          horizontalPos: 'left',
        },
        {
          text: 'p95',
          x: 125.4,
          y: 86.25,
          fill: '#333',
          fontSize: 14,
          rotation: 0,
          verticalPos: 'middle',
          horizontalPos: 'left',
        },
      ],
    });
  });

  it('does not render when legends are disabled or no named plots fit', () => {
    const disabledLegend = new ChartLegend(
      textDimensionCalculator,
      { ...chartConfig, showLegend: false },
      chartData,
      chartThemeConfig
    );
    expect(disabledLegend.calculateSpace({ width: 200, height: 200 })).toEqual({
      width: 0,
      height: 0,
    });
    expect(disabledLegend.getDrawableElements()).toEqual([]);

    const crampedLegend = new ChartLegend(
      textDimensionCalculator,
      chartConfig,
      chartData,
      chartThemeConfig
    );
    expect(crampedLegend.calculateSpace({ width: 20, height: 20 })).toEqual({
      width: 0,
      height: 0,
    });
    expect(crampedLegend.getDrawableElements()).toEqual([]);
  });

  it('creates a legend component and integrates with the chart builder', () => {
    const legend = getChartLegendComponent(
      chartConfig,
      chartData,
      chartThemeConfig,
      undefined as unknown as SVGGroup
    );

    expect(legend.calculateSpace({ width: 200, height: 200 })).toEqual({
      width: 77.4,
      height: 55,
    });

    const drawables = XYChartBuilder.build(
      { ...chartConfig, chartOrientation: 'horizontal' },
      chartData,
      chartThemeConfig,
      undefined as unknown as SVGGroup
    );

    expect(
      drawables.find(
        (drawable) => drawable.type === 'text' && drawable.groupTexts.join('.') === 'legend.label'
      )?.data
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: 'avg', fill: '#333' }),
        expect.objectContaining({ text: 'p95', fill: '#333' }),
      ])
    );
  });
});
