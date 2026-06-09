/**
 * Unit tests for R2 / Phase B1 compaction wedges (iter-4):
 *
 *   1. Deterministic iteration (R8 — Map-iteration non-determinism in the
 *      pairwise overlap-constraint loop at drawability.ts:880–1034).
 *   2. Transitive-closure guard — don't emit a visibility arc between two
 *      aux-nodes already ordered by shape arcs (paper phrasing: "visibility
 *      arcs only between pairs not transitively ordered by shape").
 *   3. Deterministic direction tie-break for unordered pairs — replace
 *      topoIndex (stable only under consistent Map insertion) with sorted
 *      node-id lexicographic compare, preferring the perpendicular-coord
 *      ordering when it disambiguates (geometric-alignment heuristic).
 *
 * Scope caveat (iter-4 plan gate, see iter-4 iteration.md): this is NOT a
 * full podavsnef port — podavsnef per Siebenhaller `21f7ca55` is a variable-
 * size MCF on rectangularized Kandinsky faces, which DOMUS's point-vertex +
 * SAT-expansion model doesn't produce. This iteration tightens the existing
 * hack to match the paper-phrased invariants we CAN support (OGDF-style
 * longest-path compaction with transitive-ordering + determinism). The
 * shape-arc vs visibility-arc direction rules live in Klau/Mutzel [KM99]
 * and Bruckdorfer/Bekos — both cited by DOMUS but not imported into our
 * NotebookLM corpus, so their specific mechanics are deferred.
 *
 * These tests exercise `computeTransitiveClosure` and
 * `computeCompactedCoordinatesWithOverlapConstraints` (both exported from
 * `drawability.ts` for this iteration) plus the integration surface via
 * `computeCoordinatesFromShape` for determinism.
 */

import { describe, it, expect } from 'vitest';
import {
  computeTransitiveClosure,
  computeCompactedCoordinatesWithOverlapConstraints,
} from './drawability.js';
import {
  computeCoordinatesFromShape,
  testRectilinearDrawability,
  buildAuxiliaryGraphGx,
  buildAuxiliaryGraphGy,
} from './drawability.js';
import { createDomusGraph, createShape } from './types.js';
import type { AuxiliaryGraph, AuxNode, AuxArc, DirectedEdge, DrawabilityResult } from './types.js';

function makeAuxNode(id: string, vertices: string[]): AuxNode {
  return { id, vertices: new Set(vertices) };
}

function makeAuxArc(from: string, to: string, edgeId = `${from}->${to}`): AuxArc {
  const inducingEdge: DirectedEdge = {
    id: edgeId,
    from: `${from}_v`,
    to: `${to}_v`,
    originalEdgeId: edgeId,
  };
  return { from, to, inducingEdge };
}

function makeAux(
  type: 'Gx' | 'Gy',
  nodeDefs: [string, string[]][],
  arcDefs: [string, string][]
): AuxiliaryGraph {
  const nodes = new Map<string, AuxNode>();
  const vertexToNode = new Map<string, string>();
  for (const [id, vs] of nodeDefs) {
    nodes.set(id, makeAuxNode(id, vs));
    for (const v of vs) {
      vertexToNode.set(v, id);
    }
  }
  const arcs: AuxArc[] = arcDefs.map(([f, t]) => makeAuxArc(f, t));
  return { type, nodes, arcs, vertexToNode };
}

describe('R2 wedges — computeTransitiveClosure', () => {
  it('self-reachability: every node reaches itself', () => {
    const aux = makeAux(
      'Gx',
      [
        ['A', ['a']],
        ['B', ['b']],
      ],
      []
    );
    const tc = computeTransitiveClosure(aux);
    expect(tc.has('A->A')).toBe(true);
    expect(tc.has('B->B')).toBe(true);
  });

  it('direct arc: A→B reachable; B→A not', () => {
    const aux = makeAux(
      'Gx',
      [
        ['A', ['a']],
        ['B', ['b']],
      ],
      [['A', 'B']]
    );
    const tc = computeTransitiveClosure(aux);
    expect(tc.has('A->B')).toBe(true);
    expect(tc.has('B->A')).toBe(false);
  });

  it('transitive chain A→B→C: A reaches C', () => {
    const aux = makeAux(
      'Gx',
      [
        ['A', ['a']],
        ['B', ['b']],
        ['C', ['c']],
      ],
      [
        ['A', 'B'],
        ['B', 'C'],
      ]
    );
    const tc = computeTransitiveClosure(aux);
    expect(tc.has('A->B')).toBe(true);
    expect(tc.has('B->C')).toBe(true);
    expect(tc.has('A->C')).toBe(true);
    expect(tc.has('C->A')).toBe(false);
  });

  it('unordered pair: no reachability either way', () => {
    const aux = makeAux(
      'Gx',
      [
        ['A', ['a']],
        ['B', ['b']],
      ],
      []
    );
    const tc = computeTransitiveClosure(aux);
    expect(tc.has('A->B')).toBe(false);
    expect(tc.has('B->A')).toBe(false);
  });
});

