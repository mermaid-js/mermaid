import type { BlockDB } from './blockDB.js';
import type { Block } from './blockTypes.js';
import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
// TODO: This means the number we provide in diagram's config will never be used. Should fix.
const padding = getConfig()?.block?.padding ?? 8;

interface BlockPosition {
  px: number;
  py: number;
}

export function calculateBlockPosition(columns: number, position: number): BlockPosition {
  // log.debug('calculateBlockPosition abc89', columns, position);
  // Ensure that columns is a positive integer
  if (columns === 0 || !Number.isInteger(columns)) {
    throw new Error('Columns must be an integer !== 0.');
  }

  // Ensure that position is a non-negative integer
  if (position < 0 || !Number.isInteger(position)) {
    throw new Error('Position must be a non-negative integer.' + position);
  }

  if (columns < 0) {
    // Auto columns is set
    return { px: position, py: 0 };
  }
  if (columns === 1) {
    // Auto columns is set
    return { px: 0, py: position };
  }
  // Calculate posX and posY
  const px = position % columns;
  const py = Math.floor(position / columns);
  // log.debug('calculateBlockPosition abc89', columns, position, '=> (', px, py, ')');
  return { px, py };
}

const getMaxChildSize = (block: Block) => {
  let maxWidth = 0;
  let maxHeight = 0;
  // find max width of children
  // log.debug('getMaxChildSize abc95 (start) parent:', block.id);
  for (const child of block.children) {
    const { width, height, x, y } = child.size ?? { width: 0, height: 0, x: 0, y: 0 };
    log.debug(
      'getMaxChildSize abc95 child:',
      child.id,
      'width:',
      width,
      'height:',
      height,
      'x:',
      x,
      'y:',
      y,
      child.type
    );
    if (child.type === 'space') {
      continue;
    }
    if (width > maxWidth) {
      maxWidth = width / (block.widthInColumns ?? 1);
    }
    if (height > maxHeight) {
      maxHeight = height;
    }
  }
  return { width: maxWidth, height: maxHeight };
};

function setBlockSizes(block: Block, db: BlockDB, siblingWidth = 0, siblingHeight = 0) {
  log.debug(
    'setBlockSizes abc95 (start)',
    block.id,
    block?.size?.x,
    'block width =',
    block?.size,
    'sieblingWidth',
    siblingWidth
  );
  if (!block?.size?.width) {
    block.size = {
      width: siblingWidth,
      height: siblingHeight,
      x: 0,
      y: 0,
    };
  }
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
    log.debug('setBlockSizes abc95 maxWidth of', block.id, ':s children is ', maxWidth, maxHeight);

    // set width of block to max width of children
    for (const child of block.children) {
      if (child.size) {
        log.debug(
          `abc95 Setting size of children of ${block.id} id=${child.id} ${maxWidth} ${maxHeight} ${JSON.stringify(child.size)}`
        );
        child.size.width =
          maxWidth * (child.widthInColumns ?? 1) + padding * ((child.widthInColumns ?? 1) - 1);
        child.size.height = maxHeight;
        child.size.x = 0;
        child.size.y = 0;

        log.debug(
          `abc95 updating size of ${block.id} children child:${child.id} maxWidth:${maxWidth} maxHeight:${maxHeight}`
        );
      }
    }
    for (const child of block.children) {
      setBlockSizes(child, db, maxWidth, maxHeight);
    }

    const columns = block.columns ?? -1;
    let numItems = 0;
    for (const child of block.children) {
      numItems += child.widthInColumns ?? 1;
    }

    // The width and height in number blocks
    let xSize = block.children.length;
    if (columns > 0 && columns < numItems) {
      xSize = columns;
    }

    const ySize = Math.ceil(numItems / xSize);

    let width = xSize * (maxWidth + padding) + padding;
    let height = ySize * (maxHeight + padding) + padding;
    // If maxWidth
    if (width < siblingWidth) {
      log.debug(
        `Detected to small siebling: abc95 ${block.id} sieblingWidth ${siblingWidth} sieblingHeight ${siblingHeight} width ${width}`
      );
      width = siblingWidth;
      height = siblingHeight;
      const childWidth = (siblingWidth - xSize * padding - padding) / xSize;
      const childHeight = (siblingHeight - ySize * padding - padding) / ySize;
      // cspell:ignore indata
      log.debug('Size indata abc88', block.id, 'childWidth', childWidth, 'maxWidth', maxWidth);
      log.debug('Size indata abc88', block.id, 'childHeight', childHeight, 'maxHeight', maxHeight);
      log.debug('Size indata abc88 xSize', xSize, 'padding', padding);

      // set width of block to max width of children
      for (const child of block.children) {
        if (child.size) {
          child.size.width = childWidth;
          child.size.height = childHeight;
          child.size.x = 0;
          child.size.y = 0;
        }
      }
    }

    log.debug(
      `abc95 (finale calc) ${block.id} xSize ${xSize} ySize ${ySize} columns ${columns}${
        block.children.length
      } width=${Math.max(width, block.size?.width || 0)}`
    );
    if (width < (block?.size?.width || 0)) {
      width = block?.size?.width || 0;

      // Grow children to fit
      const num = columns > 0 ? Math.min(block.children.length, columns) : block.children.length;
      if (num > 0) {
        const childWidth = (width - num * padding - padding) / num;
        log.debug('abc95 (growing to fit) width', block.id, width, block.size?.width, childWidth);
        for (const child of block.children) {
          if (child.size) {
            child.size.width = childWidth;
          }
        }
      }
    }
    block.size = {
      width,
      height,
      x: 0,
      y: 0,
    };
  }

  log.debug(
    'setBlockSizes abc94 (done)',
    block.id,
    block?.size?.x,
    block?.size?.width,
    block?.size?.y,
    block?.size?.height
  );
}

