import {
  GridRoutingResourceLimitError,
  type GridRoutingInstrumentation,
} from './routerInstrumentation.js';
import type {
  ContainerRoutingTopology,
  GridOrientation,
  GridSide,
  RouterArc,
  RouterObstacle,
  RouterPoint,
  RouterRect,
  RouterVertex,
} from './types.js';

export type RouterTupleCost = [
  length: number,
  bends: number,
  boundaryTransitions: number,
  occupiedLength: number,
  crossings: number,
  endpointCandidateRank: number,
];

export interface RouterSearchResult {
  points: RouterPoint[];
  vertexIds: number[];
  cost: RouterTupleCost;
}

export interface RouterSearchCaps {
  maxExpandedStates?: number;
  maxInvocationExpandedStates?: number;
  maxEstimatedBytes?: number;
}

export interface RouterSearchBudget {
  expandedStates: number;
}

export interface RouterSearchOptions {
  metrics?: GridRoutingInstrumentation;
  caps?: RouterSearchCaps;
  endpointCandidateRank?: number;
  recordOutcome?: boolean;
  budget?: RouterSearchBudget;
  initialOrientation?: GridOrientation;
  initialSide?: GridSide;
  initialLength?: number;
  targetOrientation?: GridOrientation;
  targetSide?: GridSide;
  targetLength?: number;
  topologyValidated?: boolean;
  workspace?: RouterSearchWorkspace;
  heuristic?: 'bend-aware' | 'zero';
  queueOrder?: 'canonical' | 'reverse';
  estimatedBytesBase?: number;
  arcAllowed?: (from: RouterPoint, to: RouterPoint) => boolean;
}

const DEFAULT_MAX_EDGE_STATES = 100_000;
const DEFAULT_MAX_INVOCATION_STATES = 2_000_000;

export class RouterSearchWorkspace {
  stateVertices = new Int32Array(256);
  orientations = new Uint8Array(256);
  gLengths = new Float64Array(256);
  gBends = new Float64Array(256);
  gBoundaryTransitions = new Float64Array(256);
  gOccupiedLengths = new Float64Array(256);
  gCrossings = new Float64Array(256);
  fLengths = new Float64Array(256);
  fBends = new Float64Array(256);
  predecessors = new Int32Array(256);
  depths = new Int32Array(256);
  ancestor4 = new Int32Array(256);
  best = new Int32Array(256);
  heapChildren = new Int32Array(256);
  heapSiblings = new Int32Array(256);
  heapPairs: number[] = [];

  reset(vertexCount: number): void {
    const bestLength = vertexCount * 3;
    if (this.best.length < bestLength) {
      this.best = new Int32Array(bestLength);
    }
    this.best.fill(-1, 0, bestLength);
    this.heapPairs.length = 0;
  }

  ensureStateCapacity(required: number): void {
    if (this.stateVertices.length >= required) {
      return;
    }
    const capacity = Math.max(required, this.stateVertices.length * 2);
    this.stateVertices = growTypedArray(this.stateVertices, capacity);
    this.orientations = growTypedArray(this.orientations, capacity);
    this.gLengths = growTypedArray(this.gLengths, capacity);
    this.gBends = growTypedArray(this.gBends, capacity);
    this.gBoundaryTransitions = growTypedArray(this.gBoundaryTransitions, capacity);
    this.gOccupiedLengths = growTypedArray(this.gOccupiedLengths, capacity);
    this.gCrossings = growTypedArray(this.gCrossings, capacity);
    this.fLengths = growTypedArray(this.fLengths, capacity);
    this.fBends = growTypedArray(this.fBends, capacity);
    this.predecessors = growTypedArray(this.predecessors, capacity);
    this.depths = growTypedArray(this.depths, capacity);
    this.ancestor4 = growTypedArray(this.ancestor4, capacity);
    this.heapChildren = growTypedArray(this.heapChildren, capacity);
    this.heapSiblings = growTypedArray(this.heapSiblings, capacity);
  }

