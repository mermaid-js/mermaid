// import type { BlockDB } from './blockTypes.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import type { BlockConfig, BlockType, Block, Link, ClassDef } from './blockTypes.js';

import * as configApi from '../../config.js';
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
import clone from 'lodash-es/clone.js';

// Initialize the node database for simple lookups
let blockDatabase: Record<string, Block> = {};
let edgeList: Block[] = [];
let edgeCount: Record<string, number> = {};

const COLOR_KEYWORD = 'color';
const FILL_KEYWORD = 'fill';
const BG_FILL = 'bgFill';
const STYLECLASS_SEP = ',';

let classes = {} as Record<string, ClassDef>;

/**
 * Called when the parser comes across a (style) class definition
 * @example classDef my-style fill:#f96;
 *
 * @param {string} id - the id of this (style) class
 * @param  {string | null} styleAttributes - the string with 1 or more style attributes (each separated by a comma)
 */
export const addStyleClass = function (id: string, styleAttributes = '') {
  // create a new style class object with this id
  if (classes[id] === undefined) {
    classes[id] = { id: id, styles: [], textStyles: [] }; // This is a classDef
  }
  const foundClass = classes[id];
  if (styleAttributes !== undefined && styleAttributes !== null) {
    styleAttributes.split(STYLECLASS_SEP).forEach((attrib) => {
      // remove any trailing ;
      const fixedAttrib = attrib.replace(/([^;]*);/, '$1').trim();

      // replace some style keywords
      if (attrib.match(COLOR_KEYWORD)) {
        const newStyle1 = fixedAttrib.replace(FILL_KEYWORD, BG_FILL);
        const newStyle2 = newStyle1.replace(COLOR_KEYWORD, FILL_KEYWORD);
        foundClass.textStyles.push(newStyle2);
      }
      foundClass.styles.push(fixedAttrib);
    });
  }
};

/**
 * Add a (style) class or css class to a state with the given id.
 * If the state isn't already in the list of known states, add it.
 * Might be called by parser when a style class or CSS class should be applied to a state
 *
 * @param {string | string[]} itemIds The id or a list of ids of the item(s) to apply the css class to
 * @param {string} cssClassName CSS class name
 */
export const setCssClass = function (itemIds: string, cssClassName: string) {
  console.log('abc88 setCssClass enter', itemIds, cssClassName);
  itemIds.split(',').forEach(function (id: string) {
    let foundBlock = blockDatabase[id];
    if (foundBlock === undefined) {
      const trimmedId = id.trim();
      blockDatabase[trimmedId] = { id: trimmedId, type: 'na', children: [] } as Block;
      foundBlock = blockDatabase[trimmedId];
    }
    if (!foundBlock.classes) {
      foundBlock.classes = [];
    }
    foundBlock.classes.push(cssClassName);
    console.log('abc88 setCssClass', foundBlock);
  });
};

// /**
//  * Add a style to a state with the given id.
//  * @example style stateId fill:#f9f,stroke:#333,stroke-width:4px
//  *   where 'style' is the keyword
//  *   stateId is the id of a state
//  *   the rest of the string is the styleText (all of the attributes to be applied to the state)
//  *
//  * @param itemId The id of item to apply the style to
//  * @param styleText - the text of the attributes for the style
//  */
// export const setStyle = function (itemId, styleText) {
//   const item = getState(itemId);
//   if (item !== undefined) {
//     item.textStyles.push(styleText);
//   }
// };

// /**
//  * Add a text style to a state with the given id
//  *
//  * @param itemId The id of item to apply the css class to
//  * @param cssClassName CSS class name
//  */
// export const setTextStyle = function (itemId, cssClassName) {
//   const item = getState(itemId);
//   if (item !== undefined) {
//     item.textStyles.push(cssClassName);
//   }
// };

