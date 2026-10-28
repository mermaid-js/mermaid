import { log } from '../../../logger.js';
import type {
  LayoutData,
  Node as MermaidNode,
  Edge as MermaidEdge,
  ClusterNode,
} from '../../types.js';
import { buildLaneModel, type LaneModel } from './lanes.js';
import { collectAnchoredIds, resolveAnchorHostId } from './anchoredNodes.js';

export type Layout = LayoutData;
export type Node = MermaidNode;
export type NodeId = Node['id'];
export type EdgeId = MermaidEdge['id'];

export interface EdgeRef {
  id: EdgeId;
  src: NodeId;
  dst: NodeId;
  weight?: number;
  ref: MermaidEdge;
}

export interface Graph {
  nodes: NodeId[];
  edges: EdgeRef[];
  layout: Layout;
  nodeById: Map<NodeId, Node>;
}

export interface Layering {
  layers: NodeId[][];
  rankOf: Record<NodeId, number>;
  dummy?: Set<NodeId>;
}

export interface OrderedLayers {
  layers: NodeId[][];
}

export interface Coordinates {
  x: Record<NodeId, number>;
  y: Record<NodeId, number>;
}

export type Edge = EdgeRef;

export const DEFAULT_SWIMLANE_ID = '__swimlane_default__';

export interface WriteBackOptions {
  layerGap?: number;
  nodeGap?: number;
}

// Captured swimlane fixtures use 21px as the stable single-line label height.
const TOP_LANE_TITLE_BAND_HEIGHT = 21;
const MIN_TOP_LANE_HORIZONTAL_PADDING = 20;

function topLaneHorizontalPadding(lane: Node): number {
  return Math.max(lane.padding ?? MIN_TOP_LANE_HORIZONTAL_PADDING, MIN_TOP_LANE_HORIZONTAL_PADDING);
}

function assignTopLaneTitleRect(lane: Node): void {
  const { x, y, width, height } = lane;
  const contentTop = (lane as { swimlaneContentTop?: unknown }).swimlaneContentTop;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    typeof contentTop !== 'number' ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(contentTop) ||
    width <= 0 ||
    height <= 0
  ) {
    delete lane.groupTitleRect;
    return;
  }

  const top = y - height / 2;
  const headerBottom = Math.min(contentTop, y + height / 2);
  const titleHeight = Math.min(TOP_LANE_TITLE_BAND_HEIGHT, Math.max(0, headerBottom - top));
  const bottom = top + titleHeight;
  if (bottom <= top) {
    delete lane.groupTitleRect;
    return;
  }

  lane.groupTitleRect = {
    left: x - width / 2,
    right: x + width / 2,
    top,
    bottom,
  };
}

// Mirrors DroppedSubGraphMember in the flowchart types, which a rendering-util module must not import.
interface SharedMember {
  node: string;
  keptBy: string;
  droppedFrom: string;
}

function sharedMembers(layout: LayoutData): SharedMember[] {
  const members: unknown = layout.other?.droppedSubGraphMembers;
  return Array.isArray(members) ? members : [];
}

const isEmptyLane = (layout: LayoutData, nodes: Node[], laneId: string): boolean =>
  !nodes.some((node) => node.parentId === laneId) &&
  !(layout.edges ?? []).some((edge) => edge.start === laneId || edge.end === laneId);

/** The lane a node sits in, or the node itself when it is a lane; undefined outside every lane. */
function laneIdOrSelf(model: LaneModel, id: string): string | undefined {
  return model.isLane(id) ? id : (model.laneIdOf(id) ?? undefined);
}

function removeEmptyLanes(layout: LayoutData, nodes: Node[], laneIds: Set<string>): void {
  for (const laneId of laneIds) {
    const index = nodes.findIndex((node) => node.id === laneId);
    if (index >= 0 && isEmptyLane(layout, nodes, laneId)) {
      nodes.splice(index, 1);
    }
  }
}

/**
 * A node listed in two lanes stays in the first, so the second can end up with nothing.
 * Warns for each such node and removes the lanes it emptied. A lane the author left empty
 * lost no member and stays, and so does one an edge points at. The lane that kept the node
 * can be the one around a subgraph nested in it, so `keptBy` is resolved up to its lane.
 */