  estimatedBytes(): number {
    return (
      this.stateVertices.byteLength +
      this.orientations.byteLength +
      this.gLengths.byteLength +
      this.gBends.byteLength +
      this.gBoundaryTransitions.byteLength +
      this.gOccupiedLengths.byteLength +
      this.gCrossings.byteLength +
      this.fLengths.byteLength +
      this.fBends.byteLength +
      this.predecessors.byteLength +
      this.depths.byteLength +
      this.ancestor4.byteLength +
      this.best.byteLength +
      this.heapChildren.byteLength +
      this.heapSiblings.byteLength +
      this.heapPairs.length * 8
    );
  }
}

function growTypedArray<T extends Int32Array | Uint8Array | Float64Array>(
  values: T,
  capacity: number
): T {
  const grown = new (values.constructor as new (length: number) => T)(capacity);
  grown.set(values);
  return grown;
}
export function compareTupleCost(a: RouterTupleCost, b: RouterTupleCost): number {
  for (let index = 0; index < 6; index++) {
    if (a[index] < b[index]) {
      return -1;
    }
    if (a[index] > b[index]) {
      return 1;
    }
  }
  return 0;
}

export function addTupleCost(a: RouterTupleCost, b: RouterTupleCost): RouterTupleCost {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3], a[4] + b[4], a[5] + b[5]];
}

function minimumBends(
  dx: number,
  dy: number,
  incomingOrientation?: GridOrientation,
  targetOrientation?: GridOrientation
): number {
  if (dx === 0 && dy === 0) {
    return incomingOrientation && targetOrientation
      ? Number(incomingOrientation !== targetOrientation)
      : 0;
  }
  if (dx === 0) {
    return (
      (incomingOrientation ? Number(incomingOrientation !== 'V') : 0) +
      (targetOrientation ? Number(targetOrientation !== 'V') : 0)
    );
  }
  if (dy === 0) {
    return (
      (incomingOrientation ? Number(incomingOrientation !== 'H') : 0) +
      (targetOrientation ? Number(targetOrientation !== 'H') : 0)
    );
  }
  return Math.min(
    (incomingOrientation ? Number(incomingOrientation !== 'H') : 0) +
      1 +
      (targetOrientation ? Number(targetOrientation !== 'V') : 0),
    (incomingOrientation ? Number(incomingOrientation !== 'V') : 0) +
      1 +
      (targetOrientation ? Number(targetOrientation !== 'H') : 0)
  );
}

export function tupleHeuristic(
  from: RouterPoint,
  to: RouterPoint,
  incomingOrientation?: GridOrientation,
  targetOrientation?: GridOrientation
): RouterTupleCost {
  const dx = Math.abs(from.x - to.x);
  const dy = Math.abs(from.y - to.y);
  const bends = minimumBends(dx, dy, incomingOrientation, targetOrientation);
  return [dx + dy, bends, 0, 0, 0, 0];
}

function orientationOrdinal(orientation: GridOrientation | undefined): number {
  return orientation === undefined ? 0 : orientation === 'H' ? 1 : 2;
}

function movesTowardOwner(from: RouterPoint, to: RouterPoint, side: GridSide): boolean {
  return side === 'left'
    ? from.y === to.y && to.x > from.x
    : side === 'right'
      ? from.y === to.y && to.x < from.x
      : side === 'top'
        ? from.x === to.x && to.y > from.y
        : from.x === to.x && to.y < from.y;
}

function stateIndex(vertexId: number, orientation: GridOrientation | undefined): number {
  return vertexId * 3 + orientationOrdinal(orientation);
}

function normalizePoints(points: readonly RouterPoint[]): RouterPoint[] {
  const result: RouterPoint[] = [];
  for (const point of points) {
    const previous = result.at(-1);
    if (previous && previous.x === point.x && previous.y === point.y) {
      continue;
    }
    const beforePrevious = result.at(-2);
    if (
      beforePrevious &&
      previous &&
      ((beforePrevious.x === previous.x && previous.x === point.x) ||
        (beforePrevious.y === previous.y && previous.y === point.y))
    ) {
      result[result.length - 1] = { ...point };
    } else {
      result.push({ ...point });
    }
  }
  return result;
}

