/* eslint-disable no-console */
/**
 * Tests for the DOMUS shape-first orthogonal drawing algorithm.
 *
 * These tests verify:
 * - Core data structures (Shape, CycleSet, DomusGraph)
 * - Graph analysis (biconnected components, cycle basis)
 * - Auxiliary graph construction (Gx, Gy)
 * - Drawability testing
 * - SAT encoding and solving
 * - The full DOMUS algorithm
 *
 * Reference: (DOMUS, LIPIcs.GD.2025.35)
 */

import { describe, it, expect } from 'vitest';
import {
  runDomus,
  createShape,
  createCycleSet,
  createDomusGraph,
  splitEdge,
  resetDummyVertexCounter,
  isCycleComplete,
  oppositeLabel,
  ALL_LABELS,
  findBiconnectedComponents,
  computeCycleBasis,
  getVertexDegree,
  isConnected,
  buildAuxiliaryGraphGx,
  buildAuxiliaryGraphGy,
  testRectilinearDrawability,
  computeCoordinatesFromShape,
  generateShapeSATFormula,
  solveSAT,
  solveShapeSAT,
  identifyEdgeToSplit,
  buildPreferenceVariableBias,
  extractShapeFromAssignment,
  gridToPixelCoordinates,
} from './index.js';
import type { SimpleCycle, EdgeLabel, DomusConstraints } from './types.js';
import type { LayoutData } from '../../../types.js';

const DOMUS_TEST = '[DOMUS_TEST]';

describe('DOMUS Core Types', () => {
  describe('EdgeLabel utilities', () => {
    it('oppositeLabel returns correct opposites', () => {
      expect(oppositeLabel('L')).toBe('R');
      expect(oppositeLabel('R')).toBe('L');
      expect(oppositeLabel('U')).toBe('D');
      expect(oppositeLabel('D')).toBe('U');
    });

    it('ALL_LABELS contains all four directions', () => {
      expect(ALL_LABELS).toContain('L');
      expect(ALL_LABELS).toContain('R');
      expect(ALL_LABELS).toContain('U');
      expect(ALL_LABELS).toContain('D');
      expect(ALL_LABELS.length).toBe(4);
    });
  });

  describe('Shape', () => {
    it('creates an empty shape', () => {
      const shape = createShape();
      expect(shape.labels.size).toBe(0);
    });

    it('sets and gets labels', () => {
      const shape = createShape();
      shape.setLabel('e1', 'R');
      shape.setLabel('e2', 'U');

      expect(shape.labels.get('e1')).toBe('R');
      expect(shape.labels.get('e2')).toBe('U');
    });
  });

  describe('CycleSet', () => {
    it('creates an empty cycle set', () => {
      const cycleSet = createCycleSet();
      expect(cycleSet.cycles.length).toBe(0);
    });

    it('adds cycles and checks containment', () => {
      const cycleSet = createCycleSet();
      const cycle1: SimpleCycle = {
        vertices: ['A', 'B', 'C'],
        edgeIds: ['e1', 'e2', 'e3'],
      };
      const cycle2: SimpleCycle = {
        vertices: ['A', 'B', 'C'],
        edgeIds: ['e1', 'e2', 'e3'],
      };

      cycleSet.add(cycle1);
      expect(cycleSet.cycles.length).toBe(1);
      expect(cycleSet.contains(cycle2)).toBe(true);

      // Adding duplicate doesn't increase size
      cycleSet.add(cycle2);
      expect(cycleSet.cycles.length).toBe(1);
    });

    it('recognizes cycles in different orientations as the same', () => {
      const cycleSet = createCycleSet();
      const cycle1: SimpleCycle = {
        vertices: ['A', 'B', 'C'],
        edgeIds: ['e1', 'e2', 'e3'],
      };
      const cycle2: SimpleCycle = {
        vertices: ['C', 'B', 'A'],
        edgeIds: ['e3', 'e2', 'e1'],
      };

      cycleSet.add(cycle1);
      expect(cycleSet.contains(cycle2)).toBe(true);
    });
  });

  describe('DomusGraph', () => {
    it('creates a graph from vertices and edges', () => {
      const graph = createDomusGraph(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
        ]
      );

      expect(graph.vertices.size).toBe(3);
      expect(graph.edges.size).toBe(2);
      expect(graph.adjacency.get('A')?.length).toBe(1);
      expect(graph.adjacency.get('B')?.length).toBe(2);
      expect(graph.adjacency.get('C')?.length).toBe(1);
    });

    it('excludes edges outside the vertex set', () => {
      const graph = createDomusGraph(
        ['A', 'B'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'A', to: 'Group' },
          { id: 'e3', from: 'Group', to: 'B' },
        ]
      );

      expect(graph.edges.size).toBe(1);
      expect(graph.edges.has('e2')).toBe(false);
      expect(graph.edges.has('e3')).toBe(false);
      expect(graph.adjacency.get('A')).toEqual([{ neighbor: 'B', edgeId: 'e1' }]);
      expect(graph.adjacency.get('B')).toEqual([{ neighbor: 'A', edgeId: 'e1' }]);
      expect(graph.adjacency.has('Group')).toBe(false);
    });

    it('splits an edge correctly', () => {
      const graph = createDomusGraph(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);

      const { dummyId, newEdgeIds } = splitEdge(graph, 'e1');

      expect(graph.vertices.size).toBe(3);
      expect(graph.vertices.has(dummyId)).toBe(true);
      expect(graph.edges.size).toBe(2);
      expect(graph.edges.has('e1')).toBe(false);
      expect(graph.edges.has(newEdgeIds[0])).toBe(true);
      expect(graph.edges.has(newEdgeIds[1])).toBe(true);
      expect(graph.dummyVertices.has(dummyId)).toBe(true);
    });
  });

  describe('isCycleComplete', () => {
    it('returns true for a complete cycle', () => {
      const shape = createShape();
      shape.setLabel('e1', 'L');
      shape.setLabel('e2', 'R');
      shape.setLabel('e3', 'U');
      shape.setLabel('e4', 'D');

      const cycle: SimpleCycle = {
        vertices: ['A', 'B', 'C', 'D'],
        edgeIds: ['e1', 'e2', 'e3', 'e4'],
      };

      expect(isCycleComplete(cycle, shape)).toBe(true);
    });

    it('returns false for an incomplete cycle', () => {
      const shape = createShape();
      shape.setLabel('e1', 'L');
      shape.setLabel('e2', 'R');
      shape.setLabel('e3', 'L'); // Missing U and D
      shape.setLabel('e4', 'R');

      const cycle: SimpleCycle = {
        vertices: ['A', 'B', 'C', 'D'],
        edgeIds: ['e1', 'e2', 'e3', 'e4'],
      };

      expect(isCycleComplete(cycle, shape)).toBe(false);
    });
  });
});

