import { describe, expect, it } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { layOutFixture } from './viewerSizedLayout.js';

interface Pt {
  x: number;
  y: number;
}

// What the dev viewer measures for 13-disagree-exits-b-c-d.mmd.
const VIEWER_SIZES = {
  A: [150, 51],
  B: [204, 91],
  I: [152, 45],
  Sys1: [152, 45],
  E: [152, 45],
  C: [204, 91],
  D: [204, 91],
  F: [152, 45],
  G: [152, 45],
  H: [152, 45],
} as const;

const SAME_POINT = 1;
const MIN_SHARED_RUN = 1;

const distance = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function sharedRun(a: Pt[], b: Pt[]): number {
  let run = 0;
  for (let i = 1; i < a.length; i++) {
    for (let j = 1; j < b.length; j++) {
      const horizontal = a[i].y === a[i - 1].y && b[j].y === b[j - 1].y && a[i].y === b[j].y;
      const vertical = a[i].x === a[i - 1].x && b[j].x === b[j - 1].x && a[i].x === b[j].x;
      if (horizontal || vertical) {
        const axis = horizontal ? 'x' : 'y';
        const lo = Math.max(
          Math.min(a[i][axis], a[i - 1][axis]),
          Math.min(b[j][axis], b[j - 1][axis])
        );
        const hi = Math.min(
          Math.max(a[i][axis], a[i - 1][axis]),
          Math.max(b[j][axis], b[j - 1][axis])
        );
        run += Math.max(0, hi - lo);
      }
    }
  }
  return run;
}

function incomingAgainstOutgoing(layout: LayoutData, nodeId: string) {
  const edges = layout.edges.filter((e) => e.points?.length);
  return edges
    .filter((e) => e.end === nodeId)
    .flatMap((incoming) =>
      edges.filter((e) => e.start === nodeId).map((outgoing) => ({ incoming, outgoing }))
    );
}

describe('an incoming and an outgoing edge on a non-rectangular node', () => {
  it('13-disagree-exits-b-c-d: never end where, or run along where, B -> C leaves B', async () => {
    const layout = await layOutFixture('13-disagree-exits-b-c-d', VIEWER_SIZES);
    const pairs = incomingAgainstOutgoing(layout, 'B');
    expect(pairs.length).toBeGreaterThan(0);
    for (const { incoming, outgoing } of pairs) {
      const inPts = incoming.points!;
      const outPts = outgoing.points!;
      expect(
        distance(inPts.at(-1)!, outPts[0]),
        `${incoming.id} ends on ${outgoing.id}`
      ).toBeGreaterThan(SAME_POINT);
      expect(sharedRun(inPts, outPts), `${incoming.id} runs along ${outgoing.id}`).toBeLessThan(
        MIN_SHARED_RUN
      );
    }
  });
});