function reconstruct(
  stateId: number,
  stateVertices: ArrayLike<number>,
  predecessors: ArrayLike<number>,
  cost: RouterTupleCost,
  vertexAt: (id: number) => RouterVertex
): RouterSearchResult {
  const vertexIds: number[] = [];
  let current = stateId;
  while (current >= 0) {
    vertexIds.push(stateVertices[current]);
    current = predecessors[current];
  }
  vertexIds.reverse();
  return {
    points: normalizePoints(vertexIds.map((id) => vertexAt(id).point)),
    vertexIds,
    cost,
  };
}

function validateSearchTopology(
  topology: Pick<ContainerRoutingTopology, 'vertices' | 'adjacency'>
): void {
  for (const vertex of topology.vertices) {
    if (
      vertex.id < 0 ||
      topology.vertices[vertex.id] !== vertex ||
      !Number.isFinite(vertex.point.x) ||
      !Number.isFinite(vertex.point.y)
    ) {
      throw new Error('Malformed grid routing vertex');
    }
    for (const arc of topology.adjacency.get(vertex.id) ?? []) {
      const target = topology.vertices[arc.to];
      const aligned =
        target &&
        (arc.orientation === 'H'
          ? vertex.point.y === target.point.y
          : vertex.point.x === target.point.x);
      const length = target
        ? Math.abs(vertex.point.x - target.point.x) + Math.abs(vertex.point.y - target.point.y)
        : Number.NaN;
      if (
        arc.from !== vertex.id ||
        !aligned ||
        !Number.isFinite(arc.length) ||
        arc.length <= 0 ||
        arc.length !== length
      ) {
        throw new Error('Malformed grid routing arc');
      }
    }
  }
}

