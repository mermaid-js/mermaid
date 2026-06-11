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

interface Point {
  x: number;
  y: number;
}
type Rect = ReturnType<typeof rectForNode>;
interface Issue {
  type: string;
  message?: string;
  edgeId?: string;
  details?: { edgeIds?: string[] };
}

const EPS = 1e-6;
const MARGIN = 8;
const MAX_ROUNDS = 4;

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
      if (parallel) {
        candidates.push(...railShiftCandidates(pts));
      }

      const curKeys = new Set((current.issues as Issue[]).map(issueKey));
      const old = e!.points;
      for (const candidate of candidates) {
        if (candidate.length >= old!.length + 2) {
          continue; // don't trade a defect for a much longer route
        }
        e!.points = candidate;
        const next = validateLayout(layout);
        const fewer = next.issues.length < current.issues.length;
        const noNew = (next.issues as Issue[]).every((iss) => curKeys.has(issueKey(iss)));
        if (fewer && noNew) {
          current = next;
          improvedThisRound = true;
          break;
        }
        e!.points = old;
      }
    }
    if (!improvedThisRound) {
      return;
    }
  }
}
