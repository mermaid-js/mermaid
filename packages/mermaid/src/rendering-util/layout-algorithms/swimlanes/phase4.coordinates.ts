import type { Graph, OrderedLayers, Coordinates, NodeId, EdgeRef, Node } from './helpers.js';
import { COORDINATES } from './config.js';
import { createTopLaneResolver, resolveTopLaneOrder } from './phase2.options.js';

export interface CoordOptions {
  layerGap?: number; // vertical distance between layers
  nodeGap?: number; // horizontal gap between siblings inside a lane
  laneGap?: number; // horizontal gap between lanes (clusters)
  direction?: 'TB' | 'LR' | 'BT' | 'RL'; // layout direction for proper spacing
  laneOrder?: string[];
}

/** A labelled edge within one rank: its label sits in the target's row. */
interface RowLabel {
  labelId: NodeId;
  rank: number;
  lane: string | null;
  /** The side of the row's nodes the edge comes in from. */
  side: 'before' | 'after';
}

/** A labelled edge whose label spans the gap between two ranks. */
interface GapLabel {
  labelId: NodeId;
  start: NodeId;
  end: NodeId;
  gap: number;
  crossesLanes: boolean;
}

/**
 * Positions every node, and seeds each edge label (which has no rank) where the
 * layout keeps room for it:
 * - the label of an edge between two ranks widens the gap between them by the
 *   label's extent along the flow, in every direction;
 * - the label of an edge within one rank (a cross-lane edge) sits in that row,
 *   beyond the target lane's nodes on the side the edge comes in from. The lane
 *   widens on both sides, so its nodes stay centred where they would be without
 *   the label.
 */
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

  const x: Record<NodeId, number> = Object.create(null);
  const y: Record<NodeId, number> = Object.create(null);

  const labelById = new Map<NodeId, Node>(
    (gWithDummies.layout?.nodes ?? []).filter((n) => n.isEdgeLabel).map((n) => [n.id, n])
  );
  const getNode = (id: NodeId) => labelById.get(id) ?? gWithDummies.nodeById.get(id);
  const getWidth = (id: NodeId) => getNode(id)?.width ?? 0;
  const getHeight = (id: NodeId) => getNode(id)?.height ?? 0;
  const topLaneOfNode = createTopLaneResolver(gWithDummies);
  const labelLane = new Map<NodeId, string | null>();
  const topLaneOf = (id: NodeId) =>
    labelLane.has(id) ? (labelLane.get(id) ?? null) : topLaneOfNode(id);
  const laneOrderGlobal = resolveTopLaneOrder(gWithDummies, opts?.laneOrder);

  const lanesUsedSet = new Set<string | null>();
  for (const layer of ordered.layers) {
    for (const id of layer) {
      lanesUsedSet.add(topLaneOfNode(id));
    }
  }
  const hasNullLane = lanesUsedSet.has(null);
  const lanesUsed = laneOrderGlobal.filter((L) => lanesUsedSet.has(L));
  const laneOrderColumns: (string | null)[] = [...(hasNullLane ? [null] : []), ...lanesUsed];

  const layers = ordered.layers;
  const rankOf = new Map<NodeId, number>();
  for (const [li, layer] of layers.entries()) {
    for (const id of layer) {
      rankOf.set(id, li);
    }
  }
  const rowLabels: RowLabel[] = [];
  const gapLabels: GapLabel[] = [];
  const unrankedLabels: { labelId: NodeId; near: NodeId }[] = [];
  for (const edge of gWithDummies.layout?.edges ?? []) {
    const labelId = edge.labelNodeId;
    const start = edge.start;
    const end = edge.end;
    if (!labelId || !labelById.has(labelId) || start == null || end == null) {
      continue;
    }
    const rs = rankOf.get(start);
    const rt = rankOf.get(end);
    if (rs == null || rt == null) {
      // An endpoint without a rank leaves the label nothing to sit between.
      unrankedLabels.push({ labelId, near: rs == null ? end : start });
      continue;
    }
    labelLane.set(labelId, topLaneOfNode(end));
    if (rs === rt) {
      const column = (id: NodeId) => laneOrderColumns.indexOf(topLaneOfNode(id));
      rowLabels.push({
        labelId,
        rank: rt,
        lane: topLaneOfNode(end),
        side: start !== end && column(start) < column(end) ? 'before' : 'after',
      });
      continue;
    }
    const lo = Math.min(rs, rt);
    const hi = Math.max(rs, rt);
    gapLabels.push({
      labelId,
      start,
      end,
      gap: lo + Math.floor((hi - lo - 1) / 2),
      crossesLanes: topLaneOfNode(start) !== topLaneOfNode(end),
    });
  }

  const layerHeights: number[] = layers.map((layer) =>
    layer.reduce((m, v) => Math.max(m, getHeight(v)), 0)
  );
  for (const { labelId, rank } of rowLabels) {
    layerHeights[rank] = Math.max(layerHeights[rank], getHeight(labelId));
  }

  // LR/RL transforms turn width into horizontal span, so widen layer gaps up front.
  const extraLayerGaps: number[] = layers.map(() => 0);
  if (isHorizontal) {
    for (let i = 0; i + 1 < layers.length; i++) {
      const thisLayerMaxWidth = layers[i].reduce((m, v) => Math.max(m, getWidth(v)), 0);
      const nextLayerMaxWidth = layers[i + 1].reduce((m, v) => Math.max(m, getWidth(v)), 0);
      const thisLayerMaxHeight = layerHeights[i];
      const nextLayerMaxHeight = layerHeights[i + 1];

      const normalSpacing = thisLayerMaxHeight / 2 + nextLayerMaxHeight / 2;
      const requiredSpacing = (thisLayerMaxWidth + nextLayerMaxWidth) / 2;
      extraLayerGaps[i] = Math.max(0, requiredSpacing - normalSpacing - layerGap);
    }
  }
  // A gap holding a label grows by the label's extent along the flow plus clearance
  // on both sides. It keeps its own spacing as well, because that is where the router
  // runs edges across the gap, and a label squeezed into it has nowhere to dodge them.
  // Labels sharing a gap sit side by side, so the tallest one decides.
  const labelGapNeed: number[] = layers.map(() => 0);
  for (const { labelId, gap } of gapLabels) {
    const extent = isHorizontal ? getWidth(labelId) : getHeight(labelId);
    const need = extent + 2 * COORDINATES.EDGE_LABEL_CLEARANCE;
    labelGapNeed[gap] = Math.max(labelGapNeed[gap], need);
  }
  for (const [gap, need] of labelGapNeed.entries()) {
    extraLayerGaps[gap] += need;
  }

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
  // Labels between ranks are anchored inside their lane, so the lane must hold them.
  // Those in one gap and lane sit side by side, so the lane holds their combined width.
  const gapLabelGroups = new Map<string, GapLabel[]>();
  for (const label of gapLabels) {
    const key = `${label.gap}:${topLaneOf(label.labelId)}`;
    gapLabelGroups.set(key, [...(gapLabelGroups.get(key) ?? []), label]);
  }
  for (const group of gapLabelGroups.values()) {
    const L = topLaneOf(group[0].labelId);
    if (L !== null) {
      const span = group.reduce(
        (sum, l, i) => sum + getWidth(l.labelId) + (i > 0 ? nodeGap : 0),
        0
      );
      laneWidth[L] = Math.max(laneWidth[L] ?? 0, span);
    }
  }
  // Labels in a row stack outward from the row's nodes on their side. The lane grows
  // by the wider side on both sides, so the nodes keep the lane's centre.
  const rowLabelSpan = (rank: number, lane: string | null, side: RowLabel['side']) =>
    rowLabels
      .filter((l) => l.rank === rank && l.lane === lane && l.side === side)
      .reduce((sum, l) => sum + nodeGap + getWidth(l.labelId), 0);
  for (const { rank, lane } of rowLabels) {
    const nodesWidth = layers[rank]
      .filter((id) => topLaneOf(id) === lane)
      .reduce((sum, id, i) => sum + getWidth(id) + (i > 0 ? nodeGap : 0), 0);
    const side = Math.max(rowLabelSpan(rank, lane, 'before'), rowLabelSpan(rank, lane, 'after'));
    const key = lane ?? 'null';
    laneWidth[key] = Math.max(laneWidth[key] ?? 0, nodesWidth + 2 * side);
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

  const gapCenterY: number[] = [];
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

    const gapSize = layerGap + (extraLayerGaps[li] ?? 0);
    gapCenterY[li] = yOffset + layerH + gapSize / 2;
    yOffset += layerH + gapSize;
  }

  // A row label goes beyond the row's nodes in its lane, on the side the edge comes
  // in from; several on one side stack outward in the order they were declared.
  const rowEdge = new Map<string, number>();
  for (const { labelId, rank, lane, side } of rowLabels) {
    const key = `${rank}:${lane}:${side}`;
    if (!rowEdge.has(key)) {
      const inRow = layers[rank].filter((id) => topLaneOf(id) === lane);
      const edges = inRow.map((id) =>
        side === 'before' ? x[id] - getWidth(id) / 2 : x[id] + getWidth(id) / 2
      );
      rowEdge.set(key, side === 'before' ? Math.min(...edges) : Math.max(...edges));
    }
    const w = getWidth(labelId);
    const at = rowEdge.get(key)! + (side === 'before' ? -1 : 1) * (nodeGap + w / 2);
    x[labelId] = at;
    y[labelId] = y[layers[rank].find((id) => topLaneOf(id) === lane)!];
    rowEdge.set(key, at + (side === 'before' ? -1 : 1) * (w / 2));
  }

  // A label between ranks starts in the middle of its gap: over the target, where
  // the router drops a cross-lane edge into the target's lane, or between the two
  // ends of an edge inside one lane.
  // Labels that would start on top of each other in one gap and lane are spread side
  // by side, in the order they were declared, around where they would have started.
  for (const group of gapLabelGroups.values()) {
    const wanted = group.map(({ start, end, crossesLanes }) =>
      crossesLanes ? x[end] : ((x[start] ?? 0) + (x[end] ?? 0)) / 2
    );
    const order = group.map((_, i) => i).sort((a, b) => wanted[a] - wanted[b] || a - b);
    const placed: number[] = [];
    let right = -Infinity;
    for (const i of order) {
      const w = getWidth(group[i].labelId);
      placed[i] = Math.max(wanted[i], right + nodeGap + w / 2);
      right = placed[i] + w / 2;
    }
    const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
    const shift = mean(wanted) - mean(placed);
    for (const [i, { labelId, gap }] of group.entries()) {
      x[labelId] = placed[i] + shift;
      y[labelId] = gapCenterY[gap];
    }
  }

  // A label with no ranked endpoint to follow stays on the other endpoint, or at the origin.
  for (const { labelId, near } of unrankedLabels) {
    x[labelId] = x[near] ?? 0;
    y[labelId] = y[near] ?? 0;
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
