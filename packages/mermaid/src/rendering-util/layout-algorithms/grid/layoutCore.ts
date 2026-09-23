import type { LayoutData, Node } from '../../types.js';
import { positionGridEdgeLabels } from './edgeLabels.js';
import { buildGridForest } from './groups.js';
import {
  buildGridSourceOrder,
  readGridConfig,
  resolveGridPlacements,
  validateGridPlacementMap,
} from './placement.js';
import { routeGridEdges, type GridRoutingOptions } from './router.js';
import type { GridRoutingInstrumentation } from './routerInstrumentation.js';
import {
  GRID_DEFAULTS,
  ROOT_CONTAINER_ID,
  type GridContainerId,
  type GridContainerLayoutMeta,
  type GridItemLayoutMeta,
  type GridLayoutConfigNormalized,
  type GridForest,
  type GridLayoutResult,
  type GridLayoutData,
  gridError,
  isEdgeLabelNode,
  isFinitePositiveNumber,
} from './types.js';

const GROUP_ROUTING_GUTTER = 24;
const GROUP_ROUTING_CLEARANCE = 20;

function sortBySourceOrder(items: Node[], sourceOrder: Map<string, number>): Node[] {
  return [...items].sort((a, b) => {
    const aOrder = sourceOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = sourceOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    return a.id.localeCompare(b.id);
  });
}

function titleBandFor(node: Node, titleGap: number): number {
  if (!node.label || !node.labelBBox || !(node.labelBBox.height > 0)) {
    return 0;
  }
  return node.labelBBox.height + titleGap;
}

function ensureMeasuredNode(node: Node): void {
  if (!isFinitePositiveNumber(node.width) || !isFinitePositiveNumber(node.height)) {
    throw gridError('GRID_MISSING_MEASUREMENT', `Node "${node.id}" is missing size`, {
      nodeId: node.id,
      width: node.width,
      height: node.height,
    });
  }
}

function measureChild(node: Node): { width: number; height: number } {
  ensureMeasuredNode(node);
  return { width: node.width!, height: node.height! };
}

