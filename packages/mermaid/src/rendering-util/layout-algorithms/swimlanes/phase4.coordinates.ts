import type { Graph, OrderedLayers, Coordinates, NodeId, EdgeRef } from './helpers.js';
import { COORDINATES } from './config.js';
import { createTopLaneResolver, resolveTopLaneOrder } from './phase2.options.js';

export interface CoordOptions {
  layerGap?: number; // vertical distance between layers
  nodeGap?: number; // horizontal gap between siblings inside a lane
  laneGap?: number; // horizontal gap between lanes (clusters)
  direction?: 'TB' | 'LR' | 'BT' | 'RL'; // layout direction for proper spacing
  laneOrder?: string[];
}

export function assignCoordinates(
  ordered: OrderedLayers,
  gWithDummies: Graph,
  opts?: CoordOptions
): Coordinates {
  const layerGap = opts?.layerGap ?? COORDINATES.DEFAULT_LAYER_GAP;
  const nodeGap = opts?.nodeGap ?? COORDINATES.DEFAULT_NODE_GAP;
  const laneGap = opts?.laneGap ?? nodeGap * 2;
  const direction = opts?.direction ?? 'TB';
  const isHorizontal = direction === 'LR' || direction === 'RL';

  const layers = ordered.layers;

  const x: Record<NodeId, number> = Object.create(null);
  const y: Record<NodeId, number> = Object.create(null);

  const getNode = (id: NodeId) => gWithDummies.nodeById.get(id) as any;
  const getWidth = (id: NodeId) => getNode(id)?.width ?? 0;
  const getHeight = (id: NodeId) => getNode(id)?.height ?? 0;
  const topLaneOf = createTopLaneResolver(gWithDummies);
  const laneOrderGlobal = resolveTopLaneOrder(gWithDummies, opts?.laneOrder);

  const layerHeights: number[] = layers.map((layer) =>
    layer.reduce((m, v) => Math.max(m, getHeight(v)), 0)
  );

  // LR/RL transforms turn width into horizontal span, so widen layer gaps up front.
  const extraLayerGaps: number[] = [];
  if (isHorizontal) {
    for (let i = 0; i + 1 < layers.length; i++) {
      const thisLayerMaxWidth = layers[i].reduce((m, v) => Math.max(m, getWidth(v)), 0);
      const nextLayerMaxWidth = layers[i + 1].reduce((m, v) => Math.max(m, getWidth(v)), 0);
      const thisLayerMaxHeight = layerHeights[i];
      const nextLayerMaxHeight = layerHeights[i + 1];

      const normalSpacing = thisLayerMaxHeight / 2 + nextLayerMaxHeight / 2;
      const requiredSpacing = (thisLayerMaxWidth + nextLayerMaxWidth) / 2;
      const extraNeeded = Math.max(0, requiredSpacing - normalSpacing - layerGap);
      extraLayerGaps.push(extraNeeded);
    }
  }

  const lanesUsedSet = new Set<string | null>();
  for (const layer of layers) {
    for (const id of layer) {
      lanesUsedSet.add(topLaneOf(id));
    }
  }
  const hasNullLane = lanesUsedSet.has(null);
  const lanesUsed = laneOrderGlobal.filter((L) => lanesUsedSet.has(L));
  const laneOrderColumns: (string | null)[] = [...(hasNullLane ? [null] : []), ...lanesUsed];

  const laneWidth: Record<string, number> = Object.create(null);
  for (const L of lanesUsed) {
    laneWidth[L] = 0;
  }
  if (hasNullLane) {
    (laneWidth as any).null = 0 as any;
  }
  for (const layer of layers) {
    const perLane: Record<string, string[]> = Object.create(null);
    const nullIds: string[] = [];
    for (const id of layer) {
      const L = topLaneOf(id);
      if (L === null) {
        nullIds.push(id);
      } else {
        (perLane[L] ||= []).push(id);
      }
    }
    for (const [L, ids] of Object.entries(perLane)) {
      const total =
        ids.reduce((s, id) => s + getWidth(id), 0) + nodeGap * Math.max(0, ids.length - 1);
      laneWidth[L] = Math.max(laneWidth[L] ?? 0, total);
    }
    if (hasNullLane && nullIds.length) {
      const totalNull =
        nullIds.reduce((s, id) => s + getWidth(id), 0) + nodeGap * Math.max(0, nullIds.length - 1);
      (laneWidth as any).null = Math.max((laneWidth as any).null ?? 0, totalNull) as any;
    }
  }

  const centerX = new Map<string | null, number>();
  {
    const widths = laneOrderColumns.map(
      (L) => (L === null ? ((laneWidth as any).null as number) : laneWidth[L]) ?? 0
    );
    const totalW =
      widths.reduce((a, b) => a + b, 0) + laneGap * Math.max(0, laneOrderColumns.length - 1);
    let cursor = -totalW / 2;
    for (let i = 0; i < laneOrderColumns.length; i++) {
      const L = laneOrderColumns[i];
      const w = widths[i] ?? 0;
      const cx = cursor + w / 2;
      centerX.set(L, cx);
      cursor += w;
      if (i < laneOrderColumns.length - 1) {
        cursor += laneGap;
      }
    }
  }

  let yOffset = 0;
  for (const [li, layer] of layers.entries()) {
    const layerH = layerHeights[li] ?? 0;

    const byLane = new Map<string | null, NodeId[]>();
    for (const id of layer) {
      const laneId = topLaneOf(id);
      const arr = byLane.get(laneId) ?? [];
      arr.push(id);
      byLane.set(laneId, arr);
    }

    for (const L of laneOrderColumns) {
      const nodesInLane = byLane.get(L) ?? [];
      if (nodesInLane.length === 0) {
        continue;
      }
      const cx = centerX.get(L)!;
      if (nodesInLane.length === 1) {
        const id = nodesInLane[0];
        x[id] = cx;
        y[id] = yOffset + layerH / 2;
      } else {
        // Preserve phase 3 order while spreading nodes around the lane center.
        const widths = nodesInLane.map((id) => getWidth(id));
        const total = widths.reduce((a, b) => a + b, 0) + nodeGap * (nodesInLane.length - 1);
        let start = cx - total / 2;
        for (const [i, id] of nodesInLane.entries()) {
          const w = widths[i];
          x[id] = start + w / 2;
          y[id] = yOffset + layerH / 2;
          start += w + nodeGap;
        }
      }
    }

    const extraGap = extraLayerGaps[li] ?? 0;
    yOffset += layerH + layerGap + extraGap;
  }

  // Align dummy chains for each original edge: set dummy x to midpoint between src and dst.
  const byRef = new Map<string, EdgeRef[]>();
  for (const e of gWithDummies.edges) {
    const rid = e.ref.id;
    if (!byRef.has(rid)) {
      byRef.set(rid, []);
    }
    byRef.get(rid)!.push(e);
  }
  for (const [, chainEdges] of byRef) {
    if (chainEdges.length === 0) {
      continue;
    }
    const ref = chainEdges[0].ref;
    const src = ref.start!;
    const dst = ref.end!;
    if (src == null || dst == null) {
      continue;
    }
    const midX = Math.round(((x[src] ?? 0) + (x[dst] ?? 0)) / 2);
    const involved = new Set<NodeId>();
    for (const e of chainEdges) {
      involved.add(e.src);
      involved.add(e.dst);
    }
    for (const vid of involved) {
      if (vid === src || vid === dst) {
        continue;
      }
      const node = gWithDummies.nodeById.get(vid) as any;
      if (node?.isDummy) {
        x[vid] = midX;
      }
    }
  }

  return { x, y };
}
