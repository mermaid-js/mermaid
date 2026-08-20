/**
 * SAT Encoding for DOMUS Shape Construction
 *
 * Encodes the shape construction problem as a CNF formula with:
 * 1. Exactly-one label per edge
 * 2. Vertex label distinctness
 * 3. Cycle completeness
 *
 * Reference: (DOMUS, p.9, §4.1)
 */

import type {
  DomusGraph,
  CycleSet,
  SATVariables,
  CNFFormula,
  CNFClause,
  EdgeLabel,
  Shape,
  DomusConstraints,
} from './types.js';
import { ALL_LABELS, createSATVariables, createShape } from './types.js';
import { getNeighbors } from './graphAnalysis.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';

/**
 * Generate the exactly-one-label clauses for each edge.
 *
 * For edge (v,w) with variables [ℓ, r, d, u]:
 * - At least one: (ℓ ∨ r ∨ d ∨ u)
 * - At most one: (¬ℓ ∨ ¬r), (¬ℓ ∨ ¬d), (¬ℓ ∨ ¬u), (¬r ∨ ¬d), (¬r ∨ ¬u), (¬d ∨ ¬u)
 *
 * Reference: (DOMUS, p.9, §4.1, clauses (i)-(vii))
 */
function generateExactlyOneLabelClauses(vars: SATVariables): CNFClause[] {
  const clauses: CNFClause[] = [];

  for (const [_edgeId, [l, r, d, u]] of vars.edgeVars) {
    // At least one
    clauses.push([l, r, d, u]);

    // At most one (pairwise exclusion)
    clauses.push([-l, -r]);
    clauses.push([-l, -d]);
    clauses.push([-l, -u]);
    clauses.push([-r, -d]);
    clauses.push([-r, -u]);
    clauses.push([-d, -u]);
  }

  return clauses;
}

/**
 * Get the variable for a specific label on an edge.
 */
function getVarForLabel(vars: SATVariables, edgeId: string, label: EdgeLabel): number {
  const edgeVars = vars.edgeVars.get(edgeId);
  if (!edgeVars) {
    throw new Error(`No SAT variables for edge ${edgeId}`);
  }

  const [l, r, d, u] = edgeVars;
  switch (label) {
    case 'L':
      return l;
    case 'R':
      return r;
    case 'D':
      return d;
    case 'U':
      return u;
  }
}

/**
 * Get the variable for an edge traversed in a specific direction.
 *
 * If the edge is stored as (from, to) with label X, then:
 * - Traversing from→to uses X
 * - Traversing to→from uses opposite(X)
 *
 * We need to handle the case where we query for a direction opposite to how
 * the edge was stored.
 */
function getVarForDirection(
  vars: SATVariables,
  graph: DomusGraph,
  from: string,
  to: string,
  edgeId: string,
  label: EdgeLabel
): number {
  const edge = graph.edges.get(edgeId);
  if (!edge) {
    throw new Error(`Edge ${edgeId} not found`);
  }

  // Check if we're traversing in the canonical direction
  if (edge.from === from && edge.to === to) {
    return getVarForLabel(vars, edgeId, label);
  } else if (edge.from === to && edge.to === from) {
    // Traversing in opposite direction; use opposite label
    const oppLabel = oppositeLabel(label);
    return getVarForLabel(vars, edgeId, oppLabel);
  } else {
    // Edge doesn't connect these vertices
    throw new Error(`Edge ${edgeId} does not connect ${from} and ${to}`);
  }
}

