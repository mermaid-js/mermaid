/**
 * DOMUS (Drawing Orthogonal Metrics Using Shape) Types
 *
 * This module defines the core data structures for the DOMUS shape-first
 * orthogonal drawing methodology as described in:
 *
 * "A Walk on the Wild Side: A Shape-First Methodology for Orthogonal Drawings"
 * LIPIcs.GD.2025.35
 *
 * Reference: (DOMUS, p.4-9, §2-§4.1)
 */

// Import and re-export Point from shared types for unified coordinate representation
import type { Point as SharedPoint } from '../types.js';
export type { Point } from '../types.js';

// Type alias for internal use
type Point = SharedPoint;

/**
 * Edge direction labels used in shape construction.
 * L = Left, R = Right, D = Down, U = Up
 *
 * Reference: (DOMUS, p.4, §2)
 */
export type EdgeLabel = 'L' | 'R' | 'D' | 'U';

/**
 * The set of all edge labels.
 */
export const ALL_LABELS: readonly EdgeLabel[] = ['L', 'R', 'D', 'U'] as const;

/**
 * Returns the opposite label for a given direction.
 * L ↔ R, U ↔ D
 *
 * Reference: (DOMUS, p.4, §2)
 */
export function oppositeLabel(label: EdgeLabel): EdgeLabel {
  switch (label) {
    case 'L':
      return 'R';
    case 'R':
      return 'L';
    case 'U':
      return 'D';
    case 'D':
      return 'U';
  }
}

/**
 * Represents a directed edge in the graph.
 * Each edge has an arbitrary orientation for labeling purposes.
 *
 * Reference: (DOMUS, p.4, §2)
 */
export interface DirectedEdge {
  /** Source vertex ID */
  from: string;
  /** Target vertex ID */
  to: string;
  /** Unique edge identifier */
  id: string;
  /** The root edge ID from the original graph before any splitting */
  originalEdgeId: string;
}

/**
 * A shape assigns a direction label to each edge.
 * The label indicates the direction when traversing from `from` to `to`.
 *
 * If λ(u,v) = R, then λ(v,u) = L (opposite direction).
 *
 * Reference: (DOMUS, p.4, §2)
 */
export interface Shape {
  /** Maps edge ID to its assigned label */
  labels: Map<string, EdgeLabel>;

  /**
   * Maps edge ID to its canonical direction `\{ from, to \}`.
   * This is needed to determine if getLabel queries the edge in reverse.
   */
  canonicalDirections: Map<string, { from: string; to: string }>;

  /**
   * Get the label for traversing from u to v.
   * Handles the symmetry: if (u,v) is stored with label X,
   * then (v,u) returns the opposite of X.
   */
  getLabel(from: string, to: string, edgeId: string): EdgeLabel | undefined;

  /**
   * Set the label for edge (from, to).
   * Also stores the canonical direction for direction-aware queries.
   */
  setLabel(edgeId: string, label: EdgeLabel, from?: string, to?: string): void;
}

/**
 * Creates a new empty shape.
 */
export function createShape(): Shape {
  const labels = new Map<string, EdgeLabel>();
  const canonicalDirections = new Map<string, { from: string; to: string }>();

  return {
    labels,
    canonicalDirections,

    getLabel(from: string, to: string, edgeId: string): EdgeLabel | undefined {
      const stored = labels.get(edgeId);
      if (stored === undefined) {
        return undefined;
      }

      // Check if we have canonical direction info
      const canonical = canonicalDirections.get(edgeId);
      if (
        canonical && // If querying in the reverse direction, return the opposite label
        canonical.from === to &&
        canonical.to === from
      ) {
        return oppositeLabel(stored);
      }

      // Query matches canonical direction or no canonical info stored
      return stored;
    },

    setLabel(edgeId: string, label: EdgeLabel, from?: string, to?: string): void {
      labels.set(edgeId, label);
      // Store canonical direction if provided
      if (from !== undefined && to !== undefined) {
        canonicalDirections.set(edgeId, { from, to });
      }
    },
  };
}

