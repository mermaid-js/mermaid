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

// export type TBlockColumnsDefaultValue = 'H'; // Do we support something else, like 'auto' | 0?

// TODO: Convert to generic TreeNode type? Convert to class?
export interface Block {
  ID: string;
  label?: string;
  parent?: Block;
  children?: Block[];
  columns?: number; // | TBlockColumnsDefaultValue;
}

export interface Link {
  source: Block;
  target: Block;
}

let rootBlocks: Block[] = [];
let blocks: Block[] = [];
const links: Link[] = [];
let rootBlock = { ID: 'root', children: [], columns: -1 } as Block;
let currentBlock: Block | undefined;

const clear = (): void => {
  rootBlocks = [];
  blocks = [];
  commonClear();
  rootBlock = { ID: 'root', children: [], columns: -1 };
  currentBlock = rootBlock;
};

type IAddBlock = (block: Block) => Block;
const addBlock: IAddBlock = (block: Block, parent?: Block): Block => {
  if (parent) {
    parent.children ??= [];
    parent.children.push(block);
  } else {
    rootBlocks.push(block);
  }
  blocks.push(block);
  return block;
};

type IAddLink = (link: Link) => Link;
const addLink: IAddLink = (link: Link): Link => {
  links.push(link);
  return link;
};

type ISetColumns = (columnsStr: string) => void;
const setColumns = (columnsStr: string): void => {
  const columns = columnsStr === 'auto' ? -1 : parseInt(columnsStr);
  currentBlock!.columns = columns;
};

const getBlock = (id: string, blocks: Block[]): Block | undefined => {
  for (const block of blocks) {
    if (block.ID === id) {
      return block;
    }
    if (block.children) {
      const foundBlock = getBlock(id, block.children);
      if (foundBlock) {
        return foundBlock;
      }
    }
  }
};

type IGetColumns = (blockID: string) => number;
const getColumns = (blockID: string): number => {
  const blocks = [rootBlock];
  const block = getBlock(blockID, blocks);
  if (!block) {
    return -1;
  }
  return block.columns || -1;
};

type IGetBlocks = () => Block[];
const getBlocks: IGetBlocks = () => blocks;

type IGetLinks = () => Link[];
const getLinks: IGetLinks = () => links;

type IGetLogger = () => Console;
const getLogger: IGetLogger = () => console;

export interface BlockDB extends DiagramDB {
  clear: () => void;
  getConfig: () => BlockConfig | undefined;
  addBlock: IAddBlock;
  addLink: IAddLink;
  getLogger: IGetLogger;
  getBlocks: IGetBlocks;
  getLinks: IGetLinks;
  setColumns: ISetColumns;
  getColumns: IGetColumns;
}

const db: BlockDB = {
  getConfig: () => configApi.getConfig().block,
  addBlock: addBlock,
  addLink: addLink,
  getLogger, // TODO: remove
  getBlocks,
  getLinks,
  // getAccTitle,
  // setAccTitle,
  // getAccDescription,
  // setAccDescription,
  // getDiagramTitle,
  // setDiagramTitle,
  setColumns,
  getColumns,
  clear,
};

export default db;