describe('R2 wedges — computeCompactedCoordinatesWithOverlapConstraints', () => {
  // Transitive-ordering guard: A→B→C shape arcs in Gx, all three perp-overlap
  // in y. The hack used to add a visibility arc A→C even though shape chain
  // already orders them. With the guard, no A→C visibility arc is added; the
  // resulting x-coordinates are the same as pass-1 (shape chain dominates).
  it('skips visibility arc when pair is already transitively ordered by shape', () => {
    const gx = makeAux(
      'Gx',
      [
        ['A', ['a']],
        ['B', ['b']],
        ['C', ['c']],
      ],
      [
        ['A', 'B'],
        ['B', 'C'],
      ]
    );
    const gy = makeAux(
      'Gy',
      [
        ['Y', ['a', 'b', 'c']], // all three vertices in the same y-class (same row)
      ],
      []
    );
    const perpCoords = new Map<string, number>([['Y', 0]]);
    const nodeSizes = new Map<string, { width: number; height: number }>([
      ['a', { width: 40, height: 20 }],
      ['b', { width: 40, height: 20 }],
      ['c', { width: 40, height: 20 }],
    ]);

    const coords = computeCompactedCoordinatesWithOverlapConstraints(
      gx,
      gy,
      perpCoords,
      nodeSizes,
      'width',
      40
    );

    // All three nodes lie on one horizontal row; only shape arcs A→B, B→C.
    // A→C visibility arc — were it to fire — would be redundant with the
    // chain, so resulting coords should match the shape chain exactly.
    const xA = coords.get('A')!;
    const xB = coords.get('B')!;
    const xC = coords.get('C')!;
    expect(xA).toBeDefined();
    expect(xB).toBeDefined();
    expect(xC).toBeDefined();
    // Shape chain distance = pad + w/2 + w/2 = 40 + 20 + 20 = 80
    expect(xB - xA).toBe(80);
    expect(xC - xB).toBe(80);
  });

  // Determinism (R8): same input → same output on two runs.
  it('is deterministic: two runs of the same input produce identical output', () => {
    const gx = makeAux(
      'Gx',
      [
        ['X1', ['a']],
        ['X2', ['b']],
        ['X3', ['c']],
        ['X4', ['d']],
      ],
      [
        ['X1', 'X2'],
        ['X3', 'X4'],
      ]
    );
    const gy = makeAux('Gy', [['Y', ['a', 'b', 'c', 'd']]], []);
    const perpCoords = new Map<string, number>([['Y', 0]]);
    const nodeSizes = new Map<string, { width: number; height: number }>([
      ['a', { width: 40, height: 20 }],
      ['b', { width: 40, height: 20 }],
      ['c', { width: 40, height: 20 }],
      ['d', { width: 40, height: 20 }],
    ]);

    const coords1 = computeCompactedCoordinatesWithOverlapConstraints(
      gx,
      gy,
      perpCoords,
      nodeSizes,
      'width',
      40
    );
    const coords2 = computeCompactedCoordinatesWithOverlapConstraints(
      gx,
      gy,
      perpCoords,
      nodeSizes,
      'width',
      40
    );

    for (const id of ['X1', 'X2', 'X3', 'X4']) {
      expect(coords1.get(id)).toBe(coords2.get(id));
    }
  });

  // Wedge 3: direction tie-break is deterministic and sorted-id-based.
  // For two aux-nodes {X1, X2} with no shape arcs and perp-overlap, the
  // visibility arc fires; direction is X1→X2 (sorted id ascending),
  // producing X1.x < X2.x regardless of Map iteration order.
  it('emits a deterministic direction for visibility arcs between unordered pairs', () => {
    const gx = makeAux(
      'Gx',
      [
        ['X1', ['a']],
        ['X2', ['b']],
      ],
      [] // no shape arcs — pair is unordered
    );
    const gy = makeAux(
      'Gy',
      [['Y', ['a', 'b']]], // same y-class → perp ranges overlap
      []
    );
    const perpCoords = new Map<string, number>([['Y', 0]]);
    const nodeSizes = new Map<string, { width: number; height: number }>([
      ['a', { width: 40, height: 20 }],
      ['b', { width: 40, height: 20 }],
    ]);

    const coords = computeCompactedCoordinatesWithOverlapConstraints(
      gx,
      gy,
      perpCoords,
      nodeSizes,
      'width',
      40
    );

    const xX1 = coords.get('X1')!;
    const xX2 = coords.get('X2')!;
    // Sorted-id rule: 'X1' < 'X2' lexicographically → X1→X2 → X1.x < X2.x.
    // Distance = pad + w/2 + w/2 = 80.
    expect(xX2 - xX1).toBe(80);
  });
});

