/**
 * Which grid-like drawing of the core to keep.
 *
 * grid-like draws a core from a stress layout and then beautifies it — ACA adds
 * hard alignments one at a time, snapping pulls node centres onto a grid. Both
 * steps are greedy and neither is ever undone, so the drawing that comes out
 * depends on which alignment happened to look best *first*. On a small core that
 * makes it unstable: a four-cycle came out four different ways under sub-pixel
 * changes to the derived grid spacing, and only one of those four was the obvious
 * drawing — the rectangle, with all four edges straight.
 *
 * The remedy is not to change grid-like, whose algorithm is faithful to the paper.
 * It is to ask it more than once. Every candidate below *is* a grid-like drawing,
 * produced by grid-like from the same nodes and edges; only the knobs the paper
 * itself leaves open differ — whether the flow ordering is imposed (§26 step 1),
 * which phase-2 mechanism runs (§2), and which cost function ACA ranks candidate
 * alignments with (§13). Then the best is kept, by the same generate-and-test
 * `grid-decomposed` already applies to its two candidates, with one measure added.
 *
 * The measures, in priority order:
 *
 *   1. **edges through a node they do not connect** — the paper's own "no edge-node
 *      overlap" desideratum (§1), and the symptom of a cycle collapsed onto one
 *      line by the flow ordering;
 *   2. **crossings**;
 *   3. **edges whose endpoints share neither a row nor a column**. This one is new
 *      here, and it is what makes the difference: an unaligned pair cannot be drawn
 *      as a straight line, so every one of them costs the reader a detour. It comes
 *      last because a bend is a smaller sin than either of the others.
 *
 * A tie keeps the earlier candidate, and the candidates are ordered so that
 * everything respecting the diagram's declared direction comes first — respecting
 * it is worth something on its own.
 *
 * This is `grid-attached`'s own choice; `grid-decomposed` keeps drawing its cores
 * exactly as it did.
 */

import { log } from '../../../logger.js';
import type { Point } from '../../../types.js';
import type { LayoutData } from '../../types.js';
import { runGridLikeLayoutCore } from '../grid-like/layoutCore.js';
import type { GridLikeLayoutResult } from '../grid-like/layoutCore.js';
import {
  countEdgeCrossings,
  countEdgesThroughForeignNodes,
} from '../grid-decomposed/partQuality.js';
import type { GridAttachedOptions } from './options.js';

/** How the core may be drawn. Order is the tie-break: earlier wins. */
const CANDIDATES: { label: string; overrides: Partial<GridAttachedOptions> }[] = [
  { label: 'flow', overrides: { respectDirection: true } },
  { label: 'flow/aca', overrides: { respectDirection: true, mode: 'aca' } },
  { label: 'flow/stress', overrides: { respectDirection: true, heuristic: 'stress-change' } },
  { label: 'free', overrides: { respectDirection: false } },
  { label: 'free/aca', overrides: { respectDirection: false, mode: 'aca' } },
  { label: 'free/stress', overrides: { respectDirection: false, heuristic: 'stress-change' } },
];

const EPSILON = 0.5;

interface Candidate {
  label: string;
  grid: GridLikeLayoutResult;
  positions: Map<string, Point>;
  foreignNodeHits: number;
  crossings: number;
  bends: number;
}

/**
 * Draw the core the best way grid-like can, and leave that drawing on the nodes.
 *
 * The first candidate is the diagram as declared. If it is already flawless by all
 * three measures nothing else is drawn, which is the common case and costs a single
 * solve; only a flawed drawing is worth asking again about.
 */
export function drawBestCore(
  layoutData: LayoutData,
  options: GridAttachedOptions,
  solverData: LayoutData = layoutData
): GridLikeLayoutResult {
  let best: Candidate | undefined;

  for (const { label, overrides } of CANDIDATES) {
    const candidate = draw(layoutData, { ...options, ...overrides }, label, solverData);
    if (!best || isBetter(candidate, best)) {
      best = candidate;
    }
    if (best.foreignNodeHits === 0 && best.crossings === 0 && best.bends === 0) {
      break;
    }
  }

  restore(layoutData, best!.positions);

  log.debug(
    `GRID-ATTACHED: core drawn as "${best!.label}" — ${best!.foreignNodeHits} edge(s) through a ` +
      `node, ${best!.crossings} crossing(s), ${best!.bends} bent edge(s)`
  );

  return best!.grid;
}

/**
 * `solverData` is what grid-like is asked to lay out; `layoutData` is what the
 * candidate is *judged* on. They differ when the core's subgraph containers are
 * modelled: the containers have to be in the solve to constrain it, and must stay
 * out of the metrics, where a frame would read as a node and every edge leaving a
 * subgraph would count as an edge through one.
 */
function draw(
  layoutData: LayoutData,
  options: GridAttachedOptions,
  label: string,
  solverData: LayoutData
): Candidate {
  // `computeInitialLayout` starts from a BFS ranking rather than from whatever is
  // currently on the nodes, so one candidate cannot influence the next.
  const grid = runGridLikeLayoutCore(solverData, options);

  return {
    label,
    grid,
    positions: new Map(
      layoutData.nodes.map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }])
    ),
    // Both of these read the straight centre-to-centre routes grid-like just
    // wrote, so they have to be counted now, before the next candidate overwrites
    // them.
    foreignNodeHits: countEdgesThroughForeignNodes(layoutData),
    crossings: countEdgeCrossings(layoutData),
    bends: countBentEdges(layoutData),
  };
}

/** Lexicographic: edges through a node, then crossings, then bends. */
function isBetter(candidate: Candidate, incumbent: Candidate): boolean {
  if (candidate.foreignNodeHits !== incumbent.foreignNodeHits) {
    return candidate.foreignNodeHits < incumbent.foreignNodeHits;
  }
  if (candidate.crossings !== incumbent.crossings) {
    return candidate.crossings < incumbent.crossings;
  }
  return candidate.bends < incumbent.bends;
}

/**
 * Edges whose endpoints share neither a row nor a column.
 *
 * Counted from the node positions rather than from the routes, because it is the
 * *placement* this measures: two nodes that share neither coordinate cannot be
 * joined by a straight line, so however the edge is routed the reader follows a
 * corner. Aligning the pair is what removes the corner, and choosing between
 * drawings is the only chance to do that.
 */
export function countBentEdges(layout: LayoutData): number {
  const positions = new Map(
    (layout.nodes ?? []).map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }])
  );

  let bent = 0;
  for (const edge of layout.edges ?? []) {
    if (edge.start === edge.end) {
      continue;
    }
    const source = positions.get(edge.start ?? '');
    const target = positions.get(edge.end ?? '');
    if (!source || !target) {
      continue;
    }
    if (Math.abs(source.x - target.x) > EPSILON && Math.abs(source.y - target.y) > EPSILON) {
      bent++;
    }
  }
  return bent;
}

function restore(layoutData: LayoutData, positions: Map<string, Point>): void {
  for (const node of layoutData.nodes) {
    const position = positions.get(node.id);
    if (position) {
      node.x = position.x;
      node.y = position.y;
    }
  }
}
