import type { TreeViewDiagramConfig } from '../../config.type.js';
import type { TreeViewDb, Node } from './types.js';
import { getConfig as getCommonConfig } from '../../config.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import {
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import { cleanAndMerge } from '../../utils.js';
let cnt = 0;

const auxRoot: Node = {
  id: cnt++,
  level: -1,
  name: '/',
  children: [],
};

let stack = [auxRoot];

const clear = () => {
  cnt = 0;
  stack = [auxRoot];
  auxRoot.children = [];
  auxRoot.id = cnt++;
};

const getRoot = () => {
  return auxRoot;
};

const getCount = () => cnt;

const defaultConfig: Required<TreeViewDiagramConfig> = DEFAULT_CONFIG.treeView;

const getConfig = (): Required<TreeViewDiagramConfig> => {
  return cleanAndMerge(defaultConfig, getCommonConfig().treeView);
};

const addNode = (level: number, name: string) => {
  while (level <= stack[stack.length - 1].level) {
    stack.pop();
  }
  const node = {
    id: cnt++,
    level,
    name,
    children: [],
  };
  stack[stack.length - 1].children.push(node);
  stack.push(node);
};

const db: TreeViewDb = {
  clear,
  addNode,
  getRoot,
  getCount,
  getConfig,
  getAccTitle,
  getAccDescription,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
};

export default db;