function oppositeLabel(label: EdgeLabel): EdgeLabel {
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
 * Generate vertex label distinctness clauses.
 *
 * For a vertex v with neighbors u_0, ..., u_k:
 * - If degree = 4: each direction must be used exactly once
 *   (l_\{v,u_0\} OR l_\{v,u_1\} OR l_\{v,u_2\} OR l_\{v,u_3\}) for each label
 * - If degree \< 4: no two neighbors can share the same direction
 *   (NOT l_\{v,u_i\} OR NOT l_\{v,u_j\}) for each pair and each label
 *
 * Reference: (DOMUS, p.9, §4.1)
 */
function generateVertexDistinctnessClauses(graph: DomusGraph, vars: SATVariables): CNFClause[] {
  const clauses: CNFClause[] = [];

  for (const vertex of graph.vertices) {
    const neighbors = getNeighbors(graph, vertex);
    const degree = neighbors.length;

    if (degree <= 1) {
      // No constraints needed for degree 0 or 1
      continue;
    }

    if (degree === 4) {
      // Degree 4: require usage of all four directions (exactly one per label, given
      // the per-edge exactly-one-label constraints).
      for (const label of ALL_LABELS) {
        const clause: CNFClause = [];
        for (const { neighbor, edgeId } of neighbors) {
          const varId = getVarForDirection(vars, graph, vertex, neighbor, edgeId, label);
          clause.push(varId);
        }
        clauses.push(clause);
      }
    } else if (degree > 4) {
      // Degree > 4: relaxed “side overlap near the vertex” model (Rome graphs style).
      // Allow multiple incident edges to use the same direction while still requiring
      // that all four directions are represented at least once.
      for (const label of ALL_LABELS) {
        const clause: CNFClause = [];
        for (const { neighbor, edgeId } of neighbors) {
          const varId = getVarForDirection(vars, graph, vertex, neighbor, edgeId, label);
          clause.push(varId);
        }
        clauses.push(clause);
      }
    } else {
      // Degree 2 or 3: no two neighbors can share the same direction from v
      // This ensures at most one neighbor per label
      for (const label of ALL_LABELS) {
        for (let i = 0; i < neighbors.length; i++) {
          for (let j = i + 1; j < neighbors.length; j++) {
            const varI = getVarForDirection(
              vars,
              graph,
              vertex,
              neighbors[i].neighbor,
              neighbors[i].edgeId,
              label
            );
            const varJ = getVarForDirection(
              vars,
              graph,
              vertex,
              neighbors[j].neighbor,
              neighbors[j].edgeId,
              label
            );
            // ¬ℓ_{v,u_i} ∨ ¬ℓ_{v,u_j}
            clauses.push([-varI, -varJ]);
          }
        }
      }
    }
  }

  return clauses;
}

/**
 * Generate cycle completeness clauses.
 *
 * For each cycle c = v_0, v_1, ..., v_\{n-1\} in C:
 * - All labels must appear somewhere on the cycle
 *   (l_\{v_0,v_1\} OR l_\{v_1,v_2\} OR ... OR l_\{v_\{n-1\},v_0\}) for each label l
 *
 * Reference: (DOMUS, p.9, §4.1)
 */
function generateCycleCompletenessClauses(
  graph: DomusGraph,
  vars: SATVariables,
  cycleSet: CycleSet
): CNFClause[] {
  const clauses: CNFClause[] = [];

  for (const cycle of cycleSet.cycles) {
    const n = cycle.vertices.length;

    // A3 / R7 (defensive): a 2-cycle (anti-parallel A↔B in the multigraph)
    // forces cycle-completeness UNSAT — its 2 edges can't satisfy 4 single-
    // literal clauses (one per ALL_LABELS entry L,R,U,D). `computeCycleBasis`
    // already filters `vertices.length >= 3` from the initial C, but the
    // witness-cycle path (`domus.ts:state.cycleSet.add(witnessCycle)`) has no
    // such guard. Defensive filter here only catches 2-cycles — 3-cycles are
    // intentionally left to UNSAT and trigger the algorithm's edge-split
    // recovery (DOMUS §4.1, source `6784b3d1`) which subdivides one edge to
    // turn the 3-cycle into a 4-cycle.
    if (n < 3) {
      continue;
    }

    for (const label of ALL_LABELS) {
      const clause: CNFClause = [];

      for (let i = 0; i < n; i++) {
        const from = cycle.vertices[i];
        const to = cycle.vertices[(i + 1) % n];
        const edgeId = cycle.edgeIds[i];

        const varId = getVarForDirection(vars, graph, from, to, edgeId, label);
        clause.push(varId);
      }

      clauses.push(clause);
    }
  }

  return clauses;
}

/**
 * Generate constraint clauses from DomusConstraints.
 *
 * These clauses enforce user-specified edge direction requirements
 * and vertex relative positioning.
 *
 * Reference: (DOMUS, §7 conclusions) - "Possible to incorporate several types
 * of constraints... side-constraints... specification that certain edges should
 * be horizontal or vertical."
 */
function generateConstraintClauses(
  graph: DomusGraph,
  vars: SATVariables,
  constraints?: DomusConstraints
): CNFClause[] {
  if (!constraints) {
    return [];
  }

  const clauses: CNFClause[] = [];

  // 1. Process edge constraints (fixed directions)
  for (const ec of constraints.edgeConstraints ?? []) {
    const edgeVars = vars.edgeVars.get(ec.edgeId);
    if (!edgeVars) {
      continue; // Skip if edge not found
    }

    const [l, r, d, u] = edgeVars;
    const labelToVar: Record<EdgeLabel, number> = { L: l, R: r, D: d, U: u };

    // Required label: must be true
    if (ec.requiredLabel) {
      clauses.push([labelToVar[ec.requiredLabel]]);
    }

    // Allowed labels: at least one must be true
    if (ec.allowedLabels && ec.allowedLabels.length > 0) {
      const allowedVars = ec.allowedLabels.map((label) => labelToVar[label]);
      clauses.push(allowedVars);

      // Also forbid disallowed labels
      const allLabels: EdgeLabel[] = ['L', 'R', 'D', 'U'];
      for (const label of allLabels) {
        if (!ec.allowedLabels.includes(label)) {
          clauses.push([-labelToVar[label]]);
        }
      }
    }

    // Forbidden labels: must be false
    for (const label of ec.forbiddenLabels ?? []) {
      clauses.push([-labelToVar[label]]);
    }
  }

  // 2. Process position constraints
  // For vertices connected by an edge, we can fix the edge direction.
  // For vertices not directly connected, the paper suggests adding virtual edges.
  for (const pc of constraints.positionConstraints ?? []) {
    // Find all edges between from and to
    const edgesBetween = [...graph.edges.values()].filter(
      (e) => (e.from === pc.from && e.to === pc.to) || (e.from === pc.to && e.to === pc.from)
    );

    for (const edge of edgesBetween) {
      const edgeVars = vars.edgeVars.get(edge.id);
      if (!edgeVars) {
        continue;
      }

      const [l, r, d, u] = edgeVars;
      const isForward = edge.from === pc.from;

      switch (pc.relation) {
        case 'left-of':
          // from is left of to -> edge (from, to) must be R, or (to, from) must be L
          clauses.push([isForward ? r : l]);
          break;
        case 'right-of':
          // from is right of to -> edge (from, to) must be L, or (to, from) must be R
          clauses.push([isForward ? l : r]);
          break;
        case 'above':
          // from is above to -> edge (from, to) must be D, or (to, from) must be U
          clauses.push([isForward ? d : u]);
          break;
        case 'below':
          // from is below to -> edge (from, to) must be U, or (to, from) must be D
          clauses.push([isForward ? u : d]);
          break;
      }
    }
  }

  // 3. Process preferences (soft constraints / heuristics)
  //
  // NOTE: In this implementation, we avoid adding these as hard clauses
  // for all edges, as that can over-constrain the graph and force all nodes
  // into a single line (e.g., if all edges are forced vertical, Gx will
  // have only one alignment class).
  //
  // For a true "preference", we would need a MAX-SAT solver or a branching
  // heuristic in the SAT solver. For now, we omit these global constraints
  // to avoid the "all nodes on top of each other" issue reported.
  /*
  if (constraints.preferHorizontal) {
    for (const [edgeId, [l, r, d, u]] of vars.edgeVars) {
      clauses.push([l, r]);
    }
  }
  if (constraints.preferVertical) {
    for (const [edgeId, [l, r, d, u]] of vars.edgeVars) {
      clauses.push([d, u]);
    }
  }
  */

  return clauses;
}

/**
 * Generate the complete CNF formula F_\{G,C\} for shape construction.
 *
 * Reference: (DOMUS, p.9, §4.1)
 *
 * @param graph - The DOMUS graph
 * @param cycleSet - The cycle set C
 * @param constraints - Optional constraints on edge directions
 * @returns The CNF formula and SAT variables
 */
export function generateShapeSATFormula(
  graph: DomusGraph,
  cycleSet: CycleSet,
  constraints?: DomusConstraints
): { formula: CNFFormula; vars: SATVariables } {
  // Create SAT variables
  const edges = [...graph.edges.values()];
  const vars = createSATVariables(edges);

  // Generate clauses
  const exactlyOneClauses = generateExactlyOneLabelClauses(vars);
  const distinctnessClauses = generateVertexDistinctnessClauses(graph, vars);
  const completenessClauses = generateCycleCompletenessClauses(graph, vars, cycleSet);
  const constraintClauses = generateConstraintClauses(graph, vars, constraints);

  const allClauses = [
    ...exactlyOneClauses,
    ...distinctnessClauses,
    ...completenessClauses,
    ...constraintClauses,
  ];

  const formula: CNFFormula = {
    numVars: vars.nextVar - 1,
    clauses: allClauses,
  };

  return { formula, vars };
}

/**
 * Extract a shape from a SAT assignment.
 *
 * @param assignment - The SAT variable assignment
 * @param vars - The SAT variables
 * @param graph - Optional graph for canonical direction info (enables direction-aware getLabel)
 * @returns The shape (edge labels)
 */
export function extractShapeFromAssignment(
  assignment: Map<number, boolean>,
  vars: SATVariables,
  graph?: DomusGraph
): Shape {
  const shape = createShape();

  for (const [edgeId, [l, r, d, u]] of vars.edgeVars) {
    // Get canonical direction from graph if available
    const edge = graph?.edges.get(edgeId);
    const from = edge?.from;
    const to = edge?.to;

    if (assignment.get(l)) {
      shape.setLabel(edgeId, 'L', from, to);
    } else if (assignment.get(r)) {
      shape.setLabel(edgeId, 'R', from, to);
    } else if (assignment.get(d)) {
      shape.setLabel(edgeId, 'D', from, to);
    } else if (assignment.get(u)) {
      shape.setLabel(edgeId, 'U', from, to);
    }
  }

  return shape;
}

/**
 * A CDCL-inspired SAT solver for the DOMUS shape construction problem.
 *
 * Implements:
 * - Unit propagation with reason tracking
 * - Conflict analysis and Clause Learning (Resolution)
 * - Non-chronological backtracking (Backjumping)
 * - Most Frequent Variable heuristic
 *
 * This provides better performance for complex cycle sets compared to basic DPLL.
 */
export interface SATResult {
  satisfiable: boolean;
  assignment?: Map<number, boolean>;
  conflictVars?: number[];
}

export interface SolveSatOptions {
  /** Optional additive bias for variable activity (higher = picked earlier). */
  variableBias?: Map<number, number>;
}

export function solveSAT(
  formula: CNFFormula,
  debug = false,
  options: SolveSatOptions = {}
): SATResult {
  const clauses = formula.clauses.map((c) => [...c]);
  // Solver state in typed arrays indexed by variable, not `Map`s.
  //
  // Unit propagation reads the value of every literal of every clause on every
  // fixed point round, and `pickVariable` reads the value and activity of every
  // variable on every decision, so these are the innermost reads in the solver.
  // As `Map`s they made shape construction the largest cost in the layout on
  // `domus/triage2` — solveSAT 4818 ms self plus unitPropagate 2412 ms of a 17 s
  // layout. The algorithm, the iteration order and every decision are unchanged;
  // only the container is.
  const UNASSIGNED = 0;
  const TRUE = 1;
  const FALSE = 2;
  const varCount = formula.numVars;
  const value = new Uint8Array(varCount + 1);
  const varLevel = new Int32Array(varCount + 1).fill(-1);
  const reasonOf: (CNFClause | null)[] = new Array(varCount + 1).fill(null);
  const activity = new Float64Array(varCount + 1);
  const clauses0 = clauses;
  let lastConflictClause: CNFClause | null = null;

  // decisionStack: stores the literals assigned at each level
  // levelStack: literal -> level
  const literalStack: number[] = [];
  const levelOffsets: number[] = [0]; // Index in literalStack where each level starts
  let currentLevel = 0;

  function getLevel(v: number): number {
    return v <= varCount ? varLevel[v] : -1;
  }

  function assign(lit: number, reason: CNFClause | null): void {
    const v = Math.abs(lit);
    value[v] = lit > 0 ? TRUE : FALSE;
    varLevel[v] = currentLevel;
    reasonOf[v] = reason;
    literalStack.push(lit);
  }

  function unassign(v: number): void {
    value[v] = UNASSIGNED;
    varLevel[v] = -1;
    reasonOf[v] = null;
  }

  /**
   * Apply unit propagation.
   * Returns null if successful, or the conflicting clause if a conflict is found.
   */
  function unitPropagate(): CNFClause | null {
    let changed = true;
    while (changed) {
      changed = false;
      for (const clause of clauses) {
        let unassignedLit: number | null = null;
        let isSatisfied = false;

        for (const lit of clause) {
          const v = Math.abs(lit);
          const assigned = value[v];
          const val = assigned === UNASSIGNED ? undefined : assigned === TRUE;
          if (val === undefined) {
            if (unassignedLit === null) {
              unassignedLit = lit;
            } else {
              // More than one unassigned literal
              unassignedLit = 0; // Marker: 0 is never a valid literal
              break;
            }
          } else if (val === lit > 0) {
            isSatisfied = true;
            break;
          }
        }

        if (isSatisfied) {
          continue;
        }

        if (unassignedLit === null) {
          // Conflict: all literals are false
          return clause;
        }

        if (unassignedLit !== 0) {
          // Unit clause
          assign(unassignedLit, clause);
          changed = true;
        }
      }
    }
    return null;
  }

  function collectRootConflictVars(conflictClause: CNFClause): number[] {
    const vars = new Set<number>();
    const queue: CNFClause[] = [conflictClause];
    const visitedClause = new Set<CNFClause>();
    const visitedVar = new Set<number>();

    while (queue.length > 0) {
      const clause = queue.shift()!;
      if (visitedClause.has(clause)) {
        continue;
      }
      visitedClause.add(clause);

      for (const lit of clause) {
        const v = Math.abs(lit);
        vars.add(v);
        if (visitedVar.has(v)) {
          continue;
        }
        visitedVar.add(v);

        const reason = reasonOf[v];
        if (reason && reason.length > 0) {
          queue.push(reason);
        }
      }
    }

    return [...vars].sort((a, b) => a - b);
  }

  /**
   * Conflict Analysis: Derive a new clause using resolution.
   * Based on the 1UIP (First Unique Implication Point) heuristic.
   */
  function analyzeConflict(conflictingClause: CNFClause): {
    learnedClause: CNFClause;
    backtrackLevel: number;
  } {
    if (currentLevel === 0) {
      return { learnedClause: [], backtrackLevel: -1 };
    }

    let learned = [...conflictingClause];
    let i = literalStack.length - 1;

    while (true) {
      // Count how many literals in the current learned clause are from the current level
      const currentLevelLits = learned.filter((lit) => getLevel(Math.abs(lit)) === currentLevel);
      if (currentLevelLits.length <= 1) {
        break;
      }

      // Find the last literal assigned at the current level that is in the learned clause
      while (i >= 0) {
        const lastLit = literalStack[i];
        if (learned.some((l) => Math.abs(l) === Math.abs(lastLit))) {
          break;
        }
        i--;
      }

      const litToResolve = literalStack[i];
      const reason = reasonOf[Math.abs(litToResolve)];

      if (reason) {
        // Resolve learned clause with the reason clause
        const nextLearned = new Set<number>();
        for (const l of learned) {
          if (Math.abs(l) !== Math.abs(litToResolve)) {
            nextLearned.add(l);
          }
        }
        for (const l of reason) {
          if (Math.abs(l) !== Math.abs(litToResolve)) {
            nextLearned.add(l);
          }
        }
        learned = [...nextLearned];
      } else {
        // Safety fallback: if no reason found, we can't resolve further.
        // This shouldn't happen in a correct CDCL implementation.
        break;
      }
      i--;
    }

    // Determine backtrack level: the second highest level in the learned clause
    const levels = learned.map((lit) => getLevel(Math.abs(lit))).filter((l) => l < currentLevel);
    const backtrackLevel = levels.length > 0 ? Math.max(...levels) : 0;

    return { learnedClause: learned, backtrackLevel };
  }

  function backtrack(targetLevel: number): void {
    const offset = levelOffsets[targetLevel + 1];
    while (literalStack.length > offset) {
      const lit = literalStack.pop()!;
      unassign(Math.abs(lit));
    }
    levelOffsets.length = targetLevel + 1;
    currentLevel = targetLevel;
  }

  function pickVariable(): number | null {
    // Heuristic: VSIDS-lite (Variable State Independent Decaying Sum)
    // We use the persistent activity counts if available
    let bestVar: number | null = null;
    let maxActivity = -1;

    for (let v = 1; v <= varCount; v++) {
      if (value[v] === UNASSIGNED) {
        const act = activity[v];
        if (act > maxActivity) {
          maxActivity = act;
          bestVar = v;
        }
      }
    }
    return bestVar;
  }

  // Initialize activity with frequency
  for (const clause of clauses0) {
    for (const lit of clause) {
      const v = Math.abs(lit);
      if (v <= varCount) {
        activity[v] += 1;
      }
    }
  }
  // Apply optional bias (preferences).
  if (options.variableBias) {
    for (const [v, bias] of options.variableBias.entries()) {
      if (v <= varCount) {
        activity[v] += bias;
      }
    }
  }

  // Restart strategy
  let restartInterval = 100;
  let nextRestart = restartInterval;

  // Main Loop
  let iterations = 0;
  const MAX_ITERATIONS = 100000;
  const startTime = Date.now();
  const TIME_LIMIT = 2000; // 2 seconds

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    if (iterations % 1000 === 0 && Date.now() - startTime > TIME_LIMIT) {
      if (debug) {
        log.debug(ORTHO_DEBUG, 'domus_sat_timeout');
      }
      break;
    }

    if (iterations % 10000 === 0 && debug) {
      log.debug(ORTHO_DEBUG, 'domus_sat_iterations', { iterations, clauses: clauses.length });
    }

    if (iterations >= nextRestart) {
      backtrack(0);
      restartInterval = Math.floor(restartInterval * 1.1);
      nextRestart = iterations + restartInterval;
    }

    const conflict = unitPropagate();

    if (conflict) {
      lastConflictClause = conflict;
      if (currentLevel === 0) {
        // Unsolvable at root level. Return a small, causal conflict set based on
        // the conflicting clause and its implication (reason) closure, instead of
        // the previous "all vars" fallback.
        return { satisfiable: false, conflictVars: collectRootConflictVars(conflict) };
      }

      const { learnedClause, backtrackLevel } = analyzeConflict(conflict);
      if (backtrackLevel < 0) {
        return { satisfiable: false };
      }

      clauses.push(learnedClause);

      // Clause deletion policy: remove old/long learned clauses if we have too many
      if (clauses.length > 2000) {
        // Keep original clauses (first few) and recent learned ones
        const originalCount = formula.clauses.length;
        const learned = clauses.slice(originalCount);
        // Sort by length (shorter is usually better)
        learned.sort((a, b) => a.length - b.length);
        const kept = learned.slice(0, 1000);
        clauses.length = originalCount;
        clauses.push(...kept);
      }

      // Update activity for variables in learned clause
      for (const lit of learnedClause) {
        const v = Math.abs(lit);
        if (v <= varCount) {
          activity[v] += 1;
        }
      }
      // Decay activity periodically
      if (clauses.length % 50 === 0) {
        for (let v = 1; v <= varCount; v++) {
          activity[v] *= 0.95;
        }
      }

      backtrack(backtrackLevel);

      // The learned clause is now unit at the backtrack level
      continue;
    }

    const v = pickVariable();
    if (v === null) {
      // Materialise the assignment only on success; callers consume it as a Map.
      const assignment = new Map<number, boolean>();
      for (let i = 1; i <= varCount; i++) {
        if (value[i] !== UNASSIGNED) {
          assignment.set(i, value[i] === TRUE);
        }
      }
      return { satisfiable: true, assignment };
    }

    // New decision level
    currentLevel++;
    levelOffsets.push(literalStack.length);
    assign(v, null); // Guess true
  }

  // If we bailed due to timeout/iteration limit, return the last seen conflict
  // closure when available so callers can still make a meaningful split choice.
  if (lastConflictClause) {
    return { satisfiable: false, conflictVars: collectRootConflictVars(lastConflictClause) };
  }
  return { satisfiable: false };
}

