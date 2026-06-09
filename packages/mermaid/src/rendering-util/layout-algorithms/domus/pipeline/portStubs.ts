import type { LayoutData, Node } from '../../../types.js';
import { approxEqual, rectForNode } from '../core/helpers.js';

export function applyPortDirectionStubs(
  data: LayoutData,
  portMismatchEdgeIds: Set<string>,
  stubLen: number
): { changed: number } {
  if (portMismatchEdgeIds.size === 0) {
    return { changed: 0 };
  }

  const nodesById = new Map<string, Node>();
  for (const n of data.nodes ?? []) {
    if (n?.id != null) {
      nodesById.set(String(n.id), n);
    }
  }

  const sideFromBoundaryPoint = (p: any, r: any): 'E' | 'W' | 'N' | 'S' | null => {
    if (approxEqual(p.x, r.left)) {
      return 'W';
    }
    if (approxEqual(p.x, r.right)) {
      return 'E';
    }
    if (approxEqual(p.y, r.top)) {
      return 'N';
    }
    if (approxEqual(p.y, r.bottom)) {
      return 'S';
    }
    return null;
  };
  const segDir = (a: any, b: any): 'E' | 'W' | 'N' | 'S' | null => {
    if (approxEqual(a.x, b.x) && !approxEqual(a.y, b.y)) {
      return b.y > a.y ? 'S' : 'N';
    }
    if (approxEqual(a.y, b.y) && !approxEqual(a.x, b.x)) {
      return b.x > a.x ? 'E' : 'W';
    }
    return null;
  };
  const stubPoint = (p: any, side: 'E' | 'W' | 'N' | 'S') => {
    switch (side) {
      case 'N':
        return { x: p.x, y: p.y - stubLen };
      case 'S':
        return { x: p.x, y: p.y + stubLen };
      case 'E':
        return { x: p.x + stubLen, y: p.y };
      case 'W':
        return { x: p.x - stubLen, y: p.y };
    }
  };
  const ensureOrthoBetween = (a: any, b: any): any[] => {
    if (approxEqual(a.x, b.x) || approxEqual(a.y, b.y)) {
      return [];
    }
    // Deterministic: vertical-then-horizontal elbow.
    const elbow = { x: a.x, y: b.y };
    // If that degenerates, fall back to horizontal-then-vertical.
    if (approxEqual(elbow.x, a.x) && approxEqual(elbow.y, a.y)) {
      return [{ x: b.x, y: a.y }];
    }
    if (approxEqual(elbow.x, b.x) && approxEqual(elbow.y, b.y)) {
      return [{ x: b.x, y: a.y }];
    }
    return [elbow];
  };
  // iter-35 R16: detect when the approach segment is flush with the
  // port's side boundary. In that case the existing splice+elbow path
  // produces a U-turn (the V-then-H elbow lands on or behind the port
  // along the port normal). Paper anchor: Siebenhaller Def. 2.5
  // Bend-Or-End, source `0fb2d84f`.
  const isParallelApproach = (
    prev: { x: number; y: number },
    port: { x: number; y: number },
    side: 'E' | 'W' | 'N' | 'S'
  ): boolean => {
    if (side === 'N' || side === 'S') {
      return approxEqual(prev.y, port.y);
    }
    return approxEqual(prev.x, port.x);
  };
  const portNormal = (side: 'E' | 'W' | 'N' | 'S', len: number): { dx: number; dy: number } => {
    switch (side) {
      case 'N':
        return { dx: 0, dy: -len };
      case 'S':
        return { dx: 0, dy: len };
      case 'E':
        return { dx: len, dy: 0 };
      case 'W':
        return { dx: -len, dy: 0 };
    }
  };
  // Shift pts[idx] outward by stubLen along port normal is safe only
  // when the segment to the adjacent outer neighbor stays orthogonal.
  // If the neighbor shares the parallel-axis coord with pts[idx] (i.e.
  // the pre-stub polyline has three+ points flush with the boundary),
  // shifting would create a diagonal. Fall back to existing splice.
  const canShift = (
    neighbor: { x: number; y: number } | null,
    self: { x: number; y: number },
    side: 'E' | 'W' | 'N' | 'S'
  ): boolean => {
    if (!neighbor) {
      return true;
    }
    if (side === 'N' || side === 'S') {
      return approxEqual(neighbor.x, self.x);
    }
    return approxEqual(neighbor.y, self.y);
  };

  let changed = 0;
  for (const e of data.edges ?? []) {
    if (e?.id == null || !portMismatchEdgeIds.has(String(e.id))) {
      continue;
    }
    if (!e?.start || !e?.end || !Array.isArray((e as any).points)) {
      continue;
    }
    const pts = (e as any).points as any[];
    if (pts.length < 2) {
      continue;
    }
    const sNode = nodesById.get(String(e.start));
    const tNode = nodesById.get(String(e.end));
    if (!sNode || !tNode) {
      continue;
    }
    const rs = rectForNode(sNode);
    const rt = rectForNode(tNode);

    // Start stub.
    //
    // iter-11 handled the axis-mismatch case (firstDir != sSide). iter-19
    // D extends this to ALSO fire when the first segment is diagonal
    // (firstDir === null) — that arises when B-side portPlan or C2
    // centre-pin shifts a port off the axis A1's centre-anchored shape
    // walk assumed. The existing body (sStub along port normal +
    // ensureOrthoBetween elbow) produces the paper-backed two-bend L
    // from Siebenhaller §5.2.2 (source `0fb2d84f`).
    const sSide = sideFromBoundaryPoint(pts[0], rs);
    const firstDir = segDir(pts[0], pts[1]);
    if (sSide && firstDir !== sSide) {
      if (
        isParallelApproach(pts[1], pts[0], sSide) &&
        canShift(pts.length > 2 ? pts[2] : null, pts[1], sSide)
      ) {
        // iter-35 R16: single-bend L-approach (Kandinsky Def. 2.5).
        // Shift pts[1] outward along port normal and insert one elbow.
        const n2 = portNormal(sSide, stubLen);
        pts[1] = { x: pts[1].x + n2.dx, y: pts[1].y + n2.dy };
        pts.splice(1, 0, { x: pts[0].x + n2.dx, y: pts[0].y + n2.dy });
      } else {
        const sStub = stubPoint(pts[0], sSide);
        const next = pts[1];
        const elbow = ensureOrthoBetween(sStub, next);
        pts.splice(1, 0, sStub, ...elbow);
      }
      changed++;
    }

    // End stub (symmetric — same iter-19 D extension).
    const n = pts.length;
    const eSide = sideFromBoundaryPoint(pts[n - 1], rt);
    const lastDirTowardPrev = n >= 2 ? segDir(pts[n - 1], pts[n - 2]) : null;
    if (eSide && lastDirTowardPrev !== eSide) {
      if (
        isParallelApproach(pts[n - 2], pts[n - 1], eSide) &&
        canShift(n >= 3 ? pts[n - 3] : null, pts[n - 2], eSide)
      ) {
        // iter-35 R16.
        const nr = portNormal(eSide, stubLen);
        pts[n - 2] = { x: pts[n - 2].x + nr.dx, y: pts[n - 2].y + nr.dy };
        pts.splice(n - 1, 0, { x: pts[n - 1].x + nr.dx, y: pts[n - 1].y + nr.dy });
      } else {
        const eStub = stubPoint(pts[n - 1], eSide);
        const prev = pts[n - 2];
        const elbow = ensureOrthoBetween(prev, eStub);
        pts.splice(n - 1, 0, ...elbow, eStub);
      }
      changed++;
    }
  }

  return { changed };
}
