// @ts-ignore: TODO Fix ts errors
import { adjust, channel, toHsla, isDark, lighten, darken } from 'khroma';
import mermaidAPI from '../../mermaidAPI.js';
import * as configApi from '../../config.js';
import { sanitizeText } from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../../commonDb.js';
import { XYChartBuilder } from './chartBuilder/index.js';
import {
  DrawableElem,
  SimplePlotDataType,
  XYChartData,
  XYChartThemeConfig,
  isBandAxisData,
  isLinearAxisData,
} from './chartBuilder/Interfaces.js';
import { XYChartConfig } from '../../config.type.js';
import { getThemeVariables } from '../../themes/theme-default.js';

const defaultThemeVariables = getThemeVariables();

const config = configApi.getConfig();

function plotColorPaletteGenerator(baseColor: string, noOfColorNeeded = 15): string[] {
  const colors = [];
  const MAX_HUE_VALUE = 360;
  const baseHue = channel(baseColor, 'h');
  if (baseHue > MAX_HUE_VALUE / 2) {
    const decr = Math.floor(baseHue / noOfColorNeeded);
    for (let i = 0; i <= baseHue; i += decr) {
      colors.push(adjust(baseColor, { h: -i }));
    }
  } else {
    const incr = Math.floor((MAX_HUE_VALUE - baseHue) / noOfColorNeeded);
    for (let i = 0; i <= baseHue; i += incr) {
      colors.push(adjust(baseColor, { h: i }));
    }
  }
  return colors;
}

function getChartDefaultThemeConfig(): XYChartThemeConfig {
  return {
    xychartTitleColor:
      config.themeVariables?.xychartTitleColor || defaultThemeVariables.xychartTitleColor,
    xychartAxisLineColor:
      config.themeVariables?.xychartAxisLineColor || defaultThemeVariables.xychartAxisLineColor,
    xychartXAxisLableColor:
      config.themeVariables?.xychartXAxisLableColor || defaultThemeVariables.xychartXAxisLableColor,
    xychartXAxisTitleColor:
      config.themeVariables?.xychartXAxisTitleColor || defaultThemeVariables.xychartXAxisTitleColor,
    xychartXAxisTickColor:
      config.themeVariables?.xychartXAxisTickColor || defaultThemeVariables.xychartXAxisTickColor,
    xychartYAxisLableColor:
      config.themeVariables?.xychartYAxisLableColor || defaultThemeVariables.xychartYAxisLableColor,
    xychartYAxisTitleColor:
      config.themeVariables?.xychartYAxisTitleColor || defaultThemeVariables.xychartYAxisTitleColor,
    xychartYAxisTickColor:
      config.themeVariables?.xychartYAxisTickColor || defaultThemeVariables.xychartYAxisTickColor,
    xychartPlotBaseColor:
      config.themeVariables?.xychartPlotBaseColor || defaultThemeVariables.xychartPlotBaseColor,
  };
}
function getChartDefaultConfig(): XYChartConfig {
  return config.xyChart
    ? { ...config.xyChart, yAxis: { ...config.xyChart.yAxis }, xAxis: { ...config.xyChart.xAxis } }
    : {
        width: 700,
        height: 500,
        fontFamily: config.fontFamily || 'Sans',
        titleFontSize: 16,
        titlePadding: 5,
        showtitle: true,
        plotBorderWidth: 2,
        yAxis: {
          showLabel: true,
          labelFontSize: 14,
          lablePadding: 5,
          showTitle: true,
          titleFontSize: 16,
          titlePadding: 5,
          showTick: true,
          tickLength: 5,
          tickWidth: 2,
        },
        xAxis: {
          showLabel: true,
          labelFontSize: 14,
          lablePadding: 5,
          showTitle: true,
          titleFontSize: 16,
          titlePadding: 5,
          showTick: true,
          tickLength: 5,
          tickWidth: 2,
        },
        chartOrientation: 'vertical',
        plotReservedSpacePercent: 50,
      };
}

function getChartDefalutData(): XYChartData {
  return {
    yAxis: {
      type: 'linear',
      title: '',
      min: Infinity,
      max: -Infinity,
    },
    xAxis: {
      type: 'band',
      title: '',
      categories: [],
    },
    title: '',
    plots: [],
  };
}

let xyChartConfig: XYChartConfig = getChartDefaultConfig();
let xyChartThemeConfig: XYChartThemeConfig = getChartDefaultThemeConfig();
let xyChartData: XYChartData = getChartDefalutData();
let plotColorPalette = Array.isArray(xyChartThemeConfig.xychartPlotBaseColor)
  ? xyChartThemeConfig.xychartPlotBaseColor
  : plotColorPaletteGenerator(xyChartThemeConfig.xychartPlotBaseColor);
let hasSetXAxis = false;
let hasSetYAxis = false;

function textSanitizer(text: string) {
  return sanitizeText(text.trim(), config);
}

function parseDirective(statement: string, context: string, type: string) {
  // @ts-ignore: TODO Fix ts errors
  mermaidAPI.parseDirective(this, statement, context, type);
}

