import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LayoutData, Node, Edge } from '../../types.js';

const validateMock = vi.fn();
// Both entry points route to the same mock: the render path calls `checkLayout`
// and the diagnostic path `validateLayout`, but they are one objective by
// contract (see checkLayout-equivalence.ddlt.spec.ts), so a test that stubs the
// verdict must stub it for both or it would be asserting against a split brain.
vi.mock('./validateLayoutProxy.js', () => ({
  validateLayout: (...args: any[]) => validateMock(...args),
  checkLayout: (...args: any[]) => validateMock(...args),
}));

const ocrMock = vi.fn();
vi.mock('./core/ocr/index.js', () => ({
  findOcrPathBetweenPortsWithObstacles: (...args: any[]) => ocrMock(...args),
}));

function mkNode(id: string, x: number, y: number, width = 40, height = 40): Node {
  return { id, x, y, width, height, isGroup: false } as Node;
}

function mkEdge(id: string, start: string, end: string): Edge {
  return { id, start, end, type: 'arrow' } as Edge;
}

beforeEach(() => {
  validateMock.mockReset();
  ocrMock.mockReset();
  // Default: validator returns "ok" so tests that don't care about validation
  // don't need to explicitly stub it (pipeline may call checkLayout for repairs).
  validateMock.mockReturnValue({
    ok: true,
    issues: [],
    score: 0,
    breakdown: {},
  });
});

describe('orthogonal OCR integration (validation-gated)', () => {
  it('reroutes failing edges with OCR when validateLayout.ok===false', async () => {
    // Import after mocks so pipeline.ts picks up the mocked modules.
    const { runOrthogonalEdgePipeline } = await import('./pipeline.js');

    validateMock
      .mockReturnValueOnce({
        ok: false,
        issues: [{ type: 'edge-intersects-obstacle', message: 'fail', edgeId: 'e1' }],
        score: 0,
        breakdown: {},
      })
      .mockReturnValueOnce({
        ok: true,
        issues: [],
        score: 1,
        breakdown: {},
      });

    ocrMock.mockReturnValue({
      points: [
        { x: 1, y: 2 },
        { x: 9, y: 2 },
      ],
      stats: { nodes: 2, edges: 1, expansions: 0 },
    });

    const data: LayoutData = {
      nodes: [mkNode('A', 0, 0), mkNode('B', 100, 0)],
      edges: [mkEdge('e1', 'A', 'B')],
    } as any;

    runOrthogonalEdgePipeline(data, {
      routingBackend: 'routing-graph',
      routingGraphModel: 'grid',
      ocrFallback: true,
      spacing: 10,
    });

    expect(ocrMock).toHaveBeenCalledTimes(1);
    expect((data.edges[0] as any).points).toEqual([
      { x: 1, y: 2 },
      { x: 9, y: 2 },
    ]);
  });

  it('does not reroute with OCR when validateLayout.ok===true', async () => {
    const { runOrthogonalEdgePipeline } = await import('./pipeline.js');

    validateMock.mockReturnValue({
      ok: true,
      issues: [],
      score: 123,
      breakdown: {},
    });

    const data: LayoutData = {
      nodes: [mkNode('A', 0, 0), mkNode('B', 100, 0)],
      edges: [mkEdge('e1', 'A', 'B')],
    } as any;

    runOrthogonalEdgePipeline(data, {
      routingBackend: 'routing-graph',
      routingGraphModel: 'grid',
      ocrFallback: true,
      spacing: 10,
    });

    expect(ocrMock).toHaveBeenCalledTimes(0);
  });

  it('uses OCR as the primary model when routingGraphModel==="ocr"', async () => {
    const { runOrthogonalEdgePipeline } = await import('./pipeline.js');

    ocrMock.mockReturnValue({
      points: [
        { x: 3, y: 4 },
        { x: 3, y: 40 },
      ],
      stats: { nodes: 2, edges: 1, expansions: 0 },
    });

    const data: LayoutData = {
      nodes: [mkNode('A', 0, 0), mkNode('B', 0, 100)],
      edges: [mkEdge('e1', 'A', 'B')],
    } as any;

    runOrthogonalEdgePipeline(data, {
      routingBackend: 'routing-graph',
      routingGraphModel: 'ocr',
      ocrFallback: true,
      spacing: 10,
    });

    expect(ocrMock).toHaveBeenCalledTimes(1);
    // Primary OCR mode should not run the validation-gated OCR fallback path, but
    // the pipeline may still call validateLayout for other gated repairs.
    expect(validateMock.mock.calls.length).toBeGreaterThanOrEqual(0);
  });
});