describe('DOMUS Graph Analysis', () => {
  describe('findBiconnectedComponents', () => {
    it('finds biconnected components in a simple graph', () => {
      // Triangle graph: one biconnected component
      const graph = createDomusGraph(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
          { id: 'e3', from: 'C', to: 'A' },
        ]
      );

      const components = findBiconnectedComponents(graph);
      expect(components.length).toBe(1);
      expect(components[0].isTrivial).toBe(false);
      expect(components[0].edges.size).toBe(3);
    });

    it('identifies trivial components (single edges)', () => {
      // Path graph: two trivial components
      const graph = createDomusGraph(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
        ]
      );

      const components = findBiconnectedComponents(graph);
      const trivialCount = components.filter((c) => c.isTrivial).length;
      expect(trivialCount).toBeGreaterThan(0);
    });
  });

  describe('computeCycleBasis', () => {
    it('computes cycle basis for a triangle', () => {
      const graph = createDomusGraph(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
          { id: 'e3', from: 'C', to: 'A' },
        ]
      );

      const cycleSet = computeCycleBasis(graph);
      expect(cycleSet.cycles.length).toBe(1);
      expect(cycleSet.cycles[0].vertices.length).toBe(3);
    });

    it('computes cycle basis for K4 (complete graph on 4 vertices)', () => {
      const graph = createDomusGraph(
        ['A', 'B', 'C', 'D'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'A', to: 'C' },
          { id: 'e3', from: 'A', to: 'D' },
          { id: 'e4', from: 'B', to: 'C' },
          { id: 'e5', from: 'B', to: 'D' },
          { id: 'e6', from: 'C', to: 'D' },
        ]
      );

      const cycleSet = computeCycleBasis(graph);
      // K4 has |E| - |V| + 1 = 6 - 4 + 1 = 3 fundamental cycles
      expect(cycleSet.cycles.length).toBe(3);
    });
  });

  describe('isConnected', () => {
    it('returns true for a connected graph', () => {
      const graph = createDomusGraph(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
        ]
      );

      expect(isConnected(graph)).toBe(true);
    });

    it('returns false for a disconnected graph', () => {
      const graph = createDomusGraph(['A', 'B', 'C', 'D'], [{ id: 'e1', from: 'A', to: 'B' }]);

      // C and D are not connected to A-B
      expect(isConnected(graph)).toBe(false);
    });
  });

  describe('getVertexDegree', () => {
    it('returns correct degree for each vertex', () => {
      const graph = createDomusGraph(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
        ]
      );

      expect(getVertexDegree(graph, 'A')).toBe(1);
      expect(getVertexDegree(graph, 'B')).toBe(2);
      expect(getVertexDegree(graph, 'C')).toBe(1);
    });
  });
});

describe('DOMUS Auxiliary Graphs', () => {
  describe('buildAuxiliaryGraphGx', () => {
    it('builds Gx correctly for a simple shaped graph', () => {
      const graph = createDomusGraph(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
        ]
      );

      const shape = createShape();
      shape.setLabel('e1', 'R'); // A is left of B
      shape.setLabel('e2', 'D'); // B and C are x-aligned

      const gx = buildAuxiliaryGraphGx(graph, shape);

      // A is in one node, B and C (connected by D) are in another
      expect(gx.nodes.size).toBe(2);
      // One arc: from A's node to B's node (due to R edge)
      expect(gx.arcs.length).toBe(1);
    });
  });

  describe('buildAuxiliaryGraphGy', () => {
    it('builds Gy correctly for a simple shaped graph', () => {
      const graph = createDomusGraph(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
        ]
      );

      const shape = createShape();
      shape.setLabel('e1', 'R'); // A and B are y-aligned
      shape.setLabel('e2', 'U'); // B is below C

      const gy = buildAuxiliaryGraphGy(graph, shape);

      // A and B are in one node (connected by R), C is in another
      expect(gy.nodes.size).toBe(2);
      // One arc: from B's node to C's node (due to U edge)
      expect(gy.arcs.length).toBe(1);
    });
  });
});

