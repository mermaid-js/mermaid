import type { LayoutData, Node } from '../../types.js';

// The root participates in the same container algorithms as groups but has no backing Node.
export const ROOT_CONTAINER_ID = '__grid_root__';
// Label helpers belong to edges and must not consume cells in the node-placement forest.
export const GRID_LABEL_PREFIX = 'edge-label-';

export type GridContainerId = string;
export type GridHorizontalAlign = 'left' | 'center' | 'right';
export type GridVerticalAlign = 'top' | 'center' | 'bottom';

export interface GridPlacement {
  row?: number;
  column?: number;
  horizontalAlign?: GridHorizontalAlign;
  verticalAlign?: GridVerticalAlign;
}

export interface GridLayoutConfigNormalized {
  placements: Map<string, GridPlacement>;
  columns: number;
  rowGap: number;
  columnGap: number;
  cellGap: number;
  containerPadding: number;
  titleGap: number;
  horizontalAlign: GridHorizontalAlign;
  verticalAlign: GridVerticalAlign;
}

export interface GridResolvedPlacement {
  item: Node;
  row: number;
  column: number;
  horizontalAlign: GridHorizontalAlign;
  verticalAlign: GridVerticalAlign;
  sourceOrder: number;
  explicitRow: boolean;
  explicitColumn: boolean;
  explicitCell: boolean;
}

// Multiple nodes may intentionally share a cell; they are laid out as one vertical stack.
export interface GridCellStack {
  row: number;
  column: number;
  items: GridResolvedPlacement[];
  width: number;
  height: number;
  verticalAlign: GridVerticalAlign;
}

export interface GridItemLayoutMeta {
  containerId: GridContainerId;
  row: number;
  column: number;
  cellLeft: number;
  cellTop: number;
  cellWidth: number;
  cellHeight: number;
  leftCorridorX: number;
  rightCorridorX: number;
  topCorridorY: number;
  bottomCorridorY: number;
}

export interface GridContainerLayoutMeta {
  id: GridContainerId;
  left: number;
  top: number;
  width: number;
  height: number;
  contentLeft: number;
  contentTop: number;
  contentRight: number;
  contentBottom: number;
  // Corridors describe empty track boundaries for the routing layer added by the next stack PR.
  verticalCorridors: number[];
  horizontalCorridors: number[];
}

export interface GridForest {
  nodeById: Map<string, Node>;
  groupById: Map<string, Node & { isGroup: true }>;
  childrenByParent: Map<GridContainerId, Node[]>;
  rootChildren: Node[];
  // Children-first ordering lets parent groups measure already-sized nested groups.
  postOrderGroups: (Node & { isGroup: true })[];
  helperNodeIds: Set<string>;
}

export interface GridLayoutResult {
  forest: GridForest;
  config: GridLayoutConfigNormalized;
  containers: Map<GridContainerId, GridContainerLayoutMeta>;
  itemMeta: Map<string, GridItemLayoutMeta>;
  sourceOrder: Map<string, number>;
}

export interface GridError extends Error {
  code: GridErrorCode;
  details?: Record<string, unknown>;
}

export type GridErrorCode =
  | 'GRID_INVALID_COORDINATE'
  | 'GRID_CELL_ALIGNMENT_CONFLICT'
  | 'GRID_INVALID_CONTAINMENT'
  | 'GRID_MISSING_MEASUREMENT';

export function gridError(
  code: GridErrorCode,
  message: string,
  details?: Record<string, unknown>
): GridError {
  const error = new Error(`${code}: ${message}`) as GridError;
  error.code = code;
  error.details = details;
  return error;
}

export const GRID_DEFAULTS = {
  columns: 0,
  rowGap: 50,
  columnGap: 50,
  cellGap: 20,
  containerPadding: 20,
  titleGap: 8,
  horizontalAlign: 'center' as GridHorizontalAlign,
  verticalAlign: 'center' as GridVerticalAlign,
};

export type GridLayoutData = LayoutData & {
  config: LayoutData['config'] & {
    grid?: {
      placements?: Record<string, GridPlacement>;
      columns?: number;
      rowGap?: number;
      columnGap?: number;
      cellGap?: number;
      containerPadding?: number;
      titleGap?: number;
      horizontalAlign?: GridHorizontalAlign;
      verticalAlign?: GridVerticalAlign;
    };
  };
};

export function isEdgeLabelNode(node: Node): boolean {
  return Boolean((node as { isEdgeLabel?: boolean }).isEdgeLabel);
}

export function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
