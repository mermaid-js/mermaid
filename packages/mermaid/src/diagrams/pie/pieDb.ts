import { log } from '../../logger.js';
import { parseDirective as _parseDirective } from '../../directiveUtils.js';
import { getConfig } from '../../config.js';
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
import type { ParseDirectiveDefinition } from '../../diagram-api/types.js';
import type { PieFields, PieDb, Sections } from './pieTypes.js';
import type { PieDiagramConfig } from '../../config.type.js';

export const DEFAULT_PIE_CONFIG: PieDiagramConfig = {
  useMaxWidth: true,
  useWidth: 1200,
  textPosition: 0.75,
} as const;

export const DEFAULT_PIE_DB: PieFields = {
  sections: {},
  showData: false,
  config: DEFAULT_PIE_CONFIG,
} as const;

let sections: Sections = DEFAULT_PIE_DB.sections;
let showData: boolean = DEFAULT_PIE_DB.showData;
const config: PieDiagramConfig = {
  useWidth: DEFAULT_PIE_DB.config.useWidth,
  useMaxWidth: DEFAULT_PIE_DB.config.useMaxWidth,
  textPosition: DEFAULT_PIE_DB.config.textPosition,
};

export const parseDirective: ParseDirectiveDefinition = (statement, context, type) => {
  _parseDirective(this, statement, context, type);
};

const addSection = (label: string, value: number): void => {
  label = sanitizeText(label, getConfig());
  if (sections[label] === undefined) {
    sections[label] = value;
    log.debug(`added new section: ${label}, with value: ${value}`);
  }
};

const getSections = (): Sections => sections;

const setShowData = (toggle: boolean): void => {
  showData = toggle;
};

const getShowData = (): boolean => showData;

const cleanupValue = (value: string): number => {
  if (value.substring(0, 1) === ':') {
    value = value.substring(1).trim();
    return Number(value.trim());
  } else {
    return Number(value.trim());
  }
};

const clear = (): void => {
  sections = JSON.parse(JSON.stringify(DEFAULT_PIE_DB.sections));
  showData = DEFAULT_PIE_DB.showData;
  commonClear();
};

export const db: PieDb = {
  clear,
  getConfig: () => getConfig().pie,
  parseDirective,
  setDiagramTitle,
  getDiagramTitle,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,
  addSection,
  getSections,
  cleanupValue,
  setShowData,
  getShowData,
};
