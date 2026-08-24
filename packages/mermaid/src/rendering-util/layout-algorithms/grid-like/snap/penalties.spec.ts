import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../../types.js';
import { buildIpsepColaGraph } from '../../ipsep-cola/adapter/graph.js';
import type { Position } from '../../ipsep-cola/solver/stress.js';
import { idealDistances } from '../../ipsep-cola/solver/stress.js';
import { resolveGridLikeOptions } from '../options.js';
import {
  accumulateEdgeNodeSeparation,
  accumulatePStress,
  closestGridPoint,
  qSigma,
  qSigmaDerivative,
  snapObjective,
  zeroGradient,
} from './penalties.js';

function testGraph(
  shape: { ids: string[]; edges: [string, string][] } = {
    ids: ['A', 'B', 'C', 'D'],
    edges: [
      ['A', 'B'],
      ['A', 'C'],
      ['C', 'D'],
    ],
  }
) {
  const nodes = shape.ids.map(
    (id) => ({ id, label: id, isGroup: false, shape: 'rect', width: 80, height: 40 }) as Node
  );
  const edges: Edge[] = shape.edges.map(([start, end]) => ({ id: `${start}-${end}`, start, end }));
  const data = {
    nodes,
    edges,
    direction: 'TB',
    config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 } },
  } as unknown as LayoutData;

  const graph = buildIpsepColaGraph(data);
  const options = resolveGridLikeOptions(data, { mode: 'node-and-grid-snap' });
  const distances = idealDistances(
    graph.variables.length,
    graph.neighbors,
    options.idealEdgeLength
  );

  return { graph, options, distances };
}

describe('§4 q_σ', () => {
  it('is zero outside the snap radius and quadratic inside', () => {
    expect(qSigma(11, 10)).toBe(0);
    expect(qSigma(-11, 10)).toBe(0);
    expect(qSigma(10, 10)).toBe(1);
    expect(qSigma(5, 10)).toBeCloseTo(0.25, 12);
    expect(qSigma(0, 10)).toBe(0);
  });

  it('has a derivative that points back toward alignment', () => {
    expect(qSigmaDerivative(5, 10)).toBeGreaterThan(0);
    expect(qSigmaDerivative(-5, 10)).toBeLessThan(0);
    expect(qSigmaDerivative(11, 10)).toBe(0);
  });
});

describe('§6.1 CLOSEST_GRID_POINT', () => {
  it('returns the nearest grid point', () => {
    expect(closestGridPoint(131, 259, 130)).toEqual([130, 260]);
    expect(closestGridPoint(-10, 10, 130)).toEqual([-0, 0]);
  });

  it('breaks a tie in favour of the point closer to the origin', () => {
    // 65 is exactly between 0 and 130, and -65 exactly between -130 and 0.
    expect(closestGridPoint(65, 0, 130)[0]).toBe(0);
    expect(closestGridPoint(-65, 0, 130)[0]).toBe(-0);
  });
});

describe('§3 P-stress', () => {
  // Two components, so the pair terms can be exercised without any edge being
  // stretched: `A—B` and `C—D` stay exactly one ideal edge length long in both
  // layouts below, leaving the pair terms as the only difference.
  const { graph, options, distances } = testGraph({
    ids: ['A', 'B', 'C', 'D'],
    edges: [
      ['A', 'B'],
      ['C', 'D'],
    ],
  });
  const dL = options.idealEdgeLength;

  it('does not penalise unconnected nodes for being far apart', () => {
    const far: Position[] = [
      [0, 0],
      [0, dL],
      [1000, 0],
      [1000, dL],
    ];

    expect(accumulatePStress(graph, distances, far, dL)).toBe(0);
  });

  it('penalises a pair that is closer than its ideal distance', () => {
    const crowded: Position[] = [
      [0, 0],
      [0, dL],
      [20, 0],
      [20, dL],
    ];

    expect(accumulatePStress(graph, distances, crowded, dL)).toBeGreaterThan(0);
  });
});

describe('§8 EN-sep', () => {
  const { graph, options } = testGraph();

  it('pushes a node off an axis-aligned edge it is sitting on', () => {
    // A—B is exactly vertical; C sits beside it, within the snap radius.
    const positions: Position[] = [
      [0, 0],
      [0, 260],
      [10, 130],
      [10, 400],
    ];

    const gradient = zeroGradient(positions.length);
    const value = accumulateEdgeNodeSeparation(graph, positions, options, gradient);

    expect(value).toBeGreaterThan(0);
    // Descent moves against the gradient, so C must be pushed further right.
    expect(gradient[2][0]).toBeLessThan(0);
  });

  it('ignores a node whose perpendicular misses the segment', () => {
    const positions: Position[] = [
      [0, 0],
      [0, 260],
      [10, 900],
      [10, 1000],
    ];

    expect(accumulateEdgeNodeSeparation(graph, positions, options)).toBe(0);
  });
});

describe('objective gradient', () => {
  it('matches a finite-difference estimate', () => {
    const { graph, options, distances } = testGraph();
    const positions: Position[] = [
      [3, 7],
      [17, 141],
      [122, 133],
      [141, 271],
    ];

    const gradient = zeroGradient(positions.length);
    snapObjective(graph, distances, positions, options, gradient);

    const h = 1e-4;
    for (const [i] of positions.entries()) {
      for (const axis of [0, 1] as const) {
        const shifted = (delta: number) =>
          positions.map(
            (position, index): Position =>
              index === i
                ? [
                    axis === 0 ? position[0] + delta : position[0],
                    axis === 1 ? position[1] + delta : position[1],
                  ]
                : [position[0], position[1]]
          );

        const numeric =
          (snapObjective(graph, distances, shifted(h), options) -
            snapObjective(graph, distances, shifted(-h), options)) /
          (2 * h);

        expect(gradient[i][axis]).toBeCloseTo(numeric, 6);
      }
    }
  });
});