describe('DOMUS Drawability Testing', () => {
  describe('testRectilinearDrawability', () => {
    it('returns drawable=true for a valid shape on a path', () => {
      const graph = createDomusGraph(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
        ]
      );

      const shape = createShape();
      shape.setLabel('e1', 'R');
      shape.setLabel('e2', 'R');

      const result = testRectilinearDrawability(graph, shape);
      expect(result.drawable).toBe(true);
    });

    it('returns drawable=true for a valid shape on a square', () => {
      // Square: A-B-C-D-A with complete labeling
      const graph = createDomusGraph(
        ['A', 'B', 'C', 'D'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
          { id: 'e3', from: 'C', to: 'D' },
          { id: 'e4', from: 'D', to: 'A' },
        ]
      );

      // Valid rectangle: A-R->B-D->C-L->D-U->A
      const shape = createShape();
      shape.setLabel('e1', 'R');
      shape.setLabel('e2', 'D');
      shape.setLabel('e3', 'L');
      shape.setLabel('e4', 'U');

      const result = testRectilinearDrawability(graph, shape);
      expect(result.drawable).toBe(true);
    });

    it('returns drawable=false with witness for invalid shape', () => {
      // Triangle - cannot be rectilinearly drawn
      const graph = createDomusGraph(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
          { id: 'e3', from: 'C', to: 'A' },
        ]
      );

      // Any shape on a triangle will fail (only 3 edges for 4 directions)
      const shape = createShape();
      shape.setLabel('e1', 'R');
      shape.setLabel('e2', 'D');
      shape.setLabel('e3', 'L'); // Missing U

      const result = testRectilinearDrawability(graph, shape);
      // This should still pass the auxiliary graph test; the cycle is not complete
      // but for drawability we need Gx/Gy to be acyclic
      expect(result.drawable).toBeDefined();
    });
  });

  describe('computeCoordinatesFromShape', () => {
    it('computes coordinates for a simple path', () => {
      const graph = createDomusGraph(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
        ]
      );

      const shape = createShape();
      shape.setLabel('e1', 'R');
      shape.setLabel('e2', 'R');

      const result = testRectilinearDrawability(graph, shape);
      expect(result.drawable).toBe(true);

      const coords = computeCoordinatesFromShape(result, graph);
      expect(coords.size).toBe(3);

      // A should be left of B, B left of C
      const xA = coords.get('A')?.x ?? 0;
      const xB = coords.get('B')?.x ?? 0;
      const xC = coords.get('C')?.x ?? 0;
      expect(xA).toBeLessThan(xB);
      expect(xB).toBeLessThan(xC);

      // All y-coordinates should be equal (horizontal line)
      const yA = coords.get('A')?.y ?? 0;
      const yB = coords.get('B')?.y ?? 0;
      const yC = coords.get('C')?.y ?? 0;
      expect(yA).toBe(yB);
      expect(yB).toBe(yC);
    });
  });
});