function layoutBlocks(block: Block, db: BlockDB) {
  log.debug(
    `abc85 layout blocks (=>layoutBlocks) ${block.id} x: ${block?.size?.x} y: ${block?.size?.y} width: ${block?.size?.width}`
  );
  const columns = block.columns ?? -1;
  log.debug('layoutBlocks columns abc95', block.id, '=>', columns, block);
  if (
    block.children && // find max width of children
    block.children.length > 0
  ) {
    const width = block?.children[0]?.size?.width ?? 0;
    const widthOfChildren = block.children.length * width + (block.children.length - 1) * padding;

    log.debug('widthOfChildren 88', widthOfChildren, 'posX');

    // let first = true;
    let columnPos = 0;
    log.debug('abc91 block?.size?.x', block.id, block?.size?.x);
    let startingPosX = block?.size?.x ? block?.size?.x + (-block?.size?.width / 2 || 0) : -padding;
    let rowPos = 0;
    for (const child of block.children) {
      const parent = block;

      if (!child.size) {
        continue;
      }
      const { width, height } = child.size;
      const { px, py } = calculateBlockPosition(columns, columnPos);
      if (py != rowPos) {
        rowPos = py;
        startingPosX = block?.size?.x ? block?.size?.x + (-block?.size?.width / 2 || 0) : -padding;
        log.debug('New row in layout for block', block.id, ' and child ', child.id, rowPos);
      }
      log.debug(
        `abc89 layout blocks (child) id: ${child.id} Pos: ${columnPos} (px, py) ${px},${py} (${parent?.size?.x},${parent?.size?.y}) parent: ${parent.id} width: ${width}${padding}`
      );
      if (parent.size) {
        const halfWidth = width / 2;
        child.size.x = startingPosX + padding + halfWidth;

        // cspell:ignore pyid
        log.debug(
          `abc91 layout blocks (calc) px, pyid:${
            child.id
          } startingPos=X${startingPosX} new startingPosX${
            child.size.x
          } ${halfWidth} padding=${padding} width=${width} halfWidth=${halfWidth} => x:${
            child.size.x
          } y:${child.size.y} ${child.widthInColumns} (width * (child?.w || 1)) / 2 ${
            (width * (child?.widthInColumns ?? 1)) / 2
          }`
        );

        startingPosX = child.size.x + halfWidth;

        child.size.y =
          parent.size.y - parent.size.height / 2 + py * (height + padding) + height / 2 + padding;

        log.debug(
          `abc88 layout blocks (calc) px, pyid:${
            child.id
          }startingPosX${startingPosX}${padding}${halfWidth}=>x:${child.size.x}y:${child.size.y}${
            child.widthInColumns
          }(width * (child?.w || 1)) / 2${(width * (child?.widthInColumns ?? 1)) / 2}`
        );
      }
      if (child.children) {
        layoutBlocks(child, db);
      }
      columnPos += child?.widthInColumns ?? 1;
      log.debug('abc88 columnsPos', child, columnPos);
    }
  }
  log.debug(
    `layout blocks (<==layoutBlocks) ${block.id} x: ${block?.size?.x} y: ${block?.size?.y} width: ${block?.size?.width}`
  );
}

function findBounds(
  block: Block,
  { minX, minY, maxX, maxY } = { minX: 0, minY: 0, maxX: 0, maxY: 0 }
) {
  if (block.size && block.id !== 'root') {
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
      ({ minX, minY, maxX, maxY } = findBounds(child, { minX, minY, maxX, maxY }));
    }
  }
  return { minX, minY, maxX, maxY };
}

export function layout(db: BlockDB) {
  const root = db.getBlock('root');
  if (!root) {
    return;
  }

  setBlockSizes(root, db, 0, 0);
  layoutBlocks(root, db);
  // Position blocks relative to parents
  // positionBlock(root, root, db);
  log.debug('getBlocks', JSON.stringify(root, null, 2));

  const { minX, minY, maxX, maxY } = findBounds(root);

  const height = maxY - minY;
  const width = maxX - minX;
  return { x: minX, y: minY, width, height };
}
