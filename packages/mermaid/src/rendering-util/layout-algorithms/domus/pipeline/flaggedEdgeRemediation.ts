/**
 * Score-gated, monotone flagged-edge remediation (finalize stage).
 *
 * Multi-defect invalid layouts (e.g. subgraph-variation: 5 issues across 3
 * edges) can't be repaired by the other score-gated passes, which keep a change
 * only when the WHOLE layout's score strictly improves — on a fixture stuck at
 * 0 a single-edge fix that leaves other issues stays at 0 and is reverted.
 *
 * This pass instead makes MONOTONE progress: for each edge the validator flags,
 * it tries a small library of clean candidate routes (a co-aligned straight, an
 * L, a Z through the gap, or — for a parallel-too-close pair — a rail shift) and
 * keeps the first that strictly REDUCES the validator's issue count while
 * introducing no new issue. Chipping one issue at a time converges an invalid
 * layout toward valid. It is safe by construction: a valid layout has no flagged
 * edges (the pass is a no-op), and a candidate that adds any issue is rejected,
 * so it can never regress a layout — only repair one.
 */
import type { LayoutData, Node } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';
import { validateLayout } from '../../layout-utils/validateLayout.js';
import { findRoutingGraphPathBetweenPorts } from '../core/routing.js';
import { findDirectCompoundRoute } from './directCompoundRoute.js';
import { ancestorGroupIds } from './groups.js';

interface Point {
  x: number;
  y: number;
}
type Rect = ReturnType<typeof rectForNode>;
type Side = 'N' | 'S' | 'E' | 'W';
interface Issue {
  type: string;
  message?: string;
  edgeId?: string;
  nodeIds?: string[];
  details?: { edgeIds?: string[] };
}

const EPS = 1e-6;
const MARGIN = 8;
const MAX_ROUNDS = 4;
const STUB = 20;
const OUTWARD: Record<Side, Point> = {
  N: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  E: { x: 1, y: 0 },
  W: { x: -1, y: 0 },
};

/** Stable identity for an issue: type + the elements it implicates. */
function issueKey(issue: Issue): string {
  const ids: string[] = [];
  if (issue.edgeId != null) {
    ids.push(String(issue.edgeId));
  }
  for (const id of issue.details?.edgeIds ?? []) {
    ids.push(String(id));
  }
  if (typeof issue.message === 'string') {
    for (const m of issue.message.matchAll(/"([^"]+)"/g)) {
      ids.push(m[1]);
    }
  }
  return `${issue.type}|${[...new Set(ids)].sort().join(',')}`;
}

/** Edge ids each issue implicates (structured fields + quoted message ids). */
function edgeIdsOfIssue(issue: Issue, knownEdgeIds: Set<string>): string[] {
  const ids = new Set<string>();
  if (issue.edgeId != null) {
    ids.add(String(issue.edgeId));
  }
  for (const id of issue.details?.edgeIds ?? []) {
    ids.add(String(id));
  }
  if (typeof issue.message === 'string') {
    for (const m of issue.message.matchAll(/"([^"]+)"/g)) {
      if (knownEdgeIds.has(m[1])) {
        ids.add(m[1]);
      }
    }
  }
  return [...ids];
}

function aligned(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) <= EPS || Math.abs(a.y - b.y) <= EPS;
}

/** A few sample coordinates spread across [lo, hi] (inset by MARGIN). */
function spread(lo: number, hi: number): number[] {
  const a = lo + MARGIN;
  const b = hi - MARGIN;
  if (b < a) {
    return [(lo + hi) / 2];
  }
  return [(a + b) / 2, a, b, a + (b - a) / 3, a + (2 * (b - a)) / 3];
}

/** Clean candidate routes for a flagged edge between its terminal nodes. */
function routeCandidates(
  ps: Point,
  pe: Point,
  rS: Rect | null,
  rE: Rect | null,
  parallel: boolean
): Point[][] {
  const out: Point[][] = [];

  // Keep both endpoints, give a clean middle.
  if (aligned(ps, pe)) {
    out.push([{ ...ps }, { ...pe }]);
  }
  out.push([{ ...ps }, { x: ps.x, y: pe.y }, { ...pe }]);
  out.push([{ ...ps }, { x: pe.x, y: ps.y }, { ...pe }]);
  // Z routes via a mid-rail, plus rails spread through the inter-node gap.
  const railXs = [(ps.x + pe.x) / 2];
  const railYs = [(ps.y + pe.y) / 2];
  if (rS && rE) {
    const gapLo = Math.min(rS.right, rE.right);
    const gapHi = Math.max(rS.left, rE.left);
    if (gapHi > gapLo) {
      railXs.push(...spread(gapLo, gapHi));
    }
    const gapTop = Math.min(rS.bottom, rE.bottom);
    const gapBot = Math.max(rS.top, rE.top);
    if (gapBot > gapTop) {
      railYs.push(...spread(gapTop, gapBot));
    }
  }
  for (const rx of railXs) {
    out.push([{ ...ps }, { x: rx, y: ps.y }, { x: rx, y: pe.y }, { ...pe }]);
  }
  for (const ry of railYs) {
    out.push([{ ...ps }, { x: ps.x, y: ry }, { x: pe.x, y: ry }, { ...pe }]);
  }

  // Co-aligned straight when the terminal nodes' facing sides overlap.
  if (rS && rE) {
    const ox = Math.max(rS.left, rE.left);
    const oxHi = Math.min(rS.right, rE.right);
    if (oxHi > ox) {
      if (rS.bottom <= rE.top + 1) {
        for (const x of spread(ox, oxHi)) {
          out.push([
            { x, y: rS.bottom },
            { x, y: rE.top },
          ]);
        }
      } else if (rE.bottom <= rS.top + 1) {
        for (const x of spread(ox, oxHi)) {
          out.push([
            { x, y: rS.top },
            { x, y: rE.bottom },
          ]);
        }
      }
    }
    const oy = Math.max(rS.top, rE.top);
    const oyHi = Math.min(rS.bottom, rE.bottom);
    if (oyHi > oy) {
      if (rS.right <= rE.left + 1) {
        for (const y of spread(oy, oyHi)) {
          out.push([
            { x: rS.right, y },
            { x: rE.left, y },
          ]);
        }
      } else if (rE.right <= rS.left + 1) {
        for (const y of spread(oy, oyHi)) {
          out.push([
            { x: rS.left, y },
            { x: rE.right, y },
          ]);
        }
      }
    }
  }

  // Parallel-too-close: shift the existing interior rails perpendicular.
  if (parallel) {
    return out; // handled by railShiftCandidates on the original polyline
  }
  return out;
}

