// import type { BlockDB } from './blockTypes.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import { BlockConfig } from './blockTypes.js';

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

export type TBlockColumnsDefaultValue = 'H'; // Do we support something else, like 'auto' | 0?

interface Block {
  ID: string;
  label?: string;
  parent?: Block;
  children?: Block[];
  columns: number | TBlockColumnsDefaultValue;
}

interface Link {
  source: Block;
  target: Block;
}

let blocks: Block[] = [];
let links: Link[] = [];

const clear = (): void => {
  blocks = [];
  commonClear();
};

type IAddBlock = (block: Block) => Block;
const addBlock: IAddBlock = (block: Block): Block => {
  blocks.push(block);
  return block;
};

type IAddLink = (link: Link) => Link;
const addLink: IAddLink = (link: Link): Link => {
  links.push(link);
  return link;
};

export interface BlockDB extends DiagramDB {
  clear: () => void;
  getConfig: () => BlockConfig | undefined;
  addBlock: IAddBlock;
  addLink: IAddLink;
  getLogger: () => Console;
}

const db: BlockDB = {
  getConfig: () => configApi.getConfig().block,
  addBlock: addBlock,
  addLink: addLink,
  getLogger: () => console, // TODO: remove
  // getAccTitle,
  // setAccTitle,
  // getAccDescription,
  // setAccDescription,
  // getDiagramTitle,
  // setDiagramTitle,
  clear,
};

export default db;