function setOrientation(oriantation: string) {
  if (oriantation === 'horizontal') {
    xyChartConfig.chartOrientation = 'horizontal';
  } else {
    xyChartConfig.chartOrientation = 'vertical';
  }
}
function setXAxisTitle(title: string) {
  xyChartData.xAxis.title = textSanitizer(title);
}
function setXAxisRangeData(min: number, max: number) {
  xyChartData.xAxis = { type: 'linear', title: xyChartData.xAxis.title, min, max };
  hasSetXAxis = true;
}
function setXAxisBand(categories: string[]) {
  xyChartData.xAxis = {
    type: 'band',
    title: xyChartData.xAxis.title,
    categories: categories.map((c) => textSanitizer(c)),
  };
  hasSetXAxis = true;
}
function setYAxisTitle(title: string) {
  xyChartData.yAxis.title = textSanitizer(title);
}
function setYAxisRangeData(min: number, max: number) {
  xyChartData.yAxis = { type: 'linear', title: xyChartData.yAxis.title, min, max };
  hasSetYAxis = true;
}

// this function does not set `hasSetYAxis` as there can be multiple data so we should calculate the range accordingly
function setYAxisRangeFromPlotData(data: number[]) {
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const prevMinValue = isLinearAxisData(xyChartData.yAxis) ? xyChartData.yAxis.min : Infinity;
  const prevMaxValue = isLinearAxisData(xyChartData.yAxis) ? xyChartData.yAxis.max : -Infinity;
  xyChartData.yAxis = {
    type: 'linear',
    title: xyChartData.yAxis.title,
    min: Math.min(prevMinValue, minValue),
    max: Math.max(prevMaxValue, maxValue),
  };
}

function transformDataWithOutCategory(data: number[]): SimplePlotDataType {
  let retData: SimplePlotDataType = [];
  if (data.length === 0) {
    return retData;
  }
  if (!hasSetXAxis) {
    const prevMinValue = isLinearAxisData(xyChartData.xAxis) ? xyChartData.xAxis.min : Infinity;
    const prevMaxValue = isLinearAxisData(xyChartData.xAxis) ? xyChartData.xAxis.max : -Infinity;
    setXAxisRangeData(Math.min(prevMinValue, 1), Math.max(prevMaxValue, data.length));
  }
  if (!hasSetYAxis) {
    setYAxisRangeFromPlotData(data);
  }

  if (isBandAxisData(xyChartData.xAxis)) {
    retData = xyChartData.xAxis.categories.map((c, i) => [c, data[i]]);
  }

  if (isLinearAxisData(xyChartData.xAxis)) {
    const min = xyChartData.xAxis.min;
    const max = xyChartData.xAxis.max;
    const step = (max - min + 1) / data.length;
    const categories: string[] = [];
    for (let i = min; i <= max; i += step) {
      categories.push(`${i}`);
    }
    retData = categories.map((c, i) => [c, data[i]]);
  }

  return retData;
}

let plotIndex = 0;

function getPlotColorFromPalette(plotIndex: number): string {
  return plotColorPalette[plotIndex === 0 ? 0 : plotIndex % (plotColorPalette.length - 1)];
}

function setLineData(title: string, data: number[]) {
  const plotData = transformDataWithOutCategory(data);
  xyChartData.plots.push({
    type: 'line',
    strokeFill: getPlotColorFromPalette(plotIndex),
    strokeWidth: 2,
    data: plotData,
  });
  plotIndex++;
}

function setBarData(title: string, data: number[]) {
  const plotData = transformDataWithOutCategory(data);
  xyChartData.plots.push({
    type: 'bar',
    fill: getPlotColorFromPalette(plotIndex),
    data: plotData,
  });
  plotIndex++;
}

function getDrawableElem(): DrawableElem[] {
  if (xyChartData.plots.length === 0) {
    throw Error('No Plot to render, please provide a plot with some data');
  }
  xyChartData.title = getDiagramTitle();
  return XYChartBuilder.build(xyChartConfig, xyChartData, xyChartThemeConfig);
}

function setHeight(height: number) {
  xyChartConfig.height = height;
}

function setWidth(width: number) {
  xyChartConfig.width = width;
}

const clear = function () {
  commonClear();
  plotIndex = 0;
  xyChartConfig = getChartDefaultConfig();
  xyChartData = getChartDefalutData();
  xyChartThemeConfig = getChartDefaultThemeConfig();
  plotColorPalette = Array.isArray(xyChartThemeConfig.xychartPlotBaseColor)
    ? xyChartThemeConfig.xychartPlotBaseColor
    : plotColorPaletteGenerator(xyChartThemeConfig.xychartPlotBaseColor);
  hasSetXAxis = false;
  hasSetYAxis = false;
};

export default {
  setWidth,
  setHeight,
  getDrawableElem,
  parseDirective,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  setOrientation,
  setXAxisTitle,
  setXAxisRangeData,
  setXAxisBand,
  setYAxisTitle,
  setYAxisRangeData,
  setLineData,
  setBarData,
};
