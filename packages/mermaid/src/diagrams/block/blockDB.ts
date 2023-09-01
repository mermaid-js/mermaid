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

// export type TBlockColumnsDefaultValue = 'H'; // Do we support something else, like 'auto' | 0?

// Initialize the node database for simple lookups
let nodeDatabase: Record<string, Node> = {};
const blockDatabase: Record<string, Block> = {};

// Function to get a node by its id
type IGetNodeById = (id: string) => Block | undefined;
export const getNodeById = (id: string): Block | undefined => {
  console.log(id, nodeDatabase);
  return blockDatabase[id];
};

// TODO: Convert to generic TreeNode type? Convert to class?

let rootBlock = { id: 'root', children: [] as Block[], columns: -1 };
let blocks: Block[] = [];
const links: Link[] = [];
// let rootBlock = { id: 'root', children: [], columns: -1 } as Block;
let currentBlock = rootBlock;

const clear = (): void => {
  log.info('Clear called');
  // rootBlocks = [];
  blocks = [] as Block[];
  commonClear();
  rootBlock = { id: 'root', children: [], columns: -1 };
  currentBlock = rootBlock;
  nodeDatabase = {};
  blockDatabase[rootBlock.id] = rootBlock;
};

// type IAddBlock = (block: Block) => Block;
// const addBlock: IAddBlock = (block: Block, parent?: Block): Block => {
//   log.info('addBlock', block, parent);
//   if (parent) {
//     parent.children ??= [];
//     parent.children.push(block);
//   } else {
//     rootBlock.children.push(block);
//   }
//   blocks.push(block);
//   return block;
// };

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
export const generateId = () => {
  cnt++;
  return 'id-' + Math.random().toString(36).substr(2, 12) + '-' + cnt;
};

type IAddBlock = (_id: string, label: string, type: BlockType) => Block;
// Function to add a node to the database
export const addBlock = (_id: string, _label?: string, type?: BlockType) => {
  let id = _id;
  if (!_id) {
    id = generateId();
  }
  const label = _label || id;
  const node: Block = {
    id: id,
    label,
    type: type || 'square',
    children: [],
  };
  blockDatabase[node.id] = node;
  // currentBlock.children ??= [];
  // currentBlock.children.push(node);
  // console.log('currentBlock', currentBlock.children, nodeDatabase);
  console.log('addNode called:', id, label, type, node);
  return node;
};

type ISetHierarchy = (block: Block[]) => void;
const setHierarchy = (block: Block[]): void => {
  blocks = block;
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
    if (block.id === id) {
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
  // console.log('Block in test', rootBlock.children || []);
  console.log('Block in test', blocks, blocks[0].id);
  return blocks || [];
};

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
  typeStr2Type: ITypeStr2Type;
  setHierarchy: ISetHierarchy;
  getNodeById: IGetNodeById;
}

const db: BlockDB = {
  getConfig: () => configApi.getConfig().block,
  addBlock: addBlock,
  addLink: addLink,
  typeStr2Type: typeStr2Type,
  getLogger, // TODO: remove
  getBlocks,
  getLinks,
  setHierarchy,
  getNodeById,
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
