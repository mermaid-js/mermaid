import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../../types.js';
import { X_AXIS, Y_AXIS } from '../../ipsep-cola/adapter/constraints.js';
import { buildIpsepColaGraph } from '../../ipsep-cola/adapter/graph.js';
import type { Position } from '../../ipsep-cola/solver/stress.js';
import { resolveGridLikeOptions } from '../options.js';
import { AlignmentFlags, createsCoincidence } from './alignmentFlags.js';
import { alignmentResidual, makeSeparatedAlignment } from './separatedAlignment.js';

/** `A → B`, `A → C`: a fork, the shape §17's theorem is about. */
function forkGraph() {
  const nodes = ['A', 'B', 'C'].map(
    (id) => ({ id, label: id, isGroup: false, shape: 'rect', width: 80, height: 40 }) as Node
  );
  const edges: Edge[] = [
    { id: 'A-B', start: 'A', end: 'B' },
    { id: 'A-C', start: 'A', end: 'C' },
  ];
  const data = {
    nodes,
    edges,
    direction: 'TB',
    config: { flowchart: { nodeSpacing: 50, rankSpacing: 50 } },
  } as unknown as LayoutData;

  return {
    graph: buildIpsepColaGraph(data),
    options: resolveGridLikeOptions(data, { mode: 'aca' }),
  };
}

describe('§10 separated alignments', () => {
  const { graph, options } = forkGraph();

  it('equalises x and orders y for a southward alignment', () => {
    const alignment = makeSeparatedAlignment(graph, 0, 0, 1, 'south', options);

    expect(alignment.alignmentAxis).toBe(X_AXIS);
    expect(alignment.separationAxis).toBe(Y_AXIS);
    expect(alignment.equality.map((c) => [c.left, c.right, c.gap])).toEqual([
      [0, 1, 0],
      [1, 0, 0],
    ]);
    // v below u, by both half-heights plus the configured rank spacing.
    expect(alignment.separation.left).toBe(0);
    expect(alignment.separation.right).toBe(1);
    expect(alignment.separation.gap).toBe(40 + 50);
  });

  it('equalises y and orders x for an eastward alignment', () => {
    const alignment = makeSeparatedAlignment(graph, 0, 0, 1, 'east', options);

    expect(alignment.alignmentAxis).toBe(Y_AXIS);
    expect(alignment.separationAxis).toBe(X_AXIS);
    expect(alignment.separation.gap).toBe(80 + 50);
  });

  it('puts u on the high side for the reversed directions', () => {
    for (const direction of ['north', 'west'] as const) {
      const alignment = makeSeparatedAlignment(graph, 0, 0, 1, direction, options);
      expect(alignment.separation.left).toBe(1);
      expect(alignment.separation.right).toBe(0);
    }
  });

  it('reports how far a layout leaves the alignment violated', () => {
    const alignment = makeSeparatedAlignment(graph, 0, 0, 1, 'south', options);

    const satisfied: Position[] = [
      [0, 0],
      [0, 200],
      [0, 0],
    ];
    const broken: Position[] = [
      [0, 0],
      [7, 200],
      [0, 0],
    ];

    expect(alignmentResidual(alignment, satisfied)).toBeLessThanOrEqual(0);
    expect(alignmentResidual(alignment, broken)).toBe(7);
  });
});

describe('§17 CREATES_COINCIDENCE', () => {
  const { graph } = forkGraph();
  const count = graph.variables.length;
  // A above, its two children side by side below it.
  const positions: Position[] = [
    [0, 0],
    [0, 130],
    [130, 130],
  ];

  it('rejects aligning a second child once the first shares the column', () => {
    const flags = new AlignmentFlags(count, graph.links);
    flags.align(X_AXIS, 0, 1);

    // Proposing A—C in the same column would drop C onto the A—B segment.
    expect(createsCoincidence(flags, positions, count, 0, 2, X_AXIS, Y_AXIS)).toBe(true);
  });

  it('accepts the first alignment of the fork', () => {
    const flags = new AlignmentFlags(count, graph.links);

    expect(createsCoincidence(flags, positions, count, 0, 1, X_AXIS, Y_AXIS)).toBe(false);
  });

  it('ignores a node that is aligned but not adjacent', () => {
    const disconnected = {
      ...graph,
      links: [{ source: 0, target: 1 }],
    };
    const flags = new AlignmentFlags(count, disconnected.links);
    flags.align(X_AXIS, 0, 2);

    // C shares A's column but no edge joins it to either endpoint, so it cannot
    // put an existing edge on the new one.
    expect(createsCoincidence(flags, positions, count, 0, 1, X_AXIS, Y_AXIS)).toBe(false);
  });
});

describe('§16 alignment flags', () => {
  const { graph } = forkGraph();

  it('closes alignment transitively and keeps the axes independent', () => {
    const flags = new AlignmentFlags(graph.variables.length, graph.links);
    flags.align(X_AXIS, 0, 1);
    flags.align(X_AXIS, 1, 2);

    expect(flags.isAligned(X_AXIS, 0, 2)).toBe(true);
    expect(flags.isAligned(Y_AXIS, 0, 2)).toBe(false);
  });

  it('rebuilds from the surviving alignments after a rejection (§22)', () => {
    const options = resolveGridLikeOptions(
      { nodes: [], edges: [], config: {} } as unknown as LayoutData,
      { mode: 'aca' }
    );
    const kept = makeSeparatedAlignment(graph, 0, 0, 1, 'south', options);

    const flags = AlignmentFlags.fromAlignments(graph, [kept]);

    expect(flags.isAligned(X_AXIS, 0, 1)).toBe(true);
    expect(flags.isAligned(X_AXIS, 0, 2)).toBe(false);
  });
});
