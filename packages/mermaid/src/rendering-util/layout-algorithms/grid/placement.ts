import { log } from '../../../logger.js';
import { resolveEdgeCornerRadius } from '../../edgeCornerRadius.js';
import type { Node } from '../../types.js';
import { compareCodeUnits } from '../layout-utils/helpers.js';
import {
  GRID_DEFAULTS,
  type GridCurve,
  type GridHorizontalAlign,
  type GridLayoutConfigNormalized,
  type GridPlacement,
  type GridResolvedPlacement,
  type GridVerticalAlign,
  type GridLayoutData,
  gridError,
  type GridCellStack,
} from './types.js';

/*
 * Normalizes placement input and deterministically assigns each direct child of a container to a
 * grid cell. Placement metadata on a node takes precedence over the container-level placement map.
 */
const GRID_LOG_PREFIX = '[grid]';
// Grid accepts the same named curves as the shared edge renderer; rejecting unknown values here
// keeps layout metadata serializable and leaves renderer fallback behavior unambiguous.
const GRID_CURVES = new Set<GridCurve>([
  'basis',
  'bumpX',
  'bumpY',
  'cardinal',
  'catmullRom',
  'linear',
  'monotoneX',
  'monotoneY',
  'natural',
  'step',
  'stepAfter',
  'stepBefore',
  'rounded',
]);

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isGridHorizontalAlign(value: unknown): value is GridHorizontalAlign {
  return value === 'left' || value === 'center' || value === 'right';
}

function isGridVerticalAlign(value: unknown): value is GridVerticalAlign {
  return value === 'top' || value === 'center' || value === 'bottom';
}

function isValidGridCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function placementId(node: Node): string {
  return (node as Node & { placementId?: string }).placementId ?? node.id;
}

function ownPlacementFrom(value: unknown): Partial<GridPlacement> {
  if (!isObjectRecord(value)) {
    return {};
  }
  const placement: Partial<GridPlacement> = {};
  if (Object.hasOwn(value, 'row')) {
    placement.row = value.row as number | undefined;
  }
  if (Object.hasOwn(value, 'column')) {
    placement.column = value.column as number | undefined;
  }
  if (isGridHorizontalAlign(value.horizontalAlign)) {
    placement.horizontalAlign = value.horizontalAlign;
  }
  if (isGridVerticalAlign(value.verticalAlign)) {
    placement.verticalAlign = value.verticalAlign;
  }
  return placement;
}

function validateCoordinate(
  nodeId: string,
  field: 'row' | 'column',
  value: unknown
): asserts value is number | undefined {
  if (value === undefined) {
    return;
  }
  if (!isValidGridCoordinate(value)) {
    throw gridError('GRID_INVALID_COORDINATE', `Invalid ${field} for "${nodeId}"`, {
      nodeId,
      field,
      value,
    });
  }
}

export function buildGridSourceOrder(nodes: Node[]): Map<string, number> {
  const order = new Map<string, number>();
  let index = 0;
  for (const node of nodes) {
    if (!order.has(node.id)) {
      order.set(node.id, index++);
    }
  }
  return order;
}

export function readGridConfig(data: GridLayoutData): GridLayoutConfigNormalized {
  const raw = isObjectRecord(data.config?.grid) ? data.config.grid : {};
  const placementsRaw = isObjectRecord(raw.placements) ? raw.placements : {};
  const placements = new Map<string, GridPlacement>();
  for (const key of Object.keys(placementsRaw)) {
    placements.set(key, ownPlacementFrom(placementsRaw[key]));
  }

  return {
    placements,
    columns:
      typeof raw.columns === 'number' && Number.isFinite(raw.columns) && raw.columns >= 0
        ? Math.trunc(raw.columns)
        : GRID_DEFAULTS.columns,
    rowGap:
      typeof raw.rowGap === 'number' && Number.isFinite(raw.rowGap) && raw.rowGap >= 0
        ? raw.rowGap
        : GRID_DEFAULTS.rowGap,
    columnGap:
      typeof raw.columnGap === 'number' && Number.isFinite(raw.columnGap) && raw.columnGap >= 0
        ? raw.columnGap
        : GRID_DEFAULTS.columnGap,
    cellGap:
      typeof raw.cellGap === 'number' && Number.isFinite(raw.cellGap) && raw.cellGap >= 0
        ? raw.cellGap
        : GRID_DEFAULTS.cellGap,
    containerPadding:
      typeof raw.containerPadding === 'number' &&
      Number.isFinite(raw.containerPadding) &&
      raw.containerPadding >= 0
        ? raw.containerPadding
        : GRID_DEFAULTS.containerPadding,
    titleGap:
      typeof raw.titleGap === 'number' && Number.isFinite(raw.titleGap) && raw.titleGap >= 0
        ? raw.titleGap
        : GRID_DEFAULTS.titleGap,
    horizontalAlign: isGridHorizontalAlign(raw.horizontalAlign)
      ? raw.horizontalAlign
      : GRID_DEFAULTS.horizontalAlign,
    verticalAlign: isGridVerticalAlign(raw.verticalAlign)
      ? raw.verticalAlign
      : GRID_DEFAULTS.verticalAlign,
    // Normalize rendering options with placement so every routed edge receives one stable style.
    curve:
      typeof raw.curve === 'string' && GRID_CURVES.has(raw.curve) ? raw.curve : GRID_DEFAULTS.curve,
    edgeCornerRadius: resolveEdgeCornerRadius(raw.edgeCornerRadius),
  };
}