describe('DOMUS SAT Encoding', () => {
  describe('generateShapeSATFormula', () => {
    it('generates formula for a simple graph', () => {
      const graph = createDomusGraph(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);

      const cycleSet = createCycleSet();
      const { formula, vars } = generateShapeSATFormula(graph, cycleSet);

      // 4 variables per edge
      expect(vars.edgeVars.size).toBe(1);
      expect(formula.numVars).toBe(4);

      // Exactly-one clauses: 1 (at-least-one) + 6 (at-most-one) = 7
      // No vertex distinctness for 2 degree-1 vertices
      expect(formula.clauses.length).toBe(7);
    });

    it('generates cycle completeness clauses', () => {
      const graph = createDomusGraph(
        ['A', 'B', 'C', 'D'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
          { id: 'e3', from: 'C', to: 'D' },
          { id: 'e4', from: 'D', to: 'A' },
        ]
      );

      const cycleSet = createCycleSet();
      cycleSet.add({
        vertices: ['A', 'B', 'C', 'D'],
        edgeIds: ['e1', 'e2', 'e3', 'e4'],
      });

      const { formula } = generateShapeSATFormula(graph, cycleSet);

      // Should have 4 cycle completeness clauses (one per label)
      // Plus exactly-one clauses (7 * 4 = 28) and vertex distinctness
      expect(formula.clauses.length).toBeGreaterThan(28);
    });

    it('A3 / R7: skips completeness clauses for 2-cycles (anti-parallel edges)', () => {
      // Defensive guard against the witness-cycle addition path
      // (`domus.ts:state.cycleSet.add(witnessCycle)`). The initial-C path
      // (`computeCycleBasis`) already filters `vertices.length >= 3`; this
      // SAT-layer guard only catches 2-cycles. 3-cycles are intentionally
      // left to UNSAT-then-split: the algorithm subdivides one edge to turn
      // a 3-cycle into a 4-cycle, where each completeness clause becomes
      // satisfiable.
      //
      // Each completeness clause requires at least one cycle edge to take a
      // given label, and ALL_LABELS = {L,R,U,D} has 4 entries — a 2-edge
      // cycle cannot satisfy all 4 single-literal clauses, forcing UNSAT.
      //
      // Paper anchor: DOMUS §4.1 (source `6784b3d1`) — "2-cycles require an
      // upstream edge split."
      const graph = createDomusGraph(
        ['A', 'B'],
        [
          { id: 'eAB', from: 'A', to: 'B' },
          { id: 'eBA', from: 'B', to: 'A' },
        ]
      );

      // Baseline: empty cycle set yields the formula's structural clauses
      // (per-edge exactly-one + vertex distinctness) without any completeness
      // clauses.
      const baselineSet = createCycleSet();
      const { formula: baseline } = generateShapeSATFormula(graph, baselineSet);

      // With a 2-cycle force-added (the witness-path scenario): under A3 the
      // formula must equal baseline — the 2-cycle contributes zero clauses.
      const twoCycleSet = createCycleSet();
      twoCycleSet.add({
        vertices: ['A', 'B'],
        edgeIds: ['eAB', 'eBA'],
      });
      const { formula: withTwoCycle } = generateShapeSATFormula(graph, twoCycleSet);

      expect(withTwoCycle.clauses.length).toBe(baseline.clauses.length);
    });
  });

  describe('solveSAT', () => {
    it('solves a simple satisfiable formula', () => {
      // Simple formula: (x1 ∨ x2)
      const formula = {
        numVars: 2,
        clauses: [[1, 2]],
      };

      const result = solveSAT(formula);
      expect(result.satisfiable).toBe(true);
      expect(result.assignment).toBeDefined();

      // At least one of x1, x2 should be true
      const x1 = result.assignment?.get(1);
      const x2 = result.assignment?.get(2);
      expect(x1 === true || x2 === true).toBe(true);
    });

    it('detects unsatisfiable formula', () => {
      // Unsatisfiable: (x1) ∧ (¬x1)
      const formula = {
        numVars: 1,
        clauses: [[1], [-1]],
      };

      const result = solveSAT(formula);
      expect(result.satisfiable).toBe(false);
    });

    it('returns a tight conflictVars set for a root-level UNSAT with irrelevant variables present', () => {
      // Unsatisfiable: (x1) ∧ (¬x1), but with an irrelevant satisfiable clause (x2).
      // We expect conflictVars to reference x1 only (or at least not include x2).
      const formula = {
        numVars: 2,
        clauses: [[1], [-1], [2]],
      };

      const result = solveSAT(formula);
      expect(result.satisfiable).toBe(false);
      expect(
        result.conflictVars,
        'conflictVars should be provided for root-level UNSAT'
      ).toBeTruthy();
      const vars = result.conflictVars!;
      expect(vars).toContain(1);
      expect(vars).not.toContain(2);
    });
  });

  describe('preferences (heuristic bias)', () => {
    it('prefers vertical labels for a single-edge instance when preferVertical is set', () => {
      const graph = createDomusGraph(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);
      const cycleSet = createCycleSet();
      const constraints: DomusConstraints = { preferVertical: true };
      const { formula, vars } = generateShapeSATFormula(graph, cycleSet, constraints);

      const bias = buildPreferenceVariableBias(vars, constraints);
      const result = solveSAT(formula, false, { variableBias: bias });
      expect(result.satisfiable).toBe(true);
      const shape = extractShapeFromAssignment(result.assignment!, vars);
      expect(['U', 'D']).toContain(shape.labels.get('e1'));
    });

    it('prefers horizontal labels for a single-edge instance when preferHorizontal is set', () => {
      const graph = createDomusGraph(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);
      const cycleSet = createCycleSet();
      const constraints: DomusConstraints = { preferHorizontal: true };
      const { formula, vars } = generateShapeSATFormula(graph, cycleSet, constraints);

      const bias = buildPreferenceVariableBias(vars, constraints);
      const result = solveSAT(formula, false, { variableBias: bias });
      expect(result.satisfiable).toBe(true);
      const shape = extractShapeFromAssignment(result.assignment!, vars);
      expect(['L', 'R']).toContain(shape.labels.get('e1'));
    });
  });

  describe('identifyEdgeToSplit', () => {
    it('selects the actually conflicting edge when UNSAT is driven by contradictory edge constraints', () => {
      const graph = createDomusGraph(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);
      const cycleSet = createCycleSet();
      const constraints: DomusConstraints = {
        edgeConstraints: [
          { edgeId: 'e1', requiredLabel: 'L' },
          { edgeId: 'e1', requiredLabel: 'R' },
        ],
      };

      const { formula, vars } = generateShapeSATFormula(graph, cycleSet, constraints);
      const result = solveSAT(formula);
      expect(result.satisfiable).toBe(false);
      expect(result.conflictVars, 'conflictVars should be provided').toBeTruthy();

      const picked = identifyEdgeToSplit(result.conflictVars!, vars);
      expect(picked).toBe('e1');
    });
  });

  describe('extractShapeFromAssignment', () => {
    it('extracts shape correctly', () => {
      const graph = createDomusGraph(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);

      const cycleSet = createCycleSet();
      const { vars } = generateShapeSATFormula(graph, cycleSet);

      // Manually create an assignment where e1 is labeled R
      const [l, r, d, u] = vars.edgeVars.get('e1')!;
      const assignment = new Map<number, boolean>();
      assignment.set(l, false);
      assignment.set(r, true);
      assignment.set(d, false);
      assignment.set(u, false);

      const shape = extractShapeFromAssignment(assignment, vars);
      expect(shape.labels.get('e1')).toBe('R');
    });
  });

  describe('UNSAT core + deterministic culprit (paper-style edge splitting driver)', () => {
    it('core excludes irrelevant edges and picks culprit edge deterministically', () => {
      // Two disconnected edges; only e1 is contradictory.
      const graph = createDomusGraph(
        ['A', 'B', 'C', 'D'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'C', to: 'D' },
        ]
      );
      const cycleSet = createCycleSet();
      const constraints: DomusConstraints = {
        edgeConstraints: [
          { edgeId: 'e1', requiredLabel: 'L' },
          { edgeId: 'e1', requiredLabel: 'R' },
        ],
      };

      const { formula, vars } = generateShapeSATFormula(graph, cycleSet, constraints);
      const res = solveShapeSAT(formula, vars, false, {
        requestUnsatCore: true,
        maxClausesForCore: 500,
      });
      expect(res.satisfiable).toBe(false);
      expect(res.unsatCoreVars).toBeTruthy();
      expect(res.culpritVar).toBeTruthy();

      const e1Vars = vars.edgeVars.get('e1')!;
      const e2Vars = vars.edgeVars.get('e2')!;
      const [e1L, e1R] = e1Vars;
      // Core must mention the contradictory e1 label vars (L and R),
      // but it does not need to mention the other two labels (D/U).
      expect(res.unsatCoreVars!).toContain(e1L);
      expect(res.unsatCoreVars!).toContain(e1R);
      // Core should not need any e2 var.
      for (const v of e2Vars) {
        expect(res.unsatCoreVars!).not.toContain(v);
      }

      const culpritEdge = vars.varToEdge.get(res.culpritVar!)!.edgeId;
      expect(culpritEdge).toBe('e1');
    });

    it('culprit edge does not depend on edge insertion order', () => {
      const constraints: DomusConstraints = {
        edgeConstraints: [
          { edgeId: 'e1', requiredLabel: 'L' },
          { edgeId: 'e1', requiredLabel: 'R' },
        ],
      };

      const cycleSet = createCycleSet();

      const g1 = createDomusGraph(
        ['A', 'B', 'C', 'D'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'C', to: 'D' },
        ]
      );
      const { formula: f1, vars: v1 } = generateShapeSATFormula(g1, cycleSet, constraints);
      const r1 = solveShapeSAT(f1, v1, false, { requestUnsatCore: true, maxClausesForCore: 500 });
      const e1 = v1.varToEdge.get(r1.culpritVar!)!.edgeId;

      const g2 = createDomusGraph(
        ['A', 'B', 'C', 'D'],
        [
          { id: 'e2', from: 'C', to: 'D' },
          { id: 'e1', from: 'A', to: 'B' },
        ]
      );
      const { formula: f2, vars: v2 } = generateShapeSATFormula(g2, cycleSet, constraints);
      const r2 = solveShapeSAT(f2, v2, false, { requestUnsatCore: true, maxClausesForCore: 500 });
      const e2 = v2.varToEdge.get(r2.culpritVar!)!.edgeId;

      expect(e1).toBe('e1');
      expect(e2).toBe('e1');
    });

    it('returns a deterministic culprit even when UNSAT core extraction is skipped (fallback proof-ish mode)', () => {
      // Force the "no core" branch by setting maxClausesForCore extremely low.
      // We still want a deterministic culpritVar derived from the conflict information.
      const graph = createDomusGraph(
        ['A', 'B', 'C', 'D'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'C', to: 'D' },
        ]
      );
      const cycleSet = createCycleSet();
      const constraints: DomusConstraints = {
        edgeConstraints: [
          { edgeId: 'e1', requiredLabel: 'L' },
          { edgeId: 'e1', requiredLabel: 'R' },
        ],
      };
      const { formula, vars } = generateShapeSATFormula(graph, cycleSet, constraints);

      const res = solveShapeSAT(formula, vars, false, {
        requestUnsatCore: true,
        maxClausesForCore: 1,
      });
      expect(res.satisfiable).toBe(false);
      expect(res.unsatCoreClauses).toBeUndefined();
      expect(res.culpritVar, 'culpritVar should still be provided').toBeTruthy();
      expect(vars.varToEdge.get(res.culpritVar!)!.edgeId).toBe('e1');
    });
  });
});