/**
 * Represents a simple cycle in the graph as an ordered list of vertices.
 * The cycle v0, v1, ..., vn-1 has edges (v0,v1), (v1,v2), ..., (vn-1,v0).
 *
 * Reference: (DOMUS, p.6, §3)
 */
export interface SimpleCycle {
  /** Ordered list of vertex IDs forming the cycle */
  vertices: string[];
  /** Edge IDs in order around the cycle */
  edgeIds: string[];
}

/**
 * Checks if a shaped cycle is "complete" - contains all four labels `\{L,R,D,U\}`.
 *
 * A cycle is complete iff it contains four pairs of consecutive vertices
 * with labels L, R, D, and U respectively.
 *
 * Reference: (DOMUS, p.6, §3, Theorem 1)
 *
 * @param cycle - The cycle to check
 * @param shape - The shape (labeling) to use
 * @returns true if the cycle is complete
 */
export function isCycleComplete(cycle: SimpleCycle, shape: Shape): boolean {
  const foundLabels = new Set<EdgeLabel>();

  for (let i = 0; i < cycle.vertices.length; i++) {
    const from = cycle.vertices[i];
    const to = cycle.vertices[(i + 1) % cycle.vertices.length];
    const edgeId = cycle.edgeIds[i];

    const label = shape.getLabel(from, to, edgeId);
    if (label) {
      foundLabels.add(label);
    }
  }

  return foundLabels.size === 4;
}

/**
 * The cycle set C used in DOMUS shape construction.
 * Contains cycles that must be "complete" for the shape to be valid.
 *
 * Reference: (DOMUS, p.8, §4.1)
 */
export interface CycleSet {
  /** All cycles in the set */
  cycles: SimpleCycle[];

  /** Add a cycle to the set */
  add(cycle: SimpleCycle): void;

  /** Check if a cycle is already in the set (by vertex sequence) */
  contains(cycle: SimpleCycle): boolean;

  /** Update all cycles in the set when an edge is split */
  updateForSplit(
    oldEdgeId: string,
    from: string,
    to: string,
    dummyId: string,
    newEdgeIds: [string, string]
  ): void;
}

/**
 * Creates a new empty cycle set.
 */
export function createCycleSet(): CycleSet {
  const cycles: SimpleCycle[] = [];

  // For quick containment checks
  const cycleSignatures = new Set<string>();

  function getCycleSignature(cycle: SimpleCycle): string {
    // Normalize the cycle to start from the lexicographically smallest vertex
    // and go in the lexicographically smaller direction
    const verts = cycle.vertices;
    const n = verts.length;
    if (n === 0) {
      return '';
    }

    // Find the minimum vertex
    let minIdx = 0;
    for (let i = 1; i < n; i++) {
      if (verts[i] < verts[minIdx]) {
        minIdx = i;
      }
    }

    // Check both directions from minIdx
    const forward: string[] = [];
    const backward: string[] = [];

    for (let i = 0; i < n; i++) {
      forward.push(verts[(minIdx + i) % n]);
      backward.push(verts[(minIdx - i + n) % n]);
    }

    const forwardSig = forward.join(',');
    const backwardSig = backward.join(',');

    return forwardSig < backwardSig ? forwardSig : backwardSig;
  }

  return {
    cycles,

    add(cycle: SimpleCycle): void {
      const sig = getCycleSignature(cycle);
      if (!cycleSignatures.has(sig)) {
        cycleSignatures.add(sig);
        cycles.push(cycle);
      }
    },

    contains(cycle: SimpleCycle): boolean {
      const sig = getCycleSignature(cycle);
      return cycleSignatures.has(sig);
    },

    updateForSplit(
      oldEdgeId: string,
      from: string,
      to: string,
      dummyId: string,
      newEdgeIds: [string, string]
    ): void {
      for (let i = 0; i < cycles.length; i++) {
        const cycle = cycles[i];
        const edgeIdx = cycle.edgeIds.indexOf(oldEdgeId);
        if (edgeIdx !== -1) {
          // This cycle contains the split edge
          const newVertices = [...cycle.vertices];
          const newEdgeIdsList = [...cycle.edgeIds];

          // Determine the order of the new edges based on traversal direction in cycle
          const cycleFrom = cycle.vertices[edgeIdx];
          const cycleTo = cycle.vertices[(edgeIdx + 1) % cycle.vertices.length];

          if (cycleFrom === from && cycleTo === to) {
            // Forward traversal: from -> dummy -> to
            newVertices.splice(edgeIdx + 1, 0, dummyId);
            newEdgeIdsList.splice(edgeIdx, 1, newEdgeIds[0], newEdgeIds[1]);
          } else {
            // Reverse traversal: to -> dummy -> from
            newVertices.splice(edgeIdx + 1, 0, dummyId);
            newEdgeIdsList.splice(edgeIdx, 1, newEdgeIds[1], newEdgeIds[0]);
          }

          cycles[i] = { vertices: newVertices, edgeIds: newEdgeIdsList };

          // Re-compute signature after modification
          cycleSignatures.delete(getCycleSignature(cycle));
          cycleSignatures.add(getCycleSignature(cycles[i]));
        }
      }
    },
  };
}

