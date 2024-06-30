import clone from 'lodash-es/clone.js';
import * as configApi from '../../config.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import common from '../common/common.js';
import { clear as commonClear } from '../common/commonDb.js';
import type { Block, ClassDef } from './blockTypes.js';

// Initialize the node database for simple lookups
let blockDatabase = new Map<string, Block>();
let edgeList: Block[] = [];
let edgeCount = new Map<string, number>();

const COLOR_KEYWORD = 'color';
const FILL_KEYWORD = 'fill';
const BG_FILL = 'bgFill';
const STYLECLASS_SEP = ',';
const config = getConfig();

let classes = new Map<string, ClassDef>();

const sanitizeText = (txt: string) => common.sanitizeText(txt, config);

/**
 * Called when the parser comes across a (style) class definition
 * @example classDef my-style fill:#f96;
 *
 * @param id - the id of this (style) class
 * @param styleAttributes - the string with 1 or more style attributes (each separated by a comma)
 */
export const addStyleClass = function (id: string, styleAttributes = '') {
  // create a new style class object with this id
  let foundClass = classes.get(id);
  if (!foundClass) {
    foundClass = { id: id, styles: [], textStyles: [] };
    classes.set(id, foundClass); // This is a classDef
  }
  if (styleAttributes !== undefined && styleAttributes !== null) {
    styleAttributes.split(STYLECLASS_SEP).forEach((attrib) => {
      // remove any trailing ;
      const fixedAttrib = attrib.replace(/([^;]*);/, '$1').trim();

      // replace some style keywords
      if (RegExp(COLOR_KEYWORD).exec(attrib)) {
        const newStyle1 = fixedAttrib.replace(FILL_KEYWORD, BG_FILL);
        const newStyle2 = newStyle1.replace(COLOR_KEYWORD, FILL_KEYWORD);
        foundClass.textStyles.push(newStyle2);
      }
      foundClass.styles.push(fixedAttrib);
    });
  }
};

/**
 * Called when the parser comes across a style definition
 * @example style my-block-id fill:#f96;
 *
 * @param id - the id of the block to style
 * @param styles - the string with 1 or more style attributes (each separated by a comma)
 */
export const addStyle2Node = function (id: string, styles = '') {
  const foundBlock = blockDatabase.get(id)!;
  if (styles !== undefined && styles !== null) {
    foundBlock.styles = styles.split(STYLECLASS_SEP);
  }
};

/**
 * Add a CSS/style class to the block with the given id.
 * If the block isn't already in the list of known blocks, add it.
 * Might be called by parser when a CSS/style class should be applied to a block
 *
 * @param itemIds - The id or a list of ids of the item(s) to apply the css class to
 * @param cssClassName - CSS class name
 */
export const setCssClass = function (itemIds: string, cssClassName: string) {
  itemIds.split(',').forEach(function (id: string) {
    let foundBlock = blockDatabase.get(id);
    if (foundBlock === undefined) {
      const trimmedId = id.trim();
      foundBlock = { id: trimmedId, type: 'na', children: [] } as Block;
      blockDatabase.set(trimmedId, foundBlock);
    }
    if (!foundBlock.classes) {
      foundBlock.classes = [];
    }
    foundBlock.classes.push(cssClassName);
  });
};

const populateBlockDatabase = (_blockList: Block[], parent: Block): void => {
  const blockList = _blockList.flat();
  const children = [];
  for (const block of blockList) {
    if (block.label) {
      block.label = sanitizeText(block.label);
    }
    if (block.type === 'classDef') {
      addStyleClass(block.id, block.css);
      continue;
    }
    if (block.type === 'applyClass') {
      setCssClass(block.id, block?.styleClass ?? '');
      continue;
    }
    if (block.type === 'applyStyles') {
      if (block?.stylesStr) {
        addStyle2Node(block.id, block?.stylesStr);
      }
      continue;
    }
    if (block.type === 'column-setting') {
      parent.columns = block.columns ?? -1;
    } else if (block.type === 'edge') {
      const count = (edgeCount.get(block.id) ?? 0) + 1;
      edgeCount.set(block.id, count);
      block.id = count + '-' + block.id;
      edgeList.push(block);
    } else {
      if (!block.label) {
        if (block.type === 'composite') {
          block.label = '';
          // log.debug('abc89 composite', block);
        } else {
          block.label = block.id;
        }
      }
      const existingBlock = blockDatabase.get(block.id);

      if (existingBlock === undefined) {
        blockDatabase.set(block.id, block);
      } else {
        // Add newer relevant data to aggregated node
        if (block.type !== 'na') {
          existingBlock.type = block.type;
        }
        if (block.label !== block.id) {
          existingBlock.label = block.label;
        }
      }

      if (block.children) {
        populateBlockDatabase(block.children, block);
      }
      if (block.type === 'space') {
        // log.debug('abc95 space', block);
        const w = block.width ?? 1;
        for (let j = 0; j < w; j++) {
          const newBlock = clone(block);
          newBlock.id = newBlock.id + '-' + j;
          blockDatabase.set(newBlock.id, newBlock);
          children.push(newBlock);
        }
      } else if (existingBlock === undefined) {
        children.push(block);
      }
    }
  }
  parent.children = children;
};

let blocks: Block[] = [];
let rootBlock = { id: 'root', type: 'composite', children: [], columns: -1 } as Block;

const clear = (): void => {
  log.debug('Clear called');
  commonClear();
  rootBlock = { id: 'root', type: 'composite', children: [], columns: -1 } as Block;
  blockDatabase = new Map([['root', rootBlock]]);
  blocks = [];
  classes = new Map();

  edgeList = [];
  edgeCount = new Map();
};

export function typeStr2Type(typeStr: string) {
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

export function edgeTypeStr2Type(typeStr: string): string {
  log.debug('typeStr2Type', typeStr);
  switch (typeStr) {
    case '==':
      return 'thick';
    default:
      return 'normal';
  }
}

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
export const generateId = () => {
  cnt++;
  return 'id-' + Math.random().toString(36).substr(2, 12) + '-' + cnt;
};

const setHierarchy = (block: Block[]): void => {
  rootBlock.children = block;
  populateBlockDatabase(block, rootBlock);
  blocks = rootBlock.children;
};

const getColumns = (blockId: string): number => {
  const block = blockDatabase.get(blockId);
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

/**
 * Returns all the blocks as a flat array
 * @returns
 */
const getBlocksFlat = () => {
  return [...blockDatabase.values()];
};
/**
 * Returns the hierarchy of blocks
 * @returns
 */
const getBlocks = () => {
  return blocks || [];
};

const getEdges = () => {
  return edgeList;
};
const getBlock = (id: string) => {
  return blockDatabase.get(id);
};

const setBlock = (block: Block) => {
  blockDatabase.set(block.id, block);
};

const getLogger = () => console;

/**
 * Return all of the style classes
 */
export const getClasses = function () {
  return classes;
};

const db = {
  getConfig: () => configApi.getConfig().block,
  typeStr2Type: typeStr2Type,
  edgeTypeStr2Type: edgeTypeStr2Type,
  edgeStrToEdgeData,
  getLogger,
  getBlocksFlat,
  getBlocks,
  getEdges,
  setHierarchy,
  getBlock,
  setBlock,
  getColumns,
  getClasses,
  clear,
  generateId,
} as const;

export type BlockDB = typeof db & DiagramDB;
export default db;
