/**
 * Winner-only rail-shift repairs for two hard rules the existing passes
 * cannot reach:
 *
 * - `edge-parallel-segment-too-close` (gap under 7): `applySharedSubpathNudge`
 *   only sees rails within 1px of each other (COLLINEAR_EPS), so a pair 2-7px
 *   apart is flagged by the validator and invisible to the pass meant to
 *   separate rails. Widening that pass's tolerance was measured at -30
 *   corpus-wide (it runs unconditionally, many times, inside the placement
 *   tournament); this repair instead shifts ONE offending mid rail, once, on
 *   the winning variant, judged by the full validator.
 *
 * - `edge-label-overlaps-foreign-edge` where the LABEL cannot move: on dense
 *   drawings every anchor on/off the owner's polyline is occupied (triage2's
 *   L_fixPR_Review_0: 72 candidates, zero clear), so the label relocation
 *   pass is exhausted and the only remaining repair is to move the FOREIGN
 *   edge: shift its mid rail off the label rect, or — when the crossing
 *   segment is terminal and carries a port — insert a Z-jog that walks the
 *   route around the label.
 *
 * Both rules are pairwise (computed across edges), so acceptance uses the
 * full `checkLayout` under the standard monotone contract: fewer issues, no
 * new issue key. One deliberate relaxation: the validator reports at most ONE
 * foreign-edge overlap per label (it breaks after the first hit), so a label
 * lying on TWO routes reveals the second the moment the first is cleared.
 * That revealed issue is the same label's pre-existing overlap coming out of
 * shadow, not new damage — the jog accepts the swap at equal issue count, and
 * the fixed-point loop then repairs the revealed crossing on the next round.
 */
import type { LayoutData } from '../../../types.js';
import { checkLayout } from '../validateLayoutProxy.js';

interface Point {
  x: number;
  y: number;
}

