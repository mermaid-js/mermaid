import type { LayoutData } from '../../../types.js';
import { layoutFromSource, type LayoutOptions } from './emptyLaneHarness.js';

// Seeded random swimlane diagrams with empty lanes, for checks that must hold for every layout.
const MIN_LANES = 3;
const MAX_LANES = 5;
const MAX_NODES_PER_LANE = 3;
const MIN_NODE_WIDTH = 40;
const NODE_WIDTH_SPREAD = 90;
const EDGES_PER_NODE = 1.2;

// The published constants of the mulberry32 generator.
const MULBERRY_INCREMENT = 0x6d2b79f5;
const MULBERRY_SHIFT_A = 15;
const MULBERRY_SHIFT_B = 7;
const MULBERRY_SHIFT_C = 14;
const MULBERRY_MIX = 61;
const UINT32_RANGE = 2 ** 32;

/** A small seeded generator, so a failing diagram can be rebuilt from its seed. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + MULBERRY_INCREMENT) | 0;
    let t = Math.imul(state ^ (state >>> MULBERRY_SHIFT_A), 1 | state);
    t = (t + Math.imul(t ^ (t >>> MULBERRY_SHIFT_B), MULBERRY_MIX | t)) ^ t;
    return ((t ^ (t >>> MULBERRY_SHIFT_C)) >>> 0) / UINT32_RANGE;
  };
}

export interface FuzzCase {
  seed: number;
  source: string;
  /** Lane ids in the order the source declares them. */
  order: string[];
  widths: Map<string, number>;
}

/** A random TB or BT diagram: three to five lanes, at least one empty and one with nodes. */
export function fuzzCase(seed: number, direction: string): FuzzCase {
  const random = seededRandom(seed);
  const between = (low: number, high: number): number =>
    low + Math.floor(random() * (high - low + 1));
  const laneCount = between(MIN_LANES, MAX_LANES);
  const emptyCount = between(1, laneCount - 1);
  const empty = new Set<number>();
  while (empty.size < emptyCount) {
    empty.add(between(0, laneCount - 1));
  }

  const lines = [`swimlane-beta ${direction}`];
  const order: string[] = [];
  const widths = new Map<string, number>();
  const nodeIds: string[] = [];
  for (let lane = 0; lane < laneCount; lane++) {
    order.push(`L${lane}`);
    lines.push(`  subgraph L${lane}[Lane ${lane}]`);
    const count = empty.has(lane) ? 0 : between(1, MAX_NODES_PER_LANE);
    for (let n = 0; n < count; n++) {
      const id = `n${nodeIds.length}`;
      nodeIds.push(id);
      widths.set(id, MIN_NODE_WIDTH + Math.floor(random() * NODE_WIDTH_SPREAD));
      lines.push(`    ${id}`);
    }
    lines.push('  end');
  }
  const edgeCount = Math.round(nodeIds.length * EDGES_PER_NODE);
  for (let e = 0; e < edgeCount; e++) {
    const from = nodeIds[between(0, nodeIds.length - 1)];
    const to = nodeIds[between(0, nodeIds.length - 1)];
    if (from !== to) {
      lines.push(`  ${from} --> ${to}`);
    }
  }
  return { seed, source: lines.join('\n'), order, widths };
}

export function layoutFuzzCase(
  fuzz: FuzzCase,
  nodeSpacing: number,
  options: Pick<LayoutOptions, 'automaticLaneOrdering'> = {}
): Promise<LayoutData> {
  return layoutFromSource(fuzz.source, {
    ...options,
    nodeSpacing,
    nodeWidth: (id) => fuzz.widths.get(id) ?? MIN_NODE_WIDTH,
  });
}
