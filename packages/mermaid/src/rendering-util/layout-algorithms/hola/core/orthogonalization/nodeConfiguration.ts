/**
 * HOLA Step 2b part 1: node configuration (guide §12).
 *
 * For every hub (core node of degree ≥ 3) choose an injective assignment of
 * some of its neighbours to the four compass directions. The objective is
 * *lexicographic*: first maximise how many neighbours get a direction, only
 * then minimise the total angular displacement (invariant 6). A greedy
 * cheapest-pair matching fails both halves of that, so the search here is
 * exhaustive over the assignments that are order-valid.
 *
 * The search space is small because only four directions exist and because
 * HOLA forbids assignments that reorder the neighbourhood: the assigned
 * neighbours, read in their current angular order, must map to directions that
 * are in the same cyclic order. Enumerating *only* the cyclically compatible
 * tuples gives, for k assigned neighbours, C(m, k) · C(4, k) · k candidates.
 */

import type { Cardinal, HolaNode } from '../model.js';
import {
  CARDINALS,
  CARDINAL_ANGLE,
  angularDistance,
  nodeBounds,
  normaliseAngle,
  rectsOverlap,
} from '../model.js';
import type { Constraint } from '../constraints/types.js';
import { alignment, separation } from '../constraints/types.js';
import type { ConstraintSystem } from '../constraints/solver.js';
import type { HolaOptions } from '../options.js';
import type { DiagnosticCollector } from '../diagnostics.js';

export interface NeighbourAngle {
  id: string;
  /** atan2(dy, dx) normalised to [0, 2π); increasing = clockwise on screen. */
  angle: number;
}

export type DirectionAssignment = Map<string, Cardinal>;

export interface HubConfiguration {
  hub: string;
  assignment: DirectionAssignment;
  constraints: Constraint[];
  /** Total angular displacement of the assigned neighbours. */
  cost: number;
}

/** Neighbours of `hub`, sorted by their current angle around it. */
export function neighbourAngles(
  hub: HolaNode,
  neighbourIds: string[],
  nodes: Map<string, HolaNode>
): NeighbourAngle[] {
  return neighbourIds
    .map((id) => {
      const n = nodes.get(id)!;
      return { id, angle: normaliseAngle(Math.atan2(n.y - hub.y, n.x - hub.x)) };
    })
    .sort((a, b) => (a.angle === b.angle ? (a.id < b.id ? -1 : 1) : a.angle - b.angle));
}

/**
 * Guide §12.3. A neighbour that starts left of the hub may not be pushed to
 * its EAST, and so on: the assignment must not reverse an existing
 * orthogonal ordering.
 */
export function preservesOrthogonalOrder(
  hub: HolaNode,
  neighbour: HolaNode,
  direction: Cardinal
): boolean {
  switch (direction) {
    case 'E':
      return neighbour.x >= hub.x;
    case 'W':
      return neighbour.x <= hub.x;
    case 'N':
      return neighbour.y <= hub.y;
    case 'S':
      return neighbour.y >= hub.y;
  }
}

/**
 * Guide §12.4. Given the assigned neighbours *in their angular order*, their
 * target directions must run the same way around the compass. A cyclic
 * sequence of distinct angles is increasing exactly when a full loop through
 * it contains a single descent — that single descent being the wrap-around,
 * which is therefore always checked.
 */
export function preservesCyclicOrder(orderedDirections: Cardinal[]): boolean {
  const k = orderedDirections.length;
  if (k <= 1) {
    return true;
  }
  const angles = orderedDirections.map((d) => CARDINAL_ANGLE[d]);
  let descents = 0;
  for (let i = 0; i < k; i++) {
    const next = angles[(i + 1) % k];
    if (next <= angles[i]) {
      descents++;
    }
  }
  return descents === 1;
}

/**
 * The hard constraints that realise one direction assignment (guide §7.1).
 * Each direction contributes an alignment on one axis and a minimum separation
 * on the other.
 */
