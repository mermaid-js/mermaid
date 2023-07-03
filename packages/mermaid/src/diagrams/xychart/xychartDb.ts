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
  ChartPlotEnum,
  DrawableElem,
  XYChartData,
  isBandAxisData,
} from './chartBuilder/Interfaces.js';
import { XYChartConfig } from '../../config.type.js';

const config = configApi.getConfig();
let chartWidth = 600;
let chartHeight = 500;

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
      title: 'yAxis1',
      min: 0,
      max: 100,
    },
    xAxis: {
      title: 'xAxis',
      categories: [],
    },
    title: '',
    plots: [],
  };
}

let xyChartConfig: XYChartConfig = getChartDefaultConfig();
let xyChartData: XYChartData = getChartDefalutData();

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
  xyChartData.xAxis = { title: xyChartData.xAxis.title, min, max };
}
function setXAxisBand(categories: string[]) {
  xyChartData.xAxis = {
    title: xyChartData.xAxis.title,
    categories: categories.map((c) => textSanitizer(c)),
  };
}
function setYAxisTitle(title: string) {
  xyChartData.yAxis.title = textSanitizer(title);
}
function setYAxisRangeData(min: number, max: number) {
  xyChartData.yAxis = { title: xyChartData.yAxis.title, min, max };
}
function setLineData(title: string, data: number[]) {
  if (isBandAxisData(xyChartData.xAxis)) {
    xyChartData.plots.push({
      type: ChartPlotEnum.BAR,
      fill: '#0000bb',
      data: xyChartData.xAxis.categories.map((c, i) => [c, data[i]]),
    });
  }
}
function setBarData(title: string, data: number[]) {
  if (isBandAxisData(xyChartData.xAxis)) {
    xyChartData.plots.push({
      type: ChartPlotEnum.LINE,
      strokeFill: '#00ff00',
      strokeWidth: 2,
      data: xyChartData.xAxis.categories.map((c, i) => [c, data[i]]),
    });
  }
}

function getDrawableElem(): DrawableElem[] {
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