/**
 * A node in the auxiliary graph Gx or Gy.
 * Each node represents a maximal set of aligned vertices.
 *
 * For Gx: vertices are x-aligned if connected by D/U edges only
 * For Gy: vertices are y-aligned if connected by L/R edges only
 *
 * Reference: (DOMUS, p.6-7, §3)
 */
export interface AuxNode {
  /** Unique ID for this auxiliary node */
  id: string;
  /** Set of original graph vertex IDs in this alignment class */
  vertices: Set<string>;
}

/**
 * An arc in the auxiliary graph Gx or Gy.
 *
 * For Gx: arc from μ to ν means vertices in μ are left of vertices in ν
 * For Gy: arc from μ to ν means vertices in μ are above vertices in ν
 *
 * Reference: (DOMUS, p.6-7, §3)
 */
export interface AuxArc {
  /** Source auxiliary node ID */
  from: string;
  /** Target auxiliary node ID */
  to: string;
  /** Original graph edge that induced this arc */
  inducingEdge: DirectedEdge;
}

/**
 * Auxiliary directed graph (Gx or Gy) used for rectilinear drawability testing.
 *
 * Reference: (DOMUS, p.6-7, §3, Theorem 2)
 */
export interface AuxiliaryGraph {
  /** Type of auxiliary graph */
  type: 'Gx' | 'Gy';
  /** Nodes (alignment classes) */
  nodes: Map<string, AuxNode>;
  /** Arcs (ordering constraints) */
  arcs: AuxArc[];
  /** Maps original vertex ID to its auxiliary node ID */
  vertexToNode: Map<string, string>;
}

/**
 * Result of the rectilinear drawability test.
 *
 * Reference: (DOMUS, p.6-7, §3, Theorem 2, Theorem 3)
 */
export interface DrawabilityResult {
  /** Whether the shaped graph is rectilinear drawable */
  drawable: boolean;
  /**
   * If not drawable, a witness non-complete cycle.
   * This cycle should be added to C for refinement.
   */
  witnessCycle?: SimpleCycle;
  /** The Gx auxiliary graph */
  gx?: AuxiliaryGraph;
  /** The Gy auxiliary graph */
  gy?: AuxiliaryGraph;
}

/**
 * A dummy vertex introduced by edge splitting.
 * These vertices may become bends in the final drawing.
 *
 * Reference: (DOMUS, p.5, §2), (DOMUS, p.8, §4.1)
 */
