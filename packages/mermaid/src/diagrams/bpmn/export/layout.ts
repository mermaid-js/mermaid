import type { BpmnModel, BpmnNode } from '../bpmnTypes.js';

/** A laid-out box, top-left origin (BPMN DI convention). */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExportLayout {
  /** node id to box */
  nodes: Map<string, Box>;
  /** pool id to box (participant) */
  pools: Map<string, Box>;
  /** lane id to box */
  lanes: Map<string, Box>;
  /** overall diagram size */
  width: number;
  height: number;
}

const SIZE: Record<BpmnNode['kind'], { w: number; h: number }> = {
  event: { w: 36, h: 36 },
  gateway: { w: 50, h: 50 },
  task: { w: 110, h: 70 },
  data: { w: 50, h: 60 },
};

const COL_GAP = 70;
const ROW_H = 100;
const LANE_LABEL_W = 30;
const LANE_PAD = 20;
const POOL_HEADER_W = 0; // pool label shares the lane-label strip
const POOL_GAP = 40;
const MARGIN = 40;

const nodeSize = (node: BpmnNode) => SIZE[node.kind];

/**
 * A small deterministic layered layout used only for the exported BPMN DI (so the
 * file opens laid-out in bpmn.io). It is independent of mermaid's on-screen render
 * pass, which keeps export usable headless / server-side. Ranks come from a
 * longest-path over sequence flows; lanes become horizontal bands.
 */
export function layoutForExport(model: BpmnModel): ExportLayout {
  const seq = model.flows.filter((f) => f.kind === 'sequence');

  // rank via longest path over sequence flows (cycle-safe).
  const rank = new Map<string, number>();
  for (const n of model.nodes) {
    rank.set(n.id, 0);
  }
  for (let iteration = 0; iteration < model.nodes.length + 1; iteration++) {
    let changed = false;
    for (const f of seq) {
      const r = (rank.get(f.sourceId) ?? 0) + 1;
      if (r > (rank.get(f.targetId) ?? 0)) {
        rank.set(f.targetId, r);
        changed = true;
      }
    }
    if (!changed) {
      break;
    }
  }

  // group nodes into processes: one per pool, plus a default for pool-less nodes.
  const DEFAULT = '__default__';
  const processes = new Map<string, BpmnNode[]>();
  for (const n of model.nodes) {
    const key = n.poolId ?? DEFAULT;
    (processes.get(key) ?? processes.set(key, []).get(key)!).push(n);
  }

  const nodes = new Map<string, Box>();
  const lanes = new Map<string, Box>();
  const pools = new Map<string, Box>();

  let cursorY = MARGIN;
  let maxRight = MARGIN;

  for (const [poolKey, poolNodes] of processes) {
    // lanes in this pool, in declaration order; plus an implicit lane for
    // pool-less-within-pool nodes.
    const poolLanes = model.lanes
      .filter((l) => l.poolId === poolKey)
      .sort((a, b) => a.order - b.order);
    const laneOrder: (string | undefined)[] = poolLanes.map((l) => l.id);
    const hasNodesWithoutLane = poolNodes.some((n) => !n.laneId);
    if (hasNodesWithoutLane || laneOrder.length === 0) {
      laneOrder.unshift(undefined);
    }

    const poolLeft = MARGIN;
    const contentLeft = poolLeft + LANE_LABEL_W + POOL_HEADER_W + LANE_PAD;
    let laneTop = cursorY;
    let poolBottom = cursorY;
    let poolRight = contentLeft;

    for (const laneId of laneOrder) {
      const laneNodes = poolNodes.filter((n) => (n.laneId ?? undefined) === laneId);
      if (laneNodes.length === 0) {
        continue;
      }
      // slot within lane per rank (stack same-rank nodes vertically)
      const perRank = new Map<number, number>();
      let maxSlots = 1;
      const placements: { node: BpmnNode; r: number; slot: number }[] = [];
      for (const node of laneNodes) {
        const r = rank.get(node.id) ?? 0;
        const slot = perRank.get(r) ?? 0;
        perRank.set(r, slot + 1);
        maxSlots = Math.max(maxSlots, slot + 1);
        placements.push({ node, r, slot });
      }
      const laneHeight = maxSlots * ROW_H + LANE_PAD;
      for (const { node, r, slot } of placements) {
        const { w, h } = nodeSize(node);
        const cellCenterX = contentLeft + r * (SIZE.task.w + COL_GAP) + SIZE.task.w / 2;
        const cellCenterY = laneTop + slot * ROW_H + ROW_H / 2 + LANE_PAD / 2;
        nodes.set(node.id, {
          x: Math.round(cellCenterX - w / 2),
          y: Math.round(cellCenterY - h / 2),
          width: w,
          height: h,
        });
        poolRight = Math.max(poolRight, cellCenterX + SIZE.task.w / 2 + LANE_PAD);
      }
      if (laneId) {
        lanes.set(laneId, {
          x: poolLeft + LANE_LABEL_W,
          y: laneTop,
          width: 0, // filled after poolRight is known
          height: laneHeight,
        });
      }
      laneTop += laneHeight;
      poolBottom = laneTop;
    }

    const poolWidth = poolRight - poolLeft;
    // finalize lane widths
    for (const laneId of laneOrder) {
      if (laneId && lanes.has(laneId)) {
        lanes.get(laneId)!.width = poolRight - (poolLeft + LANE_LABEL_W);
      }
    }
    if (poolKey !== DEFAULT) {
      pools.set(poolKey, {
        x: poolLeft,
        y: cursorY,
        width: poolWidth,
        height: poolBottom - cursorY,
      });
    }
    maxRight = Math.max(maxRight, poolRight);
    cursorY = poolBottom + POOL_GAP;
  }

  return {
    nodes,
    lanes,
    pools,
    width: maxRight + MARGIN,
    height: cursorY - POOL_GAP + MARGIN,
  };
}