export function constraintsForConfiguration(
  hub: HolaNode,
  assignment: DirectionAssignment,
  nodes: Map<string, HolaNode>,
  clearance: number
): Constraint[] {
  const constraints: Constraint[] = [];
  for (const [neighbourId, direction] of assignment) {
    const neighbour = nodes.get(neighbourId);
    if (!neighbour) {
      continue;
    }
    const gapX = (hub.width + neighbour.width) / 2 + clearance;
    const gapY = (hub.height + neighbour.height) / 2 + clearance;
    switch (direction) {
      case 'E':
        constraints.push(alignment('y', hub.id, neighbourId, 'node-configuration'));
        constraints.push(separation('x', hub.id, neighbourId, gapX, 'node-configuration'));
        break;
      case 'W':
        constraints.push(alignment('y', hub.id, neighbourId, 'node-configuration'));
        constraints.push(separation('x', neighbourId, hub.id, gapX, 'node-configuration'));
        break;
      case 'S':
        constraints.push(alignment('x', hub.id, neighbourId, 'node-configuration'));
        constraints.push(separation('y', hub.id, neighbourId, gapY, 'node-configuration'));
        break;
      case 'N':
        constraints.push(alignment('x', hub.id, neighbourId, 'node-configuration'));
        constraints.push(separation('y', neighbourId, hub.id, gapY, 'node-configuration'));
        break;
    }
  }
  return constraints;
}

interface Candidate {
  assignment: DirectionAssignment;
  orderedDirections: Cardinal[];
  cost: number;
}

/** Every k-subset of `items`, as index lists, in lexicographic index order. */
function* combinations(length: number, k: number): Generator<number[]> {
  if (k === 0) {
    yield [];
    return;
  }
  const indices = Array.from({ length: k }, (_, i) => i);
  if (k > length) {
    return;
  }
  for (;;) {
    yield [...indices];
    let i = k - 1;
    while (i >= 0 && indices[i] === length - k + i) {
      i--;
    }
    if (i < 0) {
      return;
    }
    indices[i]++;
    for (let j = i + 1; j < k; j++) {
      indices[j] = indices[j - 1] + 1;
    }
  }
}

/**
 * The direction tuples of size k that are cyclically increasing: pick which
 * k of the four directions to use, then all k rotations of that subset in
 * compass order.
 */
function cyclicDirectionTuples(k: number): Cardinal[][] {
  if (k === 0) {
    return [[]];
  }
  const tuples: Cardinal[][] = [];
  for (const indices of combinations(CARDINALS.length, k)) {
    const subset = indices.map((i) => CARDINALS[i]);
    for (let rotation = 0; rotation < k; rotation++) {
      tuples.push([...subset.slice(rotation), ...subset.slice(0, rotation)]);
    }
  }
  return tuples;
}

/**
 * Exhaustive lexicographic search: largest acceptable assignment, then cheapest.
 *
 * `accepts` is consulted per candidate so a configuration the global constraint
 * system could not satisfy is never committed (guide §12.2). It is more than a
 * feasibility test: an assignment can be perfectly satisfiable and still be
 * wrong, because alignments alone can force two nodes to *coincide*. In K3,3,
 * for instance, two nodes on the same side of the bipartition share three
 * neighbours; configure enough hubs and they end up aligned on both axes, which
 * VPSC is happy to satisfy by putting them in the same place. Rejecting an
 * assignment that projects into an overlap is the same rule guide §18.1 states
 * for opportunistic alignment, and it applies here for the same reason.
 */
export function findBestConfiguration(
  hub: HolaNode,
  sortedNeighbours: NeighbourAngle[],
  nodes: Map<string, HolaNode>,
  clearance: number,
  accepts: (constraints: Constraint[]) => boolean
): HubConfiguration | null {
  const m = sortedNeighbours.length;
  const maxK = Math.min(4, m);

  for (let k = maxK; k >= 1; k--) {
    const candidates: Candidate[] = [];

    for (const indices of combinations(m, k)) {
      const chosen = indices.map((i) => sortedNeighbours[i]);
      for (const directions of cyclicDirectionTuples(k)) {
        let ok = true;
        let cost = 0;
        const assignment: DirectionAssignment = new Map();
        for (let i = 0; i < k; i++) {
          const neighbour = nodes.get(chosen[i].id);
          if (!neighbour || !preservesOrthogonalOrder(hub, neighbour, directions[i])) {
            ok = false;
            break;
          }
          assignment.set(chosen[i].id, directions[i]);
          cost += angularDistance(chosen[i].angle, CARDINAL_ANGLE[directions[i]]);
        }
        if (!ok || !preservesCyclicOrder(directions)) {
          continue;
        }
        candidates.push({ assignment, orderedDirections: directions, cost });
      }
    }

    candidates.sort((a, b) => {
      if (a.cost !== b.cost) {
        return a.cost - b.cost;
      }
      // Deterministic tie-break: compare assigned ids in compass order.
      return describe(a).localeCompare(describe(b));
    });

    for (const candidate of candidates) {
      const constraints = constraintsForConfiguration(hub, candidate.assignment, nodes, clearance);
      if (accepts(constraints)) {
        return { hub: hub.id, assignment: candidate.assignment, constraints, cost: candidate.cost };
      }
    }
  }

  return null;
}

