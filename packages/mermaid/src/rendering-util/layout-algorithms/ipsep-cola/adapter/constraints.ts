import { log } from '../../../../logger.js';
import type { Axis, Position } from '../solver/stress.js';
import type { SeparationConstraint } from '../solver/types.js';
import type { IpsepColaOptions } from '../options.js';
import type { IpsepColaGraph } from './graph.js';
import type { Entity, GroupEntry } from './groups.js';
import { childrenOf, siblingSets } from './groups.js';

export const X_AXIS: Axis = 0;
export const Y_AXIS: Axis = 1;

/**
 * What a constraint is worth when the system turns out to be cyclic.
 *
 * Containment is structural — dropping it lets a node escape its subgraph — so
 * it outranks everything. A flow constraint is the cheapest thing to give up:
 * the edge is still drawn, it just stops dictating an order.
 */
export const PRIORITY_FLOW = 0;
export const PRIORITY_SEPARATION = 1;
export const PRIORITY_CONTAINMENT = 2;

/** A constraint carrying what it costs to drop it. The solver ignores this field. */
export interface PrioritisedConstraint extends SeparationConstraint {
  priority: number;
}

/** Which axis the diagram flows along, and whether edges run along it or against it. */
export interface FlowAxis {
  axis: Axis;
  /** `false` for `BT`/`RL`, where an edge's target sits on the low side. */
  forward: boolean;
}

export function resolveFlowAxis(direction: string | undefined): FlowAxis {
  switch ((direction ?? 'TB').trim().toUpperCase()) {
    case 'LR':
      return { axis: X_AXIS, forward: true };
    case 'RL':
      return { axis: X_AXIS, forward: false };
    case 'BT':
      return { axis: Y_AXIS, forward: false };
    case 'TB':
    case 'TD':
    default:
      return { axis: Y_AXIS, forward: true };
  }
}

// ---------------------------------------------------------------------------
// Entity edges
//
// Every requirement below is "this edge of A must sit at least `gap` before
// that edge of B". A leaf's edges are its centre variable displaced by half its
// size; a group's edges *are* variables. Expressing both as a
// (variable, offset) pair lets one function emit the constraint for any mix.
// ---------------------------------------------------------------------------

interface EdgeRef {
  variable: number;
  offset: number;
}

function halfExtent(graph: IpsepColaGraph, leaf: number, axis: Axis): number {
  const variable = graph.variables[leaf];
  return (axis === X_AXIS ? variable.width : variable.height) / 2;
}

function lowEdge(graph: IpsepColaGraph, entity: Entity, axis: Axis): EdgeRef {
  return entity.kind === 'leaf'
    ? { variable: entity.index, offset: -halfExtent(graph, entity.index, axis) }
    : { variable: graph.groups.groups[entity.index].minIndex, offset: 0 };
}

function highEdge(graph: IpsepColaGraph, entity: Entity, axis: Axis): EdgeRef {
  return entity.kind === 'leaf'
    ? { variable: entity.index, offset: halfExtent(graph, entity.index, axis) }
    : { variable: graph.groups.groups[entity.index].maxIndex, offset: 0 };
}

function edgeValue(positions: readonly Position[], ref: EdgeRef, axis: Axis): number {
  return positions[ref.variable][axis] + ref.offset;
}

/** `before` ends at least `gap` before `after` starts, on `axis`. */
function separate(
  graph: IpsepColaGraph,
  before: Entity,
  after: Entity,
  axis: Axis,
  gap: number,
  priority: number
): PrioritisedConstraint {
  const from = highEdge(graph, before, axis);
  const to = lowEdge(graph, after, axis);
  return {
    left: from.variable,
    right: to.variable,
    gap: from.offset + gap - to.offset,
    priority,
  };
}

// ---------------------------------------------------------------------------
// Containment
// ---------------------------------------------------------------------------

/** Padding inside a group's frame on the low side of `axis`. */
function lowPadding(group: GroupEntry, axis: Axis, options: IpsepColaOptions): number {
  // The cluster title is drawn along the top of the frame, so on the vertical
  // axis the low side has to clear it as well as the ordinary padding.
  return options.groupPadding + (axis === Y_AXIS ? group.titleHeight : 0);
}

/**
 * Keep every child inside its group's frame.
 *
 * These are the constraints that make a subgraph a subgraph. They are static —
 * they never depend on where anything currently is — so they are built once and
 * reused for every iteration, and they carry the highest drop priority.
 */
