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
  return [primary, secondary, ['N', 'S'], ['S', 'N'], ['E', 'W'], ['W', 'E']];
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
          nodeById,
          startId,
          endId,
          10,
          { model: 'channels', clearance: 8 }
        );
        const routes: Point[][] = [];
        if (mid && mid.length >= 2) {
          routes.push([{ ...ps }, ...mid.map((p) => ({ ...p })), { ...pe }]);
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
    for (const issue of current.issues as Issue[]) {
      for (const id of edgeIdsOfIssue(issue, knownEdgeIds)) {
        const set = flagged.get(id) ?? new Set<string>();
        set.add(issue.type);
        flagged.set(id, set);
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
