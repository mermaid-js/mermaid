import type {
  LayoutData,
  Node as MermaidNode,
  Edge as MermaidEdge,
  ClusterNode,
} from '../../types.js';

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

export function prepareLayoutForSwimlanes(layout: LayoutData): void {
  const direction = (layout as any).direction;
  const nodes = (layout.nodes ??= []);
  for (const node of layout.nodes ?? []) {
    if (node.isGroup && !node.parentId) {
      node.shape = 'swimlane';
      if (direction) {
        (node as any).direction = direction;
      }
    }
  }

  const looseNodes = nodes.filter((node) => !node.isGroup && !node.parentId);
  if (looseNodes.length === 0) {
    return;
  }

  let defaultLane = nodes.find((node) => node.id === DEFAULT_SWIMLANE_ID);
  if (!defaultLane) {
    defaultLane = {
      id: DEFAULT_SWIMLANE_ID,
      label: '',
      isGroup: true,
      shape: 'swimlane',
      padding: 20,
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

export function toGraphView(layout: LayoutData): Graph {
  const nodeById = new Map<NodeId, Node>();
  for (const n of layout.nodes ?? []) {
    nodeById.set(n.id, n);
  }

  const edges: EdgeRef[] = [];
  for (const e of layout.edges ?? []) {
    const src = typeof e.start === 'string' ? e.start : undefined;
    const dst = typeof e.end === 'string' ? e.end : undefined;
    if (!src || !dst) {
      continue;
    }
    // Exclude labelled originals from Sugiyama: their routing is carried by
    // the two layout-only virtual edges A→label and label→B, which create the
    // correct layer/ordering constraints. Including the original as well would
    // double-count rank pressure and inflate crossing penalties.
    if ((e as MermaidEdge & { labelNodeId?: string }).labelNodeId) {
      continue;
    }
    edges.push({ id: e.id, src, dst, ref: e });
  }

  const allNodes = layout.nodes ?? [];
  const groupNodes = allNodes.filter((n) => n.isGroup);
  const nonGroupNodes = allNodes.filter((n) => !n.isGroup);

  const nodesInGroupOrder = [...groupNodes].reverse();
  const nodes: NodeId[] = [...nodesInGroupOrder, ...nonGroupNodes].map((n) => n.id);
  return { nodes, edges, layout, nodeById };
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
  const groupBounds = new Map<NodeId, { minX: number; maxX: number; minY: number; maxY: number }>();
  const topLevelGroups: Node[] = [];
  for (const group of allNodes) {
    if (!group?.isGroup) {
      continue;
    }
    if (!group.parentId) {
      topLevelGroups.push(group);
    }
    const children = allNodes.filter((n) => n.parentId === group.id);
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
        minX = Math.min(minX, cx - cw / 2);
        maxX = Math.max(maxX, cx + cw / 2);
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
      const horizontalPad = group.parentId ? pad : 0;
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
        const contentWidth = Math.max(0, b.maxX - b.minX);
        const cx = lane.x ?? (b.minX + b.maxX) / 2;
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
        }
      }
    }
  }
}
