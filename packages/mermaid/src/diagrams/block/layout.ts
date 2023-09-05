import { BlockDB } from './blockDB.js';
import type { Block } from './blockTypes.js';

function layoutBLock(block: Block, db: BlockDB) {
  if (block.children) {
    for (const child of block.children) {
      layoutBLock(child, db);
    }
    // find max width of children
    let maxWidth = 0;
    let maxHeight = 0;
    for (const child of block.children) {
      const { width, height, x, y } = child.size || { width: 0, height: 0, x: 0, y: 0 };
      if (width > maxWidth) {
        maxWidth = width;
      }
      if (height > maxHeight) {
        maxHeight = height;
      }
    }

    // set width of block to max width of children
    for (const child of block.children) {
      if (child.size) {
        child.size.width = maxWidth;
        child.size.height = maxHeight;
      }
    }

    // Position items
    let x = 0;
    let y = 0;
    const padding = 10;
    for (const child of block.children) {
      if (child.size) {
        child.size.x = x;
        child.size.y = y;
        x += maxWidth + padding;
      }
    }
  }
}

function positionBlock(block: Block, db: BlockDB) {
  console.log('Here Positioning', block?.size?.node);
  // const o = db.getBlock(block.id);
  // const node;
  if (block?.size?.node) {
    const node = block?.size?.node;
    const size = block?.size;
    console.log('Here as well', node);
    if (node) {
      node.attr(
        'transform',
        'translate(' + (size.x - size.width / 2) + ', ' + (size.y - size.height / 2) + ')'
      );
    }
  }
  if (block.children) {
    for (const child of block.children) {
      positionBlock(child, db);
    }
  }
}
let minX = 0;
let minY = 0;
let maxX = 0;
let maxY = 0;

function findBounds(block: Block) {
  if (block.size) {
    const { x, y, width, height } = block.size;
    console.log('Here', minX, minY, x, y, width, height);
    if (x - width < minX) {
      minX = x - width;
    }
    if (y - height < minY) {
      minY = y - height;
    }
    if (x > maxX) {
      maxX = x;
    }
    if (y > maxY) {
      maxY = y;
    }
  }
  if (block.children) {
    for (const child of block.children) {
      findBounds(child);
    }
  }
}

export function layout(db: BlockDB) {
  const blocks = db.getBlocks();
  const root = { id: 'root', type: 'composite', children: blocks } as Block;
  layoutBLock(root, db);
  positionBlock(root, db);

  minX = 0;
  minY = 0;
  maxX = 0;
  maxY = 0;
  findBounds(root);
  const height = maxY - minY;
  const width = maxX - minX;
  return { x: minX, y: minY, width, height };
}
