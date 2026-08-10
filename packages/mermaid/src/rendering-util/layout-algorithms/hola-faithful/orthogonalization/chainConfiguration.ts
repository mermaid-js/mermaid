/**
 * HOLA Step 2b part 2: chain configuration (guide §13).
 *
 * This is the stage that makes HOLA HOLA: a chain of degree-2 links is turned
 * into an orthogonal polyline, and a required 90° turn may be placed *inside an
 * edge* rather than at an existing node (invariant 7). Such a bend becomes a
 * dummy that participates in the constraint system and is recorded as a
 * mandatory waypoint that survives to final routing (invariant 18).
 *
 * Per chain:
 *   1. candidate exit directions at each anchor (§13.2);
 *   2. every minimum-length turn sequence for each direction pair (§13.3);
 *   3. for each required turn, the ordered candidate sites — link nodes *and*
 *      edge interiors (§13.4);
 *   4. a bend-site cost that measures how close the site already is to a
 *      natural ±1 slope, signed by the turn (§13.5);
 *   5. greedy ordered site choice, cheapest total wins, then alignment and
 *      separation constraints, projection, and waypoint provenance (§13.6).
 */

import type { Cardinal, HolaEdge, HolaNode, Point } from '../model.js';
import { DIRECTION_VECTOR, angularDistance } from '../model.js';
import type { Constraint } from '../constraints/types.js';
import { alignment, separation } from '../constraints/types.js';
import { bendDummyId } from '../ids.js';
import type { CoreLayoutState } from '../state.js';
import { makeEntity } from '../state.js';
import type { Chain, OpenChain } from './chains.js';
import { findChains } from './chains.js';
import { enumerateMinimalBendSequences } from './bendSequences.js';
import type { BendSequence } from './bendSequences.js';
import { acaAlign } from './acaAlignment.js';
import { StressModel } from '../stress/stressModel.js';

/** One position along a chain where a turn may be placed. */
type SiteKind = 'node' | 'edge';

interface CandidateSite {
  kind: SiteKind;
  /** Index into the element list (node sites) or the edge list (edge sites). */
  index: number;
}

interface PlannedBend {
  site: CandidateSite;
  cost: number;
}

interface ChainPlan {
  chain: OpenChain;
  sequence: BendSequence;
  bends: PlannedBend[];
  totalCost: number;
}

export interface ChainConfigurationResult {
  /** Bends created inside edges, in chain order. */
  createdBends: string[];
  /** Chains that could not be made orthogonal. */
  failedChains: number;
}

export function configureCoreChains(state: CoreLayoutState): ChainConfigurationResult {
  const chains = findChains(state.core);
  const createdBends: string[] = [];
  let failedChains = 0;

  for (const chain of chains) {
    if (chain.kind === 'closed') {
      configureClosedChain(state, chain.links);
      continue;
    }
    const applied = configureOpenChain(state, chain);
    if (applied === null) {
      failedChains++;
    } else {
      createdBends.push(...applied);
    }
  }

  return { createdBends, failedChains };
}

// ---------------------------------------------------------------------------
// Open chains
// ---------------------------------------------------------------------------

function configureOpenChain(state: CoreLayoutState, chain: OpenChain): string[] | null {
  const { entities, system, options } = state;
  const startAnchor = entities.get(chain.startAnchor);
  const endAnchor = entities.get(chain.endAnchor);
  if (!startAnchor || !endAnchor) {
    return null;
  }

  const elements = [chain.startAnchor, ...chain.links, chain.endAnchor];
  const startCandidates = exitDirectionCandidates(state, chain.startAnchor, elements[1]);
  const endCandidates = exitDirectionCandidates(
    state,
    chain.endAnchor,
    elements[elements.length - 2]
  );

  const delta: Point = { x: endAnchor.x - startAnchor.x, y: endAnchor.y - startAnchor.y };

  let best: { plan: ChainPlan; built: BuiltChain } | null = null;

  for (const startDirection of startCandidates) {
    for (const endExit of endCandidates) {
      // The connector *arrives* at the end anchor travelling opposite to the
      // direction in which that anchor sees the chain leave it.
      const arrival = opposite(endExit);
      for (const sequence of enumerateMinimalBendSequences(delta, startDirection, arrival)) {
        const plan = planChain(state, chain, elements, sequence);
        if (plan === null) {
          continue;
        }
        if (best !== null && plan.totalCost >= best.plan.totalCost) {
          continue;
        }
        const built = buildChainConstraints(state, plan, elements);
        if (built === null) {
          continue;
        }
        if (!system.isFeasible(entities, built.constraints)) {
          continue;
        }
        best = { plan, built };
      }
    }
  }

  if (best === null) {
    state.diagnostics.report({
      code: 'HOLA_CHAIN_SEQUENCE_NOT_FOUND',
      stage: 'chain-configuration',
      componentId: state.componentId,
      nodeIds: elements,
      message: 'No feasible minimal bend sequence for this chain; falling back to ACA alignment.',
    });
    acaAlign(
      entities,
      consecutivePairs(elements),
      system,
      StressModel.neighboursOnly(
        [...state.core.nodes.keys()],
        state.core.adjacency,
        options.baseEdgeLength
      ),
      options.nodeClearance
    );
    return null;
  }

  commitChainPlan(state, elements, best.built);
  return best.built.bendIds;
}

