// import type { BlockDB } from './blockTypes.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import { BlockConfig, BlockType, Block, Link } from './blockTypes.js';

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
import { log } from '../../logger.js';

// Initialize the node database for simple lookups
let blockDatabase: Record<string, Block> = {};

const populateBlockDatabase = (blockList: Block[], parent: Block): void => {
  const children = [];
  for (const block of blockList) {
    if (block.type === 'column-setting') {
      const columns = block.columns || -1;
      parent.columns = columns;
    } else {
      if (!block.label) {
        if (block.type === 'composite') {
          block.label = '';
        } else {
          block.label = block.id;
        }
      }
      blockDatabase[block.id] = block;

      if (block.children) {
        populateBlockDatabase(block.children, block);
      }
      if (block.type !== 'column-setting') {
        children.push(block);
      }
    }
  }
  parent.children = children;
};

let blocks: Block[] = [];
const links: Link[] = [];
let rootBlock = { id: 'root', type: 'composite', children: [], columns: -1 } as Block;

const clear = (): void => {
  log.info('Clear called');
  commonClear();
  rootBlock = { id: 'root', type: 'composite', children: [], columns: -1 } as Block;
  blockDatabase = { root: rootBlock };
  blocks = [] as Block[];
};

type ITypeStr2Type = (typeStr: string) => BlockType;
export function typeStr2Type(typeStr: string) {
  // TODO: add all types
  switch (typeStr) {
    case '[]':
      return 'square';
    case '()':
      return 'round';
    default:
      return 'square';
  }
}

let cnt = 0;
type IGenerateId = () => string;
export const generateId = () => {
  cnt++;
  return 'id-' + Math.random().toString(36).substr(2, 12) + '-' + cnt;
};

type ISetHierarchy = (block: Block[]) => void;
const setHierarchy = (block: Block[]): void => {
  populateBlockDatabase(block, rootBlock);
  log.debug('The hierarchy', JSON.stringify(block, null, 2));
  blocks = block;
};

type IAddLink = (link: Link) => Link;
const addLink: IAddLink = (link: Link): Link => {
  links.push(link);
  return link;
};

type IGetColumns = (blockid: string) => number;
const getColumns = (blockid: string): number => {
  const block = blockDatabase[blockid];
  if (!block) {
    return -1;
  }
  if (block.columns) {
    return block.columns;
  }
  if (!block.children) {
    return -1;
  }
  return block.children.length;
};

type IGetBlocks = () => Block[];
const getBlocks: IGetBlocks = () => {
  return blocks || [];
};
type IGetBlock = (id: string) => Block | undefined;
const getBlock: IGetBlock = (id: string) => {
  return blockDatabase[id];
};
type ISetBlock = (block: Block) => void;
const setBlock: ISetBlock = (block: Block) => {
  blockDatabase[block.id] = block;
};

type IGetLinks = () => Link[];
const getLinks: IGetLinks = () => links;

type IGetLogger = () => Console;
const getLogger: IGetLogger = () => console;

export interface BlockDB extends DiagramDB {
  clear: () => void;
  getConfig: () => BlockConfig | undefined;
  addLink: IAddLink;
  getLogger: IGetLogger;
  getBlocks: IGetBlocks;
  getBlock: IGetBlock;
  setBlock: ISetBlock;
  getLinks: IGetLinks;
  getColumns: IGetColumns;
  typeStr2Type: ITypeStr2Type;
  setHierarchy: ISetHierarchy;
  generateId: IGenerateId;
}

const db: BlockDB = {
  getConfig: () => configApi.getConfig().block,
  addLink: addLink,
  typeStr2Type: typeStr2Type,
  getLogger, // TODO: remove
  getBlocks,
  getLinks,
  setHierarchy,
  getBlock,
  setBlock,
  // getAccTitle,
  // setAccTitle,
  // getAccDescription,
  // setAccDescription,
  // getDiagramTitle,
  // setDiagramTitle,
  getColumns,
  clear,
  generateId,
};

export default db;
