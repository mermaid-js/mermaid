import { log } from '../../logger.js';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../common/commonDb.js';
import type { PieFields, PieDB, Sections, D3Section } from './pieTypes.js';
import type { RequiredDeep } from 'type-fest';
import type { PieDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';

export const DEFAULT_PIE_CONFIG: Required<PieDiagramConfig> = DEFAULT_CONFIG.pie;

export const DEFAULT_PIE_DB: RequiredDeep<PieFields> = {
  sections: new Map(),
  showData: false,
  config: DEFAULT_PIE_CONFIG,
} as const;

let sections: Sections = DEFAULT_PIE_DB.sections;
let showData: boolean = DEFAULT_PIE_DB.showData;
const config: Required<PieDiagramConfig> = structuredClone(DEFAULT_PIE_CONFIG);

const getConfig = (): Required<PieDiagramConfig> => structuredClone(config);

const clear = (): void => {
  sections = new Map();
  showData = DEFAULT_PIE_DB.showData;
  commonClear();
};

const addSection = ({ label, value }: D3Section): void => {
  if (!sections.has(label)) {
    sections.set(label, value);
    log.debug(`added new section: ${label}, with value: ${value}`);
  }
};

const getSections = (): Sections => sections;

const setShowData = (toggle: boolean): void => {
  showData = toggle;
};

const getShowData = (): boolean => showData;

export const db: PieDB = {
  getConfig,

  clear,
  setDiagramTitle,
  getDiagramTitle,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,

  addSection,
  getSections,
  setShowData,
  getShowData,
};
