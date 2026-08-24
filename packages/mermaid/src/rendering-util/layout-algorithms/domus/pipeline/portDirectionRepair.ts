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
/**
 * Edges whose route crosses the interior of their own TARGET node.
 *
 * Reported by the validator as `edge-intersects-obstacle` where the obstacle is
 * the edge's own `end`. Repairable only by moving the end port, which is what
 * `endCandidates` builds.
 */
function collectSelfTargetEdges(
  issues: readonly Issue[],
  edges: readonly { id?: string; start?: string; end?: string }[]
): Mismatch[] {
  const endById = new Map<string, string>();
  for (const e of edges) {
    if (e?.id != null) {
      endById.set(String(e.id), String(e.end ?? ''));
    }
  }
  const out: Mismatch[] = [];
  const seen = new Set<string>();
  for (const issue of issues) {
    if (issue.type !== 'edge-intersects-obstacle' || issue.edgeId == null) {
      continue;
    }
    const edgeId = String(issue.edgeId);
    const endId = endById.get(edgeId);
    if (!endId || seen.has(edgeId)) {
      continue;
    }
    if ((issue.nodeIds ?? []).some((n) => String(n) === endId)) {
      seen.add(edgeId);
      out.push({ edgeId, terminal: 'end' });
    }
  }
  return out;
}

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
/**
 * Mirror of {@link startCandidates} for the END terminal.
 *
 * The start version keeps the far port fixed and re-exits the near one. This is
 * the same construction reflected: `ps` (the edge's fixed start point) is the
 * anchor, and the END port slides along a perpendicular side of its own node so
 * the last segment arrives facing that side instead of crossing the body.
 *
 * The pass previously handled `start` only — "END mismatches are left for the
 * report" — which left `L_MLProduct_VendAI_0` and `L_LanternML_Chats_0` on
 * `domus/architecture4` routed through the interior of the very node they
 * terminate at, with no pass able to repair them: `obstacleDetourInsertPass`
 * routes AROUND obstacles and the obstacle here is the destination.
 */
function endCandidates(rE: Rect, ps: Point, startSide: Side): Point[][] {
  const candidates: Point[][] = [];
  const horizDeparture = startSide === 'E' || startSide === 'W';

  if (horizDeparture) {
    // Start leaves horizontally → end must be entered vertically (N or S).
    let sideY: number | null = null;
    if (ps.y < rE.top) {
      sideY = rE.top; // enter from the north
    } else if (ps.y > rE.bottom) {
      sideY = rE.bottom; // enter from the south
    }
    if (sideY == null) {
      return candidates;
    }
    const lo = rE.left + CORNER_MARGIN;
    const hi = rE.right - CORNER_MARGIN;
    const departSign = startSide === 'E' ? 1 : -1;
    for (const px of [
      departSign > 0 ? Math.max(lo, ps.x + MIN_STUB) : Math.min(hi, ps.x - MIN_STUB),
      (lo + hi) / 2,
      departSign > 0 ? hi : lo,
    ]) {
      if (px < lo - ON_SIDE || px > hi + ON_SIDE) {
        continue;
      }
      if (Math.abs(px - ps.x) < MIN_STUB) {
        continue;
      }
      candidates.push([
        { x: ps.x, y: ps.y },
        { x: px, y: ps.y },
        { x: px, y: sideY },
      ]);
    }
  } else {
    // Start leaves vertically → end must be entered horizontally (E or W).
    let sideX: number | null = null;
    if (ps.x < rE.left) {
      sideX = rE.left;
    } else if (ps.x > rE.right) {
      sideX = rE.right;
    }
    if (sideX == null) {
      return candidates;
    }
    const lo = rE.top + CORNER_MARGIN;
    const hi = rE.bottom - CORNER_MARGIN;
    const departSign = startSide === 'S' ? 1 : -1;
    for (const py of [
      departSign > 0 ? Math.max(lo, ps.y + MIN_STUB) : Math.min(hi, ps.y - MIN_STUB),
      (lo + hi) / 2,
      departSign > 0 ? hi : lo,
    ]) {
      if (py < lo - ON_SIDE || py > hi + ON_SIDE) {
        continue;
      }
      if (Math.abs(py - ps.y) < MIN_STUB) {
        continue;
      }
      candidates.push([
        { x: ps.x, y: ps.y },
        { x: ps.x, y: py },
        { x: sideX, y: py },
      ]);
    }
  }

  return candidates;
}

