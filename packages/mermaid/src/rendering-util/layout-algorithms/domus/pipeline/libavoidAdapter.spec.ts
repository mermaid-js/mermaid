import { describe, expect, it } from 'vitest';
import type { LayoutData, Node } from '../../../types.js';
import {
  createLoadedLibavoidAdapter,
  preloadLibavoidAdapterForLayout,
  withDefaultLibavoidFallback,
} from './libavoidAdapter.js';

function node(id: string, x: number, y: number): Node {
  return {
    id,
    x,
    y,
    width: 20,
    height: 20,
    isGroup: false,
  } as Node;
}

describe('libavoid adapter', () => {
  it('routes fixed-node orthogonal polylines through the real libavoid runtime', async () => {
    const data: LayoutData = {
      nodes: [node('A', 0, 0), node('B', 100, 100), node('C', 50, 50)],
      edges: [
        {
          id: 'A-B',
          start: 'A',
          end: 'B',
          points: [
            { x: 10, y: 0 },
            { x: 90, y: 100 },
          ],
          type: 'arrow',
        },
      ],
      config: {} as any,
    };
    const nodesById = new Map(data.nodes.map((n) => [String(n.id), n]));

    const adapter = await createLoadedLibavoidAdapter();
    const result = adapter({
      data,
      nodesById,
      edgeIds: ['A-B'],
      spacing: 10,
    });

    const points = (result as Map<string, { x: number; y: number }[]>).get('A-B');
    expect(points).toBeTruthy();
    expect(points!.length).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < points!.length - 1; i++) {
      const a = points![i];
      const b = points![i + 1];
      expect(a.x === b.x || a.y === b.y).toBe(true);
    }
  });

  it('injects default libavoid fallback options after preload', async () => {
    const data: LayoutData = {
      nodes: [node('A', 0, 0), node('B', 100, 0)],
      edges: [
        {
          id: 'A-B',
          start: 'A',
          end: 'B',
          points: [
            { x: 10, y: 0 },
            { x: 90, y: 0 },
          ],
          type: 'arrow',
        },
      ],
      config: {} as any,
    };

    await preloadLibavoidAdapterForLayout(data);
    const options = withDefaultLibavoidFallback(data, {
      spacing: 10,
      routingBackend: 'domus',
      useExistingPositions: false,
    });

    expect(options.libavoidFallback).toBe(true);
    expect(options.libavoidAdapter).toBeTypeOf('function');
    // 2026-05-02 — aggressive default is now any browser env (incl.
    // JSDOM), so thresholds are 0/0/2 (was 2/2/4 outside `/dev/` URLs).
    // The change drops the URL-based throttle on libavoid engagement
    // once an adapter is loaded.
    expect(options.libavoidCrossingThreshold).toBe(0);
    expect(options.libavoidRenderedDiagonalThreshold).toBe(0);
    expect(options.libavoidMaxEdgeBendsThreshold).toBe(2);
    expect(options.libavoidAggressive).toBe(true);
  });
});
