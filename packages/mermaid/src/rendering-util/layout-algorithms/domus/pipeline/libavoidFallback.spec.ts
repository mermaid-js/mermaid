import { describe, expect, it } from 'vitest';
import type { LayoutData, Node } from '../../../types.js';
import { scoreLayout } from '../../layout-utils/scoreLayout.js';
import { validateLayout } from '../validateLayoutProxy.js';
import { applyLibavoidFallbackIfNeeded } from './libavoidFallback.js';

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

describe('libavoid fallback seam', () => {
  it('does not send self-loop edges to the libavoid adapter', () => {
    const data: LayoutData = {
      nodes: [node('A', 0, 0)],
      edges: [
        {
          id: 'A-A',
          start: 'A',
          end: 'A',
          points: [
            { x: 10, y: 0 },
            { x: 40, y: 0 },
            { x: 40, y: 30 },
            { x: 10, y: 30 },
            { x: 10, y: 10 },
          ],
          type: 'arrow',
        },
      ],
      config: {} as any,
    };
    const nodesById = new Map(data.nodes.map((n) => [String(n.id), n]));
    const calls: string[][] = [];

    applyLibavoidFallbackIfNeeded({
      data,
      options: {
        libavoidFallback: true,
        libavoidMaxEdgeBendsThreshold: 0,
        spacing: 10,
        libavoidAdapter: ({ edgeIds }) => {
          calls.push([...edgeIds]);
          return {
            'A-A': [
              { x: 10, y: 0 },
              { x: 45, y: 0 },
              { x: 45, y: 10 },
              { x: 10, y: 10 },
            ],
          };
        },
      },
      nodesById,
    });

    expect(calls).toEqual([]);
    expect(data.edges[0].points).toEqual([
      { x: 10, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 30 },
      { x: 10, y: 30 },
      { x: 10, y: 10 },
    ]);
  });

  it('accepts alternate fixed-node routes when they improve crossings', () => {
    const data: LayoutData = {
      nodes: [node('A', 0, 0), node('B', 100, 100), node('C', 0, 100), node('D', 100, 0)],
      edges: [
        {
          id: 'A-B',
          start: 'A',
          end: 'B',
          points: [
            { x: 10, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 100 },
            { x: 90, y: 100 },
          ],
          type: 'arrow',
        },
        {
          id: 'C-D',
          start: 'C',
          end: 'D',
          points: [
            { x: 10, y: 100 },
            { x: 80, y: 100 },
            { x: 80, y: 10 },
            { x: 90, y: 0 },
          ],
          type: 'arrow',
        },
      ],
      config: {} as any,
    };
    const nodesById = new Map(data.nodes.map((n) => [String(n.id), n]));
    const before = scoreLayout(data).scores;
    expect(before.crossings).toBeGreaterThan(0);

    applyLibavoidFallbackIfNeeded({
      data,
      options: {
        libavoidFallback: true,
        libavoidCrossingThreshold: 0,
        spacing: 10,
        libavoidAdapter: () => ({
          'C-D': [
            { x: 10, y: 100 },
            { x: 30, y: 100 },
            { x: 30, y: 40 },
            { x: 90, y: 40 },
            { x: 90, y: 0 },
          ],
        }),
      },
      nodesById,
    });

    const afterValidation = validateLayout(data);
    const after = scoreLayout(data).scores;
    expect(data.edges.find((e) => e.id === 'C-D')?.points).not.toEqual([
      { x: 10, y: 100 },
      { x: 80, y: 100 },
      { x: 80, y: 10 },
      { x: 90, y: 0 },
    ]);
    expect(
      afterValidation.issues.some(
        (issue) => issue.edgeId === 'C-D' && issue.type === 'edge-non-orthogonal'
      )
    ).toBe(false);
    expect(after.crossings).toBeLessThan(before.crossings);
  });

  it('reports the best rejected candidate when no acceptable reroute exists', () => {
    const data: LayoutData = {
      nodes: [node('A', 0, 0), node('B', 100, 100), node('C', 0, 100), node('D', 100, 0)],
      edges: [
        {
          id: 'A-B',
          start: 'A',
          end: 'B',
          points: [
            { x: 10, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 100 },
            { x: 90, y: 100 },
          ],
          type: 'arrow',
        },
        {
          id: 'C-D',
          start: 'C',
          end: 'D',
          points: [
            { x: 10, y: 100 },
            { x: 80, y: 100 },
            { x: 80, y: 10 },
            { x: 90, y: 0 },
          ],
          type: 'arrow',
        },
      ],
      config: {} as any,
    };
    const nodesById = new Map(data.nodes.map((n) => [String(n.id), n]));

    applyLibavoidFallbackIfNeeded({
      data,
      options: {
        libavoidFallback: true,
        libavoidCrossingThreshold: 0,
        spacing: 10,
        libavoidAdapter: () => ({
          'C-D': [
            { x: 10, y: 100 },
            { x: 80, y: 100 },
            { x: 80, y: 90 },
            { x: 100, y: 90 },
            { x: 100, y: 0 },
          ],
        }),
      },
      nodesById,
    });

    const report = (data as LayoutData & { __libavoidReport?: any }).__libavoidReport;
    expect(report?.outcome?.status).toBe('rejected');
    expect(['no-acceptable-candidate', 'no-edge-geometry-changed']).toContain(
      report?.outcome?.reason
    );
    if (report?.outcome?.reason === 'no-acceptable-candidate') {
      expect(report?.outcome?.bestRejectedCandidate?.edgeIds).toEqual(['C-D']);
      expect(report?.outcome?.bestRejectedCandidate?.reason).toBe('not-better-than-before');
      expect(Array.isArray(report?.outcome?.topRejectedCandidates)).toBe(true);
      expect(report?.outcome?.topRejectedCandidates?.length).toBeGreaterThan(0);
      expect(Array.isArray(report?.outcome?.topRejectedLargeBundles)).toBe(true);
      expect(Array.isArray(report?.outcome?.topIssueBudgetExceededCandidates)).toBe(true);
    }
  });
});