describe('R2 wedges — end-to-end determinism via computeCoordinatesFromShape', () => {
  it('two runs of the full compaction pipeline on the same graph agree', () => {
    const graph = createDomusGraph(
      ['A', 'B', 'C', 'D'],
      [
        { id: 'e1', from: 'A', to: 'B' },
        { id: 'e2', from: 'A', to: 'C' },
        { id: 'e3', from: 'C', to: 'D' },
        { id: 'e4', from: 'B', to: 'D' },
      ]
    );
    const shape = createShape();
    shape.setLabel('e1', 'R', 'A', 'B');
    shape.setLabel('e2', 'D', 'A', 'C');
    shape.setLabel('e3', 'R', 'C', 'D');
    shape.setLabel('e4', 'D', 'B', 'D');

    const nodeSizes = new Map<string, { width: number; height: number }>([
      ['A', { width: 100, height: 50 }],
      ['B', { width: 100, height: 50 }],
      ['C', { width: 100, height: 50 }],
      ['D', { width: 100, height: 50 }],
    ]);

    const result = testRectilinearDrawability(graph, shape);
    expect(result.drawable).toBe(true);

    const c1 = computeCoordinatesFromShape(result, graph, nodeSizes, true, 40);
    const c2 = computeCoordinatesFromShape(result, graph, nodeSizes, true, 40);

    for (const id of ['A', 'B', 'C', 'D']) {
      expect(c1.get(id)).toEqual(c2.get(id));
    }
  });
});

