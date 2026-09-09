/**
 * Adaptive Constrained Alignment (ACA).
 *
 * HOLA's chain configuration assumes a chain has two anchors. A core that is
 * one closed cycle of degree-2 links has none, and guide §13.1 directs the
 * implementation to the paper's "configurable ACA chain-processing path"
 * rather than to an invented spiral.
 *
 * ACA is the greedy alignment procedure of Wybrow, Dwyer & Marriott: repeatedly
 * add the single horizontal-or-vertical edge alignment that costs the layout
 * least, rejecting any alignment that the constraint system cannot satisfy or
 * that would introduce a node overlap. It converges when nothing more can be
 * aligned, which for a rectilinear-realisable cycle is a fully orthogonal one.
 */

import type { Axis, HolaNode } from '../model.js';
import { nodeBounds, rectsOverlap } from '../model.js';
import type { ConstraintSystem } from '../constraints/solver.js';
import type { Constraint } from '../constraints/types.js';
import { alignment, separation } from '../constraints/types.js';
import type { StressModel } from '../stress/stressModel.js';

export interface AcaEdge {
  a: string;
  b: string;
}

export interface AcaResult {
  aligned: { a: string; b: string; axis: Axis }[];
  rounds: number;
}

const ALIGNMENT_EPSILON = 1e-6;

/**
 * Greedily align `edges` one at a time, cheapest first by measured stress
 * increase. Every candidate is validated through the real solver, so this
 * never produces an infeasible or overlapping configuration.
 */
export function acaAlign(
  entities: Map<string, HolaNode>,
  edges: AcaEdge[],
  system: ConstraintSystem,
  model: StressModel,
  clearance: number,
  origin: Constraint['origin'] = 'chain-configuration'
): AcaResult {
  const aligned: { a: string; b: string; axis: Axis }[] = [];
  const done = new Set<string>();

  for (let round = 0; round < edges.length * 2; round++) {
    let best: { edge: AcaEdge; axis: Axis; penalty: number; constraints: Constraint[] } | null =
      null;

    for (const edge of edges) {
      for (const axis of ['x', 'y'] as Axis[]) {
        const key = `${edge.a}|${edge.b}|${axis}`;
        if (done.has(key)) {
          continue;
        }
        const a = entities.get(edge.a);
        const b = entities.get(edge.b);
        if (!a || !b) {
          continue;
        }
        // Already aligned on this axis: nothing to gain.
        if (Math.abs(axis === 'x' ? a.x - b.x : a.y - b.y) < ALIGNMENT_EPSILON) {
          continue;
        }

        const candidate = buildAlignment(a, b, axis, clearance, origin);
        if (!system.isFeasible(entities, candidate)) {
          continue;
        }

        const snapshot = system.snapshot(entities);
        const before = model.value(entities);
        const ids = system.addAll(candidate);
        const projection = system.project(entities);
        const penalty = projection.feasible
          ? model.value(entities) - before
          : Number.POSITIVE_INFINITY;
        const overlaps = projection.feasible && hasOverlap(entities);
        system.remove(ids);
        system.restore(snapshot, entities);

        // Rejected *for now* — not for good. Whether an alignment overlaps or is
        // satisfiable depends on which alignments are already committed, and this
        // loop commits one per round: the last edge of a cycle typically collides
        // while the cycle is still half-formed and is perfectly placeable once the
        // rest is in. Blacklisting it here left a four-cycle with three of its four
        // alignments, so one side of the rectangle came out as a jog.
        if (!projection.feasible || overlaps || !isFinite(penalty)) {
          continue;
        }
        if (best === null || penalty < best.penalty) {
          best = { edge, axis, penalty, constraints: candidate };
        }
      }
    }

    if (best === null) {
      return { aligned, rounds: round };
    }

    if (!system.tryAdd(entities, best.constraints)) {
      done.add(`${best.edge.a}|${best.edge.b}|${best.axis}`);
      continue;
    }
    aligned.push({ a: best.edge.a, b: best.edge.b, axis: best.axis });
    done.add(`${best.edge.a}|${best.edge.b}|x`);
    done.add(`${best.edge.a}|${best.edge.b}|y`);
  }

  return { aligned, rounds: edges.length * 2 };
}

/**
 * Align two nodes on `axis` while keeping them apart on the other axis in the
 * order they currently have, so aligning never collapses an edge to zero
 * length or flips its direction.
 */
function buildAlignment(
  a: HolaNode,
  b: HolaNode,
  axis: Axis,
  clearance: number,
  origin: Constraint['origin']
): Constraint[] {
  const constraints: Constraint[] = [alignment(axis, a.id, b.id, origin)];
  if (axis === 'x') {
    const gap = (a.height + b.height) / 2 + clearance;
    constraints.push(
      a.y <= b.y
        ? separation('y', a.id, b.id, gap, origin)
        : separation('y', b.id, a.id, gap, origin)
    );
  } else {
    const gap = (a.width + b.width) / 2 + clearance;
    constraints.push(
      a.x <= b.x
        ? separation('x', a.id, b.id, gap, origin)
        : separation('x', b.id, a.id, gap, origin)
    );
  }
  return constraints;
}

function hasOverlap(entities: Map<string, HolaNode>): boolean {
  const list = [...entities.values()].filter((n) => n.width > 0 && n.height > 0);
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (rectsOverlap(nodeBounds(list[i]), nodeBounds(list[j]))) {
        return true;
      }
    }
  }
  return false;
}