/** Shift each interior rail of an existing polyline perpendicular by ±offsets. */
function railShiftCandidates(pts: Point[]): Point[][] {
  const out: Point[][] = [];
  const offsets = [7, -7, 10, -10, 14, -14];
  for (let i = 1; i < pts.length - 2; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const isV = Math.abs(a.x - b.x) <= EPS && Math.abs(a.y - b.y) > EPS;
    const isH = Math.abs(a.y - b.y) <= EPS && Math.abs(a.x - b.x) > EPS;
    if (!isV && !isH) {
      continue;
    }
    for (const d of offsets) {
      const next = pts.map((p) => ({ ...p }));
      if (isV) {
        next[i].x += d;
        next[i + 1].x += d;
      } else {
        next[i].y += d;
        next[i + 1].y += d;
      }
      out.push(next);
    }
  }
  return out;
}

/**
 * Re-attach a detached terminal: keep the route, replace the loose end with
 * an orthogonal L into the nearest border point of the terminal node. The
 * generic candidates reuse the CURRENT terminal points, so a detached
 * endpoint can never heal without this.
 */
function reattachEndCandidates(pts: Point[], rE: Rect): Point[][] {
  const out: Point[][] = [];
  if (pts.length < 2) {
    return out;
  }
  const end = pts[pts.length - 1];
  const clampX = Math.max(rE.left + MARGIN, Math.min(rE.right - MARGIN, end.x));
  const clampY = Math.max(rE.top + MARGIN, Math.min(rE.bottom - MARGIN, end.y));
  const head = pts.slice(0, -1).map((p) => ({ ...p }));
  // Vertical entry through N or S at a clamped x.
  out.push([
    ...head,
    { ...end },
    { x: clampX, y: end.y },
    { x: clampX, y: end.y < rE.cy ? rE.top : rE.bottom },
  ]);
  // Horizontal entry through W or E at a clamped y.
  out.push([
    ...head,
    { ...end },
    { x: end.x, y: clampY },
    { x: end.x < rE.cx ? rE.left : rE.right, y: clampY },
  ]);
  return out;
}

/**
 * Shift an interior rail segment that cuts through a known obstacle to just
 * past that obstacle's near side (the generic rail shifts only try small
 * fixed deltas and never clear a wide box).
 */
function obstacleClearingRailShifts(
  pts: Point[],
  obstacle: Rect,
  rS: Rect | null,
  rE: Rect | null
): Point[][] {
  const out: Point[][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const isFirst = i === 0;
    const isLast = i === pts.length - 2;
    const horizontal = Math.abs(a.y - b.y) <= EPS;
    const vertical = Math.abs(a.x - b.x) <= EPS;
    if (horizontal) {
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      if (
        a.y > obstacle.top &&
        a.y < obstacle.bottom &&
        minX < obstacle.right &&
        maxX > obstacle.left
      ) {
        for (const newY of [
          obstacle.top - 24,
          obstacle.bottom + 24,
          obstacle.top - 36,
          obstacle.bottom + 36,
          obstacle.top - 12,
          obstacle.bottom + 12,
        ]) {
          // A terminal segment may slide only while its endpoint stays on the
          // same border side of the terminal node.
          if (isFirst && rS && (newY < rS.top + 2 || newY > rS.bottom - 2)) {
            continue;
          }
          if (isLast && rE && (newY < rE.top + 2 || newY > rE.bottom - 2)) {
            continue;
          }
          const cand = pts.map((p) => ({ ...p }));
          cand[i] = { x: a.x, y: newY };
          cand[i + 1] = { x: b.x, y: newY };
          out.push(cand);
        }
      }
    } else if (vertical) {
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      if (
        a.x > obstacle.left &&
        a.x < obstacle.right &&
        minY < obstacle.bottom &&
        maxY > obstacle.top
      ) {
        for (const newX of [
          obstacle.left - 24,
          obstacle.right + 24,
          obstacle.left - 36,
          obstacle.right + 36,
          obstacle.left - 12,
          obstacle.right + 12,
        ]) {
          if (isFirst && rS && (newX < rS.left + 2 || newX > rS.right - 2)) {
            continue;
          }
          if (isLast && rE && (newX < rE.left + 2 || newX > rE.right - 2)) {
            continue;
          }
          const cand = pts.map((p) => ({ ...p }));
          cand[i] = { x: newX, y: a.y };
          cand[i + 1] = { x: newX, y: b.y };
          out.push(cand);
        }
      }
    }
  }
  return out;
}

/**
 * Cheap local pre-check: a candidate whose segment cuts a leaf node's strict
 * interior can never be accepted (edge-intersects-obstacle is hard), and the
 * full `validateLayout` per candidate is O(E^2). Group frames are crossable.
 */
function candidateCutsLeafInterior(
  candidate: Point[],
  nodeById: Map<string, Node>,
  startId: string,
  endId: string
): boolean {
  for (const [id, n] of nodeById) {
    if (id === startId || id === endId || (n as { isGroup?: boolean }).isGroup) {
      continue;
    }
    const r = rectForNode(n);
    for (let i = 0; i < candidate.length - 1; i++) {
      const a = candidate[i];
      const b = candidate[i + 1];
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      if (minX < r.right - 1 && maxX > r.left + 1 && minY < r.bottom - 1 && maxY > r.top + 1) {
        return true;
      }
    }
  }
  return false;
}

function sidePort(r: Rect, side: Side, t: number): Point {
  const clamped = Math.max(0, Math.min(1, t));
  if (side === 'N' || side === 'S') {
    return { x: r.left + (r.right - r.left) * clamped, y: side === 'N' ? r.top : r.bottom };
  }
  return { x: side === 'W' ? r.left : r.right, y: r.top + (r.bottom - r.top) * clamped };
}

function sidePreference(rS: Rect, rE: Rect): [Side, Side][] {
  const dx = rE.cx - rS.cx;
  const dy = rE.cy - rS.cy;
  const primary: [Side, Side] =
    Math.abs(dx) > Math.abs(dy)
      ? dx >= 0
        ? ['E', 'W']
        : ['W', 'E']
      : dy >= 0
        ? ['S', 'N']
        : ['N', 'S'];
  const secondary: [Side, Side] =
    Math.abs(dx) > Math.abs(dy)
      ? dy >= 0
        ? ['S', 'N']
        : ['N', 'S']
      : dx >= 0
        ? ['E', 'W']
        : ['W', 'E'];
  // Opposite-side pairs first, then perpendicular combinations — narrow
  // alleys (the endpoint-band rule needs 18px on BOTH sides) often admit only
  // an exit on one axis and an entry on the other.
  const perpendicular: [Side, Side][] =
    Math.abs(dx) > Math.abs(dy)
      ? dy >= 0
        ? [
            [primary[0], 'N'],
            ['S', primary[1]],
          ]
        : [
            [primary[0], 'S'],
            ['N', primary[1]],
          ]
      : dx >= 0
        ? [
            [primary[0], 'W'],
            ['E', primary[1]],
          ]
        : [
            [primary[0], 'E'],
            ['W', primary[1]],
          ];
  return [primary, secondary, ...perpendicular, ['N', 'S'], ['S', 'N'], ['E', 'W'], ['W', 'E']];
}

