import type { VennDB, VennData, VennTextData, VennStyleData } from './vennTypes.js';
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

const subsets: VennData[] = [];
const textNodes: VennTextData[] = [];
const styleEntries: VennStyleData[] = [];
const knownSets = new Set<string>();
let currentSets: string[] | undefined;
let indentMode = false;

export const addSubsetData: VennDB['addSubsetData'] = (identifierList, label, size) => {
  const sets = normalizeIdentifierList(identifierList).sort();
  const resolvedSize = size ?? 10 / Math.pow(identifierList.length, 2);
  currentSets = sets;
  if (sets.length === 1) {
    knownSets.add(sets[0]);
  }

  subsets.push({
    sets,
    size: resolvedSize,
    label: label ? normalizeText(label) : undefined,
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

export const addTextData: VennDB['addTextData'] = (identifierList, id, label) => {
  const normalizedId = normalizeText(id);
  textNodes.push({
    sets: normalizeIdentifierList(identifierList).sort(),
    id: normalizedId,
    label: label ? normalizeText(label) : undefined,
  });
};

export const addStyleData: VennDB['addStyleData'] = (identifierList, data) => {
  const targets = normalizeIdentifierList(identifierList).sort();
  const styles: Record<string, string> = {};
  for (const [key, value] of data) {
    styles[key] = normalizeStyleValue(value) ?? value;
  }
  styleEntries.push({ targets, styles });
};

export const getStyleData = () => {
  return styleEntries;
};

const normalizeIdentifierList = (identifierList: string[]) => {
  return identifierList.map((identifier) => normalizeText(identifier));
};

export const validateUnionIdentifiers: VennDB['validateUnionIdentifiers'] = (identifierList) => {
  const normalized = normalizeIdentifierList(identifierList);
  const unknown = normalized.filter((identifier) => !knownSets.has(identifier));
  if (unknown.length > 0) {
    throw new Error(`unknown set identifier: ${unknown.join(', ')}`);
  }
};

export const getTextData = () => {
  return textNodes;
};

export const getCurrentSets: VennDB['getCurrentSets'] = () => currentSets;
export const getIndentMode: VennDB['getIndentMode'] = () => indentMode;
export const setIndentMode: VennDB['setIndentMode'] = (enabled) => {
  indentMode = enabled;
};

const DEFAULT_VENN_CONFIG: Required<VennDiagramConfig> = DEFAULT_CONFIG.venn;

function getConfig(): Required<VennDiagramConfig> {
  return cleanAndMerge(DEFAULT_VENN_CONFIG, commonGetConfig().venn);
}

const customClear = () => {
  clear();
  subsets.length = 0;
  textNodes.length = 0;
  styleEntries.length = 0;
  knownSets.clear();
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
  addStyleData,
  validateUnionIdentifiers,
  getTextData,
  getStyleData,
  getCurrentSets,
  getIndentMode,
  setIndentMode,
};