export function buildContainmentConstraints(
  graph: IpsepColaGraph,
  axis: Axis,
  options: IpsepColaOptions
): PrioritisedConstraint[] {
  const constraints: PrioritisedConstraint[] = [];

  for (const group of graph.groups.groups) {
    const padLow = lowPadding(group, axis, options);
    const padHigh = options.groupPadding;

    for (const child of childrenOf(group)) {
      const low = lowEdge(graph, child, axis);
      const high = highEdge(graph, child, axis);
      // frame.min + padLow <= child.low
      constraints.push({
        left: group.minIndex,
        right: low.variable,
        gap: padLow - low.offset,
        priority: PRIORITY_CONTAINMENT,
      });
      // child.high + padHigh <= frame.max
      constraints.push({
        left: high.variable,
        right: group.maxIndex,
        gap: high.offset + padHigh,
        priority: PRIORITY_CONTAINMENT,
      });
    }

    // A frame never collapses below its own padding, which also keeps the two
    // boundary variables strictly ordered for the tightening spring to pull on.
    constraints.push({
      left: group.minIndex,
      right: group.maxIndex,
      gap: padLow + padHigh,
      priority: PRIORITY_CONTAINMENT,
    });
  }

  return constraints;
}

// ---------------------------------------------------------------------------
// Flow
// ---------------------------------------------------------------------------

/**
 * Directed separation constraints along the flow axis, one per edge.
 *
 * The gap covers both endpoints' extents plus `rankSpacing`, so a satisfied
 * flow constraint already keeps the pair apart on that axis — which is why
 * `buildSeparationConstraints` skips these pairs.
 *
 * Cycles in the edge set would make the system infeasible, so back edges are
 * dropped: the cycle still exists in the drawing, its edge simply does not
 * dictate an ordering.
 */
export function buildFlowConstraints(
  graph: IpsepColaGraph,
  flow: FlowAxis,
  options: IpsepColaOptions
): { constraints: PrioritisedConstraint[]; constrainedPairs: Set<string> } {
  const constraints: PrioritisedConstraint[] = [];
  const constrainedPairs = new Set<string>();

  if (!options.respectDirection) {
    return { constraints, constrainedPairs };
  }

  for (const link of acyclicLinks(graph)) {
    const [low, high] = flow.forward ? [link.source, link.target] : [link.target, link.source];
    constraints.push(separate(graph, low, high, flow.axis, options.rankSpacing, PRIORITY_FLOW));
    constrainedPairs.add(entityPairKey(link.source, link.target));
  }

  return { constraints, constrainedPairs };
}

// ---------------------------------------------------------------------------
// Separation between siblings
//
// Non-overlap is only ever generated between entities that share a parent.
// That is enough: containment puts every node inside its group's frame, so
// separating the frames separates everything they hold. It is also what keeps
// the system close to acyclic — siblings are ordered by their current position,
// which is a total order, and containment is a forest.
// ---------------------------------------------------------------------------

interface Box {
  low: number;
  high: number;
}

function boxOf(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  entity: Entity,
  axis: Axis
): Box {
  return {
    low: edgeValue(positions, lowEdge(graph, entity, axis), axis),
    high: edgeValue(positions, highEdge(graph, entity, axis), axis),
  };
}

/** How deeply two boxes interpenetrate on one axis, including the spacing. */
function penetration(a: Box, b: Box, spacing: number): number {
  return Math.min(a.high + spacing - b.low, b.high + spacing - a.low);
}

/**
 * Non-overlap constraints for one axis, regenerated from the current layout.
 *
 * A pair that currently overlaps on both axes is separated along whichever axis
 * needs the smaller correction; pushing on the other would move things further
 * than necessary. Orientation follows the pair's current order, which is what
 * keeps a freshly generated set free of cycles.
 */
