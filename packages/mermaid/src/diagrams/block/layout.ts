import type { BlockDB } from './blockDB.js';
import type { Block } from './blockTypes.js';
import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';

// TODO: This means the number we provide in diagram's config will never be used. Should fix.
const padding = getConfig()?.block?.padding ?? 8;

// Scale parent blocks sizes recursively.
// From leaves blocks to root block we scale parents that parent block have size
// enough to fit all his child blocks scaled to the size of max child.
// See scaleAndLayout function.
function scaleParentBlocksSizes(block: Block, db: BlockDB) {
  // if not child blocks (it is leaf), just skip.
  if (!block.children?.length) {
    return;
  }

  // scale child recursively
  for (const child of block.children) {
    scaleParentBlocksSizes(child, db);
  }

  // block dimension
  const { columns: sizeInColumns, rows: sizeInRows } = getBlockDimension(block);

  // find max child's cell size
  const {
    width: maxChildCellWidth,
    height: maxChildCellHeight,
    heightByRow: maxCellHeightByRow,
  } = getMaxChildBlockCellSize(block, sizeInRows);

  // calc size of block based on max child size
  const width = (maxChildCellWidth + padding) * sizeInColumns + padding;
  // height of block with all rows equal size
  let height = (maxChildCellHeight + padding) * sizeInRows + padding;
  // find height for case when each row have varied size
  const rowsHeightsRelative: number[] = [];
  if (block.scale?.rows == 'varied') {
    let heightRowVaried = 0;
    let allRowsHeight = 0;
    for (const h of maxCellHeightByRow) {
      allRowsHeight += h;
    }
    for (const h of maxCellHeightByRow) {
      rowsHeightsRelative.push(h / allRowsHeight);
    }
    heightRowVaried += allRowsHeight + padding * sizeInRows + padding;
    height = heightRowVaried;
  }
  block.size = {
    width,
    height: height,
    x: 0,
    y: 0,
    irow: 0,
    icol: 0,
    dimension: [sizeInRows, sizeInColumns],
    rowsHeightsRelative: rowsHeightsRelative,
  };
}

// we need rescale blocks for update child blocks size.
// reqCellWidth, reqCellHeight required block's cell width and height (if zero just skip update size of block).
function rescaleBlockSizes(block: Block, db: BlockDB, reqCellWidth = 0, reqCellHeight = 0) {
  const { width: blockCellWidth, height: blockCellHeight } = getBlockCellSize(block);
  // update block size if need
  if (
    reqCellWidth &&
    reqCellHeight &&
    (blockCellWidth != reqCellWidth || blockCellHeight != reqCellHeight) &&
    block.size
  ) {
    const { width: width, height: height } = getBlockSizeByCellSize(
      block,
      reqCellWidth,
      reqCellHeight
    );
    block.size.width = width;
    block.size.height = height;
  }

  // if leaf block (no children) skip
  if (!block.children?.length) {
    return;
  }

  // block's parameter to calc children sizes
  const width = block.size?.width ?? 0;
  const height = block.size?.height ?? 0;
  const blockDim = block.size?.dimension ?? [0, 0];
  const sizeInRows = blockDim[0];
  const sizeInColumns = blockDim[1];
  const rowsHeightsRelative = block.size?.rowsHeightsRelative ?? [];
  // calc child cell size
  const childBlockCellWidth = (width - padding) / sizeInColumns - padding;
  let childBlockCellHeight = (height - padding) / sizeInRows - padding;
  // height of all rows without padding (we need it for case with varied rows)
  const heightOnlyRows = height - padding * sizeInRows - padding;

  for (const child of block.children) {
    if (rowsHeightsRelative.length) {
      const irow = child.size?.irow ?? 0;
      childBlockCellHeight = rowsHeightsRelative[irow] * heightOnlyRows;
    }
    rescaleBlockSizes(child, db, childBlockCellWidth, childBlockCellHeight);
  }
}

// getMaxChildBlockCellSize returns max block's cell size.
// Block can occupy two and more columns (cells, block.widthInColumns).
// To bring all elements to common size we need scale by cell not by entire size of block.
function getMaxChildBlockCellSize(block: Block, sizeInRows: number) {
  let maxCellWidth = 0;
  let maxCellHeight = 0;
  // We need heights by rows if we want scale each row individually.
  const maxCellHeightByRow: number[] = new Array(sizeInRows).fill(0);
  for (const child of block.children) {
    if (child.type === 'space') {
      continue;
    }
    const { width: cellWidth, height: cellHeight } = getBlockCellSize(child);
    if (cellWidth > maxCellWidth) {
      maxCellWidth = cellWidth;
    }
    if (cellHeight > maxCellHeight) {
      maxCellHeight = cellHeight;
    }
    const cellIRow = child.size?.irow ?? 0;
    if (cellIRow < sizeInRows && cellHeight > maxCellHeightByRow[cellIRow]) {
      maxCellHeightByRow[cellIRow] = cellHeight;
    }
  }
  return { width: maxCellWidth, height: maxCellHeight, heightByRow: maxCellHeightByRow };
}