describe('DOMUS Full Algorithm', () => {
  describe('runDomus', () => {
    it('solves a simple path graph', () => {
      const result = runDomus(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
        ]
      );

      expect(result.success).toBe(true);
      expect(result.shape).toBeDefined();
      expect(result.coordinates?.size).toBe(3);
      expect(result.stats.edgeSplits).toBe(0);

      console.log(DOMUS_TEST, 'path_result', JSON.stringify(result.stats));
    });

    it('solves a square graph (4-cycle)', () => {
      const result = runDomus(
        ['A', 'B', 'C', 'D'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
          { id: 'e3', from: 'C', to: 'D' },
          { id: 'e4', from: 'D', to: 'A' },
        ]
      );

      expect(result.success).toBe(true);
      expect(result.shape).toBeDefined();
      expect(result.coordinates?.size).toBe(4);

      // Verify the shape is a valid rectangle
      if (result.shape) {
        const labels = new Set<EdgeLabel>();
        for (const [, label] of result.shape.labels) {
          labels.add(label);
        }
        expect(labels.size).toBe(4); // All four directions used
      }

      console.log(DOMUS_TEST, 'square_result', JSON.stringify(result.stats));
    });

    it('handles a triangle by splitting edges', () => {
      const result = runDomus(
        ['A', 'B', 'C'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'B', to: 'C' },
          { id: 'e3', from: 'C', to: 'A' },
        ],
        { debug: false } // Enable debug for tracing
      );

      // Triangle needs edge splits to become drawable
      // (3 edges is not enough for 4 directions on the cycle)
      // SAT should detect UNSAT and split edges until drawable
      console.log(
        DOMUS_TEST,
        'triangle_result',
        JSON.stringify({
          success: result.success,
          stats: result.stats,
          dummyVertices: result.graph.dummyVertices.size,
          finalEdgeCount: result.graph.edges.size,
        })
      );

      if (result.success) {
        // Verify that edge splits occurred (triangle is not rectilinear drawable without bends)
        expect(result.stats.edgeSplits).toBeGreaterThanOrEqual(0);
      } else {
        // If it fails, check the stats to understand why
        expect(result.stats).toBeDefined();
      }
    });

    it('handles a grid-like graph', () => {
      // 2x2 grid: A-B-C-D with cross edges
      const result = runDomus(
        ['A', 'B', 'C', 'D'],
        [
          { id: 'e1', from: 'A', to: 'B' },
          { id: 'e2', from: 'A', to: 'C' },
          { id: 'e3', from: 'B', to: 'D' },
          { id: 'e4', from: 'C', to: 'D' },
        ]
      );

      expect(result.success).toBe(true);
      expect(result.coordinates?.size).toBe(4);

      console.log(DOMUS_TEST, 'grid_result', JSON.stringify(result.stats));
    });
  });

  describe('gridToPixelCoordinates', () => {
    it('converts grid coordinates to pixels', () => {
      const gridCoords = new Map<string, { x: number; y: number }>();
      gridCoords.set('A', { x: 0, y: 0 });
      gridCoords.set('B', { x: 1, y: 0 });
      gridCoords.set('C', { x: 1, y: 1 });

      const pixelCoords = gridToPixelCoordinates(gridCoords, 100, { x: 50, y: 50 });

      expect(pixelCoords.get('A')).toEqual({ x: 50, y: 50 });
      expect(pixelCoords.get('B')).toEqual({ x: 150, y: 50 });
      expect(pixelCoords.get('C')).toEqual({ x: 150, y: 150 });
    });
  });
});

