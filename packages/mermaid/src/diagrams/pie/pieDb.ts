// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { log } from '../../logger.js';
import { parseDirective as _parseDirective } from '../../directiveUtils.js';
import * as configApi from '../../config.js';
import common from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../../commonDb.js';
import { ParseDirectiveDefinition } from '../../diagram-api/types.js';

let sections: Record<string, number> = {};
let showData = false;

export const parseDirective: ParseDirectiveDefinition = (statement, context, type) => {
  _parseDirective(this, statement, context, type);
};

const addSection = function (id: string, value: number): void {
  id = common.sanitizeText(id, configApi.getConfig());
  if (sections[id] === undefined) {
    sections[id] = value;
    log.debug('Added new section : ', id, ' with value:', value);
  }
};
const getSections = (): Record<string, number> => sections;

const setShowData = function (toggle: boolean): void {
  showData = toggle;
};

const getShowData = function (): boolean {
  return showData;
};

const cleanupValue = function (value: string): number {
  if (value.substring(0, 1) === ':') {
    value = value.substring(1).trim();
    return Number(value.trim());
  } else {
    return Number(value.trim());
  }
};

const clear = function (): void {
  sections = {};
  showData = false;
  commonClear();
};

export default {
  parseDirective,
  getConfig: () => configApi.getConfig().pie,
  addSection,
  getSections,
  cleanupValue,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  setShowData,
  getShowData,
  getAccDescription,
  setAccDescription,
};
