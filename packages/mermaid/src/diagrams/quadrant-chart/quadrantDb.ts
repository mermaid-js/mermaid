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

const config = getConfig();

function textSanitizer(text: string) {
  return sanitizeText(text.trim(), config);
}

type LexTextObj = { text: string; type: 'text' | 'markdown' };

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
  if (styles.length !== 0) {
    for (const item of styles) {
      const style = item.trim().split(/\s*:\s*/);
      if (style[0] == 'radius') {
        stylesObject.radius = parseInt(style[1]);
      } else if (style[0] == 'color') {
        stylesObject.color = style[1];
      } else if (style[0] == 'stroke-color') {
        stylesObject.strokeColor = style[1];
      } else if (style[0] == 'stroke-width') {
        stylesObject.strokeWidth = style[1];
      } else {
        throw new Error(`stlye named ${style[0]} is unacceptable`);
      }
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
      className: className,
      text: textSanitizer(textObj.text),
      radius: stylesObject.radius,
      color: stylesObject.color,
      strokeColor: stylesObject.strokeColor,
      strokeWidth: stylesObject.strokeWidth,
    },
  ]);
}

function addClass(className: string, styles: string[]) {
  const ss = parseStyles(styles);
  if (Object.keys(ss).length === 0) {
    throw new Error('class defintions require ss');
  }
  quadrantBuilder.addClass(className, ss);
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
