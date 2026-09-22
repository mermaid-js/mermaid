import type { GridRoutingInstrumentation } from './routerInstrumentation.js';
import type {
  ContainerRoutingTopology,
  GridOrientation,
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

export interface RouterSearchOptions {
  metrics?: GridRoutingInstrumentation;
  endpointCandidateRank?: number;
  recordOutcome?: boolean;
  initialOrientation?: GridOrientation;
  initialLength?: number;
  targetOrientation?: GridOrientation;
  targetLength?: number;
  topologyValidated?: boolean;
  workspace?: RouterSearchWorkspace;
}

export class RouterSearchWorkspace {
  stateVertices = new Int32Array(256);
  orientations = new Uint8Array(256);
  gLengths = new Float64Array(256);
  gBends = new Float64Array(256);
  gBoundaryTransitions = new Float64Array(256);
  gOccupiedLengths = new Float64Array(256);
  gCrossings = new Float64Array(256);
  fLengths = new Float64Array(256);
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
    this.predecessors = growTypedArray(this.predecessors, capacity);
    this.depths = growTypedArray(this.depths, capacity);
    this.ancestor4 = growTypedArray(this.ancestor4, capacity);
    this.heapChildren = growTypedArray(this.heapChildren, capacity);
    this.heapSiblings = growTypedArray(this.heapSiblings, capacity);
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

export function tupleHeuristic(from: RouterPoint, to: RouterPoint): RouterTupleCost {
  return [Math.abs(from.x - to.x) + Math.abs(from.y - to.y), 0, 0, 0, 0, 0];
}

function orientationOrdinal(orientation: GridOrientation | undefined): number {
  return orientation === undefined ? 0 : orientation === 'H' ? 1 : 2;
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
  topology: Pick<ContainerRoutingTopology, 'vertices'>
): RouterSearchResult {
  const vertexIds: number[] = [];
  let current = stateId;
  while (current >= 0) {
    vertexIds.push(stateVertices[current]);
    current = predecessors[current];
  }
  vertexIds.reverse();
  return {
    points: normalizePoints(vertexIds.map((id) => topology.vertices[id].point)),
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
    Partial<Pick<ContainerRoutingTopology, 'adjacencyByVertex' | 'searchAdjacencyByVertex'>>,
  sourceId: number,
  targetId: number,
  options: RouterSearchOptions,
  useHeuristic: boolean
): RouterSearchResult | undefined {
  const source = topology.vertices[sourceId];
  const target = topology.vertices[targetId];
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
  workspace.reset(topology.vertices.length);
  let stateVertices = workspace.stateVertices;
  let orientations = workspace.orientations;
  let gLengths = workspace.gLengths;
  let gBends = workspace.gBends;
  let gBoundaryTransitions = workspace.gBoundaryTransitions;
  let gOccupiedLengths = workspace.gOccupiedLengths;
  let gCrossings = workspace.gCrossings;
  let fLengths = workspace.fLengths;
  let predecessors = workspace.predecessors;
  let depths = workspace.depths;
  let ancestor4 = workspace.ancestor4;
  let heapChildren = workspace.heapChildren;
  let heapSiblings = workspace.heapSiblings;
  const best = workspace.best;
  const heapPairs = workspace.heapPairs;
  let stateCount = 1;
  const endpointCandidateRank = options.endpointCandidateRank ?? 0;
  const compareStates = (a: number, b: number): number =>
    fLengths[a] - fLengths[b] ||
    gBends[a] - gBends[b] ||
    gBoundaryTransitions[a] - gBoundaryTransitions[b] ||
    gOccupiedLengths[a] - gOccupiedLengths[b] ||
    gCrossings[a] - gCrossings[b] ||
    stateVertices[a] - stateVertices[b] ||
    orientations[a] - orientations[b] ||
    predecessors[a] - predecessors[b] ||
    a - b;
  const compareChains = (a: number, b: number): number => {
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
  };
  let heapRoot = -1;
  let heapSize = 0;
  const heapMeld = (first: number, second: number): number => {
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
  };
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
  const commitExpandedStates = (): void => {
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
  fLengths[0] =
    initialLength +
    (useHeuristic
      ? Math.abs(source.point.x - target.point.x) + Math.abs(source.point.y - target.point.y)
      : 0);
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
        gBends[next] - bestGoalCost[1] ||
        gBoundaryTransitions[next] - bestGoalCost[2] ||
        gOccupiedLengths[next] - bestGoalCost[3] ||
        gCrossings[next] - bestGoalCost[4] ||
        endpointCandidateRank - bestGoalCost[5]) >= 0
    ) {
      break;
    }
    const current = heapPop()!;
    if (best[stateVertices[current] * 3 + orientations[current]] !== current) {
      continue;
    }
    expandedThisSearch++;

    if (stateVertices[current] === targetId) {
      considerGoal(current);
      continue;
    }

    const vertexId = stateVertices[current];
    const compactArcs = topology.searchAdjacencyByVertex?.[vertexId];
    if (compactArcs) {
      for (const arc of compactArcs) {
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
          predecessors = workspace.predecessors;
          depths = workspace.depths;
          ancestor4 = workspace.ancestor4;
          heapChildren = workspace.heapChildren;
          heapSiblings = workspace.heapSiblings;
        }
        stateVertices[candidate] = arc.to;
        orientations[candidate] = orientation;
        gLengths[candidate] = length;
        gBends[candidate] = bends;
        gBoundaryTransitions[candidate] = boundaryTransitions;
        gOccupiedLengths[candidate] = occupiedLength;
        gCrossings[candidate] = crossings;
        fLengths[candidate] =
          length +
          (useHeuristic
            ? Math.abs(topology.vertices[arc.to].point.x - target.point.x) +
              Math.abs(topology.vertices[arc.to].point.y - target.point.y)
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
          predecessors = workspace.predecessors;
          depths = workspace.depths;
          ancestor4 = workspace.ancestor4;
          heapChildren = workspace.heapChildren;
          heapSiblings = workspace.heapSiblings;
        }
        stateVertices[candidate] = arc.to;
        orientations[candidate] = orientation;
        gLengths[candidate] = length;
        gBends[candidate] = bends;
        gBoundaryTransitions[candidate] = boundaryTransitions;
        gOccupiedLengths[candidate] = occupiedLength;
        gCrossings[candidate] = crossings;
        fLengths[candidate] =
          length +
          (useHeuristic
            ? Math.abs(topology.vertices[arc.to].point.x - target.point.x) +
              Math.abs(topology.vertices[arc.to].point.y - target.point.y)
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
  return reconstruct(bestGoalState, stateVertices, predecessors, bestGoalCost, topology);
}

export function findShortestRoute(
  topology: Pick<ContainerRoutingTopology, 'vertices' | 'adjacency'> &
    Partial<Pick<ContainerRoutingTopology, 'adjacencyByVertex' | 'searchAdjacencyByVertex'>>,
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