/**
 * Guide §13.2. A direction fixed by node configuration wins; otherwise both
 * cardinal directions consistent with the current relative position of the
 * first link are candidates.
 */
function exitDirectionCandidates(
  state: CoreLayoutState,
  anchorId: string,
  towardsId: string
): Cardinal[] {
  const fixed = state.fixedDirections?.get(anchorId)?.get(towardsId);
  if (fixed) {
    return [fixed];
  }
  const anchor = state.entities.get(anchorId)!;
  const towards = state.entities.get(towardsId)!;
  const horizontal: Cardinal = towards.x >= anchor.x ? 'E' : 'W';
  const vertical: Cardinal = towards.y >= anchor.y ? 'S' : 'N';
  return [horizontal, vertical];
}

function opposite(direction: Cardinal): Cardinal {
  switch (direction) {
    case 'N':
      return 'S';
    case 'S':
      return 'N';
    case 'E':
      return 'W';
    case 'W':
      return 'E';
  }
}

/**
 * Greedy ordered site selection for one bend sequence (guide §13.5).
 *
 * Candidate sites alternate along the chain: edge 0, link 1, edge 1, link 2, …
 * so index 2i is edge i and index 2j−1 is link j. Turns must use strictly
 * increasing site indices.
 */
function planChain(
  state: CoreLayoutState,
  chain: OpenChain,
  elements: string[],
  sequence: BendSequence
): ChainPlan | null {
  const bendCount = sequence.turns.length;
  const edgeCount = elements.length - 1;
  const linkCount = chain.links.length;
  const siteCount = edgeCount + linkCount;
  if (bendCount > siteCount) {
    return null;
  }

  const bends: PlannedBend[] = [];
  let cursor = -1;
  let totalCost = 0;

  for (let t = 0; t < bendCount; t++) {
    const incoming = sequence.directions[t];
    const outgoing = sequence.directions[t + 1];
    const target = naturalSlopeAngle(incoming, outgoing);
    const lastAllowed = siteCount - 1 - (bendCount - 1 - t);

    let chosen: PlannedBend | null = null;
    for (let index = cursor + 1; index <= lastAllowed; index++) {
      const site = siteAt(index);
      const measured = siteSlopeAngle(state, elements, site);
      if (measured === null) {
        continue;
      }
      const cost = angularDistance(measured, target);
      if (chosen === null || cost < chosen.cost) {
        chosen = { site, cost };
      }
    }
    if (chosen === null) {
      return null;
    }
    cursor = siteIndex(chosen.site);
    totalCost += chosen.cost;
    bends.push(chosen);
  }

  return { chain, sequence, bends, totalCost };
}

function siteAt(index: number): CandidateSite {
  return index % 2 === 0
    ? { kind: 'edge', index: index / 2 }
    : { kind: 'node', index: (index + 1) / 2 };
}

function siteIndex(site: CandidateSite): number {
  return site.kind === 'edge' ? site.index * 2 : site.index * 2 - 1;
}

/**
 * The "natural" slope for a turn: the bisector of the incoming and outgoing
 * travel directions, which is a ±45° diagonal. Measuring a site against this
 * angle is exactly "how far its current slope deviates from ±1, with the sign
 * selected by the turn direction".
 */
export function naturalSlopeAngle(incoming: Cardinal, outgoing: Cardinal): number {
  const a = DIRECTION_VECTOR[incoming];
  const b = DIRECTION_VECTOR[outgoing];
  return Math.atan2(a.y + b.y, a.x + b.x);
}