export function validateGridPlacementMap(
  items: Iterable<Node>,
  config: GridLayoutConfigNormalized
): void {
  const knownIds = new Set<string>();
  for (const item of items) {
    knownIds.add(placementId(item));
  }
  for (const [key] of config.placements) {
    if (!knownIds.has(key)) {
      log.warn(GRID_LOG_PREFIX, `Ignoring grid placement for unknown target "${key}"`);
    }
  }
}

function itemComparator(sourceOrder: Map<string, number>) {
  return (a: Node, b: Node): number => {
    const aOrder = sourceOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = sourceOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    return compareCodeUnits(a.id, b.id);
  };
}

function resolveItemPlacement(
  item: Node,
  sourceOrder: Map<string, number>,
  config: GridLayoutConfigNormalized
): GridResolvedPlacement {
  const configPlacement = config.placements.get(placementId(item)) ?? {};
  const metadataPlacement = ownPlacementFrom(item.metadata);

  // Node metadata is closest to the authored node, so it deliberately wins over the shared map.
  // Log disagreements to make an otherwise valid but surprising layout diagnosable.
  for (const field of ['row', 'column', 'horizontalAlign', 'verticalAlign'] as const) {
    if (
      Object.hasOwn(configPlacement, field) &&
      Object.hasOwn(metadataPlacement, field) &&
      configPlacement[field] !== metadataPlacement[field]
    ) {
      log.debug(GRID_LOG_PREFIX, 'metadata overrides placement map', {
        nodeId: item.id,
        field,
        metadata: metadataPlacement[field],
        config: configPlacement[field],
      });
    }
  }

  const row = Object.hasOwn(metadataPlacement, 'row') ? metadataPlacement.row : configPlacement.row;
  const column = Object.hasOwn(metadataPlacement, 'column')
    ? metadataPlacement.column
    : configPlacement.column;
  validateCoordinate(item.id, 'row', row);
  validateCoordinate(item.id, 'column', column);

  return {
    item,
    row: row ?? 0,
    column: column ?? 0,
    horizontalAlign:
      metadataPlacement.horizontalAlign ??
      configPlacement.horizontalAlign ??
      config.horizontalAlign,
    verticalAlign:
      metadataPlacement.verticalAlign ?? configPlacement.verticalAlign ?? config.verticalAlign,
    sourceOrder: sourceOrder.get(item.id) ?? Number.MAX_SAFE_INTEGER,
    explicitRow: row !== undefined,
    explicitColumn: column !== undefined,
    explicitCell: row !== undefined && column !== undefined,
  };
}

function nextFreeColumn(row: number, occupied: Set<string>): number {
  let column = 1;
  while (occupied.has(`${row}:${column}`)) {
    column++;
  }
  return column;
}

function nextFreeRow(column: number, occupied: Set<string>): number {
  let row = 1;
  while (occupied.has(`${row}:${column}`)) {
    row++;
  }
  return row;
}

function nextAutoCell(
  occupied: Set<string>,
  candidateColumns: number
): {
  row: number;
  column: number;
} {
  let row = 1;
  for (;;) {
    for (let column = 1; column <= candidateColumns; column++) {
      if (!occupied.has(`${row}:${column}`)) {
        return { row, column };
      }
    }
    row++;
  }
}

export function resolveGridPlacements(
  items: Node[],
  sourceOrder: Map<string, number>,
  config: GridLayoutConfigNormalized
): {
  placements: GridResolvedPlacement[];
  cells: Map<string, GridCellStack>;
} {
  const sortedItems = [...items].sort(itemComparator(sourceOrder));
  const resolved = sortedItems.map((item) => resolveItemPlacement(item, sourceOrder, config));

  const cells = new Map<string, GridCellStack>();
  const occupied = new Set<string>();

  // Reserve fully specified cells first. Auto-placement must route around authored coordinates
  // regardless of source order, while multiple explicit occupants intentionally form a stack.
  for (const placement of resolved) {
    if (!placement.explicitCell) {
      continue;
    }
    const key = `${placement.row}:${placement.column}`;
    occupied.add(key);
    const existing = cells.get(key);
    if (existing) {
      if (existing.verticalAlign !== placement.verticalAlign) {
        throw gridError(
          'GRID_CELL_ALIGNMENT_CONFLICT',
          `Conflicting vertical alignment in cell (${placement.row}, ${placement.column})`,
          {
            containerId: placement.item.parentId ?? 'root',
            row: placement.row,
            column: placement.column,
            itemIds: [...existing.items.map((item) => item.item.id), placement.item.id],
            values: [...existing.items.map((item) => item.verticalAlign), placement.verticalAlign],
          }
        );
      }
      existing.items.push(placement);
    } else {
      cells.set(key, {
        row: placement.row,
        column: placement.column,
        items: [placement],
        width: 0,
        height: 0,
        verticalAlign: placement.verticalAlign,
      });
    }
  }

  const candidateColumns =
    config.columns > 0 ? config.columns : Math.max(1, Math.ceil(Math.sqrt(sortedItems.length)));

  // Partially specified placements scan only their missing axis. Fully automatic placements use a
  // compact row-major grid whose default width keeps roughly square diagrams.
  for (const placement of resolved) {
    if (placement.explicitCell) {
      continue;
    }

    if (placement.explicitRow) {
      placement.column = nextFreeColumn(placement.row, occupied);
    } else if (placement.explicitColumn) {
      placement.row = nextFreeRow(placement.column, occupied);
    } else {
      const next = nextAutoCell(occupied, candidateColumns);
      placement.row = next.row;
      placement.column = next.column;
    }

    const key = `${placement.row}:${placement.column}`;
    occupied.add(key);
    cells.set(key, {
      row: placement.row,
      column: placement.column,
      items: [placement],
      width: 0,
      height: 0,
      verticalAlign: placement.verticalAlign,
    });
  }

  return { placements: resolved, cells };
}
