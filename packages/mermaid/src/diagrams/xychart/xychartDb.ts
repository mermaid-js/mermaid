// @ts-ignore: TODO Fix ts errors
import { adjust, channel } from 'khroma';
import { Selection } from 'd3-selection';
import mermaidAPI from '../../mermaidAPI.js';
import * as configApi from '../../config.js';
import defaultConfig from '../../defaultConfig.js';
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
  XYChartConfig,
} from './chartBuilder/Interfaces.js';
import { getThemeVariables } from '../../themes/theme-default.js';

export type SVGGType = Selection<SVGGElement, unknown, Element | null, unknown>;

const defaultThemeVariables = getThemeVariables();

const config = configApi.getConfig();

let plotIndex = 0;

let tmpSVGGElem: SVGGType;

let xyChartConfig: XYChartConfig = getChartDefaultConfig();
let xyChartThemeConfig: XYChartThemeConfig = getChartDefaultThemeConfig();
let xyChartData: XYChartData = getChartDefalutData();
let plotColorPalette = xyChartThemeConfig.plotColorPalette;
let hasSetXAxis = false;
let hasSetYAxis = false;

interface NormalTextType {
  type: 'text';
  text: string;
}

function getChartDefaultThemeConfig(): XYChartThemeConfig {
  return {
    ...defaultThemeVariables.xyChart,
    ...config.themeVariables?.xyChart,
  };
}
function getChartDefaultConfig(): XYChartConfig {
  return {
    ...(defaultConfig.xyChart as XYChartConfig),
    ...config.xyChart,
    yAxis: {
      ...(defaultConfig.xyChart as XYChartConfig).yAxis,
      ...config.xyChart?.yAxis,
    },
    xAxis: {
      ...(defaultConfig.xyChart as XYChartConfig).xAxis,
      ...config.xyChart?.xAxis,
    },
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

function textSanitizer(text: string) {
  return sanitizeText(text.trim(), config);
}

function parseDirective(statement: string, context: string, type: string) {
  // @ts-ignore: TODO Fix ts errors
  mermaidAPI.parseDirective(this, statement, context, type);
}

function setTmpSVGG(SVGG: SVGGType) {
  tmpSVGGElem = SVGG;
}
function setOrientation(oriantation: string) {
  if (oriantation === 'horizontal') {
    xyChartConfig.chartOrientation = 'horizontal';
  } else {
    xyChartConfig.chartOrientation = 'vertical';
  }
}
function setXAxisTitle(title: NormalTextType) {
  xyChartData.xAxis.title = textSanitizer(title.text);
}
function setXAxisRangeData(min: number, max: number) {
  xyChartData.xAxis = { type: 'linear', title: xyChartData.xAxis.title, min, max };
  hasSetXAxis = true;
}
function setXAxisBand(categories: NormalTextType[]) {
  xyChartData.xAxis = {
    type: 'band',
    title: xyChartData.xAxis.title,
    categories: categories.map((c) => textSanitizer(c.text)),
  };
  hasSetXAxis = true;
}
function setYAxisTitle(title: NormalTextType) {
  xyChartData.yAxis.title = textSanitizer(title.text);
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

function transformDataWithoutCategory(data: number[]): SimplePlotDataType {
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

function getPlotColorFromPalette(plotIndex: number): string {
  return plotColorPalette[plotIndex === 0 ? 0 : plotIndex % (plotColorPalette.length - 1)];
}

function setLineData(title: NormalTextType, data: number[]) {
  const plotData = transformDataWithoutCategory(data);
  xyChartData.plots.push({
    type: 'line',
    strokeFill: getPlotColorFromPalette(plotIndex),
    strokeWidth: 2,
    data: plotData,
  });
  plotIndex++;
}

function setBarData(title: NormalTextType, data: number[]) {
  const plotData = transformDataWithoutCategory(data);
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
  return XYChartBuilder.build(xyChartConfig, xyChartData, xyChartThemeConfig, tmpSVGGElem);
}

function getChartThemeConfig() {
  return xyChartThemeConfig;
}

function getChartConfig() {
  return xyChartConfig;
}

const clear = function () {
  commonClear();
  plotIndex = 0;
  xyChartConfig = getChartDefaultConfig();
  xyChartData = getChartDefalutData();
  xyChartThemeConfig = getChartDefaultThemeConfig();
  plotColorPalette = xyChartThemeConfig.plotColorPalette;
  hasSetXAxis = false;
  hasSetYAxis = false;
};

export default {
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
  setTmpSVGG,
  getChartThemeConfig,
  getChartConfig,
};
