import type { MermaidConfig } from '../../../config.type.js';
import type { GridHorizontalAlign, GridPlacement, GridVerticalAlign } from '../../../types.js';
import type { LayoutData, Node } from '../../types.js';
import type { Point } from '../../../types.js';
import type { GridRoutingInstrumentation } from './routerInstrumentation.js';

export const ROOT_CONTAINER_ID = '__grid_root__';
export const GRID_LABEL_PREFIX = 'edge-label-';

export type GridContainerId = string;
export type GridSide = 'left' | 'right' | 'top' | 'bottom';
export type GridOrientation = 'H' | 'V';
export type GridCurve =
  | 'basis'
  | 'bumpX'
  | 'bumpY'
  | 'cardinal'
  | 'catmullRom'
  | 'linear'
  | 'monotoneX'
  | 'monotoneY'
  | 'natural'
  | 'step'
  | 'stepAfter'
  | 'stepBefore'
  | 'rounded';
export type RouterVertexId = number;

export interface RouterPoint {
  x: number;
  y: number;
}

export interface RouterRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface RouterObstacle extends RouterRect {
  id: string;
}

export interface PortalRange {
  ownerId: string;
  side: GridSide;
  low: number;
  high: number;
  coordinate?: number;
}

export interface PairedPortal {
  ownerId: string;
  side: GridSide;
  tangentialCoordinate: number;
  interior: RouterPoint;
  exterior: RouterPoint;
  transition: {
    from: RouterPoint;
    to: RouterPoint;
    orientation: GridOrientation;
    length: number;
    kind: 'portal';
  };
}

export interface RouterVertex {
  id: RouterVertexId;
  point: RouterPoint;
  kind: 'corner' | 'projection' | 'portal' | 'endpoint' | 'lane';
  ownerId?: string;
  side?: GridSide;
}

export interface RouterArc {
  from: RouterVertexId;
  to: RouterVertexId;
  orientation: GridOrientation;
  length: number;
  kind: 'visibility' | 'terminal' | 'portal' | 'lane';
  intervalStart: number;
  intervalEnd: number;
  occupiedLength?: number;
  crossingCount?: number;
}

export interface RouterSearchArc {
  to: RouterVertexId;
  orientationOrdinal: 1 | 2;
  length: number;
  boundaryTransitions: 0 | 1;
  occupiedLength: number;
  crossings: number;
}

export interface OrthogonalIntervalIndex {
  readonly coordinateCount: number;
  readonly intervalCount: number;
  intersects(coordinate: number, intervalStart: number, intervalEnd: number): boolean;
  contains(coordinate: number, varying: number): boolean;
  nearestBoundary(coordinate: number, origin: number, direction: -1 | 1): number | undefined;
}

export interface ContainerRoutingTopology {
  containerId: GridContainerId;
  bounds: RouterRect;
  obstacles: readonly RouterObstacle[];
  vertices: readonly RouterVertex[];
  pointVertexIds: ReadonlyMap<string, RouterVertexId>;
  horizontalVertexLines: ReadonlyMap<number, readonly RouterVertex[]>;
  verticalVertexLines: ReadonlyMap<number, readonly RouterVertex[]>;
  adjacency: ReadonlyMap<RouterVertexId, readonly RouterArc[]>;
  adjacencyByVertex: readonly (readonly RouterArc[])[];
  searchAdjacencyByVertex: readonly (readonly RouterSearchArc[])[];
  adjacencyEntries: number;
  horizontalIntervals: OrthogonalIntervalIndex;
  verticalIntervals: OrthogonalIntervalIndex;
  portalRanges: readonly PortalRange[];
  seedCount: number;
  estimatedBytes: number;
  readonly vertexCount?: number;
  getVertex?(id: RouterVertexId): RouterVertex | undefined;
  getSearchArcs?(id: RouterVertexId): readonly RouterSearchArc[];
}

export interface RouteOccupancyIndex {
  readonly routes: readonly (readonly RouterPoint[])[];
}

export interface GridRoutingContext {
  topologies: Map<GridContainerId, ContainerRoutingTopology>;
  fallbackContainers: Map<GridContainerId, string>;
  occupancy: RouteOccupancyIndex;
  searchBudget: { expandedStates: number };
  baseEstimatedBytes: number;
  metrics?: GridRoutingInstrumentation;
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
  curve: GridCurve;
  edgeCornerRadius: number;
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
  verticalCorridors: number[];
  horizontalCorridors: number[];
}

export interface GridForest {
  nodeById: Map<string, Node>;
  groupById: Map<string, Node & { isGroup: true }>;
  childrenByParent: Map<GridContainerId, Node[]>;
  rootChildren: Node[];
  postOrderGroups: (Node & { isGroup: true })[];
  helperNodeIds: Set<string>;
}

export interface GridAttachmentDemand {
  ownerId: string;
  side: GridSide;
  edgeId: string;
  demandKey: string;
  oppositeCoord: number;
  preferredCoord: number;
  compactPortal: boolean;
}

export interface GridAttachment {
  port: Point;
  connect: Point;
  orientation: GridOrientation;
  side: GridSide;
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
  | 'GRID_MISSING_MEASUREMENT'
  | 'GRID_MISSING_ENDPOINT'
  | 'GRID_ROUTE_NOT_FOUND';

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
  curve: 'rounded' as GridCurve,
  edgeCornerRadius: 5,
};

export type GridLayoutData = LayoutData & {
  config: MermaidConfig & {
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
      curve?: GridCurve;
      edgeCornerRadius?: number;
    };
  };
};

export function isEdgeLabelNode(node: Node): boolean {
  return Boolean((node as { isEdgeLabel?: boolean }).isEdgeLabel);
}

export function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
