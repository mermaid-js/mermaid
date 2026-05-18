import { getConfig as getCommonConfig } from '../../config.js';
import type { TreeViewDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { cleanAndMerge } from '../../utils.js';
import { ImperativeState } from '../../utils/imperativeState.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { Node, NodeType, TreeViewDB } from './types.js';

interface TreeViewState {
  cnt: number;
  stack: Node[];
}

const state = new ImperativeState<TreeViewState>(() => ({
  cnt: 1,
  stack: [
    {
      id: 0,
      level: -1,
      name: '/',
      nodeType: 'directory' as NodeType,
      children: [],
    },
  ],
}));

const clear = () => {
  state.reset();
  commonClear();
};

const getRoot = () => {
  return state.records.stack[0];
};

const getCount = () => state.records.cnt;

const defaultConfig: Required<TreeViewDiagramConfig> = DEFAULT_CONFIG.treeView;

const getConfig = (): Required<TreeViewDiagramConfig> => {
  return cleanAndMerge(defaultConfig, getCommonConfig().treeView);
};

const addNode = (
  level: number,
  name: string,
  nodeType: NodeType,
  cssClass?: string,
  iconId?: string,
  description?: string
) => {
  while (level <= state.records.stack[state.records.stack.length - 1].level) {
    state.records.stack.pop();
  }
  const node: Node = {
    id: state.records.cnt++,
    level,
    name,
    nodeType,
    iconId,
    cssClass,
    description,
    children: [],
  };
  state.records.stack[state.records.stack.length - 1].children.push(node);
  state.records.stack.push(node);
};

const db: TreeViewDB = {
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
