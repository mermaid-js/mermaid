import { getConfig as commonGetConfig } from '../../config.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { cleanAndMerge } from '../../utils.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { TreemapDB, TreemapData, TreemapNode } from './types.js';

const defaultTreemapData: TreemapData = {
  nodes: [],
  levels: new Map(),
};
let outerNodes: TreemapNode[] = [];
let data: TreemapData = structuredClone(defaultTreemapData);

const getConfig = () => {
  return cleanAndMerge({
    ...DEFAULT_CONFIG.treemap,
    ...commonGetConfig().treemap,
  });
};

const getNodes = (): TreemapNode[] => data.nodes;

const addNode = (node: TreemapNode, level: number) => {
  data.nodes.push(node);
  data.levels.set(node, level);

  if (level === 0) {
    outerNodes.push(node);
  }

  // Set the root node if this is a level 0 node and we don't have a root yet
  if (level === 0 && !data.root) {
    data.root = node;
  }
};

const getRoot = (): TreemapNode | undefined => ({ name: '', children: outerNodes });

const clear = () => {
  commonClear();
  data = structuredClone(defaultTreemapData);
  outerNodes = [];
};

export const db: TreemapDB = {
  getNodes,
  addNode,
  getRoot,
  getConfig,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