interface EdgeLike {
  id?: string | number;
  points?: Point[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface IssueLike {
  type: string;
  edgeId?: string;
  nodeIds?: string[];
  details?: unknown;
}

function keyOf(i: IssueLike): string {
  return `${i.type}|${i.edgeId ?? ''}|${(i.nodeIds ?? []).join(',')}`;
}

/** Shift the rail pts[i]..pts[i+1] to `target` on its perpendicular axis; returns undo. */
function shiftRail(pts: Point[], i: number, target: number): (() => void) | null {
  if (i <= 0 || i + 1 >= pts.length - 1) {
    return null; // terminal rails carry port positions; do not move them
  }
  const p = pts[i];
  const q = pts[i + 1];
  const vertical = Math.abs(p.x - q.x) < 1e-6;
  const horizontal = Math.abs(p.y - q.y) < 1e-6;
  if (!vertical && !horizontal) {
    return null;
  }
  const oldP = { ...p };
  const oldQ = { ...q };
  if (vertical) {
    p.x = target;
    q.x = target;
  } else {
    p.y = target;
    q.y = target;
  }
  return () => {
    p.x = oldP.x;
    p.y = oldP.y;
    q.x = oldQ.x;
    q.y = oldQ.y;
  };
}

/** Index of the segment in pts matching the given endpoints (either order), or -1. */
function findSegment(pts: Point[], a: Point, b: Point): number {
  const eq = (u: Point, v: Point) => Math.abs(u.x - v.x) < 0.5 && Math.abs(u.y - v.y) < 0.5;
  for (let i = 0; i < pts.length - 1; i++) {
    if ((eq(pts[i], a) && eq(pts[i + 1], b)) || (eq(pts[i], b) && eq(pts[i + 1], a))) {
      return i;
    }
  }
  return -1;
}

function endpointsOf(seg: unknown): [Point, Point] | null {
  const s = seg as { a?: Point; b?: Point; p1?: Point; p2?: Point } | Point[];
  if (Array.isArray(s) && s.length >= 2) {
    return [s[0], s[1]];
  }
  const o = s as { a?: Point; b?: Point; p1?: Point; p2?: Point };
  if (o?.a && o?.b) {
    return [o.a, o.b];
  }
  if (o?.p1 && o?.p2) {
    return [o.p1, o.p2];
  }
  return null;
}

export function repairRailProximityWhenIssuesImprove(
  layout: LayoutData,
  opts: { spacing?: number } = {}
): void {
  const spacing = opts.spacing ?? 10;
  let current = checkLayout(layout);

  const edgesById = new Map<string, EdgeLike>();
  for (const e of (layout.edges ?? []) as EdgeLike[]) {
    if (e?.id != null) {
      edgesById.set(String(e.id), e);
    }
  }

  let progressed = false;

  const tryTargets = (edge: EdgeLike, segIdx: number, targets: number[]): boolean => {
    const pts = edge.points;
    if (!Array.isArray(pts)) {
      return false;
    }
    for (const target of targets) {
      const undo = shiftRail(pts, segIdx, target);
      if (!undo) {
        return false;
      }
      const next = checkLayout(layout);
      const beforeKeys = new Set(current.issues.map(keyOf));
      const grewNewKey = next.issues.some((k) => !beforeKeys.has(keyOf(k)));
      if (next.issues.length < current.issues.length && !grewNewKey) {
        current = next;
        progressed = true;
        return true;
      }
      undo();
    }
    return false;
  };

  const repairParallelPair = (iss: IssueLike): void => {
    const d = iss.details as
      | { edgeIds?: (string | number)[]; gap?: number; segments?: unknown[] }
      | undefined;
    const ids = (d?.edgeIds ?? []).map(String);
    const segPair = d?.segments;
    if (ids.length !== 2 || !Array.isArray(segPair) || segPair.length !== 2) {
      return;
    }
    const sA = endpointsOf(segPair[0]);
    const sB = endpointsOf(segPair[1]);
    if (!sA || !sB) {
      return;
    }
    const rails: { edge: EdgeLike; idx: number; mine: [Point, Point]; other: [Point, Point] }[] =
      [];
    const eA = edgesById.get(ids[0]);
    const eB = edgesById.get(ids[1]);
    if (eA?.points) {
      const idx = findSegment(eA.points, sA[0], sA[1]);
      if (idx >= 0) {
        rails.push({ edge: eA, idx, mine: sA, other: sB });
      }
    }
    if (eB?.points) {
      const idx = findSegment(eB.points, sB[0], sB[1]);
      if (idx >= 0) {
        rails.push({ edge: eB, idx, mine: sB, other: sA });
      }
    }
    for (const r of rails) {
      const vertical = Math.abs(r.mine[0].x - r.mine[1].x) < 1e-6;
      const myCoord = vertical ? r.mine[0].x : r.mine[0].y;
      const otherCoord = vertical ? r.other[0].x : r.other[0].y;
      const away = myCoord >= otherCoord ? 1 : -1;
      // Minimal legal separation first (the validator wants >= 7): these
      // corridors are tight, and a full-spacing push was measured to land on
      // the neighbours (border-hugging one way, bend-near-endpoint the
      // other). Escalate only if the minimum fails.
      const targets = [
        otherCoord + away * 8,
        otherCoord + away * spacing,
        otherCoord + away * spacing * 1.5,
      ];
      if (tryTargets(r.edge, r.idx, targets)) {
        return;
      }
    }
  };

  const repairLabelCrossing = (iss: IssueLike): void => {
    const d = iss.details as
      | { ownerEdgeId?: string; segmentIndex?: number; a?: Point; b?: Point }
      | undefined;
    const owner = d?.ownerEdgeId != null ? edgesById.get(String(d.ownerEdgeId)) : undefined;
    const crossed = iss.edgeId != null ? edgesById.get(String(iss.edgeId)) : undefined;
    if (
      !owner ||
      !crossed ||
      !Array.isArray(crossed.points) ||
      d?.segmentIndex == null ||
      !Number.isFinite(owner.x) ||
      !Number.isFinite(owner.y) ||
      !Number.isFinite(owner.width) ||
      !Number.isFinite(owner.height)
    ) {
      return;
    }
    const i = d.segmentIndex;
    const pts = crossed.points;
    if (i < 0 || i + 1 >= pts.length) {
      return;
    }
    const p = pts[i];
    const q = pts[i + 1];
    const vertical = Math.abs(p.x - q.x) < 1e-6;
    const horizontal = Math.abs(p.y - q.y) < 1e-6;
    if (!vertical && !horizontal) {
      return;
    }
    const rect = {
      left: owner.x! - owner.width! / 2,
      right: owner.x! + owner.width! / 2,
      top: owner.y! - owner.height! / 2,
      bottom: owner.y! + owner.height! / 2,
    };
    const coordinate = vertical ? p.x : p.y;
    const lo = (vertical ? rect.left : rect.top) - 2;
    const hi = (vertical ? rect.right : rect.bottom) + 2;
    const sides = [hi, lo].sort((a, b) => Math.abs(a - coordinate) - Math.abs(b - coordinate));
    if (tryTargets(crossed, i, sides)) {
      return;
    }
    // The crossing segment is often TERMINAL (a 3-point route's last leg),
    // which shiftRail refuses because it carries a port. Detour instead: keep
    // both endpoints and insert a Z-jog that walks the route around the label.
    // A side just past the rect can land on a NEIGHBOUR label (measured:
    // L_fixPR's jog at rect.right+2 hit L_deps' label), so escalate outward.
    const along = vertical ? [p.y, q.y] : [p.x, q.x];
    const dir = along[1] >= along[0] ? 1 : -1;
    const entry = vertical ? (dir > 0 ? rect.top : rect.bottom) : dir > 0 ? rect.left : rect.right;
    const exit = vertical ? (dir > 0 ? rect.bottom : rect.top) : dir > 0 ? rect.right : rect.left;
    const enterAt = entry - dir * 2;
    const exitAt = exit + dir * 2;
    const within = (v: number) =>
      dir > 0 ? v > along[0] + 1 && v < along[1] - 1 : v < along[0] - 1 && v > along[1] + 1;
    if (!within(enterAt) || !within(exitAt)) {
      return;
    }
    const jogSides = [sides[0], sides[1], sides[0] + spacing, sides[1] - spacing];
    const ownerId = String(d.ownerEdgeId);
    for (const side of jogSides) {
      const jog: Point[] = vertical
        ? [
            { x: p.x, y: enterAt },
            { x: side, y: enterAt },
            { x: side, y: exitAt },
            { x: p.x, y: exitAt },
          ]
        : [
            { x: enterAt, y: p.y },
            { x: enterAt, y: side },
            { x: exitAt, y: side },
            { x: exitAt, y: p.y },
          ];
      const oldPoints = [...pts];
      pts.splice(i + 1, 0, ...jog);
      const next = checkLayout(layout);
      const beforeKeys = new Set(current.issues.map(keyOf));
      const newIssues = next.issues.filter((n) => !beforeKeys.has(keyOf(n)));
      const onlyShadowSwaps =
        newIssues.length > 0 &&
        newIssues.every(
          (n) =>
            n.type === 'edge-label-overlaps-foreign-edge' &&
            String((n.details as { ownerEdgeId?: string })?.ownerEdgeId) === ownerId
        );
      if (
        (next.issues.length < current.issues.length && newIssues.length === 0) ||
        (next.issues.length <= current.issues.length && onlyShadowSwaps)
      ) {
        current = next;
        progressed = true;
        return;
      }
      pts.length = 0;
      pts.push(...oldPoints);
    }
  };

  // Iterate to a fixed point over rounds: clearing one label crossing can reveal the same
  // label's overlap with a DIFFERENT edge (the validator reports one crossing
  // per label), and a successful shift can change which pairs are too close.
  for (let round = 0; round < 5; round++) {
    progressed = false;
    const offenders = current.issues.filter(
      (i) =>
        i.type === 'edge-parallel-segment-too-close' ||
        i.type === 'edge-label-overlaps-foreign-edge'
    );
    if (offenders.length === 0) {
      return;
    }
    for (const iss of offenders) {
      if (iss.type === 'edge-parallel-segment-too-close') {
        repairParallelPair(iss);
      } else {
        repairLabelCrossing(iss);
      }
    }
    if (!progressed) {
      return;
    }
  }
}