export interface DummyVertex {
  /** Unique ID for the dummy vertex */
  id: string;
  /** Original edge that was split */
  originalEdgeId: string;
  /** The two new edges created by the split */
  newEdgeIds: [string, string];
}

/**
 * Graph representation for DOMUS processing.
 * Supports subdivisions (edge splits) and dummy vertex tracking.
 */
export interface DomusGraph {
  /** All vertex IDs (including dummy vertices) */
  vertices: Set<string>;
  /** All edges */
  edges: Map<string, DirectedEdge>;
  /** Adjacency list: vertex to list of (neighbor, edgeId) */
  adjacency: Map<string, { neighbor: string; edgeId: string }[]>;
  /** Dummy vertices introduced by edge splitting */
  dummyVertices: Map<string, DummyVertex>;
  /** Original vertex IDs (before any splitting) */
  originalVertices: Set<string>;
}

/**
 * Creates a DomusGraph from a list of vertices and edges.
 */
export function createDomusGraph(
  vertexIds: string[],
  edges: { id: string; from: string; to: string }[]
): DomusGraph {
  const vertices = new Set<string>(vertexIds);
  const originalVertices = new Set<string>(vertexIds);
  const edgeMap = new Map<string, DirectedEdge>();
  const adjacency = new Map<string, { neighbor: string; edgeId: string }[]>();
  const dummyVertices = new Map<string, DummyVertex>();

  // Initialize adjacency lists
  for (const v of vertices) {
    adjacency.set(v, []);
  }

  // Add edges
  for (const e of edges) {
    if (!vertices.has(e.from) || !vertices.has(e.to)) {
      continue;
    }
    const edge: DirectedEdge = { id: e.id, from: e.from, to: e.to, originalEdgeId: e.id };
    edgeMap.set(e.id, edge);

    // Undirected adjacency for graph traversal
    adjacency.get(e.from)?.push({ neighbor: e.to, edgeId: e.id });
    adjacency.get(e.to)?.push({ neighbor: e.from, edgeId: e.id });
  }

  return {
    vertices,
    edges: edgeMap,
    adjacency,
    dummyVertices,
    originalVertices,
  };
}

/**
 * Counter for deterministic dummy vertex ID generation.
 * This ensures reproducibility of the DOMUS algorithm.
 */
let dummyVertexCounter = 0;

/**
 * Reset the dummy vertex counter. Used for testing reproducibility.
 */
export function resetDummyVertexCounter(): void {
  dummyVertexCounter = 0;
}

/**
 * Split an edge by introducing a dummy vertex.
 * Edge (u,v) becomes (u,w) and (w,v) where w is the new dummy.
 *
 * Reference: (DOMUS, p.8, §4.1)
 *
 * @param graph - The graph to modify
 * @param edgeId - The edge to split
 * @returns The new dummy vertex and new edge IDs
 */