function sideRouteCandidates(
  rS: Rect,
  rE: Rect,
  nodeById: Map<string, Node>,
  startId: string,
  endId: string
): Point[][] {
  const out: Point[][] = [];
  const seen = new Set<string>();

  // The router must not treat the endpoints' OWN group frames as obstacles —
  // for any intra-group edge the stubs sit inside those rects and every
  // search returns null, leaving only the degenerate straight-stub routes
  // (tree-path rule, same as the compound routing).
  const sNode = nodeById.get(startId);
  const eNode = nodeById.get(endId);
  const chainGroups = new Set<string>([
    ...(sNode ? ancestorGroupIds(sNode, nodeById) : []),
    ...(eNode ? ancestorGroupIds(eNode, nodeById) : []),
  ]);
  const routerNodes = new Map<string, Node>();
  for (const [id, n] of nodeById) {
    if ((n as { isGroup?: boolean }).isGroup && chainGroups.has(id)) {
      continue;
    }
    routerNodes.set(id, n);
  }

  for (const [startSide, endSide] of sidePreference(rS, rE)) {
    const startHoriz = startSide === 'N' || startSide === 'S';
    const endHoriz = endSide === 'N' || endSide === 'S';
    const startTs = startHoriz
      ? [(rE.cx - rS.left) / (rS.right - rS.left), 0.5, 0.25, 0.75]
      : [(rE.cy - rS.top) / (rS.bottom - rS.top), 0.5, 0.25, 0.75];
    const endTs = endHoriz
      ? [(rS.cx - rE.left) / (rE.right - rE.left), 0.5, 0.25, 0.75]
      : [(rS.cy - rE.top) / (rE.bottom - rE.top), 0.5, 0.25, 0.75];

    for (const st of startTs) {
      const ps = sidePort(rS, startSide, st);
      const ds = OUTWARD[startSide];
      const startStub = { x: ps.x + ds.x * STUB, y: ps.y + ds.y * STUB };
      for (const et of endTs) {
        const pe = sidePort(rE, endSide, et);
        const de = OUTWARD[endSide];
        const endStub = { x: pe.x + de.x * STUB, y: pe.y + de.y * STUB };
        const mid = findRoutingGraphPathBetweenPorts(
          startStub,
          endStub,
          routerNodes,
          startId,
          endId,
          10,
          { model: 'channels', clearance: 8 }
        );
        const routes: Point[][] = [];
        if (mid && mid.length >= 2) {
          // The router snaps the stub endpoints to its grid, so the joints
          // ps->mid[0] and mid[-1]->pe are often slightly off-axis; stitch
          // them orthogonally or the candidate self-defeats on
          // corner-connection / non-orthogonal checks.
          const raw = [{ ...ps }, ...mid.map((p) => ({ ...p })), { ...pe }];
          const stitched: Point[] = [raw[0]];
          for (let ri = 1; ri < raw.length; ri++) {
            const prev = stitched[stitched.length - 1];
            const cur = raw[ri];
            if (Math.abs(prev.x - cur.x) > EPS && Math.abs(prev.y - cur.y) > EPS) {
              if (startHoriz && ri === 1) {
                stitched.push({ x: cur.x, y: prev.y });
              } else {
                stitched.push({ x: prev.x, y: cur.y });
              }
            }
            stitched.push(cur);
          }
          routes.push(stitched);
        }
        if (Math.abs(startStub.x - endStub.x) <= EPS || Math.abs(startStub.y - endStub.y) <= EPS) {
          routes.push([{ ...ps }, { ...startStub }, { ...endStub }, { ...pe }]);
        }
        for (const route of routes) {
          const key = route
            .map((p) => `${Math.round(p.x * 10) / 10},${Math.round(p.y * 10) / 10}`)
            .join('|');
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          out.push(route);
        }
      }
    }
  }
  return out;
}

function labelAnchors(pts: Point[]): Point[] {
  const anchors: { x: number; y: number; len: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    for (const t of [0.5, 0.35, 0.65, 0.25, 0.75]) {
      anchors.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, len });
    }
  }
  anchors.sort((a, b) => b.len - a.len);
  return anchors.map(({ x, y }) => ({ x, y }));
}

