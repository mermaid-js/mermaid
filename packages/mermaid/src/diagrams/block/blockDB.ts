import * as configApi from '../../config.js';
import common from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  setDiagramTitle,
  getDiagramTitle,
  clear as commonClear,
} from '../../commonDb.js';

type Block = {
  ID: string;
};

// Array of nodes guarantees their order
let blocks: Block[] = [];

const clear = (): void => {
  blocks = [];
  commonClear();
};

export default {
  getConfig: () => configApi.getConfig().block,

  getAccTitle,
  setAccTitle,
  getAccDescription,
  setAccDescription,
  getDiagramTitle,
  setDiagramTitle,
  clear,
};