/** Distinct finite coordinates, order preserved. */
function uniqueCoords(values: number[]): number[] {
  const out: number[] = [];
  for (const v of values) {
    if (Number.isFinite(v) && !out.some((e) => Math.abs(e - v) < 1e-6)) {
      out.push(v);
    }
  }
  return out;
}

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
      // The target sits INSIDE the source's vertical span, so there is no
      // "exit upward or downward and come back" route — and returning nothing
      // here is why this pass was a no-op on every edge leaving a tall source.
      // A group is the common case: `LanternML` is 284px tall on
      // `domus/architecture4`, so all three of its outgoing edges reached this
      // line, got zero candidates, and kept the port mismatch the validator
      // was reporting the whole time.
      //
      // When the target is level with the source, the natural exit is the
      // horizontal side FACING it and the route is a straight line — no bend,
      // which is also the cheapest thing the bend penalty can score.
      const facingX = pe.x > rS.right ? rS.right : pe.x < rS.left ? rS.left : null;
      if (facingX == null) {
        return candidates;
      }
      const loY = rS.top + CORNER_MARGIN;
      const hiY = rS.bottom - CORNER_MARGIN;
      if (Math.abs(facingX - pe.x) < MIN_STUB) {
        return candidates;
      }
      for (const py of uniqueCoords([pe.y, (loY + hiY) / 2])) {
        if (py < loY || py > hiY) {
          continue;
        }
        if (Math.abs(py - pe.y) < 1e-6) {
          candidates.push([
            { x: facingX, y: py },
            { x: pe.x, y: pe.y },
          ]);
        } else {
          const mid = (facingX + pe.x) / 2;
          candidates.push([
            { x: facingX, y: py },
            { x: mid, y: py },
            { x: mid, y: pe.y },
            { x: pe.x, y: pe.y },
          ]);
        }
      }
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
      // Mirror of the level-target case in the horizontal branch: the target is
      // inside the source's horizontal span, so exit the vertical side facing
      // it and run straight.
      const facingY = pe.y > rS.bottom ? rS.bottom : pe.y < rS.top ? rS.top : null;
      if (facingY == null) {
        return candidates;
      }
      const loX = rS.left + CORNER_MARGIN;
      const hiX = rS.right - CORNER_MARGIN;
      if (Math.abs(facingY - pe.y) < MIN_STUB) {
        return candidates;
      }
      for (const px of uniqueCoords([pe.x, (loX + hiX) / 2])) {
        if (px < loX || px > hiX) {
          continue;
        }
        if (Math.abs(px - pe.x) < 1e-6) {
          candidates.push([
            { x: px, y: facingY },
            { x: pe.x, y: pe.y },
          ]);
        } else {
          const mid = (facingY + pe.y) / 2;
          candidates.push([
            { x: px, y: facingY },
            { x: px, y: mid },
            { x: pe.x, y: mid },
            { x: pe.x, y: pe.y },
          ]);
        }
      }
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
  const mismatches = [...collectMismatches(current.issues)];
  const seenTargets = new Set(mismatches.map((m) => `${m.edgeId}|${m.terminal}`));
  // A route through its own target is the same defect wearing a different
  // label, and it is only repairable from the end terminal.
  for (const m of collectSelfTargetEdges(current.issues, layout.edges ?? [])) {
    if (!seenTargets.has(`${m.edgeId}|${m.terminal}`)) {
      seenTargets.add(`${m.edgeId}|${m.terminal}`);
      mismatches.push(m);
    }
  }
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
    let candidates: Point[][];
    if (terminal === 'start') {
      const rS = rectForNode(startNode);
      const pe = pts[pts.length - 1];
      const endSide = sideOfPoint(rectForNode(endNode), pe);
      if (!endSide) {
        continue;
      }
      candidates = startCandidates(rS, pe, endSide);
    } else {
      const rE = rectForNode(endNode);
      const ps = pts[0];
      const startSide = sideOfPoint(rectForNode(startNode), ps);
      if (!startSide) {
        continue;
      }
      candidates = endCandidates(rE, ps, startSide);
    }
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
