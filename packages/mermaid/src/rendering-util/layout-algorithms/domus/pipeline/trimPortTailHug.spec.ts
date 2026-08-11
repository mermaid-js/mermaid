import { describe, it, expect } from 'vitest';
import { trimPortTailHug } from './trimPortTailHug.js';
import type { LayoutData, Node } from '../../../types.js';

// iter-34 (R10) — port-approach border-hug trim.
//
// Siebenhaller §2.3.2.1 (source `0fb2d84f`): Kandinsky's bend-or-end
// requires the last segment entering a port to be perpendicular to the
// port's side. A horizontal segment at y=tNode.top can never be valid.
// `alleyMidpointNudge` (iter-1) explicitly excludes the last segment
// (interior-segment loop `i < pts.length - 2`); `postRouting` also
// excludes the tail. This helper fills the gap by popping the trailing
// point when the last segment runs colinear with the target's boundary,
// leaving the prior bend as the perpendicular approach.

describe('trimPortTailHug — trailing colinear tail removal', () => {
  it('trims a horizontal tail running along target top', () => {
    // Mirrors L_D_F_0-from-label on deploy-pipeline-simplified (iter-34
    // Phase 0 probe). Target F at cx=77, cy=389.5, w=154, h=45 → F.top=367.
    // Polyline ends with (..., (30, 367), (80, 367)); last segment runs
    // 50u east along F's top. After trim, port sits at (30, 367) with a
    // perpendicular vertical approach from (30, 352).
    const F: Node = {
      id: 'F',
      isGroup: false,
      x: 77,
      y: 389.5,
      width: 154,
      height: 45,
    } as unknown as Node;
    const src: Node = {
      id: 'src',
      isGroup: false,
      x: 10,
      y: 306.5,
      width: 22,
      height: 21,
    } as unknown as Node;
    const data = {
      nodes: [F, src],
      edges: [
        {
          id: 'e1',
          start: 'src',
          end: 'F',
          points: [
            { x: 10, y: 317 },
            { x: 30, y: 317 },
            { x: 30, y: 352 },
            { x: 30, y: 367 },
            { x: 80, y: 367 },
          ],
        },
      ],
    } as unknown as LayoutData;

    const { trimmed } = trimPortTailHug(data);
    expect(trimmed).toBe(1);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    expect(pts).toHaveLength(4);
    // Port is now the previously-penultimate point (30, 367); prior segment
    // (30, 352)→(30, 367) is a clean vertical-descending perpendicular entry.
    expect(pts[pts.length - 1]).toEqual({ x: 30, y: 367 });
    expect(pts[pts.length - 2]).toEqual({ x: 30, y: 352 });
  });

  it('trims a vertical tail running along target right side', () => {
    // Symmetric case: target at (100, 50) w=40 h=40 → right=120, top=30,
    // bottom=70. Both endpoints of last segment must be STRICTLY between
    // top and bottom (not at the corners) for the trim to fire — that
    // distinguishes "hug" from "corner entry".
    const T: Node = {
      id: 'T',
      isGroup: false,
      x: 100,
      y: 50,
      width: 40,
      height: 40,
    } as unknown as Node;
    const data = {
      nodes: [T],
      edges: [
        {
          id: 'e1',
          start: 'src',
          end: 'T',
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 40 },
            { x: 120, y: 40 },
            { x: 120, y: 60 },
          ],
        },
      ],
    } as unknown as LayoutData;

    // Last segment: (120, 40) → (120, 60). x=T.right=120; prev.y=40 and
    // last.y=60 both strictly between T.top=30 and T.bottom=70 → trim.
    // After trim, prior segment (100, 40) → (120, 40) is horizontal
    // approaching the new port (120, 40) on T.right side — perpendicular.
    const { trimmed } = trimPortTailHug(data);
    expect(trimmed).toBe(1);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    expect(pts).toHaveLength(4);
    expect(pts[pts.length - 1]).toEqual({ x: 120, y: 40 });
  });

  it('does not trim when last segment is perpendicular (normal case)', () => {
    // Legitimate perpendicular approach — last segment is vertical and
    // target's vertical boundaries are left=0/right=20; the segment is
    // at x=10 (centre), not on either side. Must leave polyline alone.
    const T: Node = {
      id: 'T',
      isGroup: false,
      x: 10,
      y: 50,
      width: 20,
      height: 20,
    } as unknown as Node;
    const data = {
      nodes: [T],
      edges: [
        {
          id: 'e1',
          start: 'x',
          end: 'T',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 40 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { trimmed } = trimPortTailHug(data);
    expect(trimmed).toBe(0);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    expect(pts).toHaveLength(3);
  });

  it('does not trim when the target is a group', () => {
    // Groups are legitimately large; children can touch their boundaries.
    // The helper skips groups even when the last segment is colinear.
    const G: Node = {
      id: 'G',
      isGroup: true,
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    } as unknown as Node;
    const data = {
      nodes: [G],
      edges: [
        {
          id: 'e1',
          start: 'x',
          end: 'G',
          points: [
            { x: -100, y: -100 },
            { x: -50, y: -100 },
            { x: 0, y: -100 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { trimmed } = trimPortTailHug(data);
    expect(trimmed).toBe(0);
  });

  it('does not trim a legitimate corner-entry approach (A→C around B regression)', () => {
    // Mirrors `orthogonal.pipeline.spec.ts > routes around a blocking node
    // when start and end are horizontally aligned`. A (100,100), B (200,100),
    // C (300,100) each 40×40. Routing detours over B's top; last segment is
    // (280, 70) → (280, 100), vertical at x=280=C.left. Without the
    // strictly-between guard, the trim mis-interprets this as a hug and
    // drops the real port. The guard: prev.y=70 < C.top=80, so NOT strictly
    // inside C's top-bottom extent → skip.
    const C: Node = {
      id: 'C',
      isGroup: false,
      x: 300,
      y: 100,
      width: 40,
      height: 40,
    } as unknown as Node;
    const data = {
      nodes: [C],
      edges: [
        {
          id: 'e1',
          start: 'A',
          end: 'C',
          points: [
            { x: 120, y: 100 },
            { x: 120, y: 70 },
            { x: 280, y: 70 },
            { x: 280, y: 100 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { trimmed } = trimPortTailHug(data);
    expect(trimmed).toBe(0);
    const pts = (data.edges[0] as { points: { x: number; y: number }[] }).points;
    // Last point preserved — isOnNodeBoundary(pts[last], C) remains true.
    expect(pts[pts.length - 1]).toEqual({ x: 280, y: 100 });
  });

  it('skips self-loops and < 3-point polylines', () => {
    const T: Node = {
      id: 'T',
      isGroup: false,
      x: 10,
      y: 10,
      width: 10,
      height: 10,
    } as unknown as Node;
    const data = {
      nodes: [T],
      edges: [
        {
          id: 'selfloop',
          start: 'T',
          end: 'T',
          points: [
            { x: 5, y: 5 },
            { x: 15, y: 5 },
            { x: 15, y: 15 },
          ],
        },
        {
          id: 'short',
          start: 'x',
          end: 'T',
          points: [
            { x: 0, y: 15 },
            { x: 15, y: 15 },
          ],
        },
      ],
    } as unknown as LayoutData;
    const { trimmed } = trimPortTailHug(data);
    expect(trimmed).toBe(0);
  });
});