export function splitEdge(
  graph: DomusGraph,
  edgeId: string
): { dummyId: string; newEdgeIds: [string, string] } {
  const edge = graph.edges.get(edgeId);
  if (!edge) {
    throw new Error(`Edge ${edgeId} not found`);
  }

  const { from, to } = edge;

  // Create dummy vertex with deterministic ID
  const dummyId = `dummy_${edgeId}_${dummyVertexCounter++}`;
  graph.vertices.add(dummyId);
  graph.adjacency.set(dummyId, []);

  // Create new edges
  const newEdgeId1 = `${edgeId}_1`;
  const newEdgeId2 = `${edgeId}_2`;

  const newEdge1: DirectedEdge = {
    id: newEdgeId1,
    from,
    to: dummyId,
    originalEdgeId: edge.originalEdgeId,
  };
  const newEdge2: DirectedEdge = {
    id: newEdgeId2,
    from: dummyId,
    to,
    originalEdgeId: edge.originalEdgeId,
  };

  graph.edges.set(newEdgeId1, newEdge1);
  graph.edges.set(newEdgeId2, newEdge2);

  // Update adjacency: remove old edge, add new edges
  const fromAdj = graph.adjacency.get(from);
  const toAdj = graph.adjacency.get(to);

  if (fromAdj) {
    const idx = fromAdj.findIndex((a) => a.edgeId === edgeId);
    if (idx >= 0) {
      fromAdj.splice(idx, 1);
    }
    fromAdj.push({ neighbor: dummyId, edgeId: newEdgeId1 });
  }

  if (toAdj) {
    const idx = toAdj.findIndex((a) => a.edgeId === edgeId);
    if (idx >= 0) {
      toAdj.splice(idx, 1);
    }
    toAdj.push({ neighbor: dummyId, edgeId: newEdgeId2 });
  }

  graph.adjacency.get(dummyId)?.push({ neighbor: from, edgeId: newEdgeId1 });
  graph.adjacency.get(dummyId)?.push({ neighbor: to, edgeId: newEdgeId2 });

  // Remove old edge
  graph.edges.delete(edgeId);

  // Track dummy vertex
  const dummy: DummyVertex = {
    id: dummyId,
    originalEdgeId: edgeId,
    newEdgeIds: [newEdgeId1, newEdgeId2],
  };
  graph.dummyVertices.set(dummyId, dummy);

  return { dummyId, newEdgeIds: [newEdgeId1, newEdgeId2] };
}

/**
 * SAT variable representation for shape construction.
 * Four boolean variables per edge indicating direction.
 *
 * Reference: (DOMUS, p.9, §4.1)
 */
export interface SATVariables {
  /** Maps edge ID to its four variable IDs [l, r, d, u] */
  edgeVars: Map<string, [number, number, number, number]>;
  /** Next available variable ID */
  nextVar: number;
  /** Reverse mapping: variable ID to (edgeId, label) */
  varToEdge: Map<number, { edgeId: string; label: EdgeLabel }>;
}

/**
 * Creates SAT variables for all edges in a graph.
 */
export function createSATVariables(edges: DirectedEdge[]): SATVariables {
  const edgeVars = new Map<string, [number, number, number, number]>();
  const varToEdge = new Map<number, { edgeId: string; label: EdgeLabel }>();
  let nextVar = 1; // SAT variables are typically 1-indexed

  for (const edge of edges) {
    const l = nextVar++;
    const r = nextVar++;
    const d = nextVar++;
    const u = nextVar++;

    edgeVars.set(edge.id, [l, r, d, u]);
    varToEdge.set(l, { edgeId: edge.id, label: 'L' });
    varToEdge.set(r, { edgeId: edge.id, label: 'R' });
    varToEdge.set(d, { edgeId: edge.id, label: 'D' });
    varToEdge.set(u, { edgeId: edge.id, label: 'U' });
  }

  return { edgeVars, nextVar, varToEdge };
}

/**
 * A CNF clause (disjunction of literals).
 * Positive number = positive literal, negative = negated.
 */
export type CNFClause = number[];

/**
 * CNF formula for SAT solving.
 */
export interface CNFFormula {
  /** Number of variables */
  numVars: number;
  /** Clauses */
  clauses: CNFClause[];
}

/**
 * Result of SAT solving.
 */
export interface SATResult {
  /** Whether the formula is satisfiable */
  satisfiable: boolean;
  /** If satisfiable, the assignment (variable ID to true/false) */
  assignment?: Map<number, boolean>;
  /**
   * If unsatisfiable, variable IDs that appear in the unsatisfiability proof.
   * Used to identify edges to split.
   */
  conflictVars?: number[];
}

/**
 * DOMUS algorithm state and configuration.
 */
export interface DomusState {
  /** The graph (may be a subdivision of the original) */
  graph: DomusGraph;
  /** Current cycle set C */
  cycleSet: CycleSet;
  /** Current shape (if computed) */
  shape?: Shape;
  /** Number of SAT solver invocations */
  satInvocations: number;
  /** Number of cycles added during refinement */
  cyclesAdded: number;
  /** Number of edge splits performed */
  edgeSplits: number;
  /** Activity counts for edges (for splitting heuristic) */
  edgeActivity?: Map<string, number>;
  /** Optional constraints for shape construction */
  constraints?: DomusConstraints;
  /** Node padding to use during compaction */
  nodePadding?: number;
}