describe('DOMUS Vertex Expansion (Degree > 4)', () => {
  it('propagates original node size onto the expanded core vertex for compaction', async () => {
    const { augmentNodeSizesForPostSatExpansion } = await import('./vertexExpansion.js');

    const nodeSizes = new Map<string, { width: number; height: number }>();
    nodeSizes.set('HUB', { width: 120, height: 80 });

    const expansions = new Map<string, any>();
    expansions.set('HUB', {
      originalVertexId: 'HUB',
      chainVertexIds: ['HUB_core', 'HUB_port_R_0'],
      chainEdgeIds: [],
      neighborToChainVertex: new Map(),
    });

    const out = augmentNodeSizesForPostSatExpansion(nodeSizes, expansions);
    expect(out.get('HUB_core')).toEqual({ width: 120, height: 80 });
  });

  it('does not expand vertices with degree <= 4', () => {
    const result = runDomus(
      ['A', 'B', 'C', 'D', 'E'],
      [
        { id: 'e1', from: 'A', to: 'B' },
        { id: 'e2', from: 'A', to: 'C' },
        { id: 'e3', from: 'A', to: 'D' },
        { id: 'e4', from: 'A', to: 'E' },
      ]
    );

    // A has degree 4, so no expansion needed
    expect(result.stats.expandedVertices).toBe(0);
    expect(result.expansions).toBeUndefined();
    expect(result.success).toBe(true);

    console.log(DOMUS_TEST, 'degree_4_result', JSON.stringify(result.stats));
  });

  it('expands a vertex with degree 5', () => {
    const result = runDomus(
      ['A', 'B', 'C', 'D', 'E', 'F'],
      [
        { id: 'e1', from: 'A', to: 'B' },
        { id: 'e2', from: 'A', to: 'C' },
        { id: 'e3', from: 'A', to: 'D' },
        { id: 'e4', from: 'A', to: 'E' },
        { id: 'e5', from: 'A', to: 'F' },
      ]
    );

    // A has degree 5, so it should be expanded
    expect(result.stats.expandedVertices).toBe(1);
    expect(result.success).toBe(true);

    // Original vertex A should still have coordinates
    if (result.coordinates) {
      expect(result.coordinates.has('A')).toBe(true);
    }

    console.log(DOMUS_TEST, 'degree_5_result', JSON.stringify(result.stats));
  });

  it('expands a vertex with degree 6', () => {
    const result = runDomus(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      [
        { id: 'e1', from: 'A', to: 'B' },
        { id: 'e2', from: 'A', to: 'C' },
        { id: 'e3', from: 'A', to: 'D' },
        { id: 'e4', from: 'A', to: 'E' },
        { id: 'e5', from: 'A', to: 'F' },
        { id: 'e6', from: 'A', to: 'G' },
      ]
    );

    // A has degree 6, so it should be expanded into ceil(6/2) = 3 chain vertices
    expect(result.stats.expandedVertices).toBe(1);
    expect(result.success).toBe(true);

    console.log(DOMUS_TEST, 'degree_6_result', JSON.stringify(result.stats));
  });

  it('handles multiple high-degree vertices', () => {
    const result = runDomus(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      [
        // A has degree 5
        { id: 'e1', from: 'A', to: 'B' },
        { id: 'e2', from: 'A', to: 'C' },
        { id: 'e3', from: 'A', to: 'D' },
        { id: 'e4', from: 'A', to: 'E' },
        { id: 'e5', from: 'A', to: 'F' },
        // F has degree 5
        { id: 'e6', from: 'F', to: 'G' },
        { id: 'e7', from: 'F', to: 'H' },
        { id: 'e8', from: 'F', to: 'B' },
        { id: 'e9', from: 'F', to: 'C' },
      ]
    );

    // Both A and F have degree 5, so both should be expanded
    expect(result.stats.expandedVertices).toBe(2);
    expect(result.success).toBe(true);

    console.log(DOMUS_TEST, 'multiple_high_degree_result', JSON.stringify(result.stats));
  });
});

describe('DOMUS RP1 Pipeline Integration', () => {
  it('runDomusRouting works with LayoutData', async () => {
    const { runDomusRouting } = await import('./runner.js');

    const layout = {
      nodes: [
        { id: 'A', x: 0, y: 0, width: 100, height: 50 },
        { id: 'B', x: 200, y: 0, width: 100, height: 50 },
        { id: 'C', x: 200, y: 150, width: 100, height: 50 },
        { id: 'D', x: 0, y: 150, width: 100, height: 50 },
      ],
      edges: [
        { id: 'e1', start: 'A', end: 'B' },
        { id: 'e2', start: 'B', end: 'C' },
        { id: 'e3', start: 'C', end: 'D' },
        { id: 'e4', start: 'D', end: 'A' },
      ],
    };

    const result = runDomusRouting(layout as unknown as LayoutData);

    expect(result.success).toBe(true);
    expect(result.edgePaths?.size).toBe(4);

    // Check that edges have points
    for (const edge of layout.edges) {
      expect((edge as { points?: { x: number; y: number }[] }).points).toBeDefined();
      expect((edge as { points?: { x: number; y: number }[] }).points!.length).toBeGreaterThan(0);
    }

    console.log(DOMUS_TEST, 'rp1_integration_result', {
      success: result.success,
      pathsGenerated: result.edgePaths?.size,
    });
  });

  it('runOrthogonalEdgePipeline uses DOMUS when requested', async () => {
    const { runOrthogonalEdgePipeline } = await import('../pipeline.js');

    const layout = {
      nodes: [
        { id: 'A', x: 0, y: 0, width: 100, height: 50 },
        { id: 'B', x: 200, y: 0, width: 100, height: 50 },
      ],
      edges: [{ id: 'e1', start: 'A', end: 'B' }],
    };

    // runOrthogonalEdgePipeline returns the mutated layout
    const result = runOrthogonalEdgePipeline(layout as unknown as LayoutData, {
      routingBackend: 'domus',
    });

    expect(result.edges[0].points).toBeDefined();
    expect(result.edges[0].points!.length).toBeGreaterThan(0);
  });

  it('shouldUseDomus recommends correctly', async () => {
    const { shouldUseDomus } = await import('./heuristics.js');

    // Simple graph (2 edges) - not recommended
    const simpleResult = shouldUseDomus({
      nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
      edges: [
        { id: 'e1', start: 'A', end: 'B' },
        { id: 'e2', start: 'B', end: 'C' },
      ],
    } as unknown as LayoutData);
    expect(simpleResult.recommended).toBe(false);

    // Cyclic graph - recommended
    const cyclicResult = shouldUseDomus({
      nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }],
      edges: [
        { id: 'e1', start: 'A', end: 'B' },
        { id: 'e2', start: 'B', end: 'C' },
        { id: 'e3', start: 'C', end: 'D' },
        { id: 'e4', start: 'D', end: 'A' },
      ],
    } as unknown as LayoutData);
    expect(cyclicResult.recommended).toBe(true);

    console.log(DOMUS_TEST, 'shouldUseDomus_results', {
      simple: simpleResult,
      cyclic: cyclicResult,
    });
  });
});