export function remediateFlaggedEdgesWhenMonotone(layout: LayoutData): void {
  let current = validateLayout(layout);
  if (current.ok) {
    return;
  }

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodeById.set(String(n.id), n);
    }
  }
  const edges = (layout.edges ?? []) as {
    id?: string;
    start?: string;
    end?: string;
    points?: Point[];
    x?: number;
    y?: number;
    label?: unknown;
  }[];
  const knownEdgeIds = new Set(edges.map((e) => String(e?.id)).filter((id) => id !== 'undefined'));

  for (let round = 0; round < MAX_ROUNDS; round++) {
    if (current.ok) {
      return;
    }
    // Map each flagged edge to the issue types it is involved in.
    const flagged = new Map<string, Set<string>>();
    const obstacleIdsByEdge = new Map<string, Set<string>>();
    for (const issue of current.issues as Issue[]) {
      for (const id of edgeIdsOfIssue(issue, knownEdgeIds)) {
        const set = flagged.get(id) ?? new Set<string>();
        set.add(issue.type);
        flagged.set(id, set);
        if (issue.type === 'edge-intersects-obstacle') {
          const obs = obstacleIdsByEdge.get(id) ?? new Set<string>();
          for (const nid of issue.nodeIds ?? []) {
            obs.add(String(nid));
          }
          obstacleIdsByEdge.set(id, obs);
        }
      }
    }
    if (flagged.size === 0) {
      return;
    }

    let improvedThisRound = false;
    for (const [edgeId, types] of flagged) {
      const e = edges.find((x) => String(x?.id) === edgeId);
      const pts = e?.points;
      if (!Array.isArray(pts) || pts.length < 2) {
        continue;
      }
      const ps = pts[0];
      const pe = pts[pts.length - 1];
      const rS =
        e?.start != null && nodeById.has(String(e.start))
          ? rectForNode(nodeById.get(String(e.start))!)
          : null;
      const rE =
        e?.end != null && nodeById.has(String(e.end))
          ? rectForNode(nodeById.get(String(e.end))!)
          : null;
      const parallel = types.has('edge-parallel-segment-too-close');

      const candidates = [...routeCandidates(ps, pe, rS, rE, parallel)];
      if (rE && types.has('edge-endpoint-detached-from-node')) {
        candidates.unshift(...reattachEndCandidates(pts, rE));
      }
      if (types.has('edge-intersects-obstacle')) {
        for (const obstacleId of obstacleIdsByEdge.get(edgeId) ?? []) {
          const obstacleNode = nodeById.get(obstacleId);
          if (obstacleNode) {
            candidates.unshift(
              ...obstacleClearingRailShifts(pts, rectForNode(obstacleNode), rS, rE)
            );
          }
        }
      }
      if (rS && rE && e?.start != null && e?.end != null) {
        // Compound-aware direct reroutes: the plain candidates below treat
        // every group frame as a hard obstacle, so a cross-group edge can
        // never be repaired by them. The direct compound search excludes the
        // ancestry-chain frames (tree-path rule) and stays inside the common
        // ancestors, exactly like the primary compound routing.
        const sNode = nodeById.get(String(e.start));
        const eNode = nodeById.get(String(e.end));
        if (sNode && eNode) {
          for (const [sSide, eSide] of sidePreference(rS, rE).slice(0, 3)) {
            const sHoriz = sSide === 'N' || sSide === 'S';
            const eHoriz = eSide === 'N' || eSide === 'S';
            const sT = sHoriz
              ? (rE.cx - rS.left) / (rS.right - rS.left)
              : (rE.cy - rS.top) / (rS.bottom - rS.top);
            const eT = eHoriz
              ? (rS.cx - rE.left) / (rE.right - rE.left)
              : (rS.cy - rE.top) / (rE.bottom - rE.top);
            for (const [st, et] of [
              [sT, eT],
              [0.5, 0.5],
            ]) {
              const compoundRoute = findDirectCompoundRoute({
                startNode: sNode,
                endNode: eNode,
                startPort: sidePort(rS, sSide, st),
                endPort: sidePort(rE, eSide, et),
                nodesById: nodeById,
                spacing: 10,
                clearance: 8,
                model: 'channels',
              });
              if (compoundRoute && compoundRoute.length >= 2) {
                candidates.push(compoundRoute.map((p) => ({ ...p })));
              }
            }
          }
        }
        candidates.push(...sideRouteCandidates(rS, rE, nodeById, String(e.start), String(e.end)));
      }
      if (parallel) {
        candidates.push(...railShiftCandidates(pts));
      }

      const curKeys = new Set((current.issues as Issue[]).map(issueKey));
      const old = e!.points;
      const oldX = e!.x;
      const oldY = e!.y;
      const hasLabel = e!.label != null && Number.isFinite(e!.x) && Number.isFinite(e!.y);
      const hardReroute =
        types.has('edge-intersects-obstacle') ||
        types.has('edge-port-direction-mismatch') ||
        types.has('edge-non-orthogonal') ||
        types.has('edge-endpoint-detached-from-node');
      for (const candidate of candidates) {
        if (!hardReroute && candidate.length >= old!.length + 2) {
          continue; // don't trade a defect for a much longer route
        }
        if (hardReroute && candidate.length > old!.length + 5) {
          continue;
        }
        if (
          e?.start != null &&
          e?.end != null &&
          candidateCutsLeafInterior(candidate, nodeById, String(e.start), String(e.end))
        ) {
          continue;
        }
        e!.points = candidate;
        const anchors = hasLabel ? labelAnchors(candidate) : [{ x: oldX ?? 0, y: oldY ?? 0 }];
        let accepted = false;
        for (const anchor of anchors) {
          if (hasLabel) {
            e!.x = anchor.x;
            e!.y = anchor.y;
          }
          const next = validateLayout(layout);
          const fewer = next.issues.length < current.issues.length;
          const noNew = (next.issues as Issue[]).every((iss) => curKeys.has(issueKey(iss)));
          if (fewer && noNew) {
            current = next;
            improvedThisRound = true;
            accepted = true;
            break;
          }
        }
        if (accepted) {
          break;
        }
        e!.points = old;
        e!.x = oldX;
        e!.y = oldY;
      }
    }
    if (!improvedThisRound) {
      return;
    }
  }
}

/**
 * Monotone bend reduction for pathological routes (8+ polyline points, i.e.
 * the exponential tier of the bend penalty). The score-gated simplifiers are
 * dormant while the score is clamped at 0, so this pass accepts on a strict
 * per-edge POINT-COUNT decrease instead: a candidate is kept when it is
 * strictly shorter (in points), introduces no new issue key, and does not
 * grow the total issue count. Runs after issue remediation; a clean, already
 * simple layout is a no-op.
 */
export function simplifyPathologicalRoutesWhenMonotone(layout: LayoutData): void {
  const MIN_POINTS = 8;
  let current = validateLayout(layout);

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodeById.set(String(n.id), n);
    }
  }
  const edges = (layout.edges ?? []) as {
    id?: string;
    start?: string;
    end?: string;
    points?: Point[];
    x?: number;
    y?: number;
    label?: unknown;
  }[];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    let improvedThisRound = false;
    const fat = edges
      .filter((e) => Array.isArray(e.points) && e.points.length >= MIN_POINTS)
      .sort((a, b) => (b.points?.length ?? 0) - (a.points?.length ?? 0));
    if (fat.length === 0) {
      return;
    }

    for (const e of fat) {
      const pts = e.points!;
      const ps = pts[0];
      const pe = pts[pts.length - 1];
      const rS =
        e.start != null && nodeById.has(String(e.start))
          ? rectForNode(nodeById.get(String(e.start))!)
          : null;
      const rE =
        e.end != null && nodeById.has(String(e.end))
          ? rectForNode(nodeById.get(String(e.end))!)
          : null;

      const candidates = [...routeCandidates(ps, pe, rS, rE, false)];
      if (rS && rE && e.start != null && e.end != null) {
        const sNode = nodeById.get(String(e.start));
        const eNode = nodeById.get(String(e.end));
        if (sNode && eNode) {
          for (const [sSide, eSide] of sidePreference(rS, rE).slice(0, 3)) {
            const sHoriz = sSide === 'N' || sSide === 'S';
            const eHoriz = eSide === 'N' || eSide === 'S';
            const sT = sHoriz
              ? (rE.cx - rS.left) / (rS.right - rS.left)
              : (rE.cy - rS.top) / (rS.bottom - rS.top);
            const eT = eHoriz
              ? (rS.cx - rE.left) / (rE.right - rE.left)
              : (rS.cy - rE.top) / (rE.bottom - rE.top);
            const compoundRoute = findDirectCompoundRoute({
              startNode: sNode,
              endNode: eNode,
              startPort: sidePort(rS, sSide, sT),
              endPort: sidePort(rE, eSide, eT),
              nodesById: nodeById,
              spacing: 10,
              clearance: 8,
              model: 'channels',
            });
            if (compoundRoute && compoundRoute.length >= 2) {
              candidates.push(compoundRoute.map((p) => ({ ...p })));
            }
          }
        }
        candidates.push(...sideRouteCandidates(rS, rE, nodeById, String(e.start), String(e.end)));
      }

      const curKeys = new Set((current.issues as Issue[]).map(issueKey));
      const old = e.points;
      const oldX = e.x;
      const oldY = e.y;
      const hasLabel = e.label != null && Number.isFinite(e.x) && Number.isFinite(e.y);
      for (const candidate of candidates) {
        if (candidate.length >= old!.length) {
          continue; // must strictly simplify
        }
        if (
          e.start != null &&
          e.end != null &&
          candidateCutsLeafInterior(candidate, nodeById, String(e.start), String(e.end))
        ) {
          continue;
        }
        e.points = candidate;
        const anchors = hasLabel ? labelAnchors(candidate) : [{ x: oldX ?? 0, y: oldY ?? 0 }];
        let accepted = false;
        for (const anchor of anchors) {
          if (hasLabel) {
            e.x = anchor.x;
            e.y = anchor.y;
          }
          const next = validateLayout(layout);
          const notWorse = next.issues.length <= current.issues.length;
          const noNew = (next.issues as Issue[]).every((iss) => curKeys.has(issueKey(iss)));
          if (notWorse && noNew) {
            current = next;
            improvedThisRound = true;
            accepted = true;
            break;
          }
        }
        if (accepted) {
          break;
        }
        e.points = old;
        e.x = oldX;
        e.y = oldY;
      }
    }
    if (!improvedThisRound) {
      return;
    }
  }
}

