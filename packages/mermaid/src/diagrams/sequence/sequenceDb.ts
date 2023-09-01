import mermaidAPI from '../../mermaidAPI.js';
import { getConfig as commonGetConfig } from '../../config.js';
import { log } from '../../logger.js';
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
import type { SequenceDB, BoxData } from './sequenceTypes.js';
import type { DiagramDB, ParseDirectiveDefinition } from '../../diagram-api/types.js';
import { parseDirective as _parseDirective } from '../../directiveUtils.js';

const prevActor = undefined;
const actors = {};
const createdActors = {};
const destroyedActors = {};
const boxes: BoxData[] = [];
const messages = [];
const notes = [];
const sequenceNumbersEnabled = false;
let wrapEnabled;
let currentBox: BoxData | undefined = undefined;
const lastCreated = undefined;
const lastDestroyed = undefined;

const parseDirective: ParseDirectiveDefinition = (statement, context, type) => {
  _parseDirective(this, statement, context, type);
};
const addBox = function (data: BoxData): void {
  boxes.push({
    title: data.title,
    wrap: data.wrap,
    color: data.color,
    actorKeys: [],
  });
  currentBox = boxes[boxes.length - 1];
};

const hasAtleastOneBox = function (): boolean {
  return boxes.length > 0;
};

const hasAtleastOneBoxWithTitle = function (): boolean {
  return boxes.some((b) => b.title);
};

const getBoxes = function (): BoxData[] {
  return boxes;
};

/**
 * We expect the box statement to be color first then description
 * The color can be rgb,rgba,hsl,hsla, or css code names #hex codes are not supported
 * for now because of the way the char # is handled
 * We extract first segment as color, the rest of the line is considered as text
 */
export const parseBoxData = function (str: string): BoxData {
  const match = str.match(/^((?:rgba?|hsla?)\s*\(.*\)|\w*)(.*)$/);
  let color = match && match[1] ? match[1].trim() : 'transparent';
  let title = match && match[2] ? match[2].trim() : '';

  // check that the string is a color
  if (window && window.CSS) {
    if (!window.CSS.supports('color', color)) {
      color = 'transparent';
      title = str.trim();
    }
  } else {
    const style = new Option().style;
    style.color = color;
    if (style.color !== color) {
      color = 'transparent';
      title = str.trim();
    }
  }

  const boxData: BoxData = {
    color: color,
    title: title ? sanitizeText(title.replace(/^:?(?:no)?wrap:/, ''), commonGetConfig()) : '',
    wrap: title && title.match(/^:?nowrap:/) ? false : true,
  };
  return boxData;
};

function boxEnd(): void {
  currentBox = undefined;
}

export const db: SequenceDB = {
  parseDirective,
  addBox,
  hasAtleastOneBox,
  hasAtleastOneBoxWithTitle,
  getBoxes,
  parseBoxData,
  boxEnd,
};