export interface ShapeSatSolveOptions {
  /** If true, compute a deterministic UNSAT clause core (deletion-based) when UNSAT. */
  requestUnsatCore?: boolean;
  /** Safety cap for core extraction (avoids O(n^2) blowups). Default: 300. */
  maxClausesForCore?: number;
}

export interface ShapeSatSolveResult {
  satisfiable: boolean;
  assignment?: Map<number, boolean>;
  /** Deterministic clause core (subset of original clauses) when computed. */
  unsatCoreClauses?: CNFClause[];
  /** Variables appearing in the UNSAT core. */
  unsatCoreVars?: number[];
  /** A single “culprit” SAT variable chosen from the core, mapped to an edge-label var. */
  culpritVar?: number;
  /** Fallback conflict variables from basic SAT solver (when core not computed). */
  conflictVars?: number[];
}

function computeUnsatCoreClausesDeterministic(
  formula: CNFFormula,
  solve: (f: CNFFormula) => SATResult
): CNFClause[] {
  // Deletion-based core extraction (deterministic):
  // try dropping each clause in order; keep it only if needed for UNSAT.
  const core: CNFClause[] = formula.clauses.map((c) => [...c]);
  let i = 0;
  while (i < core.length) {
    const trial = [...core.slice(0, i), ...core.slice(i + 1)];
    const res = solve({ numVars: formula.numVars, clauses: trial });
    if (!res.satisfiable) {
      // Clause i not needed: remove it and keep same i (next clause shifts into i).
      core.splice(i, 1);
      continue;
    }
    i++;
  }
  return core;
}

