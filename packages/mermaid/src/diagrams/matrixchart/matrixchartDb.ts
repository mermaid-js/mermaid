import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import * as configApi from '../../config.js';
import defaultConfig from '../../defaultConfig.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { cleanAndMerge } from '../../utils.js';
import { sanitizeText } from '../common/common.js';
import { MatrixChartBuilder } from './chartBuilder/index.js';
import type {
  DrawableElem,
  SimplePlotDataType,
  MatrixChartConfig,
  MatrixChartData,
  MatrixChartThemeConfig,
} from './chartBuilder/interfaces.js';
import { isBandAxisData, isLinearAxisData } from './chartBuilder/interfaces.js';
import type { Group } from '../../diagram-api/types.js';

let plotIndex = 0;

let tmpSVGGroup: Group;

let matrixChartConfig: MatrixChartConfig = getChartDefaultConfig();
let matrixChartThemeConfig: MatrixChartThemeConfig = getChartDefaultThemeConfig();
let matrixChartData: MatrixChartData = getChartDefaultData();
let plotColorPalette = matrixChartThemeConfig.plotColorPalette
  .split(',')
  .map((color) => color.trim());
let hasSetXAxis = false;
let hasSetYAxis = false;

interface NormalTextType {
  type: 'text';
  text: string;
}

function getChartDefaultThemeConfig(): MatrixChartThemeConfig {
  const defaultThemeVariables = getThemeVariables();
  const config = configApi.getConfig();
  return cleanAndMerge(defaultThemeVariables.matrixChart, config.themeVariables.matrixChart);
}
function getChartDefaultConfig(): MatrixChartConfig {
  const config = configApi.getConfig();
  return cleanAndMerge<MatrixChartConfig>(
    defaultConfig.matrixChart as MatrixChartConfig,
    config.matrixChart as MatrixChartConfig
  );
}

function getChartDefaultData(): MatrixChartData {
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

function textSanitizer(text: string) {
  const config = configApi.getConfig();
  return sanitizeText(text.trim(), config);
}

function setTmpSVGG(SVGG: Group) {
  tmpSVGGroup = SVGG;
}
function setOrientation(orientation: string) {
  if (orientation === 'horizontal') {
    matrixChartConfig.chartOrientation = 'horizontal';
  } else {
    matrixChartConfig.chartOrientation = 'vertical';
  }
}
function setXAxisTitle(title: NormalTextType) {
  matrixChartData.xAxis.title = textSanitizer(title.text);
}
function setXAxisRangeData(min: number, max: number) {
  matrixChartData.xAxis = { type: 'linear', title: matrixChartData.xAxis.title, min, max };
  hasSetXAxis = true;
}
function setXAxisBand(categories: NormalTextType[]) {
  matrixChartData.xAxis = {
    type: 'band',
    title: matrixChartData.xAxis.title,
    categories: categories.map((c) => textSanitizer(c.text)),
  };
  hasSetXAxis = true;
}
function setYAxisTitle(title: NormalTextType) {
  matrixChartData.yAxis.title = textSanitizer(title.text);
}
function setYAxisRangeData(min: number, max: number) {
  matrixChartData.yAxis = { type: 'linear', title: matrixChartData.yAxis.title, min, max };
  hasSetYAxis = true;
}

// this function does not set `hasSetYAxis` as there can be multiple data so we should calculate the range accordingly
function setYAxisRangeFromPlotData(data: number[]) {
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const prevMinValue = isLinearAxisData(matrixChartData.yAxis)
    ? matrixChartData.yAxis.min
    : Infinity;
  const prevMaxValue = isLinearAxisData(matrixChartData.yAxis)
    ? matrixChartData.yAxis.max
    : -Infinity;
  matrixChartData.yAxis = {
    type: 'linear',
    title: matrixChartData.yAxis.title,
    min: Math.min(prevMinValue, minValue),
    max: Math.max(prevMaxValue, maxValue),
  };
}

function transformDataWithoutCategory(data: number[]): SimplePlotDataType {
  let retData: SimplePlotDataType = [];
  if (data.length === 0) {
    return retData;
  }
  if (!hasSetXAxis) {
    const prevMinValue = isLinearAxisData(matrixChartData.xAxis)
      ? matrixChartData.xAxis.min
      : Infinity;
    const prevMaxValue = isLinearAxisData(matrixChartData.xAxis)
      ? matrixChartData.xAxis.max
      : -Infinity;
    setXAxisRangeData(Math.min(prevMinValue, 1), Math.max(prevMaxValue, data.length));
  }
  if (!hasSetYAxis) {
    setYAxisRangeFromPlotData(data);
  }

  if (isBandAxisData(matrixChartData.xAxis)) {
    retData = matrixChartData.xAxis.categories.map((c, i) => [c, data[i]]);
  }

  if (isLinearAxisData(matrixChartData.xAxis)) {
    const min = matrixChartData.xAxis.min;
    const max = matrixChartData.xAxis.max;
    const step = (max - min + 1) / data.length;
    const categories: string[] = [];
    for (let i = min; i <= max; i += step) {
      categories.push(`${i}`);
    }
    retData = categories.map((c, i) => [c, data[i]]);
  }

  return retData;
}

function getPlotColorFromPalette(plotIndex: number): string {
  return plotColorPalette[plotIndex === 0 ? 0 : plotIndex % plotColorPalette.length];
}

function setLineData(title: NormalTextType, data: number[]) {
  const plotData = transformDataWithoutCategory(data);
  matrixChartData.plots.push({
    type: 'line',
    strokeFill: getPlotColorFromPalette(plotIndex),
    strokeWidth: 2,
    data: plotData,
  });
  plotIndex++;
}

function setBarData(title: NormalTextType, data: number[]) {
  const plotData = transformDataWithoutCategory(data);
  matrixChartData.plots.push({
    type: 'bar',
    fill: getPlotColorFromPalette(plotIndex),
    data: plotData,
  });
  plotIndex++;
}

function getDrawableElem(): DrawableElem[] {
  if (matrixChartData.plots.length === 0) {
    throw Error('No Plot to render, please provide a plot with some data');
  }
  matrixChartData.title = getDiagramTitle();
  return MatrixChartBuilder.build(
    matrixChartConfig,
    matrixChartData,
    matrixChartThemeConfig,
    tmpSVGGroup
  );
}

function getChartThemeConfig() {
  return matrixChartThemeConfig;
}

function getChartConfig() {
  return matrixChartConfig;
}

const clear = function () {
  commonClear();
  plotIndex = 0;
  matrixChartConfig = getChartDefaultConfig();
  matrixChartData = getChartDefaultData();
  matrixChartThemeConfig = getChartDefaultThemeConfig();
  plotColorPalette = matrixChartThemeConfig.plotColorPalette
    .split(',')
    .map((color) => color.trim());
  hasSetXAxis = false;
  hasSetYAxis = false;
};

export default {
  getDrawableElem,
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
  setTmpSVGG,
  getChartThemeConfig,
  getChartConfig,
};
