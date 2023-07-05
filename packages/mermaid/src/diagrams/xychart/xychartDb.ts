import { log } from '../../logger.js';
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
  isBandAxisData,
  isLinearAxisData,
} from './chartBuilder/Interfaces.js';
import { XYChartConfig } from '../../config.type.js';

const config = configApi.getConfig();
function getChartDefaultConfig(): XYChartConfig {
  return config.xyChart
    ? { ...config.xyChart, yAxis: { ...config.xyChart.yAxis }, xAxis: { ...config.xyChart.xAxis } }
    : {
        width: 700,
        height: 500,
        fontFamily: config.fontFamily || 'Sans',
        titleFontSize: 16,
        titleFill: '#000000',
        titlePadding: 5,
        showtitle: true,
        plotBorderWidth: 2,
        yAxis: {
          showLabel: true,
          labelFontSize: 14,
          lablePadding: 5,
          labelFill: '#000000',
          showTitle: true,
          titleFontSize: 16,
          titlePadding: 5,
          titleFill: '#000000',
          showTick: true,
          tickLength: 5,
          tickWidth: 2,
          tickFill: '#000000',
        },
        xAxis: {
          showLabel: true,
          labelFontSize: 14,
          lablePadding: 5,
          labelFill: '#000000',
          showTitle: true,
          titleFontSize: 16,
          titlePadding: 5,
          titleFill: '#000000',
          showTick: true,
          tickLength: 5,
          tickWidth: 2,
          tickFill: '#000000',
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
let xyChartData: XYChartData = getChartDefalutData();
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
function setLineData(title: string, data: number[]) {
  const plotData = transformDataWithOutCategory(data);
  xyChartData.plots.push({
    type: 'line',
    strokeFill: '#00ff00',
    strokeWidth: 2,
    data: plotData,
  });
}
function setBarData(title: string, data: number[]) {
  const plotData = transformDataWithOutCategory(data);
  xyChartData.plots.push({
    type: 'bar',
    fill: '#0000bb',
    data: plotData,
  });
}

function getDrawableElem(): DrawableElem[] {
  if (xyChartData.plots.length === 0) {
    throw Error('No Plot to render, please provide a plot with some data');
  }
  xyChartData.title = getDiagramTitle();
  return XYChartBuilder.build(xyChartConfig, xyChartData);
}

function setHeight(height: number) {
  xyChartConfig.height = height;
}

function setWidth(width: number) {
  xyChartConfig.width = width;
}

const clear = function () {
  commonClear();
  xyChartConfig = getChartDefaultConfig();
  xyChartData = getChartDefalutData();
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
