import { log } from '../../../logger.js';
import type { GridPlacement } from '../../../types.js';
import {
  isGridHorizontalAlign,
  isGridVerticalAlign,
  validateGridCoordinate,
} from '../../../utils/gridPlacement.js';
import { resolveEdgeCornerRadius } from '../../edgeCornerRadius.js';
import type { Node } from '../../types.js';
import { compareCodeUnits } from '../layout-utils/helpers.js';
import {
  GRID_DEFAULTS,
  type GridCurve,
  type GridLayoutConfigNormalized,
  type GridResolvedPlacement,
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
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
  const placements = new Map<string, GridPlacement[]>();
  for (const key of Object.keys(placementsRaw)) {
    const value = placementsRaw[key];
    const occurrencePlacements = Array.isArray(value) ? value : [value];
    placements.set(
      key,
      occurrencePlacements.map((placement) => ownPlacementFrom(placement))
    );
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
      typeof raw.curve === 'string' && GRID_CURVES.has(raw.curve as GridCurve)
        ? (raw.curve as GridCurve)
        : GRID_DEFAULTS.curve,
    edgeCornerRadius: resolveEdgeCornerRadius(raw.edgeCornerRadius),
  };
}

export function validateGridPlacementMap(
  items: Iterable<Node>,
  config: GridLayoutConfigNormalized
): void {
  // Diagram adapters may retain a generated rendering ID while exposing the authored ID expected
  // by public placement maps. Fall back to `id` for diagrams whose IDs are already author-stable.
  const knownIdCounts = new Map<string, number>();
  for (const item of items) {
    const placementId = item.placementId ?? item.id;
    knownIdCounts.set(placementId, (knownIdCounts.get(placementId) ?? 0) + 1);
  }
  for (const [key, placements] of config.placements) {
    const matchingItems = knownIdCounts.get(key) ?? 0;
    if (matchingItems === 0) {
      log.warn(GRID_LOG_PREFIX, `Ignoring grid placement for unknown target "${key}"`);
      continue;
    }
    if (placements.length > matchingItems) {
      log.warn(
        GRID_LOG_PREFIX,
        `Ignoring ${placements.length - matchingItems} extra grid placement occurrence(s) for target "${key}"; found ${matchingItems} matching node(s)`
      );
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
  config: GridLayoutConfigNormalized,
  occurrenceIndex: number
): GridResolvedPlacement {
  // Resolve configuration through the authored identity while retaining the generated rendering
  // identity for deterministic ordering and diagnostic context.
  const authoredPlacementId = item.placementId ?? item.id;
  const configPlacement = config.placements.get(authoredPlacementId)?.[occurrenceIndex] ?? {};
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
  validateGridCoordinate(authoredPlacementId, 'row', row, item.id);
  validateGridCoordinate(authoredPlacementId, 'column', column, item.id);

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

function nextFreeColumn(row: number, occupied: Set<string>, startColumn: number): number {
  let column = startColumn;
  while (occupied.has(`${row}:${column}`)) {
    column++;
  }
  return column;
}

function nextFreeRow(column: number, occupied: Set<string>, startRow: number): number {
  let row = startRow;
  while (occupied.has(`${row}:${column}`)) {
    row++;
  }
  return row;
}

function nextAutoCell(
  occupied: Set<string>,
  candidateColumns: number,
  startIndex: number
): {
  row: number;
  column: number;
  nextIndex: number;
} {
  let index = startIndex;
  // The occupied set is finite while the row-major coordinate space is unbounded, so a free cell
  // must eventually be found.
  for (;;) {
    const row = Math.floor(index / candidateColumns) + 1;
    const column = (index % candidateColumns) + 1;
    index++;
    if (!occupied.has(`${row}:${column}`)) {
      return { row, column, nextIndex: index };
    }
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
  const occurrenceByPlacementId = new Map<string, number>();
  const resolved = sortedItems.map((item) => {
    const placementId = item.placementId ?? item.id;
    const occurrenceIndex = occurrenceByPlacementId.get(placementId) ?? 0;
    occurrenceByPlacementId.set(placementId, occurrenceIndex + 1);
    return resolveItemPlacement(item, sourceOrder, config, occurrenceIndex);
  });

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
  let nextAutoIndex = 0;
  const nextColumnByRow = new Map<number, number>();
  const nextRowByColumn = new Map<number, number>();

  // Partially specified placements scan only their missing axis. Fully automatic placements use a
  // compact row-major grid whose default width keeps roughly square diagrams. Each cursor only
  // moves forward because occupied cells are never released.
  for (const placement of resolved) {
    if (placement.explicitCell) {
      continue;
    }

    if (placement.explicitRow) {
      const column = nextFreeColumn(
        placement.row,
        occupied,
        nextColumnByRow.get(placement.row) ?? 1
      );
      placement.column = column;
      nextColumnByRow.set(placement.row, column + 1);
    } else if (placement.explicitColumn) {
      const row = nextFreeRow(
        placement.column,
        occupied,
        nextRowByColumn.get(placement.column) ?? 1
      );
      placement.row = row;
      nextRowByColumn.set(placement.column, row + 1);
    } else {
      const next = nextAutoCell(occupied, candidateColumns, nextAutoIndex);
      placement.row = next.row;
      placement.column = next.column;
      nextAutoIndex = next.nextIndex;
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
