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
import { QuadrantBuilder } from './quadrantBuilder.js';

const config = configApi.getConfig();

function textSanitizer(text: string) {
  return sanitizeText(text.trim(), config);
}

type LexTextObj = { text: string; type: 'text' | 'markdown' };

const quadrantBuilder = new QuadrantBuilder();

function setQuadrant1Text(textObj: LexTextObj) {
  quadrantBuilder.quadrant1Text = textSanitizer(textObj.text);
}

function setQuadrant2Text(textObj: LexTextObj) {
  quadrantBuilder.quadrant2Text = textSanitizer(textObj.text);
}

function setQuadrant3Text(textObj: LexTextObj) {
  quadrantBuilder.quadrant3Text = textSanitizer(textObj.text);
}

function setQuadrant4Text(textObj: LexTextObj) {
  quadrantBuilder.quadrant4Text = textSanitizer(textObj.text);
}

function setXAxisLeftText(textObj: LexTextObj) {
  quadrantBuilder.xAxisLeftText = textSanitizer(textObj.text);
}

function setXAxisRightText(textObj: LexTextObj) {
  quadrantBuilder.xAxisRightText = textSanitizer(textObj.text);
}

function setYAxisTopText(textObj: LexTextObj) {
  quadrantBuilder.yAxisTopText = textSanitizer(textObj.text);
}

function setYAxisBottomText(textObj: LexTextObj) {
  quadrantBuilder.yAxisBottomText = textSanitizer(textObj.text);
}

function addPoints(textObj: LexTextObj, x: number, y: number) {
  quadrantBuilder.addPoints([{ x, y, text: textSanitizer(textObj.text) }]);
}

function setWidth(width: number) {
  quadrantBuilder.totalWidth = width;
}

function setHeight(height: number) {
  quadrantBuilder.totalHeight = height;
}

function getQuadrantData() {
  const config = configApi.getConfig();
  const { themeVariables, quadrantChart: quadrantChartConfig } = config;
  quadrantBuilder.quadrant1Fill = themeVariables.quadrant1Fill;
  quadrantBuilder.quadrant2Fill = themeVariables.quadrant2Fill;
  quadrantBuilder.quadrant3Fill = themeVariables.quadrant3Fill;
  quadrantBuilder.quadrant4Fill = themeVariables.quadrant4Fill;
  quadrantBuilder.quadrant1TextFill = themeVariables.quadrant1TextFill;
  quadrantBuilder.quadrant2TextFill = themeVariables.quadrant2TextFill;
  quadrantBuilder.quadrant3TextFill = themeVariables.quadrant3TextFill;
  quadrantBuilder.quadrant4TextFill = themeVariables.quadrant4TextFill;
  quadrantBuilder.pointFill = themeVariables.quadrantPointFill;
  quadrantBuilder.pointTextFill = themeVariables.quadrantPointTextFill;
  quadrantBuilder.xAxisTextFill = themeVariables.quadrantXAxisTextFill;
  quadrantBuilder.yAxisTextFill = themeVariables.quadrantYAxisTextFill;
  if (quadrantChartConfig) {
    quadrantBuilder.quadrantPadding = quadrantChartConfig.quadrantPadding;
    quadrantBuilder.xAxisLabelPadding = quadrantChartConfig.xAxisLabelPadding;
    quadrantBuilder.yAxisLabelPadding = quadrantChartConfig.yAxisLabelPadding;
    quadrantBuilder.xAxisLabelFontSize = quadrantChartConfig.xAxisLabelFontSize;
    quadrantBuilder.yAxisLabelFontSize = quadrantChartConfig.yAxisLabelFontSize;
    quadrantBuilder.quadrantLabelFontSize = quadrantChartConfig.quadrantLabelFontSize;
    quadrantBuilder.quadrantTextTopPadding = quadrantChartConfig.quadrantTextTopPadding;
    quadrantBuilder.pointTextPadding = quadrantChartConfig.pointTextPadding;
    quadrantBuilder.pointLabelFontSize = quadrantChartConfig.pointLabelFontSize;
    quadrantBuilder.pointRadius = quadrantChartConfig.pointRadius;
    quadrantBuilder.xAxisPosition = quadrantChartConfig.xAxisPosition;
    quadrantBuilder.yAxisPosition = quadrantChartConfig.yAxisPosition;
  }
  return quadrantBuilder.build();
}

export const parseDirective = function (statement: string, context: string, type: string) {
  // @ts-ignore: TODO Fix ts errors
  mermaidAPI.parseDirective(this, statement, context, type);
};

const clear = function () {
  quadrantBuilder.clear();
  commonClear();
};

export default {
  setWidth,
  setHeight,
  setQuadrant1Text,
  setQuadrant2Text,
  setQuadrant3Text,
  setQuadrant4Text,
  setXAxisLeftText,
  setXAxisRightText,
  setYAxisTopText,
  setYAxisBottomText,
  addPoints,
  getQuadrantData,
  parseDirective,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
