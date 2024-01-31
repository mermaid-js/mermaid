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
      type: 'band',
      title: '',
      categories: [],
    },
    xAxis: {
      type: 'band',
      title: '',
      categories: [],
    },
    title: '',
    plots: [],
    color: [],
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

function setColorData(colors: NormalTextType[]) {
  matrixChartData.color = colors.map((c) => textSanitizer(c.text));
}

function setYAxisBand(categories: NormalTextType[]) {
  matrixChartData.yAxis = {
    type: 'band',
    title: matrixChartData.yAxis.title,
    categories: categories.map((c) => textSanitizer(c.text)),
  };
  hasSetXAxis = true;
}

function getPlotColorFromPalette(plotIndex: number): string {
  return plotColorPalette[plotIndex === 0 ? 0 : plotIndex % plotColorPalette.length];
}

function getDrawableElem(): DrawableElem[] {
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
  setXAxisBand,
  setYAxisBand,
  setYAxisTitle,
  setTmpSVGG,
  getChartThemeConfig,
  getChartConfig,
  setColorData,
};
