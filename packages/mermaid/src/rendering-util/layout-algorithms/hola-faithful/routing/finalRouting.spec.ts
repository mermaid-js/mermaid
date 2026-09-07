import { describe, expect, it } from 'vitest';
import type { HolaNode } from '../model.js';
import { DiagnosticCollector } from '../diagnostics.js';
import { resolveOptions } from '../options.js';
import type { FinalEdge } from './finalRouting.js';
import { routeFinalEdges } from './finalRouting.js';

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
  it('keeps a clean preferred outer corridor through the port-planning pass', () => {
    const rightBranch = edge('right-happy', 'right', 'happy');
    rightBranch.preferredSourceSide = 'bottom';
    rightBranch.preferredTargetSides = ['bottom', 'left'];
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
    // incoming branch that enters its right side.
    expect(route!.points.some((point) => point.y > 20)).toBe(true);
  });
});
