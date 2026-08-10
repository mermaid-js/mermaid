/**
 * HOLA Step 4a: opportunistic alignment (guide §18.1).
 *
 * Nearly-aligned node pairs are snapped into exact alignment — but only through
 * the constraint system. Each candidate becomes an equality constraint that is
 * rejected when the system cannot satisfy it, when projecting it would create a
 * node overlap, or when it would reverse the pair's existing ordering on the
 * other axis. Nothing is ever snapped to an arithmetic mean.
 *
 * The proximity threshold is scale-aware: a fraction of the base edge length,
 * so the same diagram at a different node size behaves the same way.
 */

import type { Axis, HolaNode } from '../model.js';
import { nodeBounds, rectsOverlap } from '../model.js';
import type { ConstraintSystem } from '../constraints/solver.js';
import { alignment } from '../constraints/types.js';

export interface AlignmentCandidate {
  a: string;
  b: string;
  axis: Axis;
  /** How far apart the pair currently is on `axis`. */
  displacement: number;
}

export interface OpportunisticAlignmentResult {
  accepted: AlignmentCandidate[];
  rejected: AlignmentCandidate[];
}

export function findAlignmentCandidates(
  entities: Map<string, HolaNode>,
  tolerance: number
): AlignmentCandidate[] {
  const nodes = [...entities.values()]
    .filter((n) => n.width > 0 && n.height > 0)
    .sort((a, b) => a.inputOrder - b.inputOrder || (a.id < b.id ? -1 : 1));

  const candidates: AlignmentCandidate[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = Math.abs(nodes[i].x - nodes[j].x);
      const dy = Math.abs(nodes[i].y - nodes[j].y);
      if (dx > 1e-9 && dx <= tolerance) {
        candidates.push({ a: nodes[i].id, b: nodes[j].id, axis: 'x', displacement: dx });
      }
      if (dy > 1e-9 && dy <= tolerance) {
        candidates.push({ a: nodes[i].id, b: nodes[j].id, axis: 'y', displacement: dy });
      }
    }
  }

  // Smallest displacement first: the cheapest, most obviously intended
  // alignments are committed while the most freedom remains.
  return candidates.sort(
    (p, q) =>
      p.displacement - q.displacement ||
      p.axis.localeCompare(q.axis) ||
      `${p.a}|${p.b}`.localeCompare(`${q.a}|${q.b}`)
  );
}

export function opportunisticallyAlign(
  entities: Map<string, HolaNode>,
  system: ConstraintSystem,
  tolerance: number
): OpportunisticAlignmentResult {
  const accepted: AlignmentCandidate[] = [];
  const rejected: AlignmentCandidate[] = [];

  for (const candidate of findAlignmentCandidates(entities, tolerance)) {
    const a = entities.get(candidate.a);
    const b = entities.get(candidate.b);
    if (!a || !b) {
      continue;
    }
    // Another commit may already have aligned this pair.
    const current = candidate.axis === 'x' ? Math.abs(a.x - b.x) : Math.abs(a.y - b.y);
    if (current < 1e-9) {
      continue;
    }

    const constraint = alignment(
      candidate.axis,
      candidate.a,
      candidate.b,
      'opportunistic-alignment'
    );
    if (!system.isFeasible(entities, [constraint])) {
      rejected.push(candidate);
      continue;
    }

    const otherAxis: Axis = candidate.axis === 'x' ? 'y' : 'x';
    const orderBefore = Math.sign(otherAxis === 'x' ? a.x - b.x : a.y - b.y);

    const snapshot = system.snapshot(entities);
    const id = system.add(constraint);
    const projection = system.project(entities);

    const orderAfter = Math.sign(otherAxis === 'x' ? a.x - b.x : a.y - b.y);
    const reversedOrder = orderBefore !== 0 && orderAfter !== 0 && orderBefore !== orderAfter;

    if (!projection.feasible || reversedOrder || introducesOverlap(entities)) {
      system.remove([id]);
      system.restore(snapshot, entities);
      rejected.push(candidate);
      continue;
    }
    void snapshot;

    accepted.push(candidate);
  }

  return { accepted, rejected };
}

function introducesOverlap(entities: Map<string, HolaNode>): boolean {
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
