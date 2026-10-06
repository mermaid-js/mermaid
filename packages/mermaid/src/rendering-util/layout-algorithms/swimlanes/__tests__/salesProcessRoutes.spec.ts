import { describe, expect, it } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { EDGE_ROUTING } from '../config.js';
import { layOutMeasured } from './viewerSizedLayout.js';

interface Pt {
  x: number;
  y: number;
}

// What the dev viewer measures for sales-process.mmd (it has no captured sizes file).
const VIEWER_SIZES = {
  C1: [187.02, 87],
  C2: [152, 45],
  Finished1: [171.23, 45],
  Finished2: [171.23, 45],
  S1: [171, 171],
  S2: [152, 87],
  T3: [152, 66],
  T5: [152, 66],
  T1: [171, 171],
  T2: [152, 45],
  T4: [152, 66],
  T6: [152, 45],
  Te1: [152, 45],
  Te2: [192, 192],
  D4: [171, 171],
  D1: [152, 45],
  D2: [152, 45],
  D3: [152, 45],
  'edge-label-S1-S2-L_S1_S2_0': [22.84, 21],
  'edge-label-S1-T1-L_S1_T1_0': [17.91, 21],
  'edge-label-T1-T2-L_T1_T2_0': [17.91, 21],
  'edge-label-T1-Te1-L_T1_Te1_0': [22.84, 21],
  'edge-label-Te2-D1-L_Te2_D1_0': [22.84, 21],
  'edge-label-Te2-T4-L_Te2_T4_0': [17.91, 21],
  'edge-label-T4-C2-L_T4_C2_0': [17.91, 21],
  'edge-label-D4-D2-L_D4_D2_0': [17.91, 21],
  'edge-label-D4-T6-L_D4_T6_0': [22.84, 21],
} as const;

const distance = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function distanceToSegment(p: Pt, a: Pt, b: Pt): number {
  const lengthSquared = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  const along =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / lengthSquared)
        );
  return distance(p, { x: a.x + along * (b.x - a.x), y: a.y + along * (b.y - a.y) });
}

const distinct = (points: Pt[]) =>
  points.filter((p, i) => i === 0 || distance(p, points[i - 1]) > 0);

/** The points where a route turns. */
function bends(points: Pt[]): Pt[] {
  const path = distinct(points);
  return path.slice(1, -1).filter((p, i) => {
    const [before, after] = [path[i], path[i + 2]];
    return (p.x - before.x) * (after.y - p.y) !== (p.y - before.y) * (after.x - p.x);
  });
}

function endsOn(layout: LayoutData, nodeId: string) {
  const node = layout.nodes.find((n) => n.id === nodeId)!;
  return layout.edges
    .filter((e) => (e.end === nodeId || e.start === nodeId) && e.points?.length)
    .map((e) => ({ id: e.id, end: e.end === nodeId ? e.points!.at(-1)! : e.points![0] }))
    .map((e) => ({ ...e, side: Math.sign(e.end.x - node.x!) }));
}

describe('sales-process, laid out as the dev viewer measures it', () => {
  it('keeps arrowheads that land on one face of a node apart', async () => {
    const layout = await layOutMeasured('sales-process', VIEWER_SIZES);
    const tooClose: string[] = [];
    for (const node of layout.nodes.filter((n) => !n.isGroup && !n.isEdgeLabel)) {
      const ends = endsOn(layout, node.id);
      for (const [i, a] of ends.entries()) {
        for (const b of ends.slice(i + 1)) {
          const gap = distance(a.end, b.end);
          if (a.side === b.side && gap < EDGE_ROUTING.MIN_ARROWHEAD_SPACING) {
            tooClose.push(`${a.id} and ${b.id} end ${gap.toFixed(1)} apart on ${node.id}`);
          }
        }
      }
    }
    expect(tooClose).toEqual([]);
  });

  it('never lets the corner of one route touch another route', async () => {
    const layout = await layOutMeasured('sales-process', VIEWER_SIZES);
    const routed = layout.edges.filter((e) => e.points?.length);
    const touching: string[] = [];
    for (const edge of routed) {
      for (const other of routed.filter((o) => o !== edge)) {
        const path = distinct(other.points!);
        for (const bend of bends(edge.points!)) {
          const near = path
            .slice(1)
            .some(
              (p, i) => distanceToSegment(bend, path[i], p) < EDGE_ROUTING.ROUTE_TOUCH_TOLERANCE
            );
          if (near) {
            touching.push(
              `${edge.id} turns at (${bend.x.toFixed(1)}, ${bend.y.toFixed(1)}) on ${other.id}`
            );
          }
        }
      }
    }
    expect(touching).toEqual([]);
  });
});
