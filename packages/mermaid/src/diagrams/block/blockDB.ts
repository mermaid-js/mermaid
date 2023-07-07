import type { BlockDB } from './blockTypes.js';

import * as configApi from '../../config.js';
// import common from '../common/common.js';
import {
  // setAccTitle,
  // getAccTitle,
  // getAccDescription,
  // setAccDescription,
  // setDiagramTitle,
  // getDiagramTitle,
  clear as commonClear,
} from '../../commonDb.js';

type Block = {
  ID: string;
};

let blocks: Block[] = [];

const clear = (): void => {
  blocks = [];
  commonClear();
};

const db: BlockDB = {
  getConfig: () => configApi.getConfig().block,

  // getAccTitle,
  // setAccTitle,
  // getAccDescription,
  // setAccDescription,
  // getDiagramTitle,
  // setDiagramTitle,
  clear,
};

export default db;