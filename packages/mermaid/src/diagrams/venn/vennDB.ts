import type { VennDB, VennData, VennTextData } from './vennTypes.js';
import type { VennDiagramConfig } from '../../config.type.js';
import { cleanAndMerge } from '../../utils.js';
import { getConfig as commonGetConfig } from '../../config.js';
import {
  clear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';

const subsets = new Array<VennData>();
const textNodes = new Array<VennTextData>();
let currentSets: string[] | undefined;
let indentMode = false;

export const addSubsetData: VennDB['addSubsetData'] = (identifierList, data) => {
  const { size: rawSize, label, color, background } = Object.fromEntries(data ?? []);

  const size = rawSize ? parseFloat(rawSize) : 10 / Math.pow(identifierList.length, 2);
  const sets = [...identifierList].sort();
  currentSets = sets;

  subsets.push({
    sets,
    size,
    label: normalizeStyleValue(label),
    color: normalizeStyleValue(color),
    background: normalizeStyleValue(background),
  });
};

export const getSubsetData = () => {
  return subsets;
};

const normalizeText = (text: string) => {
  const trimmed = text.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const normalizeStyleValue = (value: string | undefined): string | undefined => {
  return value ? normalizeText(value) : value;
};

export const addTextData: VennDB['addTextData'] = (identifierList, text, data) => {
  const styleEntries = Object.fromEntries(data ?? []);
  const color = normalizeStyleValue(styleEntries.color ?? styleEntries.textColor);
  const label = normalizeStyleValue(styleEntries.label);
  const id = normalizeText(text);
  textNodes.push({
    sets: identifierList.sort(),
    id,
    label,
    color,
  });
};

export const getTextData = () => {
  return textNodes;
};

export const getCurrentSets: VennDB['getCurrentSets'] = () => currentSets;
export const getIndentMode: VennDB['getIndentMode'] = () => indentMode;
export const setIndentMode: VennDB['setIndentMode'] = (enabled) => {
  indentMode = enabled;
};

const DEFAULT_PACKET_CONFIG: Required<VennDiagramConfig> = DEFAULT_CONFIG.venn;
const getConfig = (): Required<VennDiagramConfig> => {
  return cleanAndMerge({
    ...DEFAULT_PACKET_CONFIG,
    ...commonGetConfig().venn,
  });
};

const customClear = () => {
  clear();
  subsets.length = 0;
  textNodes.length = 0;
  currentSets = undefined;
  indentMode = false;
};

export const db: VennDB = {
  getConfig,
  clear: customClear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  addSubsetData,
  getSubsetData,
  addTextData,
  getTextData,
  getCurrentSets,
  getIndentMode,
  setIndentMode,
};