function dropLanesEmptiedBySharedNodes(layout: LayoutData, nodes: Node[]): void {
  const model = buildLaneModel(nodes);
  const laneIds = new Set(nodes.filter((node) => model.isLane(node.id)).map((lane) => lane.id));
  const emptied = new Set<string>();
  for (const { node, keptBy, droppedFrom } of sharedMembers(layout)) {
    const keptByLane = laneIdOrSelf(model, keptBy);
    if (keptByLane && keptByLane !== droppedFrom && laneIds.has(droppedFrom)) {
      log.warn(
        `Swimlane node "${node}" is listed in lanes "${keptByLane}" and "${droppedFrom}"; it is drawn in "${keptByLane}" only.`
      );
      emptied.add(droppedFrom);
    }
  }
  removeEmptyLanes(layout, nodes, emptied);
}

function warnAboutNestedGroups(nodes: Node[], model: LaneModel): void {
  for (const node of nodes) {
    if (node.isGroup && !model.isLane(node.id) && !model.isPool(node.id)) {
      log.warn(
        `Swimlane subgraph "${node.id}" is nested in "${node.parentId}"; only top-level subgraphs are lanes, so it is drawn as a plain box.`
      );
    }
  }
}

export function prepareLayoutForSwimlanes(layout: LayoutData): void {
  const direction = (layout as any).direction;
  const nodes = (layout.nodes ??= []);
  dropLanesEmptiedBySharedNodes(layout, nodes);
  const laneModel = buildLaneModel(nodes);
  warnAboutNestedGroups(nodes, laneModel);
  for (const node of nodes) {
    const isLane = laneModel.isLane(node.id);
    if (!isLane && !laneModel.isPool(node.id)) {
      continue;
    }
    node.shape = isLane ? 'swimlane' : 'pool';
    if (direction) {
      (node as any).direction = direction;
    }
  }

  const looseNodes = nodes.filter((node) => !node.isGroup && !node.parentId);
  if (looseNodes.length === 0) {
    return;
  }

  let defaultLane = nodes.find((node) => node.id === DEFAULT_SWIMLANE_ID);
  if (!defaultLane) {
    /* Synthesised, so nothing upstream gave it a `look` or a slot. Without `look` it
     * renders classic in a handDrawn diagram; slot 0 would clash with the first lane. */
    defaultLane = {
      id: DEFAULT_SWIMLANE_ID,
      label: '',
      isGroup: true,
      shape: 'swimlane',
      padding: 20,
      look: layout.config?.look,
      colorIndex: nodes.reduce((max, node) => Math.max(max, node.colorIndex ?? -1), -1) + 1,
      ...(direction ? { direction } : {}),
    } as ClusterNode;
    nodes.push(defaultLane);
  } else if (defaultLane.isGroup) {
    defaultLane.shape = 'swimlane';
    if (direction) {
      (defaultLane as any).direction = direction;
    }
  }

  for (const node of looseNodes) {
    node.parentId = DEFAULT_SWIMLANE_ID;
  }
}

/**
 * The graph the Sugiyama phases lay out. Edge-label nodes and their layout-only
 * edges are left out, and a labelled edge takes part as itself, so a label never
 * changes a node's rank. `assignCoordinates` places the labels.
 */
