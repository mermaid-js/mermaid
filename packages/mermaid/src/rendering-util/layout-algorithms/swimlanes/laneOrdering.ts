import type { Graph } from './helpers.js';
import { buildTopLaneOrder, createTopLaneResolver } from './phase2.options.js';

export const AUTOMATIC_LANE_ORDERING_RESTARTS = 8;

export interface WeightedLaneEdge {
  a: string;
  b: string;
  weight: number;
}

interface CandidateOrder {
  order: string[];
  cost: number;
  sourceDistance: number;
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deterministicShuffle(order: string[], seed: number): string[] {
  const shuffled = [...order];
  const random = mulberry32(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function sourceDistance(order: string[], sourceIndex: Map<string, number>): number {
  let distance = 0;
  for (const [index, laneId] of order.entries()) {
    distance += Math.abs(index - (sourceIndex.get(laneId) ?? index));
  }
  return distance;
}

export function laneArrangementCost(order: string[], weights: WeightedLaneEdge[]): number {
  const position = new Map<string, number>();
  for (const [index, laneId] of order.entries()) {
    position.set(laneId, index);
  }

  let cost = 0;
  for (const { a, b, weight } of weights) {
    const ai = position.get(a);
    const bi = position.get(b);
    if (ai == null || bi == null) {
      continue;
    }
    cost += weight * Math.abs(ai - bi);
  }
  return cost;
}

export function buildWeightedLaneEdges(g: Graph): WeightedLaneEdge[] {
  const sourceOrder = buildTopLaneOrder(g);
  if (sourceOrder.length < 2) {
    return [];
  }

  const sourceIndex = new Map(sourceOrder.map((laneId, index) => [laneId, index]));
  const topLaneOf = createTopLaneResolver(g);
  const weights = new Map<string, WeightedLaneEdge>();

  for (const edge of g.layout.edges ?? []) {
    if ((edge as { isLayoutOnly?: boolean }).isLayoutOnly) {
      continue;
    }
    const src = typeof edge.start === 'string' ? edge.start : undefined;
    const dst = typeof edge.end === 'string' ? edge.end : undefined;
    if (!src || !dst || !g.nodeById.has(src) || !g.nodeById.has(dst)) {
      continue;
    }

    const laneA = topLaneOf(src);
    const laneB = topLaneOf(dst);
    if (!laneA || !laneB || laneA === laneB) {
      continue;
    }

    const ia = sourceIndex.get(laneA);
    const ib = sourceIndex.get(laneB);
    if (ia == null || ib == null) {
      continue;
    }

    const [a, b] = ia <= ib ? [laneA, laneB] : [laneB, laneA];
    const key = `${a}\0${b}`;
    const existing = weights.get(key);
    if (existing) {
      existing.weight++;
    } else {
      weights.set(key, { a, b, weight: 1 });
    }
  }

  return [...weights.values()];
}

function greedySwitch(
  startOrder: string[],
  weights: WeightedLaneEdge[],
  sourceIndex: Map<string, number>
): CandidateOrder {
  const order = [...startOrder];
  let cost = laneArrangementCost(order, weights);
  let changed = true;
  let sweeps = 0;
  const maxSweeps = Math.max(1, order.length);

  while (changed && sweeps < maxSweeps) {
    changed = false;
    sweeps++;
    for (let i = 0; i + 1 < order.length; i++) {
      [order[i], order[i + 1]] = [order[i + 1], order[i]];
      const nextCost = laneArrangementCost(order, weights);
      if (nextCost < cost) {
        cost = nextCost;
        changed = true;
      } else {
        [order[i], order[i + 1]] = [order[i + 1], order[i]];
      }
    }
  }

  return {
    order,
    cost,
    sourceDistance: sourceDistance(order, sourceIndex),
  };
}

function isBetterCandidate(candidate: CandidateOrder, best: CandidateOrder): boolean {
  if (candidate.cost !== best.cost) {
    return candidate.cost < best.cost;
  }
  return candidate.sourceDistance < best.sourceDistance;
}

function seedForRestart(
  sourceOrder: string[],
  weights: WeightedLaneEdge[],
  restartIndex: number
): number {
  const weightSignature = [...weights]
    .sort((a, b) => (a.a === b.a ? a.b.localeCompare(b.b) : a.a.localeCompare(b.a)))
    .map(({ a, b, weight }) => `${a}:${b}:${weight}`)
    .join('|');
  return hashString(`${sourceOrder.join('|')}#${weightSignature}#${restartIndex}`);
}

export function optimizeTopLaneOrder(g: Graph, opts: { restarts?: number } = {}): string[] {
  const sourceOrder = buildTopLaneOrder(g);
  if (sourceOrder.length < 2) {
    return sourceOrder;
  }

  const weights = buildWeightedLaneEdges(g);
  if (weights.length === 0) {
    return sourceOrder;
  }

  const sourceIndex = new Map(sourceOrder.map((laneId, index) => [laneId, index]));
  let best = greedySwitch(sourceOrder, weights, sourceIndex);
  const restarts = Math.max(0, opts.restarts ?? AUTOMATIC_LANE_ORDERING_RESTARTS);

  for (let i = 0; i < restarts; i++) {
    const seed = seedForRestart(sourceOrder, weights, i);
    const start = deterministicShuffle(sourceOrder, seed);
    const candidate = greedySwitch(start, weights, sourceIndex);
    if (isBetterCandidate(candidate, best)) {
      best = candidate;
    }
  }

  return best.order;
}