function segmentsCross(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const d = (p: Point, q: Point, r: Point) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = d(b1, b2, a1);
  const d2 = d(b1, b2, a2);
  const d3 = d(a1, a2, b1);
  const d4 = d(a1, a2, b2);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/**
 * Score-gated rerouting of the layout's worst crossing offenders. Only
 * meaningful once the score is un-clamped (a strictly better validator score
 * is the acceptance), so it complements the monotone passes above: they get
 * the layout valid and past the 0-clamp, this one spends the remaining
 * crossing budget. No-op on layouts scoring 0 or with no crossing-heavy edge.
 */
export function rerouteTopCrossersWhenScoreImproves(layout: LayoutData): void {
  let current = validateLayout(layout);
  if (!current.ok || current.score <= 0 || current.breakdown.crossings === 0) {
    return;
  }

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodeById.set(String(n.id), n);
    }
  }
  const edges = (layout.edges ?? []) as {
    id?: string;
    start?: string;
    end?: string;
    points?: Point[];
    x?: number;
    y?: number;
    label?: unknown;
  }[];

  const crossingCounts = (): Map<string, number> => {
    const counts = new Map<string, number>();
    const routed = edges.filter((e) => (e.points?.length ?? 0) >= 2);
    for (let i = 0; i < routed.length; i++) {
      for (let j = i + 1; j < routed.length; j++) {
        const A = routed[i].points!;
        const B = routed[j].points!;
        for (let ai = 0; ai < A.length - 1; ai++) {
          for (let bi = 0; bi < B.length - 1; bi++) {
            if (segmentsCross(A[ai], A[ai + 1], B[bi], B[bi + 1])) {
              counts.set(String(routed[i].id), (counts.get(String(routed[i].id)) ?? 0) + 1);
              counts.set(String(routed[j].id), (counts.get(String(routed[j].id)) ?? 0) + 1);
            }
          }
        }
      }
    }
    return counts;
  };

  // Hard budget on full-layout validations — this pass runs inside the
  // per-fixture DDLT timeout (120s) and each validation is O(E^2).
  let evaluations = 0;
  const EVAL_BUDGET = 600;
  for (let round = 0; round < 8; round++) {
    const counts = crossingCounts();
    const targets = [...counts.entries()]
      .filter(([, c]) => c >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([id]) => id);
    if (targets.length === 0) {
      return;
    }

    let improvedThisRound = false;
    for (const edgeId of targets) {
      const e = edges.find((x) => String(x?.id) === edgeId);
      const pts = e?.points;
      if (!e || !Array.isArray(pts) || pts.length < 2) {
        continue;
      }
      const ps = pts[0];
      const pe = pts[pts.length - 1];
      const rS =
        e.start != null && nodeById.has(String(e.start))
          ? rectForNode(nodeById.get(String(e.start))!)
          : null;
      const rE =
        e.end != null && nodeById.has(String(e.end))
          ? rectForNode(nodeById.get(String(e.end))!)
          : null;

      const candidates = [...routeCandidates(ps, pe, rS, rE, false)];
      if (rS && rE && e.start != null && e.end != null) {
        const sNode = nodeById.get(String(e.start));
        const eNode = nodeById.get(String(e.end));
        if (sNode && eNode) {
          // Soft crossing avoidance: the graph search pays 40 length units
          // per crossing against the other routed edges, so it detours
          // around them wherever a corridor exists.
          const avoid = {
            segments: edges
              .filter((o) => o !== e && Array.isArray(o.points) && o.points.length >= 2)
              .map((o) => o.points!),
            costPerCrossing: 40,
          };
          for (const [sSide, eSide] of sidePreference(rS, rE)) {
            const sHoriz = sSide === 'N' || sSide === 'S';
            const eHoriz = eSide === 'N' || eSide === 'S';
            const sT = sHoriz
              ? (rE.cx - rS.left) / (rS.right - rS.left)
              : (rE.cy - rS.top) / (rS.bottom - rS.top);
            const eT = eHoriz
              ? (rS.cx - rE.left) / (rE.right - rE.left)
              : (rS.cy - rE.top) / (rE.bottom - rE.top);
            for (const [st, et] of [
              [sT, eT],
              [0.5, 0.5],
            ]) {
              const compoundRoute = findDirectCompoundRoute({
                startNode: sNode,
                endNode: eNode,
                startPort: sidePort(rS, sSide, st),
                endPort: sidePort(rE, eSide, et),
                nodesById: nodeById,
                spacing: 10,
                clearance: 8,
                model: 'channels',
                avoid,
              });
              if (compoundRoute && compoundRoute.length >= 2) {
                candidates.push(compoundRoute.map((p) => ({ ...p })));
              }
            }
          }
        }
        candidates.push(...sideRouteCandidates(rS, rE, nodeById, String(e.start), String(e.end)));
      }

      const old = e.points;
      const oldX = e.x;
      const oldY = e.y;
      const hasLabel = e.label != null && Number.isFinite(e.x) && Number.isFinite(e.y);

      for (const candidate of candidates) {
        if (
          e.start != null &&
          e.end != null &&
          candidateCutsLeafInterior(candidate, nodeById, String(e.start), String(e.end))
        ) {
          continue;
        }
        e.points = candidate;
        const anchors = hasLabel ? labelAnchors(candidate) : [{ x: oldX ?? 0, y: oldY ?? 0 }];
        let accepted = false;
        for (const anchor of anchors) {
          if (hasLabel) {
            e.x = anchor.x;
            e.y = anchor.y;
          }
          if (evaluations >= EVAL_BUDGET) {
            e.points = old;
            e.x = oldX;
            e.y = oldY;
            return;
          }
          evaluations++;
          const next = validateLayout(layout);
          if (next.ok && next.score > current.score) {
            current = next;
            improvedThisRound = true;
            accepted = true;
            break;
          }
        }
        if (accepted) {
          break;
        }
        e.points = old;
        e.x = oldX;
        e.y = oldY;
      }
    }
    if (!improvedThisRound) {
      return;
    }
  }
}

