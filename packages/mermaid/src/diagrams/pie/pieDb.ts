import { log } from '../../logger.js';
import { parseDirective as _parseDirective } from '../../directiveUtils.js';
import { getConfig as commonGetConfig } from '../../config.js';
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
import type { PieFields, PieDb, Sections, PieDiagramConfig } from './pieTypes.js';
import type { RequiredDeep } from 'type-fest';

export const DEFAULT_PIE_CONFIG: Required<PieDiagramConfig> = {
  useMaxWidth: true,
  useWidth: 1200,
  textPosition: 0.75,
} as const;

export const DEFAULT_PIE_DB: RequiredDeep<PieFields> = {
  sections: {},
  showData: false,
  config: DEFAULT_PIE_CONFIG,
} as const;

let sections: Sections = DEFAULT_PIE_DB.sections;
let showData: boolean = DEFAULT_PIE_DB.showData;
const config: Required<PieDiagramConfig> = {
  useWidth: DEFAULT_PIE_DB.config.useWidth,
  useMaxWidth: DEFAULT_PIE_DB.config.useMaxWidth,
  textPosition: DEFAULT_PIE_DB.config.textPosition,
};

const setConfig = (conf: PieDiagramConfig): void => {
  config.useWidth = conf.useWidth ?? DEFAULT_PIE_CONFIG.useWidth;
  config.useMaxWidth = conf.useMaxWidth ?? DEFAULT_PIE_CONFIG.useMaxWidth;
  config.textPosition = conf.textPosition ?? DEFAULT_PIE_CONFIG.textPosition;
};

const getConfig = (): Required<PieDiagramConfig> => config;

const reset = (): void => {
  config.useWidth = DEFAULT_PIE_CONFIG.useWidth;
  config.useMaxWidth = DEFAULT_PIE_CONFIG.useMaxWidth;
  config.textPosition = DEFAULT_PIE_CONFIG.textPosition;
};

const parseDirective: ParseDirectiveDefinition = (statement, context, type) => {
  _parseDirective(this, statement, context, type);
};

const clear = (): void => {
  sections = JSON.parse(JSON.stringify(DEFAULT_PIE_DB.sections));
  showData = DEFAULT_PIE_DB.showData;
  commonClear();
};

const addSection = (label: string, value: number): void => {
  label = sanitizeText(label, commonGetConfig());
  if (sections[label] === undefined) {
    sections[label] = value;
    log.debug(`added new section: ${label}, with value: ${value}`);
  }
};

const getSections = (): Sections => sections;

const cleanupValue = (value: string): number => {
  if (value.substring(0, 1) === ':') {
    value = value.substring(1).trim();
    return Number(value.trim());
  } else {
    return Number(value.trim());
  }
};

const setShowData = (toggle: boolean): void => {
  showData = toggle;
};

const getShowData = (): boolean => showData;

export const db: PieDb = {
  setConfig,
  getConfig,
  reset,

  parseDirective,
  clear,
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