// size of block in (Columns x Rows)
function getBlockDimension(block: Block) {
  // total number of cells
  let numElementsCells = 0;
  for (const child of block.children) {
    numElementsCells += child.widthInColumns ?? 1;
  }
  // block columns size
  const blockColumns = block.columns ?? 0;
  let sizeInColumns = numElementsCells;
  if (blockColumns > 0 && blockColumns < numElementsCells) {
    sizeInColumns = blockColumns;
  }
  // block rows size
  let elemRowIdx = 0;
  let elemColIdx = 0;
  for (const child of block.children) {
    if (elemColIdx >= sizeInColumns) {
      elemRowIdx++;
      elemColIdx = 0;
    }
    // set child row and column position
    if (child.size) {
      child.size.irow = elemRowIdx;
      child.size.icol = elemColIdx;
    }
    elemColIdx += child.widthInColumns ?? 1;
  }
  const sizeInRows = elemRowIdx + 1;
  return { columns: sizeInColumns, rows: sizeInRows };
}

// Block can occupy two and more columns (cells, block.widthInColumns).
function getBlockCellSize(block: Block) {
  const width = block.size?.width ?? 0;
  const widthInColumns = block.widthInColumns ?? 1;
  // clean paddings and get block's cell width
  const cellWidth = width ? (width - (widthInColumns - 1) * padding) / widthInColumns : 0;
  const cellHeight = block.size?.height ?? 0;
  return { width: cellWidth, height: cellHeight };
}

function getBlockSizeByCellSize(block: Block, cellWidth: number, cellHeight: number) {
  const widthInColumns = block.widthInColumns ?? 1;
  const width = cellWidth * widthInColumns + padding * (widthInColumns - 1);
  const height = cellHeight;
  return { width: width, height: height };
}

// Block's X Y coordinate is block's center position.
// We start layout child blocks in parent block beginning from left-up corner.
function layoutBlocks(block: Block, db: BlockDB, x = 0, y = 0) {
  // set block's X Y position
  if (block.size) {
    block.size.x = x;
    block.size.y = y;
  }

  if (!block.children?.length) {
    return;
  }

  // set first child left-up vertex
  const childLeftUpVertexX = x - (block.size?.width ?? 0) / 2 + padding;
  let childLeftUpVertexY = y - (block.size?.height ?? 0) / 2 + padding;
  //
  let previousRowHeight = 0;
  let currentChildRow = 0;
  let deltaX = 0;

  for (const child of block.children) {
    if (child.size) {
      const childWidth = child.size.width;
      const childHeight = child.size.height;
      const childIRow = child.size.irow;
      if (childIRow != currentChildRow) {
        currentChildRow = childIRow;
        deltaX = 0;
        childLeftUpVertexY += previousRowHeight + padding;
      }

      const childX = childLeftUpVertexX + childWidth / 2;
      const childY = childLeftUpVertexY + childHeight / 2;
      layoutBlocks(child, db, childX + deltaX, childY);

      deltaX += childWidth + padding;
      previousRowHeight = childHeight;
    }
  }
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

// Block Diagram is tree.
// We will iterate (scaleParentBlocksSize and rescaleBlocksSize) it in two steps.
// In first iteration (see example graph):
//  We start from leaves.
//  <AA1> bigger than <AA2>, so we scale <A> to fit to two elements with size <AA1>.
//  Do same for <B> starting from <BBB1> and <BBB2>.
//  Element <BBB2> bigger than <BBB1>, scale <BB2> to fit elements with size <BBB2>.
//  Scale <B> to fit elements with size <BB1>.
//  Scale <root> to fit elements with size <A>.
//          <root>
//        /        \
//      <A>        <B>
//     (max)       /  \
//     /   \      /     \
//  <AA1> <AA2>  <BB1> <BB2>
//  (max)        (max)  /  \
//                     /    \
//                   <BBB1> <BBB2>
//                           (max)
// In first iteration we scale only parent elements to have proper size to fit all properly scaled children.
// So first iteration gives as proper size of root element.
// We do not update child elements because in each step up we will need rescale children again and again.
// Instead we rescale children in second iteration (rescaleBlockSizes).
export function scaleAndLayout(db: BlockDB) {
  const root = db.getBlock('root');
  if (!root) {
    return;
  }

  scaleParentBlocksSizes(root, db);
  rescaleBlockSizes(root, db);
  layoutBlocks(root, db);
  log.debug('getBlocks', JSON.stringify(root, null, 2));

  const { minX, minY, maxX, maxY } = findBounds(root);

  const height = maxY - minY;
  const width = maxX - minX;
  return { x: minX, y: minY, width, height };
}

// cspell:ignore irow
// cspell:ignore icol