/**
 * Sink/source port-fan permutation. When several edges attach to one side of
 * a shared node (nodes that draw 5-8 edges each), ports allocated in
 * arrival order guarantee pairwise crossings whenever the far endpoints are
 * ordered differently. Reordering the whole fan by far-endpoint position and
 * rerouting it is a TRANSACTION — no single-edge move can realise it, which
 * is exactly where the per-edge passes converge. Accepted only when the full
 * validator score strictly improves.
 */
export function reorderPortFansWhenScoreImproves(layout: LayoutData): void {
  let current = validateLayout(layout);
  if (!current.ok || current.score <= 0) {
    return;
  }

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null && !(n as { isGroup?: boolean }).isGroup) {
      nodeById.set(String(n.id), n);
    }
  }
  const allNodes = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      allNodes.set(String(n.id), n);
    }
  }
  const edges = (layout.edges ?? []) as {
    id?: string;
    start?: string;
    end?: string;
    points?: Point[];
    x?: number;
    y?: number;
    label?: unknown;
  }[];

  const sideOfPointOnRect = (p: Point, r: Rect): Side | null => {
    const eps = 2;
    if (Math.abs(p.y - r.top) <= eps && p.x >= r.left - eps && p.x <= r.right + eps) {
      return 'N';
    }
    if (Math.abs(p.y - r.bottom) <= eps && p.x >= r.left - eps && p.x <= r.right + eps) {
      return 'S';
    }
    if (Math.abs(p.x - r.left) <= eps && p.y >= r.top - eps && p.y <= r.bottom + eps) {
      return 'W';
    }
    if (Math.abs(p.x - r.right) <= eps && p.y >= r.top - eps && p.y <= r.bottom + eps) {
      return 'E';
    }
    return null;
  };

  interface FanMember {
    edge: (typeof edges)[number];
    /** 'start' when the fan side is the edge's first point. */
    attach: 'start' | 'end';
    farCoord: number;
  }

  for (let round = 0; round < 2; round++) {
    // Group edge terminals by (node, side).
    const fans = new Map<string, FanMember[]>();
    for (const e of edges) {
      const pts = e.points;
      if (!Array.isArray(pts) || pts.length < 2) {
        continue;
      }
      for (const attach of ['start', 'end'] as const) {
        const nodeId = attach === 'start' ? e.start : e.end;
        if (nodeId == null || !nodeById.has(String(nodeId))) {
          continue;
        }
        const node = nodeById.get(String(nodeId))!;
        const r = rectForNode(node);
        const p = attach === 'start' ? pts[0] : pts[pts.length - 1];
        const side = sideOfPointOnRect(p, r);
        if (!side) {
          continue;
        }
        const far = attach === 'start' ? pts[pts.length - 1] : pts[0];
        const farCoord = side === 'N' || side === 'S' ? far.x : far.y;
        const key = `${String(nodeId)}|${side}`;
        const arr = fans.get(key) ?? [];
        arr.push({ edge: e, attach, farCoord });
        fans.set(key, arr);
      }
    }

    let improvedThisRound = false;
    for (const [key, members] of fans) {
      if (members.length < 3) {
        continue;
      }
      const [nodeId, side] = key.split('|') as [string, Side];
      const node = nodeById.get(nodeId)!;
      const r = rectForNode(node);

      // Current port order along the side vs far-endpoint order.
      const portCoord = (m: FanMember): number => {
        const pts = m.edge.points!;
        const p = m.attach === 'start' ? pts[0] : pts[pts.length - 1];
        return side === 'N' || side === 'S' ? p.x : p.y;
      };
      const byPort = [...members].sort((a, b) => portCoord(a) - portCoord(b));
      const byFar = [...members].sort((a, b) => a.farCoord - b.farCoord);
      const alreadyOrdered = byPort.every((m, i) => m === byFar[i]);
      if (alreadyOrdered) {
        continue;
      }

      // Transaction: assign evenly spread ports in far-endpoint order and
      // reroute every member with the direct compound search.
      const saved = members.map((m) => ({
        m,
        points: m.edge.points,
        x: m.edge.x,
        y: m.edge.y,
      }));
      // Project each far endpoint onto the side (clamped), then push apart to
      // a minimum separation so straight opportunities survive the permutation.
      const lo = (side === 'N' || side === 'S' ? r.left : r.top) + MARGIN;
      const hi = (side === 'N' || side === 'S' ? r.right : r.bottom) - MARGIN;
      const minSep = Math.min(14, (hi - lo) / Math.max(1, byFar.length - 1));
      const coords: number[] = byFar.map((m) => Math.max(lo, Math.min(hi, m.farCoord)));
      for (let i = 1; i < coords.length; i++) {
        if (coords[i] < coords[i - 1] + minSep) {
          coords[i] = coords[i - 1] + minSep;
        }
      }
      for (let i = coords.length - 1; i >= 0; i--) {
        if (coords[i] > hi) {
          coords[i] = hi;
        }
        if (i < coords.length - 1 && coords[i] > coords[i + 1] - minSep) {
          coords[i] = coords[i + 1] - minSep;
        }
      }
      let failed = false;
      for (let i = 0; i < byFar.length && !failed; i++) {
        const m = byFar[i];
        const span = hi - lo;
        const t = span > 0 ? (coords[i] - lo) / span : 0.5;
        const newPort = sidePort(r, side, Math.max(0.05, Math.min(0.95, t)));
        const pts = m.edge.points!;
        const otherEndPoint = m.attach === 'start' ? pts[pts.length - 1] : pts[0];
        const startNode =
          m.attach === 'start' ? node : (allNodes.get(String(m.edge.start ?? '')) ?? null);
        const endNode =
          m.attach === 'end' ? node : (allNodes.get(String(m.edge.end ?? '')) ?? null);
        if (!startNode || !endNode) {
          failed = true;
          break;
        }
        const route = findDirectCompoundRoute({
          startNode,
          endNode,
          startPort: m.attach === 'start' ? newPort : otherEndPoint,
          endPort: m.attach === 'end' ? newPort : otherEndPoint,
          nodesById: allNodes,
          spacing: 10,
          clearance: 8,
          model: 'channels',
        });
        if (!route || route.length < 2) {
          failed = true;
          break;
        }
        m.edge.points = route.map((p) => ({ ...p }));
        if (m.edge.label != null && Number.isFinite(m.edge.x) && Number.isFinite(m.edge.y)) {
          const anchor = labelAnchors(m.edge.points)[0];
          m.edge.x = anchor.x;
          m.edge.y = anchor.y;
        }
      }

      if (!failed) {
        const next = validateLayout(layout);
        if (next.ok && next.score > current.score) {
          current = next;
          improvedThisRound = true;
          continue;
        }
      }
      for (const s of saved) {
        s.m.edge.points = s.points;
        s.m.edge.x = s.x;
        s.m.edge.y = s.y;
      }
    }
    if (!improvedThisRound) {
      return;
    }
  }
}