function describe(candidate: Candidate): string {
  return [...candidate.assignment.entries()]
    .map(([id, d]) => `${d}:${id}`)
    .sort()
    .join('|');
}

export interface ConfigureCoreNodesResult {
  configurations: HubConfiguration[];
  /** Neighbour → direction, per hub; consumed by chain configuration. */
  fixedDirections: Map<string, Map<string, Cardinal>>;
}

/**
 * Configure every hub, committing and projecting after each one so later hubs
 * see the geometry the earlier ones produced (guide §12.5).
 */
export function configureCoreNodes(
  nodes: Map<string, HolaNode>,
  adjacency: Map<string, Set<string>>,
  system: ConstraintSystem,
  options: HolaOptions,
  diagnostics: DiagnosticCollector,
  componentId: string
): ConfigureCoreNodesResult {
  const hubs = [...nodes.values()]
    .filter((n) => (adjacency.get(n.id)?.size ?? 0) >= 3)
    .sort((a, b) => {
      const da = adjacency.get(a.id)?.size ?? 0;
      const db = adjacency.get(b.id)?.size ?? 0;
      if (da !== db) {
        return db - da;
      }
      return a.inputOrder - b.inputOrder;
    });

  const configurations: HubConfiguration[] = [];
  const fixedDirections = new Map<string, Map<string, Cardinal>>();

  for (const hub of hubs) {
    let candidates = neighbourAngles(hub, [...(adjacency.get(hub.id) ?? [])], nodes);

    if (candidates.length > options.nodeConfigurationExhaustiveDegreeLimit) {
      diagnostics.report({
        code: 'HOLA_NODE_CONFIG_TRUNCATED',
        stage: 'node-configuration',
        componentId,
        nodeIds: [hub.id],
        message:
          `Hub has degree ${candidates.length}; only the ` +
          `${options.nodeConfigurationExhaustiveDegreeLimit} neighbours closest to a cardinal ` +
          `direction were considered.`,
        detail: { degree: candidates.length },
      });
      candidates = [...candidates]
        .sort((a, b) => cardinalProximity(a.angle) - cardinalProximity(b.angle))
        .slice(0, options.nodeConfigurationExhaustiveDegreeLimit)
        .sort((a, b) => a.angle - b.angle);
    }

    const configuration = findBestConfiguration(
      hub,
      candidates,
      nodes,
      options.nodeClearance,
      (constraints) => acceptsConfiguration(nodes, system, constraints)
    );

    if (!configuration) {
      continue;
    }

    const committed = system.tryAdd(nodes, configuration.constraints);
    if (!committed) {
      diagnostics.report({
        code: 'HOLA_CONSTRAINT_INFEASIBLE',
        stage: 'node-configuration',
        componentId,
        nodeIds: [hub.id],
        message: 'Committing a hub configuration produced an infeasible system; skipped.',
      });
      continue;
    }

    configurations.push(configuration);
    fixedDirections.set(hub.id, configuration.assignment);
  }

  return { configurations, fixedDirections };
}

/**
 * Cheap feasibility first, then a real projection to make sure the assignment
 * does not place two nodes on top of each other. Rolled back either way, so the
 * caller's state is untouched.
 */
function acceptsConfiguration(
  nodes: Map<string, HolaNode>,
  system: ConstraintSystem,
  constraints: Constraint[]
): boolean {
  if (!system.isFeasible(nodes, constraints)) {
    return false;
  }
  const snapshot = system.snapshot(nodes);
  const ids = system.addAll(constraints);
  const projection = system.project(nodes);
  const acceptable = projection.feasible && !hasNodeOverlap(nodes);
  system.remove(ids);
  system.restore(snapshot, nodes);
  return acceptable;
}

function hasNodeOverlap(nodes: Map<string, HolaNode>): boolean {
  const sized = [...nodes.values()].filter((n) => n.width > 0 && n.height > 0);
  for (let i = 0; i < sized.length; i++) {
    for (let j = i + 1; j < sized.length; j++) {
      if (rectsOverlap(nodeBounds(sized[i]), nodeBounds(sized[j]))) {
        return true;
      }
    }
  }
  return false;
}

function cardinalProximity(angle: number): number {
  return Math.min(...CARDINALS.map((d) => angularDistance(angle, CARDINAL_ANGLE[d])));
}