export function toGraphView(layout: LayoutData): Graph {
  const allNodes = (layout.nodes ?? []).filter((n) => !n.isEdgeLabel);
  const byId = new Map<NodeId, Node>(allNodes.map((n) => [n.id, n]));

  const anchoredIds = collectAnchoredIds(allNodes);
  const hostOf = (id: NodeId): NodeId =>
    anchoredIds.has(id) ? (resolveAnchorHostId(id, byId) ?? id) : id;

  const nodeById = new Map<NodeId, Node>();
  for (const n of allNodes) {
    if (!anchoredIds.has(n.id)) {
      nodeById.set(n.id, n);
    }
  }

  const edges: EdgeRef[] = [];
  for (const e of layout.edges ?? []) {
    const rawSrc = typeof e.start === 'string' ? e.start : undefined;
    const rawDst = typeof e.end === 'string' ? e.end : undefined;
    if (!rawSrc || !rawDst || e.isLayoutOnly) {
      continue;
    }
    const src = hostOf(rawSrc);
    const dst = hostOf(rawDst);
    if (src === dst) {
      continue;
    }
    edges.push({ id: e.id, src, dst, ref: e });
  }

  const groupNodes = allNodes.filter((n) => n.isGroup && !anchoredIds.has(n.id));
  const nonGroupNodes = allNodes.filter((n) => !n.isGroup && !anchoredIds.has(n.id));

  const nodesInGroupOrder = [...groupNodes].reverse();
  const nodes: NodeId[] = [...nodesInGroupOrder, ...nonGroupNodes].map((n) => n.id);
  return { nodes, edges, layout, nodeById };
}

function groupsDeepestFirst(allNodes: Node[]): Node[] {
  const byId = new Map(allNodes.map((n) => [n.id, n]));
  const depthOf = (node: Node) => {
    let depth = 0;
    let parentId = node.parentId;
    const seen = new Set<NodeId>([node.id]);
    while (parentId != null && !seen.has(parentId)) {
      seen.add(parentId);
      depth++;
      parentId = byId.get(parentId)?.parentId;
    }
    return depth;
  };
  return allNodes
    .filter((n) => n?.isGroup)
    .map((n) => ({ node: n, depth: depthOf(n) }))
    .sort((a, b) => b.depth - a.depth)
    .map((entry) => entry.node);
}

