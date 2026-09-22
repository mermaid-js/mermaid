import type { Graph, OrderedLayers, Coordinates, NodeId, EdgeRef } from './helpers.js';
import { COORDINATES } from './config.js';
import { createTopLaneResolver, resolveTopLaneOrder } from './phase2.options.js';
import { anchorFootprints } from './anchoredNodes.js';

export interface CoordOptions {
  layerGap?: number; // vertical distance between layers
  nodeGap?: number; // horizontal gap between siblings inside a lane
  laneGap?: number; // horizontal gap between lanes (clusters)
  direction?: 'TB' | 'LR' | 'BT' | 'RL'; // layout direction for proper spacing

  spreadByOwnExtent?: boolean;

  gapIsRoomBetween?: boolean;
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

  const spreadByOwnExtent = opts?.spreadByOwnExtent ?? false;
  const crossExtent = (id: NodeId) =>
    isHorizontal && spreadByOwnExtent ? getHeight(id) : getWidth(id);

  const inSomeFlow = new Set<NodeId>();
  for (const e of gWithDummies.edges) {
    inSomeFlow.add(e.src);
    inSomeFlow.add(e.dst);
  }

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
      const requiredSpacing =
        (thisLayerMaxWidth + nextLayerMaxWidth) / 2 + (opts?.gapIsRoomBetween ? layerGap : 0);
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

  const footprints = anchorFootprints(gWithDummies.layout?.nodes ?? [], direction);
  const reachOf = (id: NodeId) => footprints.get(id)?.beyond ?? 0;

  const runHalves = (
    ids: NodeId[],
    extentOf: (id: NodeId) => number
  ): { spread: NodeId[]; beside: NodeId[]; left: number; right: number } => {
    const centred = ids.filter((id) => inSomeFlow.has(id));
    const loose = ids.filter((id) => !inSomeFlow.has(id));
    const spread = centred.length > 0 ? centred : loose;
    const beside = centred.length > 0 ? loose : [];

    const extents = spread.map(extentOf);
    const reaches = spread.map(reachOf);
    const total =
      extents.reduce((a, b) => a + b, 0) +
      reaches.slice(0, -1).reduce((a, b) => a + b, 0) +
      nodeGap * Math.max(0, spread.length - 1);
    let tail = reaches.length > 0 ? reaches[reaches.length - 1] : 0;
    for (const id of beside) {
      tail += nodeGap + extentOf(id) + reachOf(id);
    }
    return { spread, beside, left: total / 2, right: total / 2 + tail };
  };

  const laneSizeExtent = (id: NodeId) => Math.max(getWidth(id), crossExtent(id));

  const laneHalves = new Map<string | null, { left: number; right: number }>();
  for (const L of laneOrderColumns) {
    laneHalves.set(L, { left: 0, right: 0 });
  }
  for (const layer of layers) {
    const perLane = new Map<string | null, NodeId[]>();
    for (const id of layer) {
      const L = topLaneOf(id);
      perLane.set(L, [...(perLane.get(L) ?? []), id]);
    }
    for (const [L, ids] of perLane) {
      const half = laneHalves.get(L);
      if (!half) {
        continue;
      }
      const { left, right } = runHalves(ids, (id) =>
        L === null ? getWidth(id) : laneSizeExtent(id)
      );
      half.left = Math.max(half.left, left);
      half.right = Math.max(half.right, right);
    }
  }

  const laneAxis = new Map<string | null, number>();
  {
    const widths = laneOrderColumns.map((L) => {
      const half = laneHalves.get(L);
      return (half?.left ?? 0) + (half?.right ?? 0);
    });
    const totalW =
      widths.reduce((a, b) => a + b, 0) + laneGap * Math.max(0, laneOrderColumns.length - 1);
    let cursor = -totalW / 2;
    for (let i = 0; i < laneOrderColumns.length; i++) {
      const L = laneOrderColumns[i];
      const w = widths[i] ?? 0;
      laneAxis.set(L, cursor + (laneHalves.get(L)?.left ?? w / 2));
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
      const extentOf = (id: NodeId) => (L === null ? getWidth(id) : crossExtent(id));
      const axis = laneAxis.get(L) ?? 0;
      const { spread, beside, left } = runHalves(nodesInLane, extentOf);

      const extents = spread.map(extentOf);
      const reaches = spread.map(reachOf);
      let start = axis - left;
      for (const [i, id] of spread.entries()) {
        const w = extents[i];
        x[id] = start + w / 2;
        y[id] = yOffset + layerH / 2;
        start += w;
        if (i < spread.length - 1) {
          start += reaches[i] + nodeGap;
        }
      }
      start += reaches.length > 0 ? reaches[reaches.length - 1] : 0;
      for (const id of beside) {
        const w = extentOf(id);
        start += nodeGap;
        x[id] = start + w / 2;
        y[id] = yOffset + layerH / 2;
        start += w + reachOf(id);
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
