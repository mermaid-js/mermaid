import { BlockDB } from './blockDB.js';
import type { Block } from './blockTypes.js';
import { log } from '../../logger.js';
const padding = 8;

interface BlockPosition {
  px: number;
  py: number;
}

export function calculateBlockPosition(columns: number, position: number): BlockPosition {
  // Ensure that columns is a positive integer
  if (columns === 0 || !Number.isInteger(columns)) {
    throw new Error('Columns must be an integer !== 0.');
  }

  // Ensure that position is a non-negative integer
  if (position < 0 || !Number.isInteger(position)) {
    throw new Error('Position must be a non-negative integer.');
  }

  if (columns < 0) {
    // Auto coulumns is set
    return { px: position, py: 0 };
  }
  if (columns === 1) {
    // Auto coulumns is set
    return { px: 0, py: position };
  }
  // Calculate posX and posY
  const px = position % columns;
  const py = Math.floor(position / columns);

  return { px, py };
}

const getMaxChildSize = (block: Block) => {
  let maxWidth = 0;
  let maxHeight = 0;
  // find max width of children
  for (const child of block.children) {
    const { width, height, x, y } = child.size || { width: 0, height: 0, x: 0, y: 0 };
    log.debug('abc88', child.id, width, height, x, y);
    if (width > maxWidth) {
      maxWidth = width;
    }
    if (height > maxHeight) {
      maxHeight = height;
    }
  }
  return { width: maxWidth, height: maxHeight };
};

function setBlockSizes(block: Block, db: BlockDB, sieblingWidth: number = 0) {
  log.debug('calculateSize abc88 (start)', block.id, block?.size?.x, block?.size?.width);
  const totalWidth = 0;
  const totalHeight = 0;
  let maxWidth = 0;
  let maxHeight = 0;

  if (block.children?.length > 0) {
    for (const child of block.children) {
      setBlockSizes(child, db);
    }
    // find max width of children
    const childSize = getMaxChildSize(block);
    maxWidth = childSize.width;
    maxHeight = childSize.height;

    // set width of block to max width of children
    for (const child of block.children) {
      if (child.size) {
        child.size.width = maxWidth;
        child.size.height = maxHeight;
        child.size.x = 0;
        child.size.y = 0;
      }
    }
    for (const child of block.children) {
      setBlockSizes(child, db, maxWidth);
    }

    const columns = block.columns || -1;
    const numItems = block.children.length;

    // The width and height in number blocks
    let xSize = block.children?.length;
    if (columns > 0 && columns < numItems) {
      xSize = columns;
    }
    const ySize = Math.ceil(numItems / xSize);

    let width = xSize * (maxWidth + padding) + padding;
    // If maxWidth
    if (width < sieblingWidth) {
      console.log(
        'Detected to small siebling: abc88',
        block.id,
        'sieblingWidth',
        sieblingWidth,
        'width',
        width
      );
      width = sieblingWidth;
      const childWidth = (sieblingWidth - xSize * padding - padding) / xSize;
      log.debug('Size indata abc88', block.id, 'childWidth', childWidth, 'maxWidth', maxWidth);
      log.debug('Size indata abc88 xSize', xSize, 'paddiong', padding);

      // // set width of block to max width of children
      for (const child of block.children) {
        if (child.size) {
          child.size.width = childWidth;
          child.size.height = maxHeight;
          child.size.x = 0;
          child.size.y = 0;
        }
      }
    }

    log.debug(
      '(calc)',
      block.id,
      'xSize',
      xSize,
      'ySize',
      ySize,
      'columns',
      columns,
      block.children.length
    );

    block.size = {
      width,
      height: ySize * (maxHeight + padding) + padding,
      x: 0,
      y: 0,
    };
  }

  log.debug('calculateSize abc88 (done)', block.id, block?.size?.x, block?.size?.width);
}

function layoutBlocks(block: Block, db: BlockDB) {
  log.debug(
    'layout blocks (=>layoutBlocks)',
    block.id,
    'x:',
    block?.size?.x,
    'width:',
    block?.size?.width
  );
  const columns = block.columns || -1;
  log.debug('layoutBlocks columns', block.id, '=>', columns);
  if (
    block.children && // find max width of children
    block.children.length > 0
  ) {
    const width = block?.children[0]?.size?.width || 0;
    const widthOfChildren = block.children.length * width + (block.children.length - 1) * padding;

    log.debug('widthOfChildren', widthOfChildren, 'posX');

    // let first = true;
    let columnPos = -1;
    for (const child of block.children) {
      columnPos++;

      // log.debug(
      //   'layout blocks (child)',
      //   child.id,
      //   'x:',
      //   child?.size?.x,
      //   'width:',
      //   child?.size?.width,
      //   'posX:',
      //   posX,
      //   block?.size?.x,
      //   widthOfChildren / 2,
      //   widthOfChildren / 2
      // );

      if (!child.size) {
        continue;
      }
      const { width, height } = child.size;
      const { px, py } = calculateBlockPosition(columns, columnPos);
      log.debug(
        'layout blocks (child) px, py (',
        block?.size?.x,
        ',',
        block?.size?.y,
        ')',
        'parent:',
        block.id,
        width / 2,
        padding
      );
      if (block.size) {
        child.size.x =
          block.size.x - block.size.width / 2 + px * (width + padding) + width / 2 + padding;
        // child.size.x = px * (width + padding) - block.size.width / 2;
        // posX += width + padding;
        // child.size.y = py * (height + padding) + height / 2 + padding;
        child.size.y =
          block.size.y - block.size.height / 2 + py * (height + padding) + height / 2 + padding;

        log.debug(
          'layout blocks (calc) px, py',
          'id:',
          child.id,
          '=>',
          'x:',
          child.size.x,
          'y:',
          child.size.y
        );
      }

      // posY += height + padding;
      if (child.children) {
        layoutBlocks(child, db);
      }
    }
  }
  log.debug(
    'layout blocks (<==layoutBlocks)',
    block.id,
    'x:',
    block?.size?.x,
    'width:',
    block?.size?.width
  );
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
      // log.debug('Here APA minX', block.id, x, width, minX);
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
  const root = db.getBlock('root');
  if (!root) {
    return;
  }

  setBlockSizes(root, db, 0);
  layoutBlocks(root, db);
  // Position blocks relative to parents
  // positionBlock(root, root, db);
  log.debug('getBlocks', JSON.stringify(root, null, 2));

  minX = 0;
  minY = 0;
  maxX = 0;
  maxY = 0;
  findBounds(root);
  // log.debug('Here maxX', minX, '--', maxX);
  const height = maxY - minY;
  const width = maxX - minX;
  return { x: minX, y: minY, width, height };
}