function search(
  topology: Pick<ContainerRoutingTopology, 'vertices' | 'adjacency'> &
    Partial<
      Pick<
        ContainerRoutingTopology,
        | 'adjacencyByVertex'
        | 'searchAdjacencyByVertex'
        | 'vertexCount'
        | 'getVertex'
        | 'getSearchArcs'
      >
    >,
  sourceId: number,
  targetId: number,
  options: RouterSearchOptions,
  useHeuristic: boolean
): RouterSearchResult | undefined {
  const vertexAt = (id: number): RouterVertex => {
    const vertex = topology.getVertex?.(id) ?? topology.vertices[id];
    if (!vertex) {
      throw new Error(`Missing grid routing vertex ${id}`);
    }
    return vertex;
  };
  const source = vertexAt(sourceId);
  const target = vertexAt(targetId);
  if (!source || !target) {
    throw new Error('Grid routing search source and target must be topology vertices');
  }
  if (!options.topologyValidated) {
    validateSearchTopology(topology);
  }

  const metrics = options.metrics;
  if (metrics) {
    metrics.searches++;
  }
  const workspace = options.workspace ?? new RouterSearchWorkspace();
  workspace.reset(topology.vertexCount ?? topology.vertices.length);
  let stateVertices = workspace.stateVertices;
  let orientations = workspace.orientations;
  let gLengths = workspace.gLengths;
  let gBends = workspace.gBends;
  let gBoundaryTransitions = workspace.gBoundaryTransitions;
  let gOccupiedLengths = workspace.gOccupiedLengths;
  let gCrossings = workspace.gCrossings;
  let fLengths = workspace.fLengths;
  let fBends = workspace.fBends;
  let predecessors = workspace.predecessors;
  let depths = workspace.depths;
  let ancestor4 = workspace.ancestor4;
  let heapChildren = workspace.heapChildren;
  let heapSiblings = workspace.heapSiblings;
  const best = workspace.best;
  const heapPairs = workspace.heapPairs;
  let stateCount = 1;
  const endpointCandidateRank = options.endpointCandidateRank ?? 0;
  const useBendHeuristic = useHeuristic && options.heuristic !== 'zero';
  function nonCostOrder(a: number, b: number): number {
    return (
      stateVertices[a] - stateVertices[b] ||
      orientations[a] - orientations[b] ||
      predecessors[a] - predecessors[b] ||
      a - b
    );
  }
  function compareStates(a: number, b: number): number {
    return (
      fLengths[a] - fLengths[b] ||
      fBends[a] - fBends[b] ||
      gBoundaryTransitions[a] - gBoundaryTransitions[b] ||
      gOccupiedLengths[a] - gOccupiedLengths[b] ||
      gCrossings[a] - gCrossings[b] ||
      (options.queueOrder === 'reverse' ? -nonCostOrder(a, b) : nonCostOrder(a, b))
    );
  }
  function compareChains(a: number, b: number): number {
    if (a === b) {
      return 0;
    }
    if (a < 0) {
      return -1;
    }
    if (b < 0) {
      return 1;
    }
    const aDepth = depths[a];
    const bDepth = depths[b];
    let alignedA = a;
    let alignedB = b;
    while (depths[alignedA] > depths[alignedB]) {
      alignedA = predecessors[alignedA];
    }
    while (depths[alignedB] > depths[alignedA]) {
      alignedB = predecessors[alignedB];
    }
    if (alignedA === alignedB) {
      return aDepth - bDepth;
    }
    while (
      ancestor4[alignedA] >= 0 &&
      ancestor4[alignedB] >= 0 &&
      ancestor4[alignedA] !== ancestor4[alignedB]
    ) {
      alignedA = ancestor4[alignedA];
      alignedB = ancestor4[alignedB];
    }
    while (predecessors[alignedA] !== predecessors[alignedB]) {
      alignedA = predecessors[alignedA];
      alignedB = predecessors[alignedB];
    }
    return (
      stateVertices[alignedA] - stateVertices[alignedB] ||
      orientations[alignedA] - orientations[alignedB]
    );
  }
  let heapRoot = -1;
  let heapSize = 0;
  function heapMeld(first: number, second: number): number {
    if (first < 0) {
      return second;
    }
    if (second < 0) {
      return first;
    }
    if (compareStates(first, second) <= 0) {
      heapSiblings[second] = heapChildren[first];
      heapChildren[first] = second;
      return first;
    }
    heapSiblings[first] = heapChildren[second];
    heapChildren[second] = first;
    return second;
  }
  const heapPush = (value: number): void => {
    heapChildren[value] = -1;
    heapSiblings[value] = -1;
    heapRoot = heapMeld(heapRoot, value);
    heapSize++;
  };
  const heapPop = (): number | undefined => {
    if (heapRoot < 0) {
      return undefined;
    }
    const first = heapRoot;
    heapPairs.length = 0;
    let child = heapChildren[first];
    while (child >= 0) {
      const next = heapSiblings[child];
      heapSiblings[child] = -1;
      heapPairs.push(child);
      child = next;
    }
    for (let index = 0; index + 1 < heapPairs.length; index += 2) {
      heapPairs[index >>> 1] = heapMeld(heapPairs[index], heapPairs[index + 1]);
    }
    let pairCount = Math.ceil(heapPairs.length / 2);
    if (heapPairs.length % 2 !== 0) {
      heapPairs[pairCount - 1] = heapPairs[heapPairs.length - 1];
    }
    heapRoot = -1;
    while (pairCount > 0) {
      heapRoot = heapMeld(heapPairs[--pairCount], heapRoot);
    }
    heapSize--;
    return first;
  };
  let expandedThisSearch = 0;
  const edgeCap = options.caps?.maxExpandedStates ?? DEFAULT_MAX_EDGE_STATES;
  const invocationCap = options.caps?.maxInvocationExpandedStates ?? DEFAULT_MAX_INVOCATION_STATES;
  const invocationStart = options.budget?.expandedStates ?? metrics?.expandedStates ?? 0;
  const recordWorkspaceBytes = (): void => {
    const bytes = workspace.estimatedBytes();
    const totalBytes = (options.estimatedBytesBase ?? 0) + bytes;
    if (metrics) {
      metrics.searchWorkspaceBytes = Math.max(metrics.searchWorkspaceBytes, bytes);
      metrics.estimatedBytes = Math.max(metrics.estimatedBytes, totalBytes);
    }
    if (totalBytes > (options.caps?.maxEstimatedBytes ?? Number.POSITIVE_INFINITY)) {
      throw new GridRoutingResourceLimitError(
        'estimated_memory_cap',
        'Grid routing search workspace memory cap exceeded'
      );
    }
  };
  recordWorkspaceBytes();
  const commitExpandedStates = (): void => {
    if (options.budget) {
      options.budget.expandedStates += expandedThisSearch;
    }
    if (metrics) {
      metrics.expandedStates += expandedThisSearch;
    }
  };
  const initialLength = options.initialLength ?? 0;
  stateVertices[0] = sourceId;
  orientations[0] = orientationOrdinal(options.initialOrientation);
  gLengths[0] = initialLength;
  gBends[0] = 0;
  gBoundaryTransitions[0] = 0;
  gOccupiedLengths[0] = 0;
  gCrossings[0] = 0;
  const initialDx = Math.abs(source.point.x - target.point.x);
  const initialDy = Math.abs(source.point.y - target.point.y);
  fLengths[0] = initialLength + (useBendHeuristic ? initialDx + initialDy : 0);
  fBends[0] = useBendHeuristic
    ? minimumBends(initialDx, initialDy, options.initialOrientation, options.targetOrientation)
    : 0;
  predecessors[0] = -1;
  depths[0] = 1;
  ancestor4[0] = -1;
  best[stateIndex(sourceId, options.initialOrientation)] = 0;
  heapPush(0);
  if (metrics) {
    metrics.maxOpenSet = Math.max(metrics.maxOpenSet, heapSize);
  }
  let bestGoalState = -1;
  let bestGoalCost: RouterTupleCost | undefined;
  const considerGoal = (state: number): void => {
    const completedCost: RouterTupleCost = [
      gLengths[state] + (options.targetLength ?? 0),
      gBends[state] +
        (options.targetOrientation !== undefined &&
        orientations[state] !== 0 &&
        orientationOrdinal(options.targetOrientation) !== orientations[state]
          ? 1
          : 0),
      gBoundaryTransitions[state],
      gOccupiedLengths[state],
      gCrossings[state],
      endpointCandidateRank,
    ];
    if (
      !bestGoalCost ||
      compareTupleCost(completedCost, bestGoalCost) < 0 ||
      (compareTupleCost(completedCost, bestGoalCost) === 0 &&
        compareChains(state, bestGoalState) < 0)
    ) {
      bestGoalState = state;
      bestGoalCost = completedCost;
    }
  };

  while (heapSize > 0) {
    const next = heapRoot;
    if (
      bestGoalCost &&
      (fLengths[next] - bestGoalCost[0] ||
        fBends[next] - bestGoalCost[1] ||
        gBoundaryTransitions[next] - bestGoalCost[2] ||
        gOccupiedLengths[next] - bestGoalCost[3] ||
        gCrossings[next] - bestGoalCost[4] ||
        endpointCandidateRank - bestGoalCost[5]) > 0
    ) {
      break;
    }
    const current = heapPop()!;
    if (best[stateVertices[current] * 3 + orientations[current]] !== current) {
      continue;
    }
    if (expandedThisSearch >= edgeCap || invocationStart + expandedThisSearch >= invocationCap) {
      commitExpandedStates();
      throw new GridRoutingResourceLimitError(
        'search_state_cap',
        'Grid routing search-state cap exceeded'
      );
    }
    expandedThisSearch++;

    if (stateVertices[current] === targetId) {
      considerGoal(current);
      continue;
    }

    const vertexId = stateVertices[current];
    const compactArcs =
      topology.getSearchArcs?.(vertexId) ?? topology.searchAdjacencyByVertex?.[vertexId];
    if (compactArcs) {
      for (const arc of compactArcs) {
        if (
          options.arcAllowed &&
          !options.arcAllowed(vertexAt(vertexId).point, vertexAt(arc.to).point)
        ) {
          continue;
        }
        if (
          options.initialSide &&
          predecessors[current] < 0 &&
          movesTowardOwner(vertexAt(vertexId).point, vertexAt(arc.to).point, options.initialSide)
        ) {
          continue;
        }
        if (
          options.targetSide &&
          arc.to === targetId &&
          movesTowardOwner(target.point, vertexAt(vertexId).point, options.targetSide)
        ) {
          continue;
        }
        const orientation = arc.orientationOrdinal;
        const index = arc.to * 3 + orientation;
        const previous = best[index];
        const length = gLengths[current] + arc.length;
        const bends =
          gBends[current] +
          (orientations[current] !== 0 && orientations[current] !== orientation ? 1 : 0);
        const boundaryTransitions = gBoundaryTransitions[current] + arc.boundaryTransitions;
        const occupiedLength = gOccupiedLengths[current] + arc.occupiedLength;
        const crossings = gCrossings[current] + arc.crossings;
        const previousComparison =
          previous >= 0
            ? length - gLengths[previous] ||
              bends - gBends[previous] ||
              boundaryTransitions - gBoundaryTransitions[previous] ||
              occupiedLength - gOccupiedLengths[previous] ||
              crossings - gCrossings[previous]
            : -1;
        if (
          previous >= 0 &&
          (previousComparison > 0 ||
            (previousComparison === 0 && compareChains(current, predecessors[previous]) >= 0))
        ) {
          continue;
        }
        const candidate = stateCount++;
        if (stateCount > stateVertices.length) {
          workspace.ensureStateCapacity(stateCount);
          stateVertices = workspace.stateVertices;
          orientations = workspace.orientations;
          gLengths = workspace.gLengths;
          gBends = workspace.gBends;
          gBoundaryTransitions = workspace.gBoundaryTransitions;
          gOccupiedLengths = workspace.gOccupiedLengths;
          gCrossings = workspace.gCrossings;
          fLengths = workspace.fLengths;
          fBends = workspace.fBends;
          predecessors = workspace.predecessors;
          depths = workspace.depths;
          ancestor4 = workspace.ancestor4;
          heapChildren = workspace.heapChildren;
          heapSiblings = workspace.heapSiblings;
          recordWorkspaceBytes();
        }
        stateVertices[candidate] = arc.to;
        orientations[candidate] = orientation;
        gLengths[candidate] = length;
        gBends[candidate] = bends;
        gBoundaryTransitions[candidate] = boundaryTransitions;
        gOccupiedLengths[candidate] = occupiedLength;
        gCrossings[candidate] = crossings;
        const candidatePoint = vertexAt(arc.to).point;
        const candidateDx = Math.abs(candidatePoint.x - target.point.x);
        const candidateDy = Math.abs(candidatePoint.y - target.point.y);
        fLengths[candidate] = length + (useBendHeuristic ? candidateDx + candidateDy : 0);
        fBends[candidate] =
          bends +
          (useBendHeuristic
            ? minimumBends(
                candidateDx,
                candidateDy,
                orientation === 1 ? 'H' : 'V',
                options.targetOrientation
              )
            : 0);
        predecessors[candidate] = current;
        depths[candidate] = depths[current] + 1;
        const parent2 = predecessors[current];
        const parent3 = parent2 >= 0 ? predecessors[parent2] : -1;
        ancestor4[candidate] = parent3 >= 0 ? predecessors[parent3] : -1;
        best[index] = candidate;
        heapPush(candidate);
      }
    } else {
      for (const arc of topology.adjacencyByVertex?.[vertexId] ??
        topology.adjacency.get(vertexId) ??
        []) {
        if (
          options.arcAllowed &&
          !options.arcAllowed(vertexAt(vertexId).point, vertexAt(arc.to).point)
        ) {
          continue;
        }
        if (
          options.initialSide &&
          predecessors[current] < 0 &&
          movesTowardOwner(vertexAt(vertexId).point, vertexAt(arc.to).point, options.initialSide)
        ) {
          continue;
        }
        if (
          options.targetSide &&
          arc.to === targetId &&
          movesTowardOwner(target.point, vertexAt(vertexId).point, options.targetSide)
        ) {
          continue;
        }
        const orientation = orientationOrdinal(arc.orientation);
        const index = arc.to * 3 + orientation;
        const previous = best[index];
        const length = gLengths[current] + arc.length;
        const bends =
          gBends[current] +
          (orientations[current] !== 0 && orientations[current] !== orientation ? 1 : 0);
        const boundaryTransitions = gBoundaryTransitions[current] + (arc.kind === 'portal' ? 1 : 0);
        const occupiedLength = gOccupiedLengths[current] + (arc.occupiedLength ?? 0);
        const crossings = gCrossings[current] + (arc.crossingCount ?? 0);
        const previousComparison =
          previous >= 0
            ? length - gLengths[previous] ||
              bends - gBends[previous] ||
              boundaryTransitions - gBoundaryTransitions[previous] ||
              occupiedLength - gOccupiedLengths[previous] ||
              crossings - gCrossings[previous]
            : -1;
        if (
          previous >= 0 &&
          (previousComparison > 0 ||
            (previousComparison === 0 && compareChains(current, predecessors[previous]) >= 0))
        ) {
          continue;
        }
        const candidate = stateCount++;
        if (stateCount > stateVertices.length) {
          workspace.ensureStateCapacity(stateCount);
          stateVertices = workspace.stateVertices;
          orientations = workspace.orientations;
          gLengths = workspace.gLengths;
          gBends = workspace.gBends;
          gBoundaryTransitions = workspace.gBoundaryTransitions;
          gOccupiedLengths = workspace.gOccupiedLengths;
          gCrossings = workspace.gCrossings;
          fLengths = workspace.fLengths;
          fBends = workspace.fBends;
          predecessors = workspace.predecessors;
          depths = workspace.depths;
          ancestor4 = workspace.ancestor4;
          heapChildren = workspace.heapChildren;
          heapSiblings = workspace.heapSiblings;
          recordWorkspaceBytes();
        }
        stateVertices[candidate] = arc.to;
        orientations[candidate] = orientation;
        gLengths[candidate] = length;
        gBends[candidate] = bends;
        gBoundaryTransitions[candidate] = boundaryTransitions;
        gOccupiedLengths[candidate] = occupiedLength;
        gCrossings[candidate] = crossings;
        const candidatePoint = vertexAt(arc.to).point;
        const candidateDx = Math.abs(candidatePoint.x - target.point.x);
        const candidateDy = Math.abs(candidatePoint.y - target.point.y);
        fLengths[candidate] = length + (useBendHeuristic ? candidateDx + candidateDy : 0);
        fBends[candidate] =
          bends +
          (useBendHeuristic
            ? minimumBends(candidateDx, candidateDy, arc.orientation, options.targetOrientation)
            : 0);
        predecessors[candidate] = current;
        depths[candidate] = depths[current] + 1;
        const parent2 = predecessors[current];
        const parent3 = parent2 >= 0 ? predecessors[parent2] : -1;
        ancestor4[candidate] = parent3 >= 0 ? predecessors[parent3] : -1;
        best[index] = candidate;
        heapPush(candidate);
      }
    }
    if (metrics) {
      metrics.maxOpenSet = Math.max(metrics.maxOpenSet, heapSize);
    }
  }

  if (bestGoalState < 0 || !bestGoalCost) {
    commitExpandedStates();
    if (metrics && options.recordOutcome !== false) {
      metrics.routesImpossible++;
    }
    return undefined;
  }
  if (metrics && options.recordOutcome !== false) {
    metrics.routesFound++;
  }
  commitExpandedStates();
  return reconstruct(bestGoalState, stateVertices, predecessors, bestGoalCost, vertexAt);
}

