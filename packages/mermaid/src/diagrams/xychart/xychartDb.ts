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
import { DrawableElem } from './chartBuilder/Interfaces.js';

const config = configApi.getConfig();

function textSanitizer(text: string) {
  return sanitizeText(text.trim(), config);
}

function parseDirective(statement: string, context: string, type: string) {
  // @ts-ignore: TODO Fix ts errors
  mermaidAPI.parseDirective(this, statement, context, type);
};

const xyChartBuilder = new XYChartBuilder();

function getDrawableElem(): DrawableElem[] {
  return xyChartBuilder.build();
}

function setHeight(height: number) {
  xyChartBuilder.setHeight(height);
}

function setWidth(width: number) {
  xyChartBuilder.setWidth(width);
}

const clear = function () {
  commonClear();
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
};