export function writeBackToLayoutData(
  g: Graph,
  ordered: OrderedLayers,
  coords: Coordinates,
  opts?: WriteBackOptions
): void {
  const { layout } = g;
  const nodeMap = g.nodeById;
  const layerGap = opts?.layerGap ?? 100;
  const nodeGap = opts?.nodeGap ?? 40;

  let layerIndex = 0;
  for (const layer of ordered.layers) {
    let orderIndex = 0;
    for (const id of layer) {
      const node = nodeMap.get(id);
      if (!node) {
        orderIndex++;
        continue;
      }
      node.layer = layerIndex;
      node.order = orderIndex;
      const x = coords.x[id] ?? orderIndex * nodeGap;
      const y = coords.y[id] ?? layerIndex * layerGap;
      node.x = x;
      node.y = y;
      orderIndex++;
    }
    layerIndex++;
  }

  const allNodes = layout.nodes ?? [];
  const anchoredIds = collectAnchoredIds(allNodes);
  // Edge labels have no rank; their seed position comes from the coordinates.
  // Anchoring moves them onto the routed edge later.
  for (const label of allNodes) {
    if (label.isEdgeLabel && coords.x[label.id] != null && coords.y[label.id] != null) {
      label.x = coords.x[label.id];
      label.y = coords.y[label.id];
    }
  }
  const groupBounds = new Map<NodeId, { minX: number; maxX: number; minY: number; maxY: number }>();
  const laneModel = buildLaneModel(allNodes);
  const topLevelGroups: Node[] = [];
  for (const group of groupsDeepestFirst(allNodes)) {
    if (laneModel.isLane(group.id)) {
      topLevelGroups.push(group);
    }
    // A lane is sized across the flow by its nodes: the room reserved for edge labels
    // reaches it through the column spacing, and anchoring moves each label onto its
    // edge later. Along the flow it also holds the labels, which can be taller than
    // the row of nodes they sit beside.
    const children = allNodes.filter((n) => n.parentId === group.id && !anchoredIds.has(n.id));
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const child of children) {
      const cx = child.x ?? coords.x[child.id];
      const cy = child.y ?? coords.y[child.id];
      const cw = child.width ?? 0;
      const ch = child.height ?? 0;
      if (cx != null && cy != null) {
        if (!child.isEdgeLabel) {
          minX = Math.min(minX, cx - cw / 2);
          maxX = Math.max(maxX, cx + cw / 2);
        }
        minY = Math.min(minY, cy - ch / 2);
        maxY = Math.max(maxY, cy + ch / 2);
      }
    }
    if (minX === Infinity || minY === Infinity) {
      group.x = group.x ?? 0;
      group.y = group.y ?? 0;
      group.width = group.width ?? 0;
      group.height = group.height ?? 0;
    } else {
      const pad = group.padding ?? 20;
      const horizontalPad = group.parentId ? pad : 2 * topLaneHorizontalPadding(group);
      const verticalPad = pad;
      const w = Math.max(0, maxX - minX) + horizontalPad;
      const h = Math.max(0, maxY - minY) + verticalPad;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      group.x = cx;
      group.y = cy;
      group.width = w;
      group.height = h;
      groupBounds.set(group.id, { minX, maxX, minY, maxY });
    }
  }

  if (topLevelGroups.length > 0 && groupBounds.size > 0) {
    let globalMinY = Infinity;
    let globalMaxY = -Infinity;
    let maxPad = 0;
    for (const lane of topLevelGroups) {
      const pad = lane.padding ?? 20;
      if (pad > maxPad) {
        maxPad = pad;
      }
      const b = groupBounds.get(lane.id);
      if (!b) {
        continue;
      }
      globalMinY = Math.min(globalMinY, b.minY);
      globalMaxY = Math.max(globalMaxY, b.maxY);
    }
    if (globalMinY !== Infinity && globalMaxY !== -Infinity) {
      const contentHeight = Math.max(0, globalMaxY - globalMinY);
      const minHeaderMargin = 36;
      const verticalMargin = Math.max(maxPad, minHeaderMargin);
      const laneHeight = contentHeight + 2 * verticalMargin;
      const centerY = (globalMinY + globalMaxY) / 2;
      for (const lane of topLevelGroups) {
        lane.y = centerY;
        lane.height = laneHeight;
        (lane as any).swimlaneContentTop = globalMinY;
      }

      const sortedLanes = [...topLevelGroups].sort((a, b) => {
        const ax = a.x ?? 0;
        const bx = b.x ?? 0;
        return ax - bx;
      });

      const laneIds: NodeId[] = [];
      const centers: number[] = [];
      const baseWidths: number[] = [];

      for (const lane of sortedLanes) {
        const b = groupBounds.get(lane.id);
        if (!b) {
          continue;
        }
        const contentWidth = Math.max(0, b.maxX - b.minX) + 2 * topLaneHorizontalPadding(lane);
        const cx = (b.minX + b.maxX) / 2;
        laneIds.push(lane.id);
        centers.push(cx);
        baseWidths.push(contentWidth);
      }

      const count = laneIds.length;
      if (count > 0) {
        const laneWidths = new Map<NodeId, number>();

        if (count === 1) {
          laneWidths.set(laneIds[0], baseWidths[0]);
        } else {
          const d: number[] = [];
          for (let i = 0; i < count - 1; i++) {
            d.push(centers[i + 1] - centers[i]);
          }

          const u: number[] = new Array(count);
          u[0] = 0;
          for (let i = 0; i < count - 1; i++) {
            u[i + 1] = 2 * d[i] - u[i];
          }

          let lowerBound = 0;
          let upperBound = Number.POSITIVE_INFINITY;
          for (let i = 0; i < count; i++) {
            const baseW = baseWidths[i];
            if (i % 2 === 0) {
              lowerBound = Math.max(lowerBound, baseW - u[i]);
            } else {
              upperBound = Math.min(upperBound, u[i] - baseW);
            }
          }

          let x = lowerBound;
          if (lowerBound <= upperBound) {
            x = (lowerBound + upperBound) / 2;
          } else {
            x = lowerBound;
          }

          for (let i = 0; i < count; i++) {
            const w = u[i] + (i % 2 === 0 ? x : -x);
            const finalWidth = Math.max(baseWidths[i], w);
            laneWidths.set(laneIds[i], finalWidth);
          }
        }

        for (const lane of topLevelGroups) {
          const w = laneWidths.get(lane.id);
          if (w != null) {
            lane.width = w;
          }
          assignTopLaneTitleRect(lane);
        }
      }
    }
  }
}