export function findShortestRoute(
  topology: Pick<ContainerRoutingTopology, 'vertices' | 'adjacency'> &
    Partial<
      Pick<
        ContainerRoutingTopology,
        | 'adjacencyByVertex'
        | 'searchAdjacencyByVertex'
        | 'vertexCount'
        | 'getVertex'
        | 'getSearchArcs'
      >
    >,
  sourceId: number,
  targetId: number,
  options: RouterSearchOptions = {}
): RouterSearchResult | undefined {
  return search(topology, sourceId, targetId, options, true);
}

interface DenseOracleInput {
  bounds: RouterRect;
  obstacles: readonly RouterObstacle[];
  source: RouterPoint;
  target: RouterPoint;
}

function isBlockedPoint(point: RouterPoint, obstacles: readonly RouterObstacle[]): boolean {
  return obstacles.some(
    (obstacle) =>
      point.x > obstacle.left &&
      point.x < obstacle.right &&
      point.y > obstacle.top &&
      point.y < obstacle.bottom
  );
}

function segmentBlocked(
  orientation: GridOrientation,
  fixed: number,
  start: number,
  end: number,
  obstacles: readonly RouterObstacle[]
): boolean {
  const low = Math.min(start, end);
  const high = Math.max(start, end);
  return obstacles.some((obstacle) =>
    orientation === 'H'
      ? fixed > obstacle.top &&
        fixed < obstacle.bottom &&
        high > obstacle.left &&
        low < obstacle.right
      : fixed > obstacle.left &&
        fixed < obstacle.right &&
        high > obstacle.top &&
        low < obstacle.bottom
  );
}

