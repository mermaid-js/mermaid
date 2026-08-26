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
  start?: string | number;
  end?: string | number;
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
  const nodesById = new Map<string, { x?: number; y?: number; width?: number; height?: number }>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodesById.set(String(n.id), n as never);
    }
  }

  let progressed = false;
  // Label crossings cleared this invocation, as `owner->crossed` pairs. Two
  // labels 0.8px apart let the rail oscillate between them — each equal-count
  // trade is valid for ITS target while re-creating the previous one. A
  // cleared pair may not come back.
  const clearedPairs = new Set<string>();

  const tryTargets = (
    edge: EdgeLike,
    segIdx: number,
    targets: number[],
    goalGone?: (issues: readonly IssueLike[]) => boolean
  ): boolean => {
    const pts = edge.points;
    if (!Array.isArray(pts)) {
      return false;
    }
    for (const target of targets) {
      // The edge's own overlay label rides the rail it is anchored on, or the
      // shift strands it (edge-label-off-edge kills every candidate).
      const p0 = pts[segIdx];
      const q0 = pts[segIdx + 1];
      const railVertical = Math.abs(p0.x - q0.x) < 1e-6;
      const labelOnRail =
        Number.isFinite(edge.x) &&
        Number.isFinite(edge.y) &&
        (railVertical
          ? Math.abs(edge.x! - p0.x) <= 1 &&
            edge.y! >= Math.min(p0.y, q0.y) - 1 &&
            edge.y! <= Math.max(p0.y, q0.y) + 1
          : Math.abs(edge.y! - p0.y) <= 1 &&
            edge.x! >= Math.min(p0.x, q0.x) - 1 &&
            edge.x! <= Math.max(p0.x, q0.x) + 1);
      const oldLabelX = edge.x;
      const oldLabelY = edge.y;
      const undo = shiftRail(pts, segIdx, target);
      if (undo && labelOnRail) {
        if (railVertical) {
          edge.x = target;
        } else {
          edge.y = target;
        }
      }
      if (!undo) {
        return false;
      }
      const next = checkLayout(layout);
      const beforeKeys = new Set(current.issues.map(keyOf));
      const grewNewKey = next.issues.some((k) => !beforeKeys.has(keyOf(k)));
      // Strictly fewer is always a win. Equal count with NO new keys is
      // accepted only when the caller's target issue is verifiably gone —
      // the validator reports one crossing per label, so clearing one
      // surfaces the label's next pre-existing crossing at equal count.
      const accepted =
        !grewNewKey &&
        (next.issues.length < current.issues.length ||
          (next.issues.length === current.issues.length && goalGone?.(next.issues) === true));
      if (accepted) {
        current = next;
        progressed = true;
        return true;
      }
      undo();
      edge.x = oldLabelX;
      edge.y = oldLabelY;
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
      // other). Escalate only if the minimum fails — and then try the FAR
      // side of the partner rail (a lane swap): rails have different spans,
      // so the space one rail cannot reach may be free for the other. On
      // triage2's Done corridor every same-side lane for the long rail is
      // blocked (border-hug at +10, an obstacle at +15) while the short
      // rail's swap lane is open.
      const targets = [
        otherCoord + away * 8,
        otherCoord + away * spacing,
        otherCoord + away * spacing * 1.5,
        // The corridor window can be narrower than 8 on both ends at once
        // (triage2: band floor 493.2, obstacle top ~504, two rails to fit) —
        // the minimal-legal rung, a hair over the validator's 7, is sometimes
        // the only rung inside the window.
        otherCoord + away * 7.2,
        otherCoord - away * 7.2,
        otherCoord - away * 8,
        otherCoord - away * spacing,
        otherCoord - away * spacing * 1.5,
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
    // In a saturated pocket the spot just past the label is usually taken by
    // the next neighbour (measured on triage2: a label at +2, a rail at +10);
    // escalate well past the local traffic before giving up.
    const shiftTargets = [
      ...sides,
      sides[0] + spacing,
      sides[0] + spacing * 3,
      sides[0] + spacing * 3.3,
      sides[0] + spacing * 3.6,
      sides[0] + spacing * 4.5,
      sides[1] - spacing,
      sides[1] - spacing * 3,
      sides[1] - spacing * 4.5,
    ];
    const ownerId2 = String(d.ownerEdgeId);
    const crossedId2 = String(iss.edgeId ?? '');
    const pairKey = (owner: string, crossedEdge: string): string => `${owner}->${crossedEdge}`;
    const thisCrossingGone = (issues: readonly IssueLike[]): boolean => {
      for (const n of issues) {
        if (n.type !== 'edge-label-overlaps-foreign-edge') {
          continue;
        }
        const nOwner = String((n.details as { ownerEdgeId?: string })?.ownerEdgeId);
        const nCrossed = String(n.edgeId ?? '');
        if (nOwner === ownerId2 && nCrossed === crossedId2) {
          return false; // target still present
        }
        if (clearedPairs.has(pairKey(nOwner, nCrossed))) {
          return false; // a previously-cleared crossing came back — cycle
        }
      }
      return true;
    };
    if (tryTargets(crossed, i, shiftTargets, thisCrossingGone)) {
      clearedPairs.add(pairKey(ownerId2, crossedId2));
      return;
    }
    // LAST RESORT for a shiftable rail with no free lane: the pocket is
    // saturated — on triage2 the chain was a label at +2, a rail at +10, a
    // parallel at +30, another label at +33, with under 1.1px between them.
    // No per-edge move can help when the region holds more content than
    // space, so MAKE space: insert a vertical whitespace strip (translate
    // every node, point and label right of a cut by the strip width — an
    // operation that preserves all relative geometry on each side and leaves
    // the strip empty by construction), then retry the shift into the strip.
    // The whole transaction is judged by the same monotone gate; on any
    // failure the strip is undone.
    if (i > 0 && i + 1 < pts.length - 1 && vertical) {
      const stripW = spacing * 2;
      for (const cutX of [hi + 1, hi + spacing * 3.05]) {
        const nodeStraddles = [...nodesById.values()].some(
          (n) => Number.isFinite(n.x) && Math.abs(n.x! - cutX) < (n.width ?? 0) / 2 + 1
        );
        if (nodeStraddles) {
          continue;
        }
        const movedNodes: { n: { x?: number }; old: number }[] = [];
        for (const n of nodesById.values()) {
          if (Number.isFinite(n.x) && n.x! >= cutX) {
            movedNodes.push({ n, old: n.x! });
            n.x = n.x! + stripW;
          }
        }
        const movedPts: { pt: Point; old: number }[] = [];
        const movedLabels: { e: EdgeLike; old: number }[] = [];
        for (const e2 of edgesById.values()) {
          for (const pt of e2.points ?? []) {
            if (pt.x >= cutX) {
              movedPts.push({ pt, old: pt.x });
              pt.x += stripW;
            }
          }
          if (Number.isFinite(e2.x) && e2.x! >= cutX) {
            movedLabels.push({ e: e2, old: e2.x! });
            e2.x = e2.x! + stripW;
          }
        }
        // The strip may have carried the rail itself; retry shifts into the
        // opened space, judged against the PRE-strip issue state.
        const stripTargets = [cutX + stripW / 2, cutX + stripW / 2 + 4, cutX + stripW / 2 - 4];
        if (tryTargets(crossed, i, stripTargets, thisCrossingGone)) {
          clearedPairs.add(pairKey(ownerId2, crossedId2));
          return;
        }
        for (const m of movedNodes) {
          m.n.x = m.old;
        }
        for (const m of movedPts) {
          m.pt.x = m.old;
        }
        for (const m of movedLabels) {
          m.e.x = m.old;
        }
      }
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

    // Z-REBUILD for a straight 2-point crossed edge. Such an edge cannot be
    // jogged in place: the `port-near-corner` waiver applies only to bendless
    // routes, so a jog on an edge whose port sits near a corner (triage2's
    // L_deps at t=0.88 on deps' bottom side) un-waives the port and every jog
    // candidate dies on that instead. The rebuild moves the START port toward
    // the middle of its side AND takes the clear column in one candidate:
    //   (px, y0) -> (px, my) -> (qx, my) -> (qx, y1)
    if (pts.length !== 2) {
      return;
    }
    const startNode = nodesById.get(String(crossed.start ?? ''));
    const endNode = nodesById.get(String(crossed.end ?? ''));
    if (
      !startNode ||
      !endNode ||
      !Number.isFinite(startNode.x) ||
      !Number.isFinite(endNode.x) ||
      !vertical
    ) {
      return;
    }
    const y0 = pts[0].y;
    const y1 = pts[pts.length - 1].y;
    const dirY = y1 >= y0 ? 1 : -1;
    const sHalf = (startNode.width ?? 0) / 2;
    const eHalf = (endNode.width ?? 0) / 2;
    const pxOptions = [startNode.x!, (startNode.x! + pts[0].x) / 2];
    const myOptions = [entry - dir * 2, y0 + dirY * 12];
    const oldPts2 = pts.map((pt) => ({ ...pt }));
    const oldLx = crossed.x;
    const oldLy = crossed.y;
    const qxOptions = [...jogSides, sides[0] + 4, sides[0] + 6, sides[1] - 4, sides[1] - 6];
    for (const qx of qxOptions) {
      if (Math.abs(qx - endNode.x!) > eHalf - 2) {
        continue; // the end port must stay on the end node's side
      }
      for (const px of pxOptions) {
        if (Math.abs(px - startNode.x!) > sHalf - 2) {
          continue;
        }
        for (const my of myOptions) {
          const between = dirY > 0 ? my > y0 + 1 && my < y1 - 1 : my < y0 - 1 && my > y1 + 1;
          if (!between) {
            continue;
          }
          pts.length = 0;
          pts.push({ x: px, y: y0 }, { x: px, y: my }, { x: qx, y: my }, { x: qx, y: y1 });
          // The edge's own overlay label must ride the rebuild or the
          // candidate dies on edge-label-off-edge. A single anchor spot can
          // itself land on a neighbour, so several positions along the new
          // polyline are tried before the geometry is given up.
          const anchorOptions: [number, number][] = Number.isFinite(crossed.x)
            ? [
                [px, (y0 + my) / 2],
                [(px + qx) / 2, my],
                [qx, (my + y1) / 2],
                [qx, my + (y1 - my) * 0.25],
                [qx, y1 - dirY * 16],
              ]
            : [[Number.NaN, Number.NaN]];
          let accepted2 = false;
          for (const [ax, ay] of anchorOptions) {
            if (Number.isFinite(ax)) {
              crossed.x = ax;
              crossed.y = ay;
            }
            const next2 = checkLayout(layout);
            const beforeKeys2 = new Set(current.issues.map(keyOf));
            const fresh2 = next2.issues.filter((n2) => !beforeKeys2.has(keyOf(n2)));
            // Only this edge's own label landing badly counts as recoverable
            // damage; any other fresh issue means the geometry itself is wrong.
            const onlyOwnLabel = fresh2.every(
              (n2) =>
                (n2.type === 'edge-label-overlaps-foreign-edge' &&
                  String((n2.details as { ownerEdgeId?: string })?.ownerEdgeId) ===
                    String(crossed.id ?? '')) ||
                (n2.type === 'edge-label-overlaps-own-arrowhead' &&
                  String(n2.edgeId ?? '') === String(crossed.id ?? '')) ||
                (n2.type === 'edge-label-overlaps-node' &&
                  String(n2.edgeId ?? '') === String(crossed.id ?? ''))
            );
            // Clean acceptance, or a REDUCING swap: strictly fewer issues
            // where the only fresh damage is this label's next crossing —
            // that crossing names a DIFFERENT edge whose rail the fixed-point
            // loop's next round can shift (the whole reason the swap reduces:
            // the old crossing sat on an unmovable 2-point straight, the new
            // one sits on a mid rail).
            if (
              next2.issues.length < current.issues.length &&
              (fresh2.length === 0 || onlyOwnLabel)
            ) {
              current = next2;
              progressed = true;
              accepted2 = true;
              break;
            }
            if (!onlyOwnLabel) {
              break;
            }
          }
          if (accepted2) {
            return;
          }
          pts.length = 0;
          pts.push(...oldPts2.map((pt) => ({ ...pt })));
          crossed.x = oldLx;
          crossed.y = oldLy;
        }
      }
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