/**
 * The slope a site currently presents, measured in the direction of travel.
 *
 * For an edge site that is the edge's own slope. For a node site it is the
 * slope of the base of the isosceles triangle HOLA builds at the node: unit
 * steps along both incident chain segments, base from the incoming side to the
 * outgoing side.
 */
export function siteSlopeAngle(
  state: CoreLayoutState,
  elements: string[],
  site: CandidateSite
): number | null {
  if (site.kind === 'edge') {
    const a = state.entities.get(elements[site.index]);
    const b = state.entities.get(elements[site.index + 1]);
    if (!a || !b) {
      return null;
    }
    if (a.x === b.x && a.y === b.y) {
      return null;
    }
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  const previous = state.entities.get(elements[site.index - 1]);
  const node = state.entities.get(elements[site.index]);
  const next = state.entities.get(elements[site.index + 1]);
  if (!previous || !node || !next) {
    return null;
  }
  const toPrevious = unit(previous.x - node.x, previous.y - node.y);
  const toNext = unit(next.x - node.x, next.y - node.y);
  if (toPrevious === null || toNext === null) {
    return null;
  }
  const baseX = toNext.x - toPrevious.x;
  const baseY = toNext.y - toPrevious.y;
  if (Math.abs(baseX) < 1e-12 && Math.abs(baseY) < 1e-12) {
    return null;
  }
  return Math.atan2(baseY, baseX);
}

function unit(x: number, y: number): Point | null {
  const length = Math.hypot(x, y);
  if (length < 1e-12) {
    return null;
  }
  return { x: x / length, y: y / length };
}

interface BuiltChain {
  constraints: Constraint[];
  bendIds: string[];
  /** Chain elements with bend dummies inserted, in order. */
  sequenceElements: string[];
  /** Index within `sequenceElements` of each turn. */
  turnIndices: number[];
  /** Prepared bend dummy entities, not yet inserted into the state. */
  pendingBends: { id: string; edgeIndex: number; position: Point }[];
}

function buildChainConstraints(
  state: CoreLayoutState,
  plan: ChainPlan,
  elements: string[]
): BuiltChain | null {
  const sequenceElements: string[] = [];
  const turnIndices: number[] = [];
  const pendingBends: BuiltChain['pendingBends'] = [];
  const bendIds: string[] = [];

  const bendByEdge = new Map<number, PlannedBend>();
  const turnAtNode = new Map<number, number>();
  plan.bends.forEach((bend, order) => {
    if (bend.site.kind === 'edge') {
      bendByEdge.set(bend.site.index, bend);
    } else {
      turnAtNode.set(bend.site.index, order);
    }
  });

  let bendCounter = state.bends.size;

  for (let i = 0; i < elements.length; i++) {
    sequenceElements.push(elements[i]);
    if (turnAtNode.has(i)) {
      turnIndices.push(sequenceElements.length - 1);
    }
    if (i < elements.length - 1 && bendByEdge.has(i)) {
      const a = state.entities.get(elements[i])!;
      const b = state.entities.get(elements[i + 1])!;
      const id = bendDummyId(bendCounter++);
      pendingBends.push({
        id,
        edgeIndex: i,
        position: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      });
      bendIds.push(id);
      sequenceElements.push(id);
      turnIndices.push(sequenceElements.length - 1);
    }
  }

  if (turnIndices.length !== plan.bends.length) {
    return null;
  }

  // Runs: [0 … t₁], [t₁ … t₂], … , [t_b … last]
  const boundaries = [0, ...turnIndices, sequenceElements.length - 1];
  const constraints: Constraint[] = [];
  const sizeOf = (id: string): HolaNode =>
    state.entities.get(id) ?? {
      id,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      inputOrder: 0,
      original: undefined,
    };

  for (let run = 0; run < plan.sequence.directions.length; run++) {
    const direction = plan.sequence.directions[run];
    const from = boundaries[run];
    const to = boundaries[run + 1];
    for (let i = from; i < to; i++) {
      const a = sequenceElements[i];
      const b = sequenceElements[i + 1];
      const na = sizeOf(a);
      const nb = sizeOf(b);
      switch (direction) {
        case 'E':
          constraints.push(alignment('y', a, b, 'chain-configuration'));
          constraints.push(
            separation(
              'x',
              a,
              b,
              (na.width + nb.width) / 2 + state.options.nodeClearance,
              'chain-configuration'
            )
          );
          break;
        case 'W':
          constraints.push(alignment('y', a, b, 'chain-configuration'));
          constraints.push(
            separation(
              'x',
              b,
              a,
              (na.width + nb.width) / 2 + state.options.nodeClearance,
              'chain-configuration'
            )
          );
          break;
        case 'S':
          constraints.push(alignment('x', a, b, 'chain-configuration'));
          constraints.push(
            separation(
              'y',
              a,
              b,
              (na.height + nb.height) / 2 + state.options.nodeClearance,
              'chain-configuration'
            )
          );
          break;
        case 'N':
          constraints.push(alignment('x', a, b, 'chain-configuration'));
          constraints.push(
            separation(
              'y',
              b,
              a,
              (na.height + nb.height) / 2 + state.options.nodeClearance,
              'chain-configuration'
            )
          );
          break;
      }
    }
  }

  return { constraints, bendIds, sequenceElements, turnIndices, pendingBends };
}

function commitChainPlan(state: CoreLayoutState, elements: string[], built: BuiltChain): void {
  // Materialise the edge-interior bends before the constraints reference them.
  for (const pending of built.pendingBends) {
    state.entities.set(pending.id, makeEntity(pending.id, pending.position.x, pending.position.y));
    const edge = topologicalEdgeBetween(
      state,
      elements[pending.edgeIndex],
      elements[pending.edgeIndex + 1]
    );
    state.bends.set(pending.id, {
      id: pending.id,
      edgeId: edge?.id ?? '',
      order: orderAlongEdge(edge, elements[pending.edgeIndex]),
    });
  }

  const committed = state.system.tryAdd(state.entities, built.constraints);
  if (!committed) {
    state.diagnostics.report({
      code: 'HOLA_CONSTRAINT_INFEASIBLE',
      stage: 'chain-configuration',
      componentId: state.componentId,
      nodeIds: elements,
      message: 'Chain constraints could not be satisfied after commit.',
    });
  }

  // Record every deliberate bend as a mandatory waypoint on its original edge.
  for (const pending of built.pendingBends) {
    const edge = topologicalEdgeBetween(
      state,
      elements[pending.edgeIndex],
      elements[pending.edgeIndex + 1]
    );
    if (!edge) {
      continue;
    }
    const entity = state.entities.get(pending.id)!;
    // The id is the bend *entity* id: the bend keeps moving with the constraint
    // system, so final routing re-reads its position rather than trusting the
    // coordinates captured here.
    edge.mandatoryWaypoints.push({
      id: pending.id,
      edgeId: edge.id,
      order: edge.mandatoryWaypoints.length,
      x: entity.x,
      y: entity.y,
      source: 'chain-aesthetic-bend',
    });
  }
}

function topologicalEdgeBetween(
  state: CoreLayoutState,
  a: string,
  b: string
): HolaEdge | undefined {
  for (const edge of state.core.edges.values()) {
    if ((edge.source === a && edge.target === b) || (edge.source === b && edge.target === a)) {
      return edge;
    }
  }
  return undefined;
}

function orderAlongEdge(edge: HolaEdge | undefined, fromElement: string): number {
  if (!edge) {
    return 0;
  }
  return edge.source === fromElement ? 0 : 1;
}

function consecutivePairs(elements: string[]): { a: string; b: string }[] {
  const pairs: { a: string; b: string }[] = [];
  for (let i = 0; i < elements.length - 1; i++) {
    pairs.push({ a: elements[i], b: elements[i + 1] });
  }
  return pairs;
}

// ---------------------------------------------------------------------------
// Closed chains
// ---------------------------------------------------------------------------

function configureClosedChain(state: CoreLayoutState, links: string[]): void {
  state.diagnostics.report({
    code: 'HOLA_CLOSED_CHAIN_CYCLE',
    stage: 'chain-configuration',
    componentId: state.componentId,
    nodeIds: links,
    message: 'Anchorless degree-2 cycle: orthogonalised with the ACA alignment path.',
  });

  const edges: { a: string; b: string }[] = [];
  for (let i = 0; i < links.length; i++) {
    edges.push({ a: links[i], b: links[(i + 1) % links.length] });
  }

  acaAlign(
    state.entities,
    edges,
    state.system,
    StressModel.neighboursOnly(
      [...state.core.nodes.keys()],
      state.core.adjacency,
      state.options.baseEdgeLength
    ),
    state.options.nodeClearance
  );
}

/** Re-exported so the pipeline can pass the node-configuration result through. */
export type ChainKind = Chain['kind'];
