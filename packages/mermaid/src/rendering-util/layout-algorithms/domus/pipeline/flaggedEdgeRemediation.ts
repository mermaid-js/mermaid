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
          if (process.env.REMEDIATE_DBG && (!fewer || !noNew)) {
            // eslint-disable-next-line no-console
            console.error(
              'REMEDIATE-DBG reject',
              edgeId,
              `fewer=${fewer} noNew=${noNew}`,
              (next.issues as Issue[])
                .filter((iss) => !curKeys.has(issueKey(iss)))
                .map((iss) => `${iss.type}:${iss.edgeId ?? ''}`)
                .join(' ')
            );
          }
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
