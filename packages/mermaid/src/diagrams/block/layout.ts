import { BlockDB } from './blockDB.js';
import type { Block } from './blockTypes.js';

function calcBlockSizes(block: Block, db: BlockDB) {
  let totalWidth = 0;
  let totalHeight = 0;
  if (block.children) {
    for (const child of block.children) {
      calcBlockSizes(child, db);
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

    // Position items relative to self
    let x = 0;
    const y = 0;
    const padding = 10;
    for (const child of block.children) {
      if (child.size) {
        child.size.x = x;
        child.size.y = y;
        x += maxWidth + padding;
      }
      if (x > totalWidth) {
        totalWidth = x;
      }
      if (y > totalHeight) {
        totalHeight = y;
      }
    }
  }
  if (block.children?.length > 0) {
    block.size = { width: totalWidth, height: totalHeight, x: 0, y: 0 };
  }
  console.log('layoutBlock (done)', block);
}

function positionBlock(parent: Block, block: Block, db: BlockDB) {
  console.log('layout position block', parent.id, parent?.size?.x, block.id, block?.size?.x);
  let x = 0;
  let y = 0;
  if (parent) {
    x = parent?.size?.x || 0;
    y = parent?.size?.y || 0;
  }
  if (block.size) {
    block.size.x = block.size.x + x - block.size.width / 2;
    block.size.y = block.size.y + y;
  }
  if (block.children) {
    for (const child of block.children) {
      positionBlock(block, child, db);
    }
  }
  // console.log('layout position block', block);
}
let minX = 0;
let minY = 0;
let maxX = 0;
let maxY = 0;

function findBounds(block: Block) {
  if (block.size) {
    const { x, y, width, height } = block.size;
    if (x - width / 2 < minX) {
      minX = x - width / 2;
    }
    if (y - height / 2 < minY) {
      minY = y - height / 2;
    }
    if (x + width / 2 > maxX) {
      maxX = x + width / 2;
    }
    if (y + height / 2 > maxY) {
      maxY = y + height / 2;
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
  calcBlockSizes(root, db);
  console.log('layout getBlocks', db.getBlocks());
  // Position blocks relative to parents
  positionBlock(root, root, db);

  minX = 0;
  minY = 0;
  maxX = 0;
  maxY = 0;
  findBounds(root);
  console.log('Here maxX', maxX);
  const height = maxY - minY;
  const width = maxX - minX;
  return { x: minX, y: minY, width, height };
}
