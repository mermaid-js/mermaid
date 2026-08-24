/**
 * Score-gated port-direction-mismatch repair (finalize stage).
 *
 * `validateLayout` flags `edge-port-direction-mismatch` when an edge's terminal
 * port sits on one node side but the first/last segment leaves in a direction
 * that side does not face (e.g. subgraph-variation-2's L_three_two_0 exits
 * `three` on the W side yet the first segment heads E, back across the node).
 * The producer emits these when two facing sides are too close to satisfy the
 * 10px stub rule, so it forces a stub the wrong way.
 *
 * This pass re-exits the mismatched terminal on a sensible PERPENDICULAR side
 * and routes a clean one-bend L to the opposite (fixed) port. It is scoped to
 * the exact edges/terminals the validator flags and is fully score-gated: a
 * candidate is kept only when the unified validator score strictly improves and
 * the layout stays valid, so it can clear the mismatch (and the short-stub
 * penalty that rides with it) without ever making a layout worse.
 */
import type { LayoutData, Node } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';
import { checkLayout, type Issue } from '../validateLayoutProxy.js';

interface Point {
  x: number;
  y: number;
}
type Rect = ReturnType<typeof rectForNode>;
type Side = 'N' | 'S' | 'E' | 'W';

/** Keep re-placed ports this far inside a side span (off the corners). */
const CORNER_MARGIN = 8;
/** A terminal stub must clear validateLayout's 10px short-stub rule. */
const MIN_STUB = 11;
const ON_SIDE = 1;

interface Mismatch {
  edgeId: string;
  terminal: 'start' | 'end';
}

/**
 * Read `edge-port-direction-mismatch` rows: which edge + which terminal.
 *
 * Both come from structured fields. This used to take the edge from the first
 * quoted run of `issue.message` and the terminal from
 * `issue.message.includes('end port')` — a control-flow decision made by
 * substring-matching diagnostic English, so rewording the message would have
 * silently repaired the wrong end of every edge.
 */
function collectMismatches(
  issues: { type: string; edgeId?: string; details?: Record<string, unknown> }[]
): Mismatch[] {
  const out: Mismatch[] = [];
  for (const issue of issues) {
    if (issue.type !== 'edge-port-direction-mismatch' || issue.edgeId == null) {
      continue;
    }
    const terminal = issue.details?.terminal === 'end' ? 'end' : 'start';
    out.push({ edgeId: String(issue.edgeId), terminal });
  }
  return out;
}

/** Structured identity of an issue, so "no NEW issue" can be tested by key. */
function issueKey(issue: Issue): string {
  const ids: string[] = [];
  if (issue.edgeId != null) {
    ids.push(String(issue.edgeId));
  }
  const detailIds = issue.details?.edgeIds;
  if (Array.isArray(detailIds)) {
    for (const id of detailIds) {
      ids.push(String(id));
    }
  }
  for (const id of issue.nodeIds ?? []) {
    ids.push(String(id));
  }
  return `${issue.type}|${[...new Set(ids)].sort().join(',')}`;
}

/** Which side of `r` point `p` attaches to (within ON_SIDE), else null. */
function sideOfPoint(r: Rect, p: Point): Side | null {
  const inX = p.x >= r.left - ON_SIDE && p.x <= r.right + ON_SIDE;
  const inY = p.y >= r.top - ON_SIDE && p.y <= r.bottom + ON_SIDE;
  if (inX && Math.abs(p.y - r.top) <= ON_SIDE) {
    return 'N';
  }
  if (inX && Math.abs(p.y - r.bottom) <= ON_SIDE) {
    return 'S';
  }
  if (inY && Math.abs(p.x - r.left) <= ON_SIDE) {
    return 'W';
  }
  if (inY && Math.abs(p.x - r.right) <= ON_SIDE) {
    return 'E';
  }
  return null;
}

/**
 * Build one-bend L candidates that re-place the mismatched START port on a
 * perpendicular side and run to the fixed end port `pe`. `endSide` fixes the
 * final approach axis; the start must exit on the perpendicular axis.
 */