export function findDenseOracleRoute(input: DenseOracleInput): RouterSearchResult | undefined {
  const xs = [
    ...new Set([
      input.bounds.left,
      input.bounds.right,
      input.source.x,
      input.target.x,
      ...input.obstacles.flatMap(({ left, right }) => [left, right]),
    ]),
  ].sort((a, b) => a - b);
  const ys = [
    ...new Set([
      input.bounds.top,
      input.bounds.bottom,
      input.source.y,
      input.target.y,
      ...input.obstacles.flatMap(({ top, bottom }) => [top, bottom]),
    ]),
  ].sort((a, b) => a - b);
  const vertices: RouterVertex[] = [];
  const byPoint = new Map<string, number>();
  for (const y of ys) {
    for (const x of xs) {
      const point = { x, y };
      if (!isBlockedPoint(point, input.obstacles)) {
        const id = vertices.length;
        vertices.push({ id, point, kind: 'projection' });
        byPoint.set(`${x}:${y}`, id);
      }
    }
  }
  const adjacency = new Map<number, RouterArc[]>(
    vertices.map((vertex) => [vertex.id, [] as RouterArc[]])
  );
  const connectLines = (orientation: GridOrientation) => {
    const coordinates = orientation === 'H' ? ys : xs;
    const varying = orientation === 'H' ? xs : ys;
    for (const fixed of coordinates) {
      let previous: RouterVertex | undefined;
      for (const value of varying) {
        const id = byPoint.get(orientation === 'H' ? `${value}:${fixed}` : `${fixed}:${value}`);
        if (id === undefined) {
          continue;
        }
        const current = vertices[id];
        if (previous) {
          const start = orientation === 'H' ? previous.point.x : previous.point.y;
          const end = orientation === 'H' ? current.point.x : current.point.y;
          if (!segmentBlocked(orientation, fixed, start, end, input.obstacles)) {
            const length = end - start;
            const intervalStart = start;
            const intervalEnd = end;
            adjacency.get(previous.id)!.push({
              from: previous.id,
              to: current.id,
              orientation,
              length,
              kind: 'visibility',
              intervalStart,
              intervalEnd,
            });
            adjacency.get(current.id)!.push({
              from: current.id,
              to: previous.id,
              orientation,
              length,
              kind: 'visibility',
              intervalStart,
              intervalEnd,
            });
          }
        }
        previous = current;
      }
    }
  };
  connectLines('H');
  connectLines('V');
  const sourceId = byPoint.get(`${input.source.x}:${input.source.y}`);
  const targetId = byPoint.get(`${input.target.x}:${input.target.y}`);
  if (sourceId === undefined || targetId === undefined) {
    return undefined;
  }
  return search({ vertices, adjacency }, sourceId, targetId, {}, false);
}
