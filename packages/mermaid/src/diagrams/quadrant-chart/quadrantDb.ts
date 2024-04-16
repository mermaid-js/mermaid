import { getConfig } from '../../diagram-api/diagramAPI.js';
import { sanitizeText } from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../common/commonDb.js';
import type { StylesObject } from './quadrantBuilder.js';
import { QuadrantBuilder } from './quadrantBuilder.js';
import {
  validateHexCode,
  validateSizeInPixels,
  validateNumber,
  InvalidStyleError,
} from './utils.js';

const config = getConfig();

function textSanitizer(text: string) {
  return sanitizeText(text.trim(), config);
}

interface LexTextObj {
  text: string;
  type: 'text' | 'markdown';
}

const quadrantBuilder = new QuadrantBuilder();

function setQuadrant1Text(textObj: LexTextObj) {
  quadrantBuilder.setData({ quadrant1Text: textSanitizer(textObj.text) });
}

function setQuadrant2Text(textObj: LexTextObj) {
  quadrantBuilder.setData({ quadrant2Text: textSanitizer(textObj.text) });
}

function setQuadrant3Text(textObj: LexTextObj) {
  quadrantBuilder.setData({ quadrant3Text: textSanitizer(textObj.text) });
}

function setQuadrant4Text(textObj: LexTextObj) {
  quadrantBuilder.setData({ quadrant4Text: textSanitizer(textObj.text) });
}

function setXAxisLeftText(textObj: LexTextObj) {
  quadrantBuilder.setData({ xAxisLeftText: textSanitizer(textObj.text) });
}

function setXAxisRightText(textObj: LexTextObj) {
  quadrantBuilder.setData({ xAxisRightText: textSanitizer(textObj.text) });
}

function setYAxisTopText(textObj: LexTextObj) {
  quadrantBuilder.setData({ yAxisTopText: textSanitizer(textObj.text) });
}

function setYAxisBottomText(textObj: LexTextObj) {
  quadrantBuilder.setData({ yAxisBottomText: textSanitizer(textObj.text) });
}

function parseStyles(styles: string[]): StylesObject {
  const stylesObject: StylesObject = {};
  for (const style of styles) {
    const [key, value] = style.trim().split(/\s*:\s*/);
    if (key === 'radius') {
      if (validateNumber(value)) {
        throw new InvalidStyleError(key, value, 'number');
      }
      stylesObject.radius = parseInt(value);
    } else if (key === 'color') {
      if (validateHexCode(value)) {
        throw new InvalidStyleError(key, value, 'hex code');
      }
      stylesObject.color = value;
    } else if (key === 'stroke-color') {
      if (validateHexCode(value)) {
        throw new InvalidStyleError(key, value, 'hex code');
      }
      stylesObject.strokeColor = value;
    } else if (key === 'stroke-width') {
      if (validateSizeInPixels(value)) {
        throw new InvalidStyleError(key, value, 'number of pixels (eg. 10px)');
      }
      stylesObject.strokeWidth = value;
    } else {
      throw new Error(`style named ${key} is not supported.`);
    }
  }
  return stylesObject;
}

function addPoint(textObj: LexTextObj, className: string, x: number, y: number, styles: string[]) {
  const stylesObject = parseStyles(styles);
  quadrantBuilder.addPoints([
    {
      x,
      y,
      text: textSanitizer(textObj.text),
      className,
      ...stylesObject,
    },
  ]);
}

function addClass(className: string, styles: string[]) {
  quadrantBuilder.addClass(className, parseStyles(styles));
}

function setWidth(width: number) {
  quadrantBuilder.setConfig({ chartWidth: width });
}

function setHeight(height: number) {
  quadrantBuilder.setConfig({ chartHeight: height });
}

function getQuadrantData() {
  const config = getConfig();
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
  quadrantBuilder.setData({ titleText: getDiagramTitle() });
  return quadrantBuilder.build();
}

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
  parseStyles,
  addPoint,
  addClass,
  getQuadrantData,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