/**
 * Track-swap untangling for crossing pairs that share a terminal node.
 * Literature-backed (metro-line crossing minimisation / pipe-routing track
 * transposition): when two edges of one fan cross, their terminal tracks are
 * in inverted order — EXCHANGING the two terminal rails removes the crossing
 * with zero new bends, unlike detour-based avoidance (known to be
 * ineffective). Both ports stay on the same side of the shared node (a legal
 * port slide), and the whole swap is kept only when the validator score
 * strictly improves.
 */
export function untangleSharedTerminalPairsWhenScoreImproves(layout: LayoutData): void {
  let current = validateLayout(layout);
  if (!current.ok || current.score <= 0 || current.breakdown.crossings === 0) {
    return;
  }

  const edges = (layout.edges ?? []) as {
    id?: string;
    start?: string;
    end?: string;
    points?: Point[];
  }[];

  const crossingPairIdx = (): [number, number][] => {
    const out: [number, number][] = [];
    for (let i = 0; i < edges.length; i++) {
      const A = edges[i].points;
      if (!Array.isArray(A) || A.length < 2) {
        continue;
      }
      for (let j = i + 1; j < edges.length; j++) {
        const B = edges[j].points;
        if (!Array.isArray(B) || B.length < 2) {
          continue;
        }
        let crossed = false;
        for (let ai = 0; ai < A.length - 1 && !crossed; ai++) {
          for (let bi = 0; bi < B.length - 1 && !crossed; bi++) {
            if (segmentsCross(A[ai], A[ai + 1], B[bi], B[bi + 1])) {
              crossed = true;
            }
          }
        }
        if (crossed) {
          out.push([i, j]);
        }
      }
    }
    return out;
  };

  /**
   * The terminal "track" at the given end: the terminal point plus its rail
   * partner when the terminal segment is perpendicular to the attach side.
   * Returns the indices whose coordinate must move on a swap.
   */
  const terminalTrack = (
    pts: Point[],
    end: 'first' | 'last'
  ): { idxs: number[]; vertical: boolean; coord: number } | null => {
    if (pts.length < 2) {
      return null;
    }
    const i0 = end === 'first' ? 0 : pts.length - 1;
    const i1 = end === 'first' ? 1 : pts.length - 2;
    const a = pts[i0];
    const b = pts[i1];
    const vertical = Math.abs(a.x - b.x) <= EPS && Math.abs(a.y - b.y) > EPS;
    const horizontal = Math.abs(a.y - b.y) <= EPS && Math.abs(a.x - b.x) > EPS;
    if (!vertical && !horizontal) {
      return null;
    }
    // Extend along the collinear run so the whole terminal rail moves.
    const idxs = [i0, i1];
    const step = end === 'first' ? 1 : -1;
    let k = i1;
    while (true) {
      const nk = k + step;
      if (nk < 0 || nk >= pts.length) {
        break;
      }
      const same = vertical ? Math.abs(pts[nk].x - a.x) <= EPS : Math.abs(pts[nk].y - a.y) <= EPS;
      if (!same) {
        break;
      }
      idxs.push(nk);
      k = nk;
    }
    return { idxs, vertical, coord: vertical ? a.x : a.y };
  };

  for (let round = 0; round < 3; round++) {
    let improved = false;
    for (const [i, j] of crossingPairIdx()) {
      const a = edges[i];
      const b = edges[j];
      // Find a shared terminal node between the pair.
      const combos: ['first' | 'last', 'first' | 'last'][] = [];
      if (a.start != null && b.start != null && String(a.start) === String(b.start)) {
        combos.push(['first', 'first']);
      }
      if (a.end != null && b.end != null && String(a.end) === String(b.end)) {
        combos.push(['last', 'last']);
      }
      if (a.start != null && b.end != null && String(a.start) === String(b.end)) {
        combos.push(['first', 'last']);
      }
      if (a.end != null && b.start != null && String(a.end) === String(b.start)) {
        combos.push(['last', 'first']);
      }
      for (const [endA, endB] of combos) {
        const trackA = terminalTrack(a.points!, endA);
        const trackB = terminalTrack(b.points!, endB);
        if (!trackA || !trackB || trackA.vertical !== trackB.vertical) {
          continue;
        }
        if (Math.abs(trackA.coord - trackB.coord) <= EPS) {
          continue;
        }
        const savedA = a.points!.map((p) => ({ ...p }));
        const savedB = b.points!.map((p) => ({ ...p }));
        for (const idx of trackA.idxs) {
          if (trackA.vertical) {
            a.points![idx] = { x: trackB.coord, y: a.points![idx].y };
          } else {
            a.points![idx] = { x: a.points![idx].x, y: trackB.coord };
          }
        }
        for (const idx of trackB.idxs) {
          if (trackB.vertical) {
            b.points![idx] = { x: trackA.coord, y: b.points![idx].y };
          } else {
            b.points![idx] = { x: b.points![idx].x, y: trackA.coord };
          }
        }
        const next = validateLayout(layout);
        if (next.ok && next.score > current.score) {
          current = next;
          improved = true;
          break;
        }
        a.points = savedA;
        b.points = savedB;
      }
    }
    if (!improved) {
      return;
    }
  }
}

/**
 * Straighten parallel-side Z routes via port slides. A 4-point Z between
 * opposite node sides (V-H-V or H-V-H) is shape-optimal ONLY when the two
 * side spans don't overlap on the cross axis; when they do, sliding both
 * ports into the overlap turns the Z into a 2-point straight — +5 score,
 * zero new bends. Kept per edge only when the validator score strictly
 * improves (the slide may collide with neighbouring ports or cross a new
 * route, which the gate rejects).
 */
