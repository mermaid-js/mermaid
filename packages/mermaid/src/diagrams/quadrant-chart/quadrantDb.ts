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
  quadrantBuilder.setConfig({ quadrant1Text: textSanitizer(textObj.text) });
}

function setQuadrant2Text(textObj: LexTextObj) {
  quadrantBuilder.setConfig({ quadrant2Text: textSanitizer(textObj.text) });
}

function setQuadrant3Text(textObj: LexTextObj) {
  quadrantBuilder.setConfig({ quadrant3Text: textSanitizer(textObj.text) });
}

function setQuadrant4Text(textObj: LexTextObj) {
  quadrantBuilder.setConfig({ quadrant4Text: textSanitizer(textObj.text) });
}

function setXAxisLeftText(textObj: LexTextObj) {
  quadrantBuilder.setConfig({ xAxisLeftText: textSanitizer(textObj.text) });
}

function setXAxisRightText(textObj: LexTextObj) {
  quadrantBuilder.setConfig({ xAxisRightText: textSanitizer(textObj.text) });
}

function setYAxisTopText(textObj: LexTextObj) {
  quadrantBuilder.setConfig({ yAxisTopText: textSanitizer(textObj.text) });
}

function setYAxisBottomText(textObj: LexTextObj) {
  quadrantBuilder.setConfig({ yAxisBottomText: textSanitizer(textObj.text) });
}

function addPoint(textObj: LexTextObj, x: number, y: number) {
  quadrantBuilder.addPoints([{ x, y, text: textSanitizer(textObj.text) }]);
}

function setWidth(width: number) {
  quadrantBuilder.setConfig({ chartWidth: width });
}

function setHeight(height: number) {
  quadrantBuilder.setConfig({ chartHeight: height });
}

function getQuadrantData() {
  const config = configApi.getConfig();
  const { themeVariables, quadrantChart: quadrantChartConfig } = config;
  if (quadrantChartConfig) {
    quadrantBuilder.setConfig(quadrantChartConfig);
  }
  quadrantBuilder.setThemeConfig({
    quadrant1Fill: themeVariables.quadrant1Fill,
    quadrant2Fill: themeVariables.quadrant2Fill,
    quadrant3Fill: themeVariables.quadrant3Fill,
    quadrant4Fill: themeVariables.quadrant4Fill,
    quadrant1TextFill: themeVariables.quadrant1TextFill,
    quadrant2TextFill: themeVariables.quadrant2TextFill,
    quadrant3TextFill: themeVariables.quadrant3TextFill,
    quadrant4TextFill: themeVariables.quadrant4TextFill,
    quadrantPointFill: themeVariables.quadrantPointFill,
    quadrantPointTextFill: themeVariables.quadrantPointTextFill,
    quadrantXAxisTextFill: themeVariables.quadrantXAxisTextFill,
    quadrantYAxisTextFill: themeVariables.quadrantYAxisTextFill,
    quadrantExternalBorderStrokeFill: themeVariables.quadrantExternalBorderStrokeFill,
    quadrantInternalBorderStrokeFill: themeVariables.quadrantInternalBorderStrokeFill,
    quadrantTitleFill: themeVariables.quadrantTitleFill,
  });
  quadrantBuilder.setConfig({ titleText: getDiagramTitle() });
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
  addPoint,
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
