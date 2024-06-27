import type { VennDB, VennData } from './vennTypes.js';
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
export const addSubsetData: VennDB['addSubsetData'] = (identifierList, data) => {
  const { size: rawSize, label, color, background } = Object.fromEntries(data ?? []);

  const size = rawSize ? parseFloat(rawSize) : 10 / Math.pow(identifierList.length, 2);

  subsets.push({
    sets: identifierList.sort(),
    size,
    label,
    color,
    background,
  });
};
export const getSubsetData = () => {
  return subsets;
};

const DEFAULT_PACKET_CONFIG: Required<VennDiagramConfig> = DEFAULT_CONFIG.venn;
const getConfig = (): Required<VennDiagramConfig> => {
  return cleanAndMerge({
    ...DEFAULT_PACKET_CONFIG,
    ...commonGetConfig().packet,
  });
};

const customClear = () => {
  clear();
  subsets.length = 0;
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
};
