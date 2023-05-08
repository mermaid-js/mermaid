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

function textSanitizer(text) {
  return sanitizeText(text.trim(), config);
}

const quadrantBuilder = new QuadrantBuilder();

function setQuadrant1Text(textObj) {
  quadrantBuilder.quadrant1Text = textSanitizer(textObj.text);
}

function setQuadrant2Text(textObj) {
  quadrantBuilder.quadrant2Text = textSanitizer(textObj.text);
}

function setQuadrant3Text(textObj) {
  quadrantBuilder.quadrant3Text = textSanitizer(textObj.text);
}

function setQuadrant4Text(textObj) {
  quadrantBuilder.quadrant4Text = textSanitizer(textObj.text);
}

function setXAxisLeftText(textObj) {
  quadrantBuilder.xAxisLeftText = textSanitizer(textObj.text);
}

function setXAxisRightText(textObj) {
  quadrantBuilder.xAxisRightText = textSanitizer(textObj.text);
}

function setYAxisTopText(textObj) {
  quadrantBuilder.yAxisTopText = textSanitizer(textObj.text);
}

function setYAxisBottomText(textObj) {
  quadrantBuilder.yAxisBottomText = textSanitizer(textObj.text);
}

function addPoints(textObj, x, y) {
  console.log(textObj, x, y);
  quadrantBuilder.addPoints([{ x, y, text: textSanitizer(textObj.text) }]);
}

function setWidth(width) {
  quadrantBuilder.totalWidth = width;
}

function setHeight(height) {
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
  return quadrantBuilder.build();
}

export const parseDirective = function (statement, context, type) {
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
