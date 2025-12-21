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

export const addSubsetData: VennDB['addSubsetData'] = (identifierList, data) => {
  const { size: rawSize, label, color, background } = Object.fromEntries(data ?? []);

  const size = rawSize ? parseFloat(rawSize) : 10 / Math.pow(identifierList.length, 2);

  subsets.push({
    sets: identifierList.sort(),
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
  const resolvedText = normalizeText(text) || label || '';
  textNodes.push({
    sets: identifierList.sort(),
    text: resolvedText,
    color,
  });
};

export const getTextData = () => {
  return textNodes;
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
};
