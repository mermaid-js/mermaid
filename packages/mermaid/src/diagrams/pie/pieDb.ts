import { log } from '../../logger.js';
import { parseDirective as _parseDirective } from '../../directiveUtils.js';
import * as configApi from '../../config.js';
import { sanitizeText } from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  setAccDescription,
  getAccDescription,
  clear as commonClear,
} from '../../commonDb.js';
import { ParseDirectiveDefinition } from '../../diagram-api/types.js';

let sections: Record<string, number> = {};
let showData = false;

export const parseDirective: ParseDirectiveDefinition = (statement, context, type) => {
  _parseDirective(this, statement, context, type);
};

const addSection = (id: string, value: number): void => {
  id = sanitizeText(id, configApi.getConfig());
  if (sections[id] === undefined) {
    log.debug(`Added new section: ${id}, with value: ${value}`);
  }
  sections[id] = value;
};
const getSections = (): Record<string, number> => sections;

const setShowData = (toggle: boolean): void => {
  showData = toggle;
};

const getShowData = (): boolean => showData;

const clear = (): void => {
  sections = {};
  showData = false;
  commonClear();
};

export default {
  parseDirective,
  getConfig: () => configApi.getConfig().pie,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  setAccDescription,
  getAccDescription,
  addSection,
  getSections,
  setShowData,
  getShowData,
};
