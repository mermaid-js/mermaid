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

function addPoint(textObj: LexTextObj, x: number, y: number, styles_string: string) {
  const styles_object: {
    radius?: number;
    color?: string;
    strokeColor?: string;
    strokeWidth?: string;
  } = {};
  if (styles_string !== '') {
    const styles = styles_string.trim().split(/\s*,\s*/);
    for (const item of styles) {
      const style = item.split(/\s*:\s*/);
      if (style[0] == 'radius') {
        styles_object.radius = parseInt(style[1]);
      } else if (style[0] == 'color') {
        styles_object.color = style[1];
      } else if (style[0] == 'strokeColor') {
        styles_object.strokeColor = style[1];
      } else if (style[0] == 'strokeWidth') {
        styles_object.strokeWidth = style[1];
      } else {
        // do we add error if an unknown style is added or do we ignore it
      }
    }
  }
  quadrantBuilder.addPoints([
    {
      x,
      y,
      text: textSanitizer(textObj.text),
      radius: styles_object.radius,
      color: styles_object.color,
      strokeColor: styles_object.strokeColor,
      strokeWidth: styles_object.strokeWidth,
    },
  ]);
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
  getQuadrantData,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