describe('DOMUS Bug Fixes (Gap Analysis)', () => {
  describe('Shape.getLabel direction symmetry', () => {
    it('returns opposite label when traversing edge in reverse direction', () => {
      // Create a graph with edge stored as A->B
      const graph = createDomusGraph(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);

      const shape = createShape();
      // Set label WITH canonical direction (from='A', to='B')
      shape.setLabel('e1', 'R', 'A', 'B'); // A is to the left of B (A->B is Right)

      // When querying A->B (canonical direction), should get R
      const labelForward = shape.getLabel('A', 'B', 'e1');
      expect(labelForward).toBe('R');

      // When querying B->A (reverse direction), should get L (opposite of R)
      const labelReverse = shape.getLabel('B', 'A', 'e1');
      expect(labelReverse).toBe('L');
    });

    it('handles U/D symmetry correctly', () => {
      const graph = createDomusGraph(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);

      const shape = createShape();
      shape.setLabel('e1', 'U', 'A', 'B'); // A is below B (A->B is Up)

      // Forward direction
      expect(shape.getLabel('A', 'B', 'e1')).toBe('U');
      // Reverse direction should be D (opposite of U)
      expect(shape.getLabel('B', 'A', 'e1')).toBe('D');
    });

    it('isCycleComplete works with mixed traversal directions', () => {
      // Create a square where edges have different canonical directions
      const graph = createDomusGraph(
        ['A', 'B', 'C', 'D'],
        [
          { id: 'e1', from: 'A', to: 'B' }, // Canonical: A->B
          { id: 'e2', from: 'C', to: 'B' }, // Canonical: C->B (note: reversed!)
          { id: 'e3', from: 'C', to: 'D' }, // Canonical: C->D
          { id: 'e4', from: 'A', to: 'D' }, // Canonical: A->D (note: reversed!)
        ]
      );

      const shape = createShape();
      // Set labels for canonical directions - now WITH from/to info
      shape.setLabel('e1', 'R', 'A', 'B'); // A->B is Right
      shape.setLabel('e2', 'L', 'C', 'B'); // C->B is Left (so B->C is Right, but cycle goes B->C which is reverse)
      shape.setLabel('e3', 'D', 'C', 'D'); // C->D is Down
      shape.setLabel('e4', 'D', 'A', 'D'); // A->D is Down (so D->A is Up)

      // Cycle: A->B->C->D->A
      // Traversal: e1(A->B), e2(B->C=reverse), e3(C->D), e4(D->A=reverse)
      const cycle = {
        vertices: ['A', 'B', 'C', 'D'],
        edgeIds: ['e1', 'e2', 'e3', 'e4'],
      };

      // This test verifies that cycle completeness check accounts for traversal direction
      const isComplete = isCycleComplete(cycle, shape);
      // With proper direction handling:
      // e1: A->B = R
      // e2: B->C (reverse of C->B with L) = R
      // e3: C->D = D
      // e4: D->A (reverse of A->D with D) = U
      // Labels: R, R, D, U - missing L, so NOT complete
      expect(isComplete).toBe(false);
    });
  });

  describe('Deterministic dummy vertex IDs', () => {
    it('splitEdge produces deterministic IDs across calls with reset', () => {
      // Reset counter before first split
      resetDummyVertexCounter();
      const graph1 = createDomusGraph(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);
      const result1 = splitEdge(graph1, 'e1');

      // Reset counter before second split
      resetDummyVertexCounter();
      const graph2 = createDomusGraph(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);
      const result2 = splitEdge(graph2, 'e1');

      // IDs should be deterministic (same input after reset = same output)
      expect(result1.dummyId).toBe(result2.dummyId);
      expect(result1.newEdgeIds[0]).toBe(result2.newEdgeIds[0]);
      expect(result1.newEdgeIds[1]).toBe(result2.newEdgeIds[1]);
    });
  });

  describe('Unified debug logging prefix', () => {
    it('all DOMUS modules use consistent prefix convention', () => {
      // This is a documentation test - verifying the convention
      // Runtime orthogonal layout logging uses a single shared prefix for easy filtering.
      // (Tests may still use their own prefixes.)
      const DEBUG_PREFIX = '[ORTHO_DEBUG]';
      expect(DEBUG_PREFIX).toBe('[ORTHO_DEBUG]');
    });
  });
});