function collectVarsFromClauses(clauses: CNFClause[]): number[] {
  const vars = new Set<number>();
  for (const c of clauses) {
    for (const lit of c) {
      vars.add(Math.abs(lit));
    }
  }
  return [...vars].sort((a, b) => a - b);
}

function pickCulpritVarFromCore(coreClauses: CNFClause[], vars: SATVariables): number | undefined {
  const counts = new Map<number, number>();
  for (const clause of coreClauses) {
    for (const lit of clause) {
      const v = Math.abs(lit);
      if (!vars.varToEdge.has(v)) {
        continue;
      }
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  if (counts.size === 0) {
    return undefined;
  }

  const labelRank: Record<EdgeLabel, number> = { L: 0, R: 1, D: 2, U: 3 };

  let bestVar: number | undefined;
  let bestCount = -1;
  let bestEdge = '';
  let bestLabel: EdgeLabel = 'L';

  for (const [v, c] of counts) {
    const info = vars.varToEdge.get(v);
    if (!info) {
      continue;
    }
    if (c > bestCount) {
      bestVar = v;
      bestCount = c;
      bestEdge = info.edgeId;
      bestLabel = info.label;
      continue;
    }
    if (c === bestCount) {
      // Deterministic tie-break: edgeId, then label order L,R,D,U, then var id.
      if (info.edgeId < bestEdge) {
        bestVar = v;
        bestEdge = info.edgeId;
        bestLabel = info.label;
      } else if (info.edgeId === bestEdge) {
        if (labelRank[info.label] < labelRank[bestLabel]) {
          bestVar = v;
          bestLabel = info.label;
        } else if (
          labelRank[info.label] === labelRank[bestLabel] &&
          (bestVar === undefined || v < bestVar)
        ) {
          bestVar = v;
        }
      }
    }
  }

  return bestVar;
}

function pickCulpritVarFromConflictVars(
  conflictVars: number[],
  vars: SATVariables
): number | undefined {
  // Deterministic tie-break: edgeId, then label order L,R,D,U, then var id.
  const labelRank: Record<EdgeLabel, number> = { L: 0, R: 1, D: 2, U: 3 };
  let bestVar: number | undefined;
  let bestEdge = '\uffff';
  let bestLabel: EdgeLabel = 'U';
  for (const v of conflictVars) {
    const info = vars.varToEdge.get(v);
    if (!info) {
      continue;
    }
    if (info.edgeId < bestEdge) {
      bestVar = v;
      bestEdge = info.edgeId;
      bestLabel = info.label;
      continue;
    }
    if (info.edgeId === bestEdge) {
      if (labelRank[info.label] < labelRank[bestLabel]) {
        bestVar = v;
        bestLabel = info.label;
        continue;
      }
      if (
        labelRank[info.label] === labelRank[bestLabel] &&
        (bestVar === undefined || v < bestVar)
      ) {
        bestVar = v;
      }
    }
  }
  return bestVar;
}

/**
 * Solve the DOMUS *shape* SAT instance with optional UNSAT-core extraction and a
 * deterministic selection of a single “culprit” edge-label variable.
 *
 * This is Mermaid’s stand-in for “use the solver proof to identify a culprit variable”
 * (DOMUS paper). We do not have DRAT/Glucose proofs here; instead we compute a
 * deterministic UNSAT core by clause deletion and pick a culprit literal from that core.
 */
export function solveShapeSAT(
  formula: CNFFormula,
  vars: SATVariables,
  debug = false,
  options: ShapeSatSolveOptions = {},
  solveOptions: SolveSatOptions = {}
): ShapeSatSolveResult {
  const maxClausesForCore = options.maxClausesForCore ?? 300;
  const base = solveSAT(formula, debug, solveOptions);
  if (base.satisfiable) {
    return { satisfiable: true, assignment: base.assignment };
  }

  if (!options.requestUnsatCore || formula.clauses.length > maxClausesForCore) {
    const culpritVar = base.conflictVars
      ? pickCulpritVarFromConflictVars(base.conflictVars, vars)
      : undefined;
    return { satisfiable: false, conflictVars: base.conflictVars, culpritVar };
  }

  const coreClauses = computeUnsatCoreClausesDeterministic(formula, (f) =>
    solveSAT(f, false, solveOptions)
  );
  const coreVars = collectVarsFromClauses(coreClauses);
  const culpritVar = pickCulpritVarFromCore(coreClauses, vars);
  return {
    satisfiable: false,
    unsatCoreClauses: coreClauses,
    unsatCoreVars: coreVars,
    culpritVar,
  };
}

/**
 * Compute a variable activity bias for preference-style constraints.
 *
 * This is not MaxSAT: it only nudges the solver’s branching order toward
 * preferred directions while keeping clauses hard.
 */
export function buildPreferenceVariableBias(
  vars: SATVariables,
  constraints?: DomusConstraints
): Map<number, number> {
  const bias = new Map<number, number>();
  if (!constraints) {
    return bias;
  }

  const preferVertical = !!constraints.preferVertical;
  const preferHorizontal = !!constraints.preferHorizontal;
  if (!preferVertical && !preferHorizontal) {
    return bias;
  }

  // Strong-ish but not overwhelming.
  const BIAS = 5;

  for (const [_edgeId, [l, r, d, u]] of vars.edgeVars.entries()) {
    if (preferVertical && !preferHorizontal) {
      bias.set(d, (bias.get(d) ?? 0) + BIAS);
      bias.set(u, (bias.get(u) ?? 0) + BIAS);
    } else if (preferHorizontal && !preferVertical) {
      bias.set(l, (bias.get(l) ?? 0) + BIAS);
      bias.set(r, (bias.get(r) ?? 0) + BIAS);
    } else {
      // If both are requested, keep neutral for now.
    }
  }

  return bias;
}

/**
 * Identify an edge to split based on SAT conflict variables.
 *
 * Enhanced heuristic inspired by conflict-driven clause learning (CDCL):
 * 1. Base score: count of edge variables in the conflict set
 * 2. Activity bonus: higher weight for edges that appeared in previous conflicts
 * 3. Deterministic tie-breaking: alphabetical order for reproducibility
 *
 * Reference: (DOMUS, p.8, §4.1) - "From this proof, we identify an edge label
 * variable causing unsatisfiability"
 */
export function identifyEdgeToSplit(
  conflictVars: number[],
  vars: SATVariables,
  edgeActivity?: Map<string, number>
): string | null {
  if (conflictVars.length === 0) {
    return null;
  }

  const _conflictSet = new Set(conflictVars);
  const currentScores = new Map<string, number>();

  // Map conflict variables back to edges
  for (const v of conflictVars) {
    const info = vars.varToEdge.get(v);
    if (info) {
      currentScores.set(info.edgeId, (currentScores.get(info.edgeId) ?? 0) + 1);

      // Update persistent activity if provided
      if (edgeActivity) {
        edgeActivity.set(info.edgeId, (edgeActivity.get(info.edgeId) ?? 0) + 1);
      }
    }
  }

  // Combine current scores with persistent activity
  const combinedScores = new Map<string, number>();
  for (const [edgeId, currentScore] of currentScores) {
    const activity = edgeActivity?.get(edgeId) ?? 0;
    combinedScores.set(edgeId, currentScore + activity);
  }

  if (combinedScores.size === 0) {
    return null;
  }

  // Pick edge with highest score (with deterministic tie-breaking)
  // Sort edge IDs for deterministic ordering
  const sortedEdges = [...combinedScores.entries()].sort((a, b) => {
    // Primary: highest score
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }
    // Secondary: alphabetical (deterministic)
    return a[0].localeCompare(b[0]);
  });

  return sortedEdges[0][0];
}