const populateBlockDatabase = (_blockList: Block[], parent: Block): void => {
  const blockList = _blockList.flat();
  const children = [];
  for (const block of blockList) {
    if (block.type === 'classDef') {
      console.log('abc88 classDef', block);
      addStyleClass(block.id, block.css);
      continue;
    }
    if (block.type === 'applyClass') {
      console.log('abc88 applyClass', block);
      // addStyleClass(block.id, block.css);
      setCssClass(block.id, block.styleClass);
      continue;
    }
    if (block.type === 'column-setting') {
      parent.columns = block.columns || -1;
    } else if (block.type === 'edge') {
      if (edgeCount[block.id]) {
        edgeCount[block.id]++;
      } else {
        edgeCount[block.id] = 1;
      }
      block.id = edgeCount[block.id] + '-' + block.id;
      edgeList.push(block);
    } else {
      if (!block.label) {
        if (block.type === 'composite') {
          block.label = '';
        } else {
          block.label = block.id;
        }
      }
      const newBlock = !blockDatabase[block.id];
      if (newBlock) {
        blockDatabase[block.id] = block;
      } else {
        // Add newer relevant data to aggregated node
        if (block.type !== 'na') {
          blockDatabase[block.id].type = block.type;
        }
        if (block.label !== block.id) {
          blockDatabase[block.id].label = block.label;
        }
      }

      if (block.children) {
        populateBlockDatabase(block.children, block);
      }

      if (block.type === 'space') {
        const w = block.width || 1;
        for (let j = 0; j < w; j++) {
          const newBlock = clone(block);
          newBlock.id = newBlock.id + '-' + j;
          blockDatabase[newBlock.id] = newBlock;
          children.push(newBlock);
        }
      } else {
        if (newBlock) {
          children.push(block);
        }
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
  classes = {} as Record<string, ClassDef>;

  edgeList = [];
  edgeCount = {};
};

type ITypeStr2Type = (typeStr: string) => BlockType;
export function typeStr2Type(typeStr: string): BlockType {
  log.debug('typeStr2Type', typeStr);
  switch (typeStr) {
    case '[]':
      return 'square';
    case '()':
      log.debug('we have a round');
      return 'round';
    case '(())':
      return 'circle';
    case '>]':
      return 'rect_left_inv_arrow';
    case '{}':
      return 'diamond';
    case '{{}}':
      return 'hexagon';
    case '([])':
      return 'stadium';
    case '[[]]':
      return 'subroutine';
    case '[()]':
      return 'cylinder';
    case '((()))':
      return 'doublecircle';
    case '[//]':
      return 'lean_right';
    case '[\\\\]':
      return 'lean_left';
    case '[/\\]':
      return 'trapezoid';
    case '[\\/]':
      return 'inv_trapezoid';
    case '<[]>':
      return 'block_arrow';
    default:
      return 'na';
  }
}

type IEdgeTypeStr2Type = (typeStr: string) => string;
export function edgeTypeStr2Type(typeStr: string): string {
  log.debug('typeStr2Type', typeStr);
  switch (typeStr) {
    case '==':
      return 'thick';
    default:
      return 'normal';
  }
}
type IEdgeStrToEdgeDataType = (typeStr: string) => string;
export function edgeStrToEdgeData(typeStr: string): string {
  switch (typeStr.trim()) {
    case '--x':
      return 'arrow_cross';
    case '--o':
      return 'arrow_circle';
    default:
      return 'arrow_point';
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
  log.debug('The document from parsing', JSON.stringify(block, null, 2));
  rootBlock.children = block;
  populateBlockDatabase(block, rootBlock);
  log.debug('abc88 The document after popuplation', JSON.stringify(rootBlock, null, 2));
  blocks = rootBlock.children;
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
/**
 * Returns all the blocks as a flat array
 * @returns
 */
const getBlocksFlat: IGetBlocks = () => {
  const result: Block[] = [];
  console.log('abc88 getBlocksFlat', blockDatabase);
  const keys = Object.keys(blockDatabase);
  for (const key of keys) {
    result.push(blockDatabase[key]);
  }
  return result;
};
/**
 * Returns the the hirarchy of blocks
 * @returns
 */
const getBlocks: IGetBlocks = () => {
  return blocks || [];
};
type IGetEdges = () => Block[];
const getEdges: IGetEdges = () => {
  return edgeList;
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

type IGetClasses = () => Record<string, ClassDef>;
/**
 * Return all of the style classes
 * @returns {{} | any | classes}
 */
export const getClasses = function () {
  console.log('abc88 block db getClasses', classes);
  return classes;
};
export interface BlockDB extends DiagramDB {
  clear: () => void;
  getConfig: () => BlockConfig | undefined;
  addLink: IAddLink;
  getLogger: IGetLogger;
  getEdges: IGetEdges;
  getBlocksFlat: IGetBlocks;
  getBlocks: IGetBlocks;
  getBlock: IGetBlock;
  setBlock: ISetBlock;
  getLinks: IGetLinks;
  getColumns: IGetColumns;
  getClasses: IGetClasses;
  typeStr2Type: ITypeStr2Type;
  edgeTypeStr2Type: IEdgeTypeStr2Type;
  edgeStrToEdgeData: IEdgeStrToEdgeDataType;
  setHierarchy: ISetHierarchy;
  generateId: IGenerateId;
}

const db: BlockDB = {
  getConfig: () => configApi.getConfig().block,
  addLink: addLink,
  typeStr2Type: typeStr2Type,
  edgeTypeStr2Type: edgeTypeStr2Type,
  edgeStrToEdgeData,
  getLogger, // TODO: remove
  getBlocksFlat,
  getBlocks,
  getEdges,
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
  getClasses,
  clear,
  generateId,
};

export default db;
