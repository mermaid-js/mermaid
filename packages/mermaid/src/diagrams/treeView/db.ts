import type { TreeViewDiagramConfig } from '../../config.type.js';
import type { TreeViewDB, Node } from './types.js';
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
import { ImperativeState } from '../../utils/imperativeState.js';

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
      children: [],
    },
  ],
}));

const updateRootName = (config: Required<TreeViewDiagramConfig>) => {
  const root = state.records.stack[0];
  if (config.root === false) {
    root.name = '';
  } else if (typeof config.root === 'string') {
    root.name = config.root;
  } else {
    root.name = '/';
  }
};

const getRoot = () => {
  return state.records.stack[0];
};

const getCount = () => state.records.cnt;

const defaultConfig: Required<TreeViewDiagramConfig> = DEFAULT_CONFIG.treeView;

const getConfig = (): Required<TreeViewDiagramConfig> => {
  const config = cleanAndMerge(defaultConfig, getCommonConfig().treeView);
  updateRootName(config);
  return config;
};

const addNode = (level: number, name: string) => {
  while (level <= state.records.stack[state.records.stack.length - 1].level) {
    state.records.stack.pop();
  }
  const node = {
    id: state.records.cnt++,
    level,
    name,
    children: [],
  };
  state.records.stack[state.records.stack.length - 1].children.push(node);
  state.records.stack.push(node);
};

const db: TreeViewDB = {
  addNode,
  getRoot,
  getCount,
  clear: () => {
    state.reset();
  },
  getConfig,
  getAccTitle,
  getAccDescription,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
};

export default db;