export function straightenParallelZsWhenScoreImproves(layout: LayoutData): void {
  let current = validateLayout(layout);
  if (!current.ok || current.score <= 0) {
    return;
  }

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null && !(n as { isGroup?: boolean }).isGroup) {
      nodeById.set(String(n.id), n);
    }
  }
  const edges = (layout.edges ?? []) as {
    id?: string;
    start?: string;
    end?: string;
    points?: Point[];
    x?: number;
    y?: number;
    label?: unknown;
  }[];

  for (let round = 0; round < 2; round++) {
    let improved = false;
    for (const e of edges) {
      const pts = e.points;
      if (!Array.isArray(pts) || pts.length !== 4) {
        continue;
      }
      if (e.start == null || e.end == null) {
        continue;
      }
      const nS = nodeById.get(String(e.start));
      const nE = nodeById.get(String(e.end));
      if (!nS || !nE) {
        continue;
      }
      const rS = rectForNode(nS);
      const rE = rectForNode(nE);
      const [p0, p1, , p3] = pts;
      const firstVertical = Math.abs(p0.x - p1.x) <= EPS && Math.abs(p0.y - p1.y) > EPS;
      const firstHorizontal = Math.abs(p0.y - p1.y) <= EPS && Math.abs(p0.x - p1.x) > EPS;
      if (!firstVertical && !firstHorizontal) {
        continue;
      }
      const lastVertical = Math.abs(pts[2].x - p3.x) <= EPS && Math.abs(pts[2].y - p3.y) > EPS;
      if (firstVertical !== lastVertical) {
        continue; // not a parallel-side Z
      }

      // Z -> L: a 4-point route between parallel sides becomes a 3-point L by
      // re-terminating ONE end on a perpendicular side (+5, one fewer bend).
      {
        const savedPts = pts.map((p) => ({ ...p }));
        const savedX = e.x;
        const savedY = e.y;
        const hasLabel = e.label != null && Number.isFinite(e.x) && Number.isFinite(e.y);
        const lCandidates: Point[][] = [];
        if (firstVertical) {
          // Keep start (vertical exit); enter end horizontally at ey.
          for (const ey of [rE.cy, Math.max(rE.top + MARGIN, Math.min(rE.bottom - MARGIN, p1.y))]) {
            const endX = p0.x < rE.cx ? rE.left : rE.right;
            lCandidates.push([{ ...p0 }, { x: p0.x, y: ey }, { x: endX, y: ey }]);
          }
          // Keep end (vertical entry); exit start horizontally at sy.
          for (const sy of [rS.cy, Math.max(rS.top + MARGIN, Math.min(rS.bottom - MARGIN, p1.y))]) {
            const startX = p3.x < rS.cx ? rS.left : rS.right;
            lCandidates.push([{ x: startX, y: sy }, { x: p3.x, y: sy }, { ...p3 }]);
          }
        } else {
          // Keep start (horizontal exit); enter end vertically at ex.
          for (const ex of [rE.cx, Math.max(rE.left + MARGIN, Math.min(rE.right - MARGIN, p1.x))]) {
            const endY = p0.y < rE.cy ? rE.top : rE.bottom;
            lCandidates.push([{ ...p0 }, { x: ex, y: p0.y }, { x: ex, y: endY }]);
          }
          // Keep end (horizontal entry); exit start vertically at sx.
          for (const sx of [rS.cx, Math.max(rS.left + MARGIN, Math.min(rS.right - MARGIN, p1.x))]) {
            const startY = p3.y < rS.cy ? rS.top : rS.bottom;
            lCandidates.push([{ x: sx, y: startY }, { x: sx, y: p3.y }, { ...p3 }]);
          }
        }
        let acceptedL = false;
        for (const candidate of lCandidates) {
          e.points = candidate;
          if (hasLabel) {
            e.x = candidate[1].x;
            e.y = candidate[1].y;
          }
          const next = validateLayout(layout);
          if (next.ok && next.score > current.score) {
            current = next;
            improved = true;
            acceptedL = true;
            break;
          }
        }
        if (acceptedL) {
          continue;
        }
        e.points = savedPts;
        e.x = savedX;
        e.y = savedY;
      }

      if (firstVertical) {
        // Ports slide along horizontal sides: overlap of the two x-spans.
        const lo = Math.max(rS.left + MARGIN, rE.left + MARGIN);
        const hi = Math.min(rS.right - MARGIN, rE.right - MARGIN);
        if (hi <= lo) {
          continue;
        }
        const startY = p0.y;
        const endY = p3.y;
        const candidatesX = [
          (lo + hi) / 2,
          Math.max(lo, Math.min(hi, p0.x)),
          Math.max(lo, Math.min(hi, p3.x)),
          lo,
          hi,
        ];
        const savedPts = pts.map((p) => ({ ...p }));
        const savedX = e.x;
        const savedY = e.y;
        const hasLabel = e.label != null && Number.isFinite(e.x) && Number.isFinite(e.y);
        let accepted = false;
        for (const x of candidatesX) {
          e.points = [
            { x, y: startY },
            { x, y: endY },
          ];
          if (hasLabel) {
            e.x = x;
            e.y = (startY + endY) / 2;
          }
          const next = validateLayout(layout);
          if (next.ok && next.score > current.score) {
            current = next;
            improved = true;
            accepted = true;
            break;
          }
        }
        if (!accepted) {
          e.points = savedPts;
          e.x = savedX;
          e.y = savedY;
        }
      } else {
        // Ports slide along vertical sides: overlap of the two y-spans.
        const lo = Math.max(rS.top + MARGIN, rE.top + MARGIN);
        const hi = Math.min(rS.bottom - MARGIN, rE.bottom - MARGIN);
        if (hi <= lo) {
          continue;
        }
        const startX = p0.x;
        const endX = p3.x;
        const candidatesY = [
          (lo + hi) / 2,
          Math.max(lo, Math.min(hi, p0.y)),
          Math.max(lo, Math.min(hi, p3.y)),
          lo,
          hi,
        ];
        const savedPts = pts.map((p) => ({ ...p }));
        const savedX = e.x;
        const savedY = e.y;
        const hasLabel = e.label != null && Number.isFinite(e.x) && Number.isFinite(e.y);
        let accepted = false;
        for (const y of candidatesY) {
          e.points = [
            { x: startX, y },
            { x: endX, y },
          ];
          if (hasLabel) {
            e.x = (startX + endX) / 2;
            e.y = y;
          }
          const next = validateLayout(layout);
          if (next.ok && next.score > current.score) {
            current = next;
            improved = true;
            accepted = true;
            break;
          }
        }
        if (!accepted) {
          e.points = savedPts;
          e.x = savedX;
          e.y = savedY;
        }
      }
    }
    if (!improved) {
      return;
    }
  }
}
