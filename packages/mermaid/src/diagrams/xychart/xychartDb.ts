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

const config = configApi.getConfig();

function textSanitizer(text: string) {
  return sanitizeText(text.trim(), config);
}

export const parseDirective = function (statement: string, context: string, type: string) {
  // @ts-ignore: TODO Fix ts errors
  mermaidAPI.parseDirective(this, statement, context, type);
};

const clear = function () {
  commonClear();
};

export default {
  parseDirective,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
