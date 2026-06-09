/**
 * Phase E1 failure telemetry — contract for the new
 * `OrthoRouteTrace.routingAttempts` field. Each test drives an edge
 * through a specific level of the fallback cascade and asserts the
 * shape of the recorded attempt list.
 *
 * Tests are infrastructure-only (no algorithmic change): they pin the
 * telemetry convention so future iterations can assert
 * `fallbackCount === 0` on fixtures that should not fall through.
 */
import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../../types.js';
import { runOrthogonalEdgePipeline, type OrthogonalTrace } from '../pipeline.js';

function mkNode(id: string, x: number, y: number, width = 40, height = 40): Node {
  return { id, x, y, width, height, isGroup: false } as Node;
}

function mkEdge(id: string, start: string, end: string): Edge {
  return { id, start, end, type: 'arrow' } as Edge;
}

describe('Phase E1 — routingAttempts telemetry', () => {
  it('routing-graph primary path records a single level-1 success attempt', () => {
    // Two nodes with one blocker — routing-graph:channels should
    // succeed at level 1 and no fallback entries should appear.
    const A = mkNode('A', 100, 100);
    const Block = mkNode('Block', 200, 200, 80, 80);
    const C = mkNode('C', 300, 200);
    const e1 = mkEdge('e1', 'A', 'C');
    const data: LayoutData = { nodes: [A, Block, C], edges: [e1], config: {} as any };
    const trace: OrthogonalTrace = { stages: [], edges: {} };

    runOrthogonalEdgePipeline(data, {
      trace,
      spacing: 10,
      routingBackend: 'routing-graph',
      routingGraphModel: 'channels',
    });

    const attempts = trace.edges[e1.id]?.route?.routingAttempts;
    expect(attempts).toBeDefined();
    expect(attempts!.length).toBeGreaterThanOrEqual(1);
    const last = attempts![attempts!.length - 1];
    expect(last.outcome).toBe('success');
    expect(last.level).toBe(1);
    expect(last.kind).toMatch(/^routing-graph:/);
  });

  it('non-routing-graph backend records aligned-primary as first attempt', () => {
    // With backend='aligned' (the default non-routing-graph path), a
    // simple aligned pair should succeed at aligned-primary (level 1).
    const A = mkNode('A', 100, 150);
    const C = mkNode('C', 300, 150);
    const e1 = mkEdge('e1', 'A', 'C');
    const data: LayoutData = { nodes: [A, C], edges: [e1], config: {} as any };
    const trace: OrthogonalTrace = { stages: [], edges: {} };

    runOrthogonalEdgePipeline(data, {
      trace,
      spacing: 10,
      // Deliberately omit routingBackend so the default (not
      // 'routing-graph') path is exercised.
    });

    const attempts = trace.edges[e1.id]?.route?.routingAttempts;
    expect(attempts).toBeDefined();
    expect(attempts!.length).toBeGreaterThanOrEqual(1);
    expect(attempts![0].level).toBe(1);
    expect(attempts![0].kind).toMatch(/^aligned-/);
    const last = attempts![attempts!.length - 1];
    expect(last.outcome).toBe('success');
  });

  it('l-shape fallback is recorded when routeAligned returns no path', () => {
    // A non-axis-aligned pair (different x AND different y) forces the
    // non-routing-graph backend down to `routeLShape` (level 2+).
    const A = mkNode('A', 100, 100);
    const C = mkNode('C', 300, 200);
    const e1 = mkEdge('e1', 'A', 'C');
    const data: LayoutData = { nodes: [A, C], edges: [e1], config: {} as any };
    const trace: OrthogonalTrace = { stages: [], edges: {} };

    runOrthogonalEdgePipeline(data, {
      trace,
      spacing: 10,
    });

    const attempts = trace.edges[e1.id]?.route?.routingAttempts;
    expect(attempts).toBeDefined();
    expect(attempts!.length).toBeGreaterThanOrEqual(1);
    const last = attempts![attempts!.length - 1];
    expect(last.outcome).toBe('success');
    // At least one aligned-family attempt must appear before the
    // final success — no free lunches.
    expect(
      attempts!.some((a) => a.kind.startsWith('aligned') || a.kind.startsWith('l-shape'))
    ).toBe(true);
  });

  it('OCR null + deterministic-fallback success is the reachable cascade shape (iter-29)', () => {
    // Iter-29 finding: the `if (!points)` block in routeEdges.ts at
    // the old line 598 was unreachable. When OCR returns null, the
    // `else` branch at line 548 ALWAYS sets `points` via
    // detourAlignedIfBlocked (for aligned endpoints) or
    // routeLShapeBetweenPorts (both non-nullable). So the "OCR→grid
    // fallback" (L2), "aligned-fallback" (L3), and "l-shape-fallback"
    // (L4) attempts iter-28 instrumented inside that block are dead
    // pushes. Iter-29 removed the dead cascade; this test pins the
    // actual reachable shape so a future refactor can't silently
    // re-introduce the dead paths.
    const A = mkNode('A', 100, 100);
    const Block = mkNode('Block', 200, 150, 80, 80);
    const C = mkNode('C', 300, 200);
    const e1 = mkEdge('e1', 'A', 'C');
    const data: LayoutData = { nodes: [A, Block, C], edges: [e1], config: {} as any };
    const trace: OrthogonalTrace = { stages: [], edges: {} };

    runOrthogonalEdgePipeline(data, {
      trace,
      spacing: 10,
      routingBackend: 'routing-graph',
      routingGraphModel: 'ocr',
      ocrMaxExpansions: 1, // forces OCR A* to exhaust immediately
    });

    const eTrace = trace.edges[e1.id];
    const attempts = eTrace?.route?.routingAttempts;
    expect(attempts).toBeDefined();

    // OCR primary returns null (exhausted).
    const ocrPrimary = attempts!.find((a) => a.kind === 'routing-graph:ocr');
    expect(ocrPrimary).toBeDefined();
    expect(ocrPrimary!.outcome).toBe('null');

    // Deterministic fallback wins (either aligned-deterministic or
    // l-shape-deterministic, depending on endpoint alignment).
    const detFallback = attempts!.find((a) => a.kind.endsWith('-deterministic-fallback'));
    expect(detFallback).toBeDefined();
    expect(detFallback!.outcome).toBe('success');

    // None of the now-removed dead-code attempts should appear.
    expect(attempts!.find((a) => a.kind.startsWith('routing-graph:ocr-fallback-'))).toBeUndefined();
    expect(attempts!.find((a) => a.kind === 'aligned-fallback')).toBeUndefined();
    expect(attempts!.find((a) => a.kind === 'l-shape-fallback')).toBeUndefined();

    // Algorithm tag reflects the actual winning route (routing-graph).
    expect(eTrace?.route?.algorithm).toBe('routing-graph');
  });

  it('self-loop edge records a self-loop attempt', () => {
    const A = mkNode('A', 100, 100);
    const loop = mkEdge('loop', 'A', 'A');
    const data: LayoutData = { nodes: [A], edges: [loop], config: {} as any };
    const trace: OrthogonalTrace = { stages: [], edges: {} };

    runOrthogonalEdgePipeline(data, {
      trace,
      spacing: 10,
      routingBackend: 'routing-graph',
      routingGraphModel: 'channels',
    });

    const attempts = trace.edges[loop.id]?.route?.routingAttempts;
    expect(attempts).toBeDefined();
    expect(attempts!.length).toBe(1);
    expect(attempts![0].kind).toBe('self-loop');
    expect(attempts![0].outcome).toBe('success');
  });
});