describe('Phase B3 — per-pair vertex sizing for pass-2 arcs', () => {
  // Phase B3 of the DOMUS plan: "each shape arc carries the correct
  // pad + w_u/2 + w_v/2 (not class-max)." The current code uses
  // class-max sizes in `auxNodeBounds` (drawability.ts:~1020) which
  // over-compacts layouts where an aux-node contains mixed-width
  // siblings that don't all perp-overlap the other class.
  //
  // B3 scope: pass-2 (`computeCompactedCoordinatesWithOverlapConstraints`)
  // only. Both shape arcs and visibility arcs iterate (v_a, v_b) vertex
  // pairs and take max distance over pairs that actually perp-overlap.
  // If no pair perp-overlaps, shape arcs fall back to minimal `pad`;
  // visibility arcs skip emission entirely.
  //
  // Paper-backing: low (DOMUS defers to OGDF; Eiglsperger-Kaufmann
  // prescribed-size compaction is off-corpus). Treat B3 as a Mermaid
  // correctness adaptation for rectangle-node compaction.

  // Fixture: X1 = {A narrow, B wide} → X2 = {C narrow} (shape arc).
  //   A and C share the same Y row; wide B is in a different row.
  //   Heights uniform (20); widths A=40, B=200, C=40.
  //
  // Class-max: shape-arc distance = pad + max(40,200)/2 + 40/2 = 160.
  // Per-pair:  only (A,C) perp-overlaps (same row); (B,C) doesn't
  //            (B y=100 vs C y=0, heights 20 each). Distance = pad +
  //            A.w/2 + C.w/2 = 40 + 20 + 20 = 80.
  it('tightens shape-arc distance when wide siblings do not perp-overlap', () => {
    const gx = makeAux(
      'Gx',
      [
        ['X1', ['A', 'B']],
        ['X2', ['C']],
      ],
      [['X1', 'X2']]
    );
    const gy = makeAux(
      'Gy',
      [
        ['Y1', ['A', 'C']],
        ['Y2', ['B']],
      ],
      []
    );
    const perpCoords = new Map<string, number>([
      ['Y1', 0],
      ['Y2', 100],
    ]);
    const nodeSizes = new Map<string, { width: number; height: number }>([
      ['A', { width: 40, height: 20 }],
      ['B', { width: 200, height: 20 }],
      ['C', { width: 40, height: 20 }],
    ]);

    const coords = computeCompactedCoordinatesWithOverlapConstraints(
      gx,
      gy,
      perpCoords,
      nodeSizes,
      'width',
      40
    );

    expect(coords.get('X2')! - coords.get('X1')!).toBe(80);
  });

  // Fixture: no shape arcs. Visibility arc fires between X1={A narrow}
  //   and X2={C narrow, D wide}. A and C share Y1; D in Y2 (distinct row).
  //
  // Class-max: visibility-arc distance = pad + max(40)/2 +
  //            max(40,200)/2 = 40 + 20 + 100 = 160.
  // Per-pair:  only (A,C) perp-overlaps; (A,D) doesn't. Distance = 80.
  it('tightens visibility-arc distance when only the narrow pair actually perp-overlaps', () => {
    const gx = makeAux(
      'Gx',
      [
        ['X1', ['A']],
        ['X2', ['C', 'D']],
      ],
      []
    );
    const gy = makeAux(
      'Gy',
      [
        ['Y1', ['A', 'C']],
        ['Y2', ['D']],
      ],
      []
    );
    const perpCoords = new Map<string, number>([
      ['Y1', 0],
      ['Y2', 100],
    ]);
    const nodeSizes = new Map<string, { width: number; height: number }>([
      ['A', { width: 40, height: 20 }],
      ['C', { width: 40, height: 20 }],
      ['D', { width: 200, height: 20 }],
    ]);

    const coords = computeCompactedCoordinatesWithOverlapConstraints(
      gx,
      gy,
      perpCoords,
      nodeSizes,
      'width',
      40
    );

    expect(coords.get('X2')! - coords.get('X1')!).toBe(80);
  });

  // Fixture: class-level perp range union falsely overlaps, but no
  //   (v_a, v_b) pair actually perp-overlaps. X1 = {A y=0, B y=200},
  //   X2 = {C y=100}. Class perp X1 = [-10, 210]; X2 = [90, 110] —
  //   union overlaps [90, 110]. But A-C and B-C both miss per-pair
  //   (heights 20 each, vertical separations 100 and 100).
  //
  // Class-max: visibility arc fires (class-level perp overlap true),
  //            distance = pad + 20 + 20 = 80; longest-path puts X2 at
  //            X1+80 = 80.
  // Per-pair:  no pair overlaps → no arc emitted. X1, X2 are isolated
  //            components; longestPathCompaction places them at
  //            componentGap = pad+50 = 90 apart.
  it('does not emit a visibility arc when no vertex pair actually perp-overlaps', () => {
    const gx = makeAux(
      'Gx',
      [
        ['X1', ['A', 'B']],
        ['X2', ['C']],
      ],
      []
    );
    const gy = makeAux(
      'Gy',
      [
        ['Y1', ['A']],
        ['Y2', ['C']],
        ['Y3', ['B']],
      ],
      []
    );
    const perpCoords = new Map<string, number>([
      ['Y1', 0],
      ['Y2', 100],
      ['Y3', 200],
    ]);
    const nodeSizes = new Map<string, { width: number; height: number }>([
      ['A', { width: 40, height: 20 }],
      ['B', { width: 40, height: 20 }],
      ['C', { width: 40, height: 20 }],
    ]);

    const coords = computeCompactedCoordinatesWithOverlapConstraints(
      gx,
      gy,
      perpCoords,
      nodeSizes,
      'width',
      40
    );

    // Under B3: X1 and X2 are isolated components → componentGap spacing.
    expect(coords.get('X1')).toBe(0);
    expect(coords.get('X2')).toBe(90);
  });
});