function layoutContainer(
  containerId: GridContainerId,
  result: GridLayoutResult,
  containers: Map<GridContainerId, GridContainerLayoutMeta>,
  itemMeta: Map<string, GridItemLayoutMeta>
): void {
  const { forest, config, sourceOrder } = result;
  const group = containerId === ROOT_CONTAINER_ID ? undefined : forest.groupById.get(containerId);
  const padding = group ? Math.max(group.padding ?? 0, config.containerPadding) : 0;
  const titleBand = group ? titleBandFor(group, config.titleGap) : 0;
  const routingGutter = group ? GROUP_ROUTING_GUTTER : 0;
  const contentLeft = group ? padding + routingGutter : 0;
  const contentTop = group ? padding + titleBand + routingGutter : 0;

  const directItems = sortBySourceOrder(
    (forest.childrenByParent.get(containerId) ?? []).filter((node) => !isEdgeLabelNode(node)),
    sourceOrder
  );

  const { cells } = resolveGridPlacements(directItems, sourceOrder, config);
  const cellEntries = [...cells.values()].sort((a, b) => a.row - b.row || a.column - b.column);

  const columnWidths = new Map<number, number>();
  const rowHeights = new Map<number, number>();
  const rows = new Set<number>();
  const columns = new Set<number>();

  for (const cell of cellEntries) {
    let stackWidth = 0;
    let stackHeight = 0;
    for (const placement of cell.items) {
      const size = measureChild(placement.item);
      stackWidth = Math.max(stackWidth, size.width);
      stackHeight += size.height;
    }
    if (cell.items.length > 1) {
      stackHeight += config.cellGap * (cell.items.length - 1);
    }
    cell.width = stackWidth;
    cell.height = stackHeight;
    rows.add(cell.row);
    columns.add(cell.column);
    columnWidths.set(cell.column, Math.max(columnWidths.get(cell.column) ?? 0, stackWidth));
    rowHeights.set(cell.row, Math.max(rowHeights.get(cell.row) ?? 0, stackHeight));
  }

  const sortedRows = [...rows].sort((a, b) => a - b);
  const sortedColumns = [...columns].sort((a, b) => a - b);

  const columnOrigins = new Map<number, number>();
  let xCursor = contentLeft;
  for (const column of sortedColumns) {
    columnOrigins.set(column, xCursor);
    xCursor += (columnWidths.get(column) ?? 0) + config.columnGap;
  }
  const contentWidth = sortedColumns.length ? xCursor - config.columnGap - contentLeft : 0;

  const rowOrigins = new Map<number, number>();
  let yCursor = contentTop;
  for (const row of sortedRows) {
    rowOrigins.set(row, yCursor);
    yCursor += (rowHeights.get(row) ?? 0) + config.rowGap;
  }
  const gridHeight = sortedRows.length ? yCursor - config.rowGap - contentTop : 0;

  const outerLeftCorridor = group
    ? contentLeft - GROUP_ROUTING_CLEARANCE
    : -Math.max(config.columnGap / 2, GRID_DEFAULTS.containerPadding);
  const outerRightCorridor = group
    ? contentLeft + contentWidth + GROUP_ROUTING_CLEARANCE
    : contentLeft + contentWidth + Math.max(config.columnGap / 2, GRID_DEFAULTS.containerPadding);
  const outerTopCorridor = group
    ? contentTop - GROUP_ROUTING_CLEARANCE
    : -Math.max(config.rowGap / 2, GRID_DEFAULTS.containerPadding);
  const outerBottomCorridor = group
    ? contentTop + gridHeight + GROUP_ROUTING_CLEARANCE
    : contentTop + gridHeight + Math.max(config.rowGap / 2, GRID_DEFAULTS.containerPadding);

  const verticalCorridors = new Set<number>([outerLeftCorridor, outerRightCorridor]);
  const horizontalCorridors = new Set<number>([outerTopCorridor, outerBottomCorridor]);

  for (let index = 0; index < sortedColumns.length - 1; index++) {
    const current = sortedColumns[index];
    const next = sortedColumns[index + 1];
    const corridor =
      (columnOrigins.get(current)! + (columnWidths.get(current) ?? 0) + columnOrigins.get(next)!) /
      2;
    verticalCorridors.add(corridor);
  }
  for (let index = 0; index < sortedRows.length - 1; index++) {
    const current = sortedRows[index];
    const next = sortedRows[index + 1];
    const corridor =
      (rowOrigins.get(current)! + (rowHeights.get(current) ?? 0) + rowOrigins.get(next)!) / 2;
    horizontalCorridors.add(corridor);
  }

  const firstColumn = sortedColumns[0];
  const lastColumn = sortedColumns[sortedColumns.length - 1];
  const firstRow = sortedRows[0];
  const lastRow = sortedRows[sortedRows.length - 1];

  for (const cell of cellEntries) {
    const cellLeft = columnOrigins.get(cell.column) ?? contentLeft;
    const cellTop = rowOrigins.get(cell.row) ?? contentTop;
    const cellWidth = columnWidths.get(cell.column) ?? cell.width;
    const cellHeight = rowHeights.get(cell.row) ?? cell.height;
    const verticalFactor =
      cell.verticalAlign === 'top' ? 0 : cell.verticalAlign === 'bottom' ? 1 : 0.5;
    const stackTop = cellTop + (cellHeight - cell.height) * verticalFactor;

    let itemTop = stackTop;
    for (const [itemIndex, placement] of cell.items.entries()) {
      const { width, height } = measureChild(placement.item);
      const horizontalFactor =
        placement.horizontalAlign === 'left' ? 0 : placement.horizontalAlign === 'right' ? 1 : 0.5;
      const itemLeft = cellLeft + (cellWidth - width) * horizontalFactor;
      placement.item.x = itemLeft + width / 2;
      placement.item.y = itemTop + height / 2;
      const topCorridorY =
        itemIndex > 0
          ? itemTop - config.cellGap / 2
          : cell.row === firstRow
            ? outerTopCorridor
            : ([...horizontalCorridors]
                .filter((value) => value < cellTop)
                .sort((a, b) => b - a)[0] ?? outerTopCorridor);
      const bottomCorridorY =
        itemIndex < cell.items.length - 1
          ? itemTop + height + config.cellGap / 2
          : cell.row === lastRow
            ? outerBottomCorridor
            : ([...horizontalCorridors]
                .filter((value) => value > cellTop + cellHeight)
                .sort((a, b) => a - b)[0] ?? outerBottomCorridor);
      if (itemIndex > 0) {
        horizontalCorridors.add(topCorridorY);
      }
      if (itemIndex < cell.items.length - 1) {
        horizontalCorridors.add(bottomCorridorY);
      }

      itemMeta.set(placement.item.id, {
        containerId,
        row: cell.row,
        column: cell.column,
        cellLeft,
        cellTop,
        cellWidth,
        cellHeight,
        leftCorridorX:
          cell.column === firstColumn
            ? outerLeftCorridor
            : ([...verticalCorridors]
                .filter((value) => value < cellLeft)
                .sort((a, b) => b - a)[0] ?? outerLeftCorridor),
        rightCorridorX:
          cell.column === lastColumn
            ? outerRightCorridor
            : ([...verticalCorridors]
                .filter((value) => value > cellLeft + cellWidth)
                .sort((a, b) => a - b)[0] ?? outerRightCorridor),
        topCorridorY,
        bottomCorridorY,
      });

      itemTop += height + config.cellGap;
    }
  }

  const width = group
    ? Math.max(
        contentWidth + (padding + routingGutter) * 2,
        (group.labelBBox?.width ?? 0) + padding * 2
      )
    : contentWidth;
  const height = group ? gridHeight + titleBand + (padding + routingGutter) * 2 : gridHeight;

  containers.set(containerId, {
    id: containerId,
    left: 0,
    top: 0,
    width,
    height,
    contentLeft,
    contentTop,
    contentRight: group ? contentLeft + contentWidth : contentWidth,
    contentBottom: group ? contentTop + gridHeight : gridHeight,
    verticalCorridors: [...verticalCorridors].sort((a, b) => a - b),
    horizontalCorridors: [...horizontalCorridors].sort((a, b) => a - b),
  });

  if (group) {
    group.width = width;
    group.height = height;
    group.x = width / 2;
    group.y = height / 2;
    if (titleBand > 0) {
      group.groupTitleRect = {
        left: 0,
        right: width,
        top: 0,
        bottom: padding + titleBand,
      };
    } else {
      delete group.groupTitleRect;
    }
  }
}