export function buildSeparationConstraints(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  axis: Axis,
  options: IpsepColaOptions,
  skipPairs: ReadonlySet<string>
): PrioritisedConstraint[] {
  const constraints: PrioritisedConstraint[] = [];
  const spacing = options.nodeSpacing;

  for (const siblings of siblingSets(graph.groups)) {
    for (let i = 0; i < siblings.length; i++) {
      for (let j = i + 1; j < siblings.length; j++) {
        const a = siblings[i];
        const b = siblings[j];
        if (skipPairs.has(entityPairKey(a, b))) {
          continue;
        }

        const overlapX = penetration(
          boxOf(graph, positions, a, X_AXIS),
          boxOf(graph, positions, b, X_AXIS),
          spacing
        );
        const overlapY = penetration(
          boxOf(graph, positions, a, Y_AXIS),
          boxOf(graph, positions, b, Y_AXIS),
          spacing
        );
        if (overlapX <= 0 || overlapY <= 0) {
          continue;
        }

        const separateOnX = overlapX <= overlapY;
        if ((axis === X_AXIS) !== separateOnX) {
          continue;
        }

        const boxA = boxOf(graph, positions, a, axis);
        const boxB = boxOf(graph, positions, b, axis);
        const [before, after] = boxA.low <= boxB.low ? [a, b] : [b, a];
        constraints.push(separate(graph, before, after, axis, spacing, PRIORITY_SEPARATION));
      }
    }
  }

  return constraints;
}

/**
 * A constraint set whose projection removes **every** overlap in one pass.
 *
 * `buildSeparationConstraints` only constrains pairs that overlap on both axes,
 * which is the right touch during majorisation but does not converge as a
 * repair: separating one pair shoves its neighbours into fresh overlaps, and
 * the next round plays the same game with different pairs.
 *
 * This is the standard construction instead (Dwyer, Marriott & Stuckey, *Fast
 * Node Overlap Removal*): constrain every sibling pair that shares a band on
 * the **other** axis, whether or not it currently overlaps. Because the
 * projection moves `axis` only, the set of band-sharing pairs cannot change
 * while it runs, so afterwards each pair is either clear on the other axis or
 * separated on this one. Pairs already far enough apart yield satisfied
 * constraints, which cost the projection nothing.
 */
export function buildOverlapRemovalConstraints(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  axis: Axis,
  options: IpsepColaOptions
): PrioritisedConstraint[] {
  const otherAxis = axis === X_AXIS ? Y_AXIS : X_AXIS;
  const constraints: PrioritisedConstraint[] = [];
  const spacing = options.nodeSpacing;

  for (const siblings of siblingSets(graph.groups)) {
    for (let i = 0; i < siblings.length; i++) {
      for (let j = i + 1; j < siblings.length; j++) {
        const a = siblings[i];
        const b = siblings[j];
        const band = penetration(
          boxOf(graph, positions, a, otherAxis),
          boxOf(graph, positions, b, otherAxis),
          spacing
        );
        if (band <= 0) {
          continue;
        }
        const boxA = boxOf(graph, positions, a, axis);
        const boxB = boxOf(graph, positions, b, axis);
        const [before, after] = boxA.low <= boxB.low ? [a, b] : [b, a];
        constraints.push(separate(graph, before, after, axis, spacing, PRIORITY_SEPARATION));
      }
    }
  }

  return constraints;
}

/**
 * Whether any two leaf boxes still overlap.
 *
 * Deliberately checked over *all* leaf pairs rather than siblings only: with
 * containment satisfied the two are equivalent, so a difference means
 * containment itself was not met, and that is worth catching.
 */