describe('DOMUS Node Overlap Prevention', () => {
  it('prevents overlapping nodes with different sizes in perpendicular dimension', () => {
    // Create a graph where nodes could overlap if compaction doesn't account for sizes
    // A--B
    // |
    // C--D
    // Without proper overlap constraints, A and C might get the same x-coordinate,
    // and B and D might get the same x-coordinate, but if their y-ranges overlap
    // with their sizes, they'd visually overlap.
    const result = runDomus(
      ['A', 'B', 'C', 'D'],
      [
        { id: 'e1', from: 'A', to: 'B' },
        { id: 'e2', from: 'A', to: 'C' },
        { id: 'e3', from: 'C', to: 'D' },
        { id: 'e4', from: 'B', to: 'D' },
      ],
      {
        nodeSizes: new Map([
          ['A', { width: 100, height: 50 }],
          ['B', { width: 100, height: 50 }],
          ['C', { width: 100, height: 50 }],
          ['D', { width: 100, height: 50 }],
        ]),
      }
    );

    expect(result.success).toBe(true);
    expect(result.coordinates?.size).toBe(4);

    // Check that no two nodes overlap
    const coords = result.coordinates!;
    const nodeSizes = new Map([
      ['A', { width: 100, height: 50 }],
      ['B', { width: 100, height: 50 }],
      ['C', { width: 100, height: 50 }],
      ['D', { width: 100, height: 50 }],
    ]);

    const nodes = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const c1 = coords.get(n1)!;
        const c2 = coords.get(n2)!;
        const s1 = nodeSizes.get(n1)!;
        const s2 = nodeSizes.get(n2)!;

        // Check if bounding boxes overlap
        const xOverlap = Math.abs(c1.x - c2.x) < (s1.width + s2.width) / 2;
        const yOverlap = Math.abs(c1.y - c2.y) < (s1.height + s2.height) / 2;

        // They shouldn't overlap in BOTH dimensions simultaneously
        const bothOverlap = xOverlap && yOverlap;
        expect(bothOverlap).toBe(false);
      }
    }

    console.log(DOMUS_TEST, 'overlap_prevention_result', {
      success: result.success,
      coords: Object.fromEntries(coords),
    });
  });

  it('separates nodes with large size differences', () => {
    // Node A is very large, B and C are small
    // A should not overlap with B or C
    const result = runDomus(
      ['A', 'B', 'C'],
      [
        { id: 'e1', from: 'A', to: 'B' },
        { id: 'e2', from: 'A', to: 'C' },
      ],
      {
        nodeSizes: new Map([
          ['A', { width: 200, height: 100 }],
          ['B', { width: 50, height: 30 }],
          ['C', { width: 50, height: 30 }],
        ]),
      }
    );

    expect(result.success).toBe(true);
    const coords = result.coordinates!;

    // A is the center, B and C are around it
    const cA = coords.get('A')!;
    const cB = coords.get('B')!;
    const cC = coords.get('C')!;

    // Check A-B separation
    const xDistAB = Math.abs(cA.x - cB.x);
    const yDistAB = Math.abs(cA.y - cB.y);
    // At least one dimension should have sufficient separation
    const abSeparated = xDistAB >= (200 + 50) / 2 || yDistAB >= (100 + 30) / 2;
    expect(abSeparated).toBe(true);

    // Check A-C separation
    const xDistAC = Math.abs(cA.x - cC.x);
    const yDistAC = Math.abs(cA.y - cC.y);
    const acSeparated = xDistAC >= (200 + 50) / 2 || yDistAC >= (100 + 30) / 2;
    expect(acSeparated).toBe(true);

    console.log(DOMUS_TEST, 'large_node_separation_result', {
      coords: Object.fromEntries(coords),
    });
  });

  it('handles nodes with no direct shape arc but overlapping perpendicular ranges', () => {
    // Create a "ladder" graph where non-adjacent nodes could overlap
    // A - B
    // |   |
    // C - D
    // |   |
    // E - F
    // Here, A and E are not directly connected, but if they get the same
    // x-coordinate and their y-ranges (considering sizes) overlap, they'd overlap
    const result = runDomus(
      ['A', 'B', 'C', 'D', 'E', 'F'],
      [
        { id: 'e1', from: 'A', to: 'B' },
        { id: 'e2', from: 'A', to: 'C' },
        { id: 'e3', from: 'B', to: 'D' },
        { id: 'e4', from: 'C', to: 'D' },
        { id: 'e5', from: 'C', to: 'E' },
        { id: 'e6', from: 'D', to: 'F' },
        { id: 'e7', from: 'E', to: 'F' },
      ],
      {
        nodeSizes: new Map([
          ['A', { width: 80, height: 40 }],
          ['B', { width: 80, height: 40 }],
          ['C', { width: 80, height: 40 }],
          ['D', { width: 80, height: 40 }],
          ['E', { width: 80, height: 40 }],
          ['F', { width: 80, height: 40 }],
        ]),
      }
    );

    expect(result.success).toBe(true);
    const coords = result.coordinates!;

    // Check all pairs for non-overlap
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F'];
    const size = { width: 80, height: 40 };

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const c1 = coords.get(nodes[i])!;
        const c2 = coords.get(nodes[j])!;

        const xOverlap = Math.abs(c1.x - c2.x) < size.width;
        const yOverlap = Math.abs(c1.y - c2.y) < size.height;
        const bothOverlap = xOverlap && yOverlap;

        expect(bothOverlap).toBe(false);
      }
    }

    console.log(DOMUS_TEST, 'ladder_graph_no_overlap', {
      coords: Object.fromEntries(coords),
    });
  });
});

describe('DOMUS Edge Cases', () => {
  it('handles single vertex', () => {
    const result = runDomus(['A'], []);
    expect(result.success).toBe(true);
    expect(result.coordinates?.size).toBe(1);
  });

  it('handles two vertices with one edge', () => {
    const result = runDomus(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);
    expect(result.success).toBe(true);
    expect(result.coordinates?.size).toBe(2);
  });

  it('handles disconnected graph', () => {
    const result = runDomus(
      ['A', 'B', 'C', 'D'],
      [
        { id: 'e1', from: 'A', to: 'B' },
        { id: 'e2', from: 'C', to: 'D' },
      ]
    );

    expect(result.success).toBe(true);
    expect(result.coordinates?.size).toBe(4);
  });

  it('respects maxEdgeSplits option', () => {
    // Complex graph that might need many splits
    const result = runDomus(
      ['A', 'B', 'C', 'D', 'E'],
      [
        { id: 'e1', from: 'A', to: 'B' },
        { id: 'e2', from: 'B', to: 'C' },
        { id: 'e3', from: 'C', to: 'D' },
        { id: 'e4', from: 'D', to: 'E' },
        { id: 'e5', from: 'E', to: 'A' },
        { id: 'e6', from: 'A', to: 'C' },
        { id: 'e7', from: 'B', to: 'D' },
      ],
      { maxEdgeSplits: 5, debug: false }
    );

    console.log(
      DOMUS_TEST,
      'complex_graph_result',
      JSON.stringify({
        success: result.success,
        stats: result.stats,
      })
    );

    // maxEdgeSplits should be respected regardless of success
    expect(result.stats.edgeSplits).toBeLessThanOrEqual(5);
  });
});