function translateRect(
  rect: NonNullable<Node['groupTitleRect']>,
  dx: number,
  dy: number
): NonNullable<Node['groupTitleRect']> {
  return {
    left: rect.left + dx,
    right: rect.right + dx,
    top: rect.top + dy,
    bottom: rect.bottom + dy,
  };
}

function materializeAbsoluteGeometry(result: GridLayoutResult): void {
  const { forest, containers, itemMeta } = result;

  interface ShiftFrame {
    containerId: GridContainerId;
    offsetX: number;
    offsetY: number;
    children: Node[];
    nextChildIndex: number;
    entered: boolean;
  }

  const stack: ShiftFrame[] = [
    {
      containerId: ROOT_CONTAINER_ID,
      offsetX: 0,
      offsetY: 0,
      children: forest.childrenByParent.get(ROOT_CONTAINER_ID) ?? [],
      nextChildIndex: 0,
      entered: false,
    },
  ];

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];

    if (!frame.entered) {
      frame.entered = true;
      const container = containers.get(frame.containerId);
      if (container) {
        container.left += frame.offsetX;
        container.top += frame.offsetY;
        container.contentLeft += frame.offsetX;
        container.contentRight += frame.offsetX;
        container.contentTop += frame.offsetY;
        container.contentBottom += frame.offsetY;
        container.verticalCorridors = container.verticalCorridors.map(
          (value) => value + frame.offsetX
        );
        container.horizontalCorridors = container.horizontalCorridors.map(
          (value) => value + frame.offsetY
        );
      }
    }

    const child = frame.children[frame.nextChildIndex];
    if (!child) {
      stack.pop();
      continue;
    }
    frame.nextChildIndex += 1;

    if (isEdgeLabelNode(child)) {
      continue;
    }

    const meta = itemMeta.get(child.id);
    if (meta) {
      meta.cellLeft += frame.offsetX;
      meta.cellTop += frame.offsetY;
      meta.leftCorridorX += frame.offsetX;
      meta.rightCorridorX += frame.offsetX;
      meta.topCorridorY += frame.offsetY;
      meta.bottomCorridorY += frame.offsetY;
    }

    child.x = (child.x ?? 0) + frame.offsetX;
    child.y = (child.y ?? 0) + frame.offsetY;

    if (!child.isGroup) {
      continue;
    }

    if (child.groupTitleRect) {
      child.groupTitleRect = translateRect(child.groupTitleRect, frame.offsetX, frame.offsetY);
    }

    stack.push({
      containerId: child.id,
      offsetX: child.x - (child.width ?? 0) / 2,
      offsetY: child.y - (child.height ?? 0) / 2,
      children: forest.childrenByParent.get(child.id) ?? [],
      nextChildIndex: 0,
      entered: false,
    });
  }
}

