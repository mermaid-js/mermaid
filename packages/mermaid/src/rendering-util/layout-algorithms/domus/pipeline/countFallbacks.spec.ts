// Iter-30: contract for `countFallbacks(trace)` — aggregates per-edge
// `routingAttempts` (iter-28 E1) into a level-bucketed summary
// (level1..level4, total, suspect). Winner is the LAST success-outcome
// attempt; suspect counts edges whose max observed level ≥ 3.
import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../../types.js';
import type { OrthogonalTrace } from '../pipeline.js';
import { runOrthogonalEdgePipeline } from '../pipeline.js';
import { countFallbacks } from './countFallbacks.js';

function traceFrom(
  edges: Record<
    string,
    { attempts: { level: 1 | 2 | 3 | 4; kind: string; outcome: 'success' | 'null' }[] }
  >
): OrthogonalTrace {
  const trace: OrthogonalTrace = { stages: [], edges: {} };
  for (const [id, { attempts }] of Object.entries(edges)) {
    trace.edges[id] = {
      route: {
        algorithm: 'routing-graph',
        points: [],
        cost: { length: 0, bends: 0 },
        routingAttempts: attempts,
      },
    };
  }
  return trace;
}

describe('countFallbacks', () => {
  it('returns all zeros for an empty trace', () => {
    const counts = countFallbacks({ stages: [], edges: {} });
    expect(counts).toEqual({ level1: 0, level2: 0, level3: 0, level4: 0, total: 0, suspect: 0 });
  });

  it('ignores edges without routingAttempts', () => {
    const trace: OrthogonalTrace = {
      stages: [],
      edges: {
        e1: { route: { algorithm: 'aligned', points: [], cost: { length: 0, bends: 0 } } },
      },
    };
    const counts = countFallbacks(trace);
    expect(counts.total).toBe(0);
  });

  it('level-1 success → level1=1, suspect=0', () => {
    const trace = traceFrom({
      e1: { attempts: [{ level: 1, kind: 'routing-graph:channels', outcome: 'success' }] },
    });
    expect(countFallbacks(trace)).toEqual({
      level1: 1,
      level2: 0,
      level3: 0,
      level4: 0,
      total: 1,
      suspect: 0,
    });
  });

  it('level-1 null → level-2 success → level2=1, suspect=0', () => {
    const trace = traceFrom({
      e1: {
        attempts: [
          { level: 1, kind: 'routing-graph:ocr', outcome: 'null' },
          { level: 2, kind: 'routing-graph:ocr-fallback-grid', outcome: 'success' },
        ],
      },
    });
    expect(countFallbacks(trace)).toEqual({
      level1: 0,
      level2: 1,
      level3: 0,
      level4: 0,
      total: 1,
      suspect: 0,
    });
  });

  it('level-3 success → level3=1, suspect=1 (bug signal)', () => {
    const trace = traceFrom({
      e1: {
        attempts: [
          { level: 1, kind: 'routing-graph:grid', outcome: 'null' },
          { level: 3, kind: 'aligned-fallback', outcome: 'success' },
        ],
      },
    });
    const counts = countFallbacks(trace);
    expect(counts.level3).toBe(1);
    expect(counts.suspect).toBe(1);
    expect(counts.total).toBe(1);
  });

  it('level-4 success → level4=1, suspect=1 (severe bug signal)', () => {
    const trace = traceFrom({
      e1: {
        attempts: [
          { level: 1, kind: 'routing-graph:grid', outcome: 'null' },
          { level: 3, kind: 'aligned-fallback', outcome: 'null' },
          { level: 4, kind: 'l-shape-fallback', outcome: 'success' },
        ],
      },
    });
    const counts = countFallbacks(trace);
    expect(counts.level4).toBe(1);
    expect(counts.suspect).toBe(1);
  });

  it('suspect is independent of the winner — max observed level drives it', () => {
    // Contrived case: attempts reach level 3 but L1 also succeeded.
    // Can't actually happen with the current cascade, but the helper
    // shouldn't care about cascade semantics — it's a pure reducer.
    const trace = traceFrom({
      e1: {
        attempts: [
          { level: 1, kind: 'routing-graph:channels', outcome: 'success' },
          { level: 3, kind: 'manual-probe', outcome: 'null' },
        ],
      },
    });
    const counts = countFallbacks(trace);
    // Winner: the LAST success — level 1.
    expect(counts.level1).toBe(1);
    // But suspect: max level reached is 3.
    expect(counts.suspect).toBe(1);
  });

  it('aggregates across multiple edges', () => {
    const trace = traceFrom({
      e1: { attempts: [{ level: 1, kind: 'routing-graph:channels', outcome: 'success' }] },
      e2: {
        attempts: [
          { level: 1, kind: 'routing-graph:ocr', outcome: 'null' },
          { level: 2, kind: 'routing-graph:ocr-fallback-grid', outcome: 'success' },
        ],
      },
      e3: { attempts: [{ level: 1, kind: 'self-loop', outcome: 'success' }] },
    });
    expect(countFallbacks(trace)).toEqual({
      level1: 2,
      level2: 1,
      level3: 0,
      level4: 0,
      total: 3,
      suspect: 0,
    });
  });

  it('integration: runs against a live routeEdges trace (multi-edge fixture)', () => {
    const mkNode = (id: string, x: number, y: number, w = 40, h = 40): Node =>
      ({ id, x, y, width: w, height: h, isGroup: false }) as Node;
    const mkEdge = (id: string, start: string, end: string): Edge =>
      ({ id, start, end, type: 'arrow' }) as Edge;

    // Three edges exercising different winning levels:
    //  e1: routing-graph channels — level-1 primary success.
    //  e2: forced OCR exhaustion — level-1 deterministic fallback wins.
    //  e3: self-loop — level-1 self-loop success.
    const A = mkNode('A', 100, 100);
    const Block = mkNode('Block', 200, 200, 80, 80);
    const C = mkNode('C', 300, 200);
    const D = mkNode('D', 400, 300);
    const e1 = mkEdge('e1', 'A', 'C');
    const e2 = mkEdge('e2', 'C', 'D');
    const loop = mkEdge('loop', 'A', 'A');
    const data: LayoutData = {
      nodes: [A, Block, C, D],
      edges: [e1, e2, loop],
      config: {} as never,
    };
    const trace: OrthogonalTrace = { stages: [], edges: {} };
    runOrthogonalEdgePipeline(data, {
      trace,
      spacing: 10,
      routingBackend: 'routing-graph',
      routingGraphModel: 'channels',
    });

    const counts = countFallbacks(trace);
    // All three edges have attempts recorded.
    expect(counts.total).toBe(3);
    // Nothing should hit L3/L4 for this trivial fixture.
    expect(counts.level3).toBe(0);
    expect(counts.level4).toBe(0);
    expect(counts.suspect).toBe(0);
    // All winners live at level 1 (primary or self-loop).
    expect(counts.level1 + counts.level2).toBe(3);
  });

  it('edges with only null outcomes increment total but no winner bucket', () => {
    // Degenerate case: routing failed entirely. Shouldn't happen in
    // production (last entry is always success by iter-28 contract),
    // but the helper should handle it gracefully.
    const trace = traceFrom({
      e1: {
        attempts: [
          { level: 1, kind: 'routing-graph:ocr', outcome: 'null' },
          { level: 3, kind: 'aligned-fallback', outcome: 'null' },
        ],
      },
    });
    const counts = countFallbacks(trace);
    expect(counts.total).toBe(1);
    expect(counts.level1 + counts.level2 + counts.level3 + counts.level4).toBe(0);
    expect(counts.suspect).toBe(1);
  });
});