/**
 * Constraint on an edge's direction label.
 *
 * Used to fix edge directions for user-specified requirements like:
 * - Horizontal edges (R or L)
 * - Vertical edges (U or D)
 * - Specific direction (e.g., "A must be left of B")
 */
export interface EdgeConstraint {
  /** Edge ID */
  edgeId: string;
  /** Allowed labels for this edge (fixed direction) */
  allowedLabels?: EdgeLabel[];
  /** Required label (if only one is allowed) */
  requiredLabel?: EdgeLabel;
  /** Forbidden labels (edge must NOT have these) */
  forbiddenLabels?: EdgeLabel[];
}

/**
 * Constraint on vertex relative positioning.
 */
export interface PositionConstraint {
  /** Source vertex ID */
  from: string;
  /** Target vertex ID */
  to: string;
  /** Required relationship: 'left-of' | 'right-of' | 'above' | 'below' */
  relation: 'left-of' | 'right-of' | 'above' | 'below';
}

/**
 * Constraints for DOMUS shape construction.
 *
 * These constraints are encoded as additional clauses in the SAT formula.
 * Reference: Similar to constrained orthogonal drawings (DOMUS, §5 future work)
 */
export interface DomusConstraints {
  /** Edge direction constraints */
  edgeConstraints?: EdgeConstraint[];
  /** Vertex position constraints */
  positionConstraints?: PositionConstraint[];
  /** Whether to prefer horizontal edges (for flowcharts) */
  preferHorizontal?: boolean;
  /** Whether to prefer vertical edges (for hierarchical layouts) */
  preferVertical?: boolean;
}

/**
 * DOMUS algorithm options.
 */
export interface DomusOptions {
  /** Maximum SAT solver invocations before giving up */
  maxSatInvocations?: number;
  /** Maximum edge splits before giving up */
  maxEdgeSplits?: number;
  /** Whether to enable debug logging */
  debug?: boolean;
  /** Optional constraints on the layout */
  constraints?: DomusConstraints;
  /** Optional mapping from vertex ID to its rendered size */
  nodeSizes?: Map<string, { width: number; height: number }>;
  /** Optional padding between nodes (center-to-center minimum distance adjustment) */
  nodePadding?: number;
}

/**
 * Information about an expanded high-degree vertex.
 * Used to track vertex expansion and collapse.
 */
export interface ExpandedVertexInfo {
  /** Original vertex ID that was expanded */
  originalVertexId: string;
  /** IDs of the chain vertices created */
  chainVertexIds: string[];
  /** IDs of the internal chain edges */
  chainEdgeIds: string[];
  /** Mapping from original neighbor to the chain vertex it connects to */
  neighborToChainVertex: Map<string, string>;
}

/**
 * Final result of the DOMUS algorithm.
 */
export interface DomusResult {
  /** Whether a rectilinear drawable shape was found */
  success: boolean;
  /** The final graph (may include dummy vertices) */
  graph: DomusGraph;
  /** The final shape (if success) */
  shape?: Shape;
  /** Coordinate assignments (if success). These are collapsed for high-degree nodes. */
  coordinates?: Map<string, Point>;
  /** Un-collapsed grid coordinates for all vertices (including chain/dummy vertices) */
  fullCoordinates?: Map<string, Point>;
  /** Information about expanded high-degree vertices (if any) */
  expansions?: Map<string, ExpandedVertexInfo>;
  /** Statistics */
  stats: {
    satInvocations: number;
    cyclesAdded: number;
    edgeSplits: number;
    dummyVertices: number;
    expandedVertices?: number;
  };
}
