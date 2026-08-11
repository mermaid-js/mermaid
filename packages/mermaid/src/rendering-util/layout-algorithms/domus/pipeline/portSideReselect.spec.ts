import { describe, it, expect } from 'vitest';
import type { LayoutData, Node } from '../../../types.js';
import { reselectPortSideForPerpendicularEntry } from './portSideReselect.js';

function mkNode(id: string, x: number, y: number, w = 40, h = 40): Node {
  return {
    id,
    x,
    y,
    width: w,
    height: h,
    isGroup: false,
    shape: 'rect',
    label: id,
    layer: 0,
    order: 0,
    labelStyle: '',
    parentId: undefined,
  } as unknown as Node;
}

function byIdMap(nodes: Node[]): Map<string, Node> {
  const m = new Map<string, Node>();
  for (const n of nodes) {
    m.set(String(n.id), n);
  }
  return m;
}

describe('reselectPortSideForPerpendicularEntry', () => {
  it('redirects a vertical final segment flush on target-right to target-top', () => {
    // Mirror of the company-simp L_HongKongCompany_Wages_0 failure.
    // HKC w=160 → right edge x=350 when centered at 270. Wages w=80 → right x=450 when centered at 410.
    // Polyline ends at (450, 300) = Wages.right with vertical final segment → flush.
    // Expected redirect: endpoint to Wages.top = (410, 280).
    const hkc = mkNode('HKC', 270, 200, 160, 40);
    const wages = mkNode('Wages', 410, 300, 80, 40);
    const data: LayoutData = {
      nodes: [hkc, wages],
      edges: [
        {
          id: 'e1',
          start: 'HKC',
          end: 'Wages',
          points: [
            { x: 350, y: 200 }, // HKC.right port
            { x: 450, y: 200 }, // bend — x = Wages.right
            { x: 450, y: 300 }, // Wages.right port (FLUSH violation)
          ],
        } as unknown as LayoutData['edges'][number],
      ],
    } as unknown as LayoutData;

    const changed = reselectPortSideForPerpendicularEntry(data, byIdMap([hkc, wages]));

    expect(changed).toBe(1);
    const pts = data.edges[0].points!;
    // Endpoint now on Wages.top (y = 300 - 20 = 280), at Wages.center.x = 410
    expect(pts[pts.length - 1].y).toBeCloseTo(280, 6);
    expect(pts[pts.length - 1].x).toBeCloseTo(410, 6);
    // Final segment must be perpendicular to the top side → vertical
    const lastA = pts[pts.length - 2];
    const lastB = pts[pts.length - 1];
    expect(lastA.x).toBeCloseTo(lastB.x, 6); // vertical
  });

  it('redirects a horizontal final segment flush on target-top to target-left', () => {
    // 3-point L-shape: vertical-then-horizontal. Final horizontal segment at
    // y=target.top → flush. Approach from the left (x ascending) → redirect to
    // target.left.
    const src = mkNode('S', 0, 0, 40, 40);
    const tgt = mkNode('T', 200, 200, 40, 40); // top y=180, left x=180
    const data: LayoutData = {
      nodes: [src, tgt],
      edges: [
        {
          id: 'e1',
          start: 'S',
          end: 'T',
          points: [
            { x: 20, y: 0 }, // src.right port
            { x: 20, y: 180 }, // bend — at y=tgt.top
            { x: 200, y: 180 }, // FLUSH: final segment horizontal, endpoint on top side
          ],
        } as unknown as LayoutData['edges'][number],
      ],
    } as unknown as LayoutData;

    const changed = reselectPortSideForPerpendicularEntry(data, byIdMap([src, tgt]));

    expect(changed).toBe(1);
    const pts = data.edges[0].points!;
    const lastB = pts[pts.length - 1];
    // Endpoint moved to tgt.left (x=180) at tgt.center.y=200
    expect(lastB.x).toBeCloseTo(180, 6);
    expect(lastB.y).toBeCloseTo(200, 6);
    // Final segment perpendicular to left side → horizontal
    const lastA = pts[pts.length - 2];
    expect(lastA.y).toBeCloseTo(lastB.y, 6);
  });

  it('leaves already-perpendicular polylines unchanged', () => {
    // Horizontal final segment ending on target-left — correct perpendicular entry.
    const src = mkNode('S', 0, 0, 40, 40);
    const tgt = mkNode('T', 200, 0, 40, 40); // left edge x=180
    const data: LayoutData = {
      nodes: [src, tgt],
      edges: [
        {
          id: 'e1',
          start: 'S',
          end: 'T',
          points: [
            { x: 20, y: 0 },
            { x: 180, y: 0 }, // target.left port center
          ],
        } as unknown as LayoutData['edges'][number],
      ],
    } as unknown as LayoutData;

    const before = [...data.edges[0].points!];
    const changed = reselectPortSideForPerpendicularEntry(data, byIdMap([src, tgt]));
    expect(changed).toBe(0);
    expect(data.edges[0].points).toEqual(before);
  });

  it('does not redirect when the alternative side would require crossing another obstacle', () => {
    // Same setup as test 1, but a blocker obstacle sits directly above Wages so Wages.top
    // is unreachable without crossing the blocker. Expect no change.
    const hkc = mkNode('HKC', 270, 200, 160, 40);
    const wages = mkNode('Wages', 410, 300, 80, 40);
    // Blocker: directly above Wages at Wages.center.x, covering y ∈ [230,270],
    // x ∈ [390,430]. A vertical segment from y=200 down to Wages.top=280 at x=410 crosses it.
    const blocker = mkNode('B', 410, 250, 40, 40);
    const data: LayoutData = {
      nodes: [hkc, wages, blocker],
      edges: [
        {
          id: 'e1',
          start: 'HKC',
          end: 'Wages',
          points: [
            { x: 350, y: 200 },
            { x: 450, y: 200 },
            { x: 450, y: 300 },
          ],
        } as unknown as LayoutData['edges'][number],
      ],
    } as unknown as LayoutData;

    const before = [...data.edges[0].points!];
    const changed = reselectPortSideForPerpendicularEntry(data, byIdMap([hkc, wages, blocker]));
    expect(changed).toBe(0);
    expect(data.edges[0].points).toEqual(before);
  });

  it('does NOT touch source-side flush (upstream port-ordering owns exit-side choice)', () => {
    // Start-side reselect is intentionally not implemented — see hk-left-inversion
    // regression and the note in portSideReselect.ts. Upstream port-ordering
    // passes deliberately keep exit ports on a chosen side even when the first
    // segment is briefly flush.
    const src = mkNode('S', 100, 100, 40, 40);
    const tgt = mkNode('T', 300, 300, 40, 40);
    const data: LayoutData = {
      nodes: [src, tgt],
      edges: [
        {
          id: 'e1',
          start: 'S',
          end: 'T',
          points: [
            { x: 120, y: 100 },
            { x: 120, y: 300 },
            { x: 280, y: 300 },
          ],
        } as unknown as LayoutData['edges'][number],
      ],
    } as unknown as LayoutData;

    const before = [...data.edges[0].points!];
    const changed = reselectPortSideForPerpendicularEntry(data, byIdMap([src, tgt]));
    expect(changed).toBe(0);
    expect(data.edges[0].points).toEqual(before);
  });
});
