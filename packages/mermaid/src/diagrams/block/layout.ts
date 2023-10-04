import { BlockDB } from './blockDB.js';
import type { Block } from './blockTypes.js';

const padding = 10;

function calcBlockSizes(block: Block, db: BlockDB) {
  console.log('calculateSize (start)', block.id, block?.size?.x, block?.size?.width);
  const totalWidth = 0;
  const totalHeight = 0;
  let maxWidth = 0;
  let maxHeight = 0;

  if (block.children) {
    for (const child of block.children) {
      calcBlockSizes(child, db);
    }
    // find max width of children
    for (const child of block.children) {
      const { width, height, x, y } = child.size || { width: 0, height: 0, x: 0, y: 0 };
      // console.log('APA', child.id, width, height, x, y);
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
        child.size.x = 0;
        child.size.y = 0;
      }
    }

    // // Position items relative to self
    // let x = -padding / 2;
    // const y = 0;

    // let accumulatedPaddingX = 0;
    // for (const child of block.children) {
    //   if (child.size) {
    //     child.size.x = x;
    //     child.size.y = y;
    //     x += maxWidth + padding;
    //   }
    //   accumulatedPaddingX += padding;
    // }
  }
  if (block.children?.length > 0) {
    const numChildren = block.children.length;
    block.size = {
      width: numChildren * (maxWidth + padding) + padding,
      height: maxHeight + 2 * padding,
      x: 0,
      y: 0,
    };
  }
  console.log('calculateSize APA (done)', block.id, block.size.x, block.size.width);
}

function layoutBlocks(block: Block, db: BlockDB) {
  console.log('layout blocks (block)', block.id, 'x:', block.size.x, 'width:', block.size.width);
  if (
    block.children && // find max width of children
    block.children.length > 0
  ) {
    const width = block?.children[0]?.size?.width || 0;
    const widthOfChildren = block.children.length * width + (block.children.length - 1) * padding;
    let posX = (block?.size?.x || 0) - widthOfChildren / 2;
    const posY = 0;
    const parentX = block?.size?.x || 0 - block.children.length;
    const parentWidth = block?.size?.width || 0;

    console.log('widthOfChildren', widthOfChildren, 'posX', posX, 'parentX', parentX);

    // let first = true;
    for (const child of block.children) {
      console.log(
        'layout blocks (child)',
        child.id,
        'x:',
        child?.size?.x,
        'width:',
        child?.size?.width,
        'posX:',
        posX,
        block?.size?.x,
        widthOfChildren / 2,
        widthOfChildren / 2
      );

      if (!child.size) {
        continue;
      }
      const { width, height } = child.size;
      child.size.x = posX + width / 2;
      posX += width + padding;
      child.size.y = posY;
      // posY += height + padding;
      if (child.children) {
        layoutBlocks(child, db);
      }
    }
  }
}

function positionBlock(parent: Block, block: Block, db: BlockDB) {
  console.log(
    'layout position block',
    parent.id,
    parent?.size?.x,
    block.id,
    block?.size?.x,
    'width:',
    block?.size?.width
  );
  let parentX = 0;
  let parentWidth = 0;
  let y = 0;
  if (parent.id !== 'root') {
    parentX = parent?.size?.x || 0;
    parentWidth = parent?.size?.width || 0;
    y = parent?.size?.y || 0;
  }
  if (block.size && block.id !== 'root') {
    console.log(
      'layout position block (calc)',
      'x:',
      parentX,
      parentWidth / 2,
      block.id,
      'x:',
      block.size.x,
      block.size.width
    );
    // block.size.x = parentX + block.size.x + -block.size.width / 2;
    block.size.x =
      parentX < 0 ? parentX + block.size.x : parentX + block.size.x + -block.size.width / 2;
    // block.size.x = parentX - parentWidth + Math.abs(block.size.x) / 2;
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
  if (block.size && block.id !== 'root') {
    const { x, y, width, height } = block.size;
    if (x - width / 2 < minX) {
      minX = x - width / 2;
      // console.log('Here APA minX', block.id, x, width, minX);
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
  layoutBlocks(root, db);
  // Position blocks relative to parents
  // positionBlock(root, root, db);
  console.log('getBlocks', JSON.stringify(db.getBlocks(), null, 2));

  minX = 0;
  minY = 0;
  maxX = 0;
  maxY = 0;
  findBounds(root);
  // console.log('Here maxX', minX, '--', maxX);
  const height = maxY - minY;
  const width = maxX - minX;
  return { x: minX, y: minY, width, height };
}
