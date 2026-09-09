import { describe, expect, it } from 'vitest';
import type { HolaNode } from '../model.js';
import { DiagnosticCollector } from '../diagnostics.js';
import { resolveOptions } from '../options.js';
import type { FinalEdge } from './finalRouting.js';
import { finalRouterConfig, routeFinalEdges } from './finalRouting.js';

const node = (id: string, x: number, y: number): HolaNode => ({
  id,
  x,
  y,
  width: 80,
  height: 40,
  inputOrder: 0,
  original: null,
});

const edge = (originalEdgeId: string, source: string, target: string): FinalEdge => ({
  originalEdgeId,
  source,
  target,
  mandatoryWaypoints: [],
  parallelIndex: 0,
  parallelCount: 1,
});

describe('final routing preferences', () => {
  it('carries the full arrowhead runway into the final router', () => {
    const config = finalRouterConfig(resolveOptions({ minTerminalLegLength: 18 }));

    expect(config.minTerminalLegLength).toBe(18);
  });

  it('keeps a clean preferred outer corridor through the port-planning pass', () => {
    const rightBranch = edge('right-happy', 'right', 'happy');
    rightBranch.preferredOutsideSide = 'bottom';
    const nodes = new Map([
      ['happy', node('happy', 0, 0)],
      ['better', node('better', 200, -160)],
      ['right', node('right', 400, 0)],
    ]);

    const routed = routeFinalEdges(
      nodes,
      [rightBranch, edge('better-happy', 'better', 'happy')],
      resolveOptions({}),
      new DiagnosticCollector(),
      'test'
    );
    const route = routed.edges.find((candidate) => candidate.originalEdgeId === 'right-happy');

    expect(route).toMatchObject({ sourceSide: 'bottom', targetSide: 'bottom' });
    // The long run remains entirely below the sink rather than crossing the
    // incoming branch that enters its right side, then returns vertically to the
    // sink's bottom face instead of wrapping to its far horizontal face.
    expect(route!.points.some((point) => point.y > 20)).toBe(true);
    const last = route!.points.at(-1)!;
    const beforeLast = route!.points.at(-2)!;
    expect(beforeLast.x).toBeCloseTo(last.x);
    expect(beforeLast.y).toBeGreaterThan(last.y);
  });

  it('separates parallel ports far enough that their labels do not cover each other', () => {
    const first = edge('first', 'source', 'target');
    first.parallelCount = 2;
    first.labelWidth = 100;
    first.labelClearance = 12;
    const second = edge('second', 'source', 'target');
    second.parallelIndex = 1;
    second.parallelCount = 2;
    second.labelWidth = 100;
    second.labelClearance = 12;
    const nodes = new Map([
      ['source', { ...node('source', 0, 0), width: 240 }],
      ['target', { ...node('target', 0, 240), width: 240 }],
    ]);

    const routed = routeFinalEdges(
      nodes,
      [first, second],
      resolveOptions({}),
      new DiagnosticCollector(),
      'test'
    );
    const firstRoute = routed.edges.find((candidate) => candidate.originalEdgeId === 'first')!;
    const secondRoute = routed.edges.find((candidate) => candidate.originalEdgeId === 'second')!;

    // A vertical route's label extends across x, so its neighbouring vertical
    // route needs half the label width plus its normal clearance as a lane.
    expect(Math.abs(firstRoute.points[0].x - secondRoute.points[0].x)).toBeGreaterThanOrEqual(62);
  });

  it('keeps the middle runs of a parallel right-to-left bundle in separate lanes', () => {
    const bundle = Array.from({ length: 5 }, (_, index) =>
      index === 4
        ? {
            ...edge(`parallel-${index}`, 'target', 'source'),
            parallelIndex: index,
            parallelCount: 5,
            lockedSourceSide: 'left' as const,
            lockedTargetSide: 'right' as const,
          }
        : {
            ...edge(`parallel-${index}`, 'source', 'target'),
            parallelIndex: index,
            parallelCount: 5,
            lockedSourceSide: 'right' as const,
            lockedTargetSide: 'left' as const,
          }
    );
    const nodes = new Map([
      ['source', node('source', 0, 0)],
      ['target', node('target', 220, 160)],
    ]);

    const routed = routeFinalEdges(
      nodes,
      bundle,
      resolveOptions({}),
      new DiagnosticCollector(),
      'test'
    );
    expect(routed.failed).toEqual([]);
    expect(routed.edges.every((route) => route.points.length === 4)).toBe(true);

    const middleLanes = routed.edges.map((route) => {
      const [firstBend, secondBend] = route.points.slice(1, 3);
      expect(firstBend.x).toBeCloseTo(secondBend.x);
      return firstBend.x;
    });
    expect(new Set(middleLanes)).toHaveLength(5);
  });
});