describe('Phase B2 — two-pass Gauss-Seidel coupling in computeCoordinatesFromShape', () => {
  // Phase B2 of the DOMUS plan asks: "Recompute both passes symmetrically.
  // Document that pass-2 Gy reads pass-2 x (already does, but undocumented)."
  //
  // The two-pass compaction runs Gauss-Seidel, not Jacobi:
  //   pass-1 X     uses no perpCoords        (independent)
  //   pass-1 Y     uses no perpCoords        (independent)
  //   pass-2 X     uses pass-1 Y             (initialYCoord)
  //   pass-2 Y     uses pass-2 X             (xCoord, not _initialXCoord)
  //
  // The Jacobi alternative — pass-2 Y reading _initialXCoord — would feed
  // stale perpCoords into Y's overlap detector and can flip the visibility-
  // arc decision in either direction.
  //
  // This test pins the Gauss-Seidel behaviour with a fixture where Jacobi and
  // Gauss-Seidel disagree. If someone "cleans up" the asymmetry on line
  // ~711 of drawability.ts by passing `_initialXCoord` into pass-2 Y, the
  // Y coords below change and this test fails.
  it('pass-2 Y reads pass-2 X (not pass-1 X) — overlap decision flips on real X', () => {
    // Fixture: 4 vertices, no shape arcs in Gx or Gy.
    //   Gx: 4 classes X1={A}, X2={B}, X3={C}, X4={D}
    //   Gy: 2 classes Y1={A,B}, Y2={C,D}
    //
    // pass-1 X (isolated nodes, componentGap=90): 0, 90, 180, 270
    // pass-1 Y (isolated nodes, componentGap=90): 0, 90
    //
    // pass-2 X: X1/X2 both perp-overlap in Y1 (y=0); X3/X4 both in Y2 (y=90).
    //   Two visibility arcs fire (X1→X2, X3→X4) with separation 80, compressing
    //   X to (0, 80, 90, 170).
    //
    // pass-2 Y with pass-2 X perpCoords (Gauss-Seidel, current behaviour):
    //   Y1 perp-X = [-20, 100] (A at x=0, B at x=80)
    //   Y2 perp-X = [70, 190]  (C at x=90, D at x=170)
    //   Ranges overlap at 70..100 → Y1→Y2 visibility arc (separation 60)
    //   → Y1=0, Y2=60.
    //
    // pass-2 Y with pass-1 X perpCoords (Jacobi, regression signal):
    //   Y1 perp-X = [-20, 110] (A at x=0, B at x=90)
    //   Y2 perp-X = [160, 290] (C at x=180, D at x=270)
    //   Ranges do NOT overlap → no arc → Y1=0, Y2=90 (componentGap).
    //
    // The test asserts y(C)=y(D)=60. Under Jacobi that would be 90.
    const graph = createDomusGraph(['A', 'B', 'C', 'D'], []);
    const gx = makeAux(
      'Gx',
      [
        ['X1', ['A']],
        ['X2', ['B']],
        ['X3', ['C']],
        ['X4', ['D']],
      ],
      []
    );
    const gy = makeAux(
      'Gy',
      [
        ['Y1', ['A', 'B']],
        ['Y2', ['C', 'D']],
      ],
      []
    );
    const result: DrawabilityResult = { drawable: true, gx, gy };
    const nodeSizes = new Map<string, { width: number; height: number }>([
      ['A', { width: 40, height: 20 }],
      ['B', { width: 40, height: 20 }],
      ['C', { width: 40, height: 20 }],
      ['D', { width: 40, height: 20 }],
    ]);

    const coords = computeCoordinatesFromShape(result, graph, nodeSizes, true, 40);

    // pass-2 X (compressed by the two visibility arcs):
    expect(coords.get('A')).toEqual({ x: 0, y: 0 });
    expect(coords.get('B')).toEqual({ x: 80, y: 0 });
    // pass-2 Y: the Gauss-Seidel coupling lets Y see compressed X, so the
    // Y1/Y2 perp-X ranges overlap and a visibility arc fires.
    // Jacobi would leave Y2 at componentGap=90.
    expect(coords.get('C')).toEqual({ x: 90, y: 60 });
    expect(coords.get('D')).toEqual({ x: 170, y: 60 });
  });
});

// Self-test: the harness builds valid aux graphs.
describe('harness sanity', () => {
  it('buildAuxiliaryGraphGx/Gy operate on a valid shape', () => {
    const graph = createDomusGraph(['A', 'B'], [{ id: 'e1', from: 'A', to: 'B' }]);
    const shape = createShape();
    shape.setLabel('e1', 'R', 'A', 'B');
    const gx = buildAuxiliaryGraphGx(graph, shape);
    const gy = buildAuxiliaryGraphGy(graph, shape);
    expect(gx.nodes.size).toBeGreaterThan(0);
    expect(gy.nodes.size).toBeGreaterThan(0);
  });
});