export function hasOverlaps(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  options: IpsepColaOptions,
  skipPairs: ReadonlySet<string>
): boolean {
  const spacing = options.nodeSpacing;
  const count = graph.variables.length;

  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const a: Entity = { kind: 'leaf', index: i };
      const b: Entity = { kind: 'leaf', index: j };
      if (skipPairs.has(entityPairKey(a, b))) {
        continue;
      }
      const overlapX = penetration(
        boxOf(graph, positions, a, X_AXIS),
        boxOf(graph, positions, b, X_AXIS),
        spacing
      );
      const overlapY = penetration(
        boxOf(graph, positions, a, Y_AXIS),
        boxOf(graph, positions, b, Y_AXIS),
        spacing
      );
      if (overlapX > 1e-6 && overlapY > 1e-6) {
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Feasibility
// ---------------------------------------------------------------------------

/**
 * Drop constraints until the `left → right` digraph is acyclic.
 *
 * A cyclic separation system has no feasible point, and PROJECT (§4) would keep
 * repairing constraints that break each other. Containment is a forest and a
 * freshly generated separation set follows the current ordering, but their
 * union with the flow constraints can still close a cycle — a node ordered
 * *below* another by an edge while their two subgraph frames are stacked the
 * other way round, for instance.
 *
 * Each cycle is broken at its cheapest constraint, so a flow constraint goes
 * before a separation and containment is never what gives way. Cycles are rare,
 * so the repeated scan costs nothing in practice.
 */
export function removeCyclicConstraints(
  constraints: readonly PrioritisedConstraint[],
  variableCount: number
): PrioritisedConstraint[] {
  let remaining = [...constraints];
  let dropped = 0;

  for (;;) {
    const cycle = findCycle(remaining, variableCount);
    if (!cycle) {
      break;
    }
    let weakest = cycle[0];
    for (const constraint of cycle) {
      if (constraint.priority <= weakest.priority) {
        weakest = constraint;
      }
    }
    remaining = remaining.filter((constraint) => constraint !== weakest);
    dropped++;
  }

  if (dropped > 0) {
    log.debug(`IPSEP-COLA: dropped ${dropped} cyclic separation constraint(s)`);
  }
  return remaining;
}

/** One cycle in the constraint digraph, as the constraints along it. */
function findCycle(
  constraints: readonly PrioritisedConstraint[],
  variableCount: number
): PrioritisedConstraint[] | undefined {
  const outgoing: PrioritisedConstraint[][] = Array.from({ length: variableCount }, () => []);
  for (const constraint of constraints) {
    outgoing[constraint.left].push(constraint);
  }

  const UNVISITED = 0;
  const ON_STACK = 1;
  const DONE = 2;
  const state = new Array<number>(variableCount).fill(UNVISITED);

  for (let root = 0; root < variableCount; root++) {
    if (state[root] !== UNVISITED) {
      continue;
    }
    // Iterative DFS; `via` is the constraint that entered this frame's node, so
    // the stack doubles as the current path.
    const stack: { node: number; next: number; via?: PrioritisedConstraint }[] = [
      { node: root, next: 0 },
    ];
    state[root] = ON_STACK;

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (frame.next >= outgoing[frame.node].length) {
        state[frame.node] = DONE;
        stack.pop();
        continue;
      }

      const constraint = outgoing[frame.node][frame.next++];
      const next = constraint.right;

      if (state[next] === ON_STACK) {
        const start = stack.findIndex((entry) => entry.node === next);
        const path = stack
          .slice(start + 1)
          .map((entry) => entry.via)
          .filter((via): via is PrioritisedConstraint => via !== undefined);
        return [...path, constraint];
      }
      if (state[next] === UNVISITED) {
        state[next] = ON_STACK;
        stack.push({ node: next, next: 0, via: constraint });
      }
    }
  }

  return undefined;
}

/**
 * Key for a pair of leaf variables.
 *
 * Kept in its numeric form because the `grid-like` layout builds on this
 * adapter and keys its own skip sets the same way; {@link entityPairKey} agrees
 * with it exactly for two leaves.
 */
export function pairKey(a: number, b: number): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function entityPairKey(a: Entity, b: Entity): string {
  if (a.kind === 'leaf' && b.kind === 'leaf') {
    return pairKey(a.index, b.index);
  }
  const left = `${a.kind}:${a.index}`;
  const right = `${b.kind}:${b.index}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

/**
 * The link set with cycles broken, as a DFS spanning structure minus its back
 * edges. Deterministic: links are visited in `data4Layout.edges` order.
 */
function acyclicLinks(graph: IpsepColaGraph): { source: Entity; target: Entity }[] {
  const linkList = graph.entityLinks;
  const nodeCount = graph.variableCount;
  const keyOf = (entity: Entity): number =>
    entity.kind === 'leaf' ? entity.index : graph.groups.groups[entity.index].minIndex;

  const outgoing: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const [index, link] of linkList.entries()) {
    outgoing[keyOf(link.source)].push(index);
  }

  const UNVISITED = 0;
  const ON_STACK = 1;
  const DONE = 2;
  const state = new Array<number>(nodeCount).fill(UNVISITED);
  const isBackEdge = new Array<boolean>(linkList.length).fill(false);

  for (let root = 0; root < nodeCount; root++) {
    if (state[root] !== UNVISITED) {
      continue;
    }
    const stack: { node: number; next: number }[] = [{ node: root, next: 0 }];
    state[root] = ON_STACK;

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (frame.next >= outgoing[frame.node].length) {
        state[frame.node] = DONE;
        stack.pop();
        continue;
      }

      const linkIndex = outgoing[frame.node][frame.next++];
      const next = keyOf(linkList[linkIndex].target);

      if (state[next] === ON_STACK) {
        isBackEdge[linkIndex] = true;
      } else if (state[next] === UNVISITED) {
        state[next] = ON_STACK;
        stack.push({ node: next, next: 0 });
      }
    }
  }

  return linkList.filter((_, index) => !isBackEdge[index]);
}
