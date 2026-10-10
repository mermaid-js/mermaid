import { describe, expect, it } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { faceAxis, type Box } from './faceGeometry.js';
import { layOutFixture } from './viewerSizedLayout.js';

// What the dev viewer measures for query-process.mmd.
const VIEWER_SIZES = {
  A: [150, 51],
  A2: [192, 192],
  E: [171, 171],
  F: [150, 51],
  G: [150, 51],
  F2: [150, 51],
  B: [171, 171],
  C: [150, 51],
} as const;

// A rail closer than this to a node it does not join counts as touching it.
const RAIL_CLEARANCE = 4;

describe('edges that leave one node', () => {
  it('query-process: every edge leaves the diamond E at a vertex, not beside it', async () => {
    const layout: LayoutData = await layOutFixture('query-process', VIEWER_SIZES);
    const diamond = layout.nodes.find((n) => n.id === 'E') as unknown as Box;
    const leaving = layout.edges.filter((e) => e.start === 'E' && e.points?.length);
    expect(leaving.length).toBeGreaterThan(1);
    for (const edge of leaving) {
      expect(faceAxis(diamond, edge.points![0]), `${edge.id} starts off a vertex`).toBeDefined();
    }
  });

  it('query-process: no edge runs along or through a node it does not join', async () => {
    const layout = await layOutFixture('query-process', VIEWER_SIZES);
    const boxes = layout.nodes.filter((n) => !n.isGroup && !n.isEdgeLabel);
    const touching: string[] = [];
    for (const edge of layout.edges) {
      const points = edge.points ?? [];
      for (let i = 1; i < points.length; i++) {
        const [a, b] = [points[i - 1], points[i]];
        for (const node of boxes) {
          if (node.id === edge.start || node.id === edge.end) {
            continue;
          }
          const halfW = (node.width ?? 0) / 2 + RAIL_CLEARANCE;
          const halfH = (node.height ?? 0) / 2 + RAIL_CLEARANCE;
          const overlapsX =
            Math.min(a.x, b.x) < node.x! + halfW && Math.max(a.x, b.x) > node.x! - halfW;
          const overlapsY =
            Math.min(a.y, b.y) < node.y! + halfH && Math.max(a.y, b.y) > node.y! - halfH;
          if (overlapsX && overlapsY) {
            touching.push(`${edge.id} touches ${node.id}`);
          }
        }
      }
    }
    expect(touching).toEqual([]);
  });
});