function validatePlacementsBeforeLayout(
  forest: GridForest,
  config: GridLayoutConfigNormalized,
  sourceOrder: Map<string, number>
): void {
  for (const children of forest.childrenByParent.values()) {
    const directItems = sortBySourceOrder(
      children.filter((node) => !isEdgeLabelNode(node)),
      sourceOrder
    );
    resolveGridPlacements(directItems, sourceOrder, config);
  }
}

function commitGridGeometry(source: LayoutData, target: LayoutData): void {
  const sourceNodeById = new Map(source.nodes.map((node) => [node.id, node]));
  for (const targetNode of target.nodes) {
    const sourceNode = sourceNodeById.get(targetNode.id);
    if (!sourceNode) {
      continue;
    }
    targetNode.x = sourceNode.x;
    targetNode.y = sourceNode.y;
    targetNode.width = sourceNode.width;
    targetNode.height = sourceNode.height;
    if (sourceNode.groupTitleRect) {
      targetNode.groupTitleRect = { ...sourceNode.groupTitleRect };
    } else {
      delete targetNode.groupTitleRect;
    }
  }

  const sourceEdgeById = new Map(source.edges.map((edge) => [edge.id, edge]));
  for (const targetEdge of target.edges) {
    const sourceEdge = sourceEdgeById.get(targetEdge.id);
    if (!sourceEdge) {
      continue;
    }
    targetEdge.points = sourceEdge.points?.map((point) => ({ ...point }));
    targetEdge.curve = sourceEdge.curve;
    targetEdge.cornerRadius = sourceEdge.cornerRadius;
  }
}

function cloneGridLayoutData(data: GridLayoutData): GridLayoutData {
  return {
    ...data,
    nodes: data.nodes.map((node) => ({
      ...node,
      labelBBox: node.labelBBox ? { ...node.labelBBox } : node.labelBBox,
      groupTitleRect: node.groupTitleRect ? { ...node.groupTitleRect } : node.groupTitleRect,
    })),
    edges: data.edges.map((edge) => ({
      ...edge,
      points: edge.points?.map((point) => ({ ...point })),
    })),
  };
}

function runGridLayoutCoreInPlace(
  data: GridLayoutData,
  metrics?: GridRoutingInstrumentation,
  routingOptions?: GridRoutingOptions
): GridLayoutResult {
  const forest = buildGridForest(data.nodes);
  const config = readGridConfig(data);
  const sourceOrder = buildGridSourceOrder(data.nodes.filter((node) => !isEdgeLabelNode(node)));
  validateGridPlacementMap(
    data.nodes.filter((node) => !isEdgeLabelNode(node)),
    config
  );
  validatePlacementsBeforeLayout(forest, config, sourceOrder);

  const result: GridLayoutResult = {
    forest,
    config,
    containers: new Map(),
    itemMeta: new Map(),
    sourceOrder,
  };

  for (const group of forest.postOrderGroups) {
    layoutContainer(group.id, result, result.containers, result.itemMeta);
  }
  layoutContainer(ROOT_CONTAINER_ID, result, result.containers, result.itemMeta);
  materializeAbsoluteGeometry(result);
  routeGridEdges(data, result, metrics, routingOptions);
  positionGridEdgeLabels(data, undefined, metrics);
  return result;
}

export function runGridLayoutCore(data4Layout: LayoutData): GridLayoutResult;
export function runGridLayoutCore(
  data4Layout: LayoutData,
  metrics: GridRoutingInstrumentation,
  routingOptions?: GridRoutingOptions
): GridLayoutResult;
export function runGridLayoutCore(
  data4Layout: LayoutData,
  metrics?: GridRoutingInstrumentation,
  routingOptions?: GridRoutingOptions
): GridLayoutResult {
  const data = data4Layout as GridLayoutData;
  const forest = buildGridForest(data.nodes);
  const config = readGridConfig(data);
  const sourceOrder = buildGridSourceOrder(data.nodes.filter((node) => !isEdgeLabelNode(node)));
  validateGridPlacementMap(
    data.nodes.filter((node) => !isEdgeLabelNode(node)),
    config
  );
  validatePlacementsBeforeLayout(forest, config, sourceOrder);

  const working = cloneGridLayoutData(data);
  const result = runGridLayoutCoreInPlace(working, metrics, routingOptions);
  commitGridGeometry(working, data);
  return result;
}