function startCandidates(rS: Rect, pe: Point, endSide: Side): Point[][] {
  const candidates: Point[][] = [];
  const horizApproach = endSide === 'E' || endSide === 'W';

  if (horizApproach) {
    // End approached horizontally → start exits vertically (N or S). Pick the
    // side whose outward run actually reaches pe.y.
    let sideY: number | null = null;
    if (pe.y < rS.top) {
      sideY = rS.top; // exit N (up)
    } else if (pe.y > rS.bottom) {
      sideY = rS.bottom; // exit S (down)
    }
    if (sideY == null) {
      return candidates;
    }
    // Last segment approaches pe from the side `endSide` faces.
    const approachSign = endSide === 'E' ? 1 : -1; // E: from the east (px > pe.x)
    const lo = rS.left + CORNER_MARGIN;
    const hi = rS.right - CORNER_MARGIN;
    for (const px of [
      approachSign > 0 ? Math.max(lo, pe.x + MIN_STUB) : Math.min(hi, pe.x - MIN_STUB),
      (lo + hi) / 2,
      approachSign > 0 ? hi : lo,
    ]) {
      if (px < lo - ON_SIDE || px > hi + ON_SIDE) {
        continue;
      }
      if (Math.abs(px - pe.x) < MIN_STUB) {
        continue;
      }
      candidates.push([
        { x: px, y: sideY },
        { x: px, y: pe.y },
        { x: pe.x, y: pe.y },
      ]);
    }
  } else {
    // End approached vertically → start exits horizontally (E or W).
    let sideX: number | null = null;
    if (pe.x < rS.left) {
      sideX = rS.left; // exit W (left)
    } else if (pe.x > rS.right) {
      sideX = rS.right; // exit E (right)
    }
    if (sideX == null) {
      return candidates;
    }
    const approachSign = endSide === 'S' ? 1 : -1; // S: from the south (py > pe.y)
    const lo = rS.top + CORNER_MARGIN;
    const hi = rS.bottom - CORNER_MARGIN;
    for (const py of [
      approachSign > 0 ? Math.max(lo, pe.y + MIN_STUB) : Math.min(hi, pe.y - MIN_STUB),
      (lo + hi) / 2,
      approachSign > 0 ? hi : lo,
    ]) {
      if (py < lo - ON_SIDE || py > hi + ON_SIDE) {
        continue;
      }
      if (Math.abs(py - pe.y) < MIN_STUB) {
        continue;
      }
      candidates.push([
        { x: sideX, y: py },
        { x: pe.x, y: py },
        { x: pe.x, y: pe.y },
      ]);
    }
  }
  return candidates;
}

export function repairPortDirectionMismatchWhenScoreImproves(layout: LayoutData): void {
  let current = checkLayout(layout);
  const mismatches = collectMismatches(current.issues);
  if (mismatches.length === 0) {
    return;
  }

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodeById.set(String(n.id), n);
    }
  }
  const edgeById = new Map<string, { points?: Point[]; start?: string; end?: string }>();
  for (const e of layout.edges ?? []) {
    if (e?.id != null) {
      edgeById.set(String(e.id), e as { points?: Point[]; start?: string; end?: string });
    }
  }

  for (const { edgeId, terminal } of mismatches) {
    // Only the START terminal is handled for now (the case the producer emits
    // when facing sides are too close); END mismatches are left for the report.
    if (terminal !== 'start') {
      continue;
    }
    const e = edgeById.get(edgeId);
    const pts = e?.points;
    if (!Array.isArray(pts) || pts.length < 2) {
      continue;
    }
    const startNode = e?.start != null ? nodeById.get(String(e.start)) : undefined;
    const endNode = e?.end != null ? nodeById.get(String(e.end)) : undefined;
    if (!startNode || !endNode) {
      continue;
    }
    const rS = rectForNode(startNode);
    const pe = pts[pts.length - 1];
    const endSide = sideOfPoint(rectForNode(endNode), pe);
    if (!endSide) {
      continue;
    }

    const candidates = startCandidates(rS, pe, endSide);
    const currentKeys = new Set(current.issues.map(issueKey));
    for (const candidate of candidates) {
      const old = e!.points;
      e!.points = candidate;
      const next = checkLayout(layout);
      // Accept on a strict improvement, judged the way the layout's own state
      // allows. On a VALID layout the score is the objective, as before. On an
      // INVALID one it is not available: `score` is clamped to 0 whenever
      // `!ok`, and `next.ok` asks the WHOLE layout to be valid — which a
      // single-edge port repair cannot deliver on a layout with two dozen
      // issues. So the old gate could never fire on exactly the layouts this
      // pass exists to repair, and it sat dormant while `domus/architecture4`
      // kept four edges routed back through their own endpoint nodes.
      //
      // Invalid case: fewer issues than before and no issue key the baseline
      // did not already have. Monotone, so a candidate can never make the
      // layout worse — the same rule `remediateFlaggedEdgesWhenMonotone` uses.
      const improved = current.ok
        ? next.ok && next.score > current.score
        : next.issues.length < current.issues.length &&
          next.issues.every((iss) => currentKeys.has(issueKey(iss)));
      if (improved) {
        current = next;
        break;
      }
      e!.points = old;
    }
  }
}
