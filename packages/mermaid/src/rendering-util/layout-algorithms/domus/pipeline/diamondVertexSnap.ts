/**
 * Diamond vertex snap (winner-only, score-gated).
 *
 * A decision node is drawn as a rhombus inscribed in its bounding box, touching
 * it only at the four side midpoints — the shape's vertices. `validateLayout`
 * prices a port anywhere else on the box as `port-off-diamond-corner` (soft 40:
 * "on a decision shape the vertex is the natural attachment, and giving one up
 * is meant to cost more than the bend it was traded for"). DOMUS's port
 * distribution places ports anywhere along a side, so flagged diamonds are
 * common (triage x6, co-pilot-extension x4, incremental-editing x3) and no
 * pass repaired them.
 *
 * The repair slides a flagged terminal ALONG its side to a preferred position,
 * translating the perpendicular exit stub laterally with it so the departing
 * segment keeps its orientation (the segment after the stub absorbs the
 * shift). Each move is kept only when the unified score strictly improves, so
 * a snap that would collide two ports on the same vertex, deform a straight
 * edge, or trade the penalty for something worse is rejected wholesale.
 *
 * The same slide also repairs `port-near-corner` (soft 10: a port in the
 * outer 15% of a side "reads as an accident rather than a choice", waived for
 * bendless routes): minimal inboard slide first, side midpoint as fallback.
 */
import type { LayoutData, Node } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';
import { checkLayout } from '../validateLayoutProxy.js';
import { log } from '../../../../logger.js';

interface Point {
  x: number;
  y: number;
}

interface SnapEdge {
  id?: string;
  start?: string;
  end?: string;
  points?: Point[];
  x?: number;
  y?: number;
  label?: unknown;
}

const EPS = 1e-6;
/** Same tolerance the validator uses to locate a port on a box side. */
const EPS_SIDE = 2;

/** A near-corner port slides inboard to this fraction of its side — just past
 * the validator's PORT_CORNER_FRACTION (0.15) with margin to spare. */
const INBOARD_FRACTION = 0.2;

export function snapDiamondPortsToVertexWhenScoreImproves(layout: LayoutData): void {
  let current = checkLayout(layout);
  const flagged = current.issues.filter(
    (i) => i.type === 'port-off-diamond-corner' || i.type === 'port-near-corner'
  );
  log.debug(`DIAMSNAP: enter ok=${current.ok} flags=${flagged.length}`);
  if (!current.ok || current.score === 0) {
    // Score-gated only. A clamped or zeroed score cannot grade a candidate:
    // `next.score > 0` would need >1000 points of soft penalty reclaimed, and
    // this pass's largest single lever is 40 — every rung would be a full
    // checkLayout spent on a gate that cannot open (architecture and
    // mermaid-chart-architecture carry 13 such flags between them).
    return;
  }
  if (flagged.length === 0) {
    return;
  }

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodeById.set(String(n.id), n);
    }
  }
  const edges = (layout.edges ?? []) as SnapEdge[];
  const edgeById = new Map<string, SnapEdge>();
  for (const e of edges) {
    if (e?.id != null) {
      edgeById.set(String(e.id), e);
    }
  }

  // Diamonds first (their penalty is 4x a corner port's), then worst offender
  // first within each type — the farthest port has the most to gain and the
  // least chance of fighting a sibling for the same slot.
  const severity = (i: (typeof flagged)[number]): number =>
    i.type === 'port-off-diamond-corner'
      ? 1000 + ((i.details?.offset as number) ?? 0)
      : 1 - ((i.details?.fraction as number) ?? 0);
  const sorted = [...flagged].sort((a, b) => severity(b) - severity(a));

  for (const issue of sorted) {
    const edge = issue.edgeId != null ? edgeById.get(String(issue.edgeId)) : undefined;
    const node = issue.nodeIds?.[0] != null ? nodeById.get(String(issue.nodeIds[0])) : undefined;
    const terminal = issue.details?.terminal as 'start' | 'end' | undefined;
    const pts = edge?.points;
    if (!edge || !node || !terminal || !Array.isArray(pts) || pts.length < 2) {
      continue;
    }
    const rect = rectForNode(node);
    const idx = terminal === 'start' ? 0 : pts.length - 1;
    const adjIdx = terminal === 'start' ? 1 : pts.length - 2;
    const pN = pts[idx];
    const pAdj = pts[adjIdx];

    // Which side of the box is the port on? The lateral axis runs along it.
    const onWE = Math.abs(pN.x - rect.left) <= EPS_SIDE || Math.abs(pN.x - rect.right) <= EPS_SIDE;
    const onNS = Math.abs(pN.y - rect.top) <= EPS_SIDE || Math.abs(pN.y - rect.bottom) <= EPS_SIDE;
    let lateral: 'x' | 'y';
    if (onWE && !onNS) {
      lateral = 'y'; // west/east side: slide vertically to the middle
    } else if (onNS && !onWE) {
      lateral = 'x'; // north/south side: slide horizontally to the middle
    } else {
      continue; // corner or interior — not this pass's shape
    }
    const lo = lateral === 'y' ? rect.top : rect.left;
    const hi = lateral === 'y' ? rect.bottom : rect.right;
    const cur = lateral === 'y' ? pN.y : pN.x;
    const mid = (lo + hi) / 2;
    // A diamond port belongs ON the vertex; a near-corner port only needs to
    // clear the corner band — minimal slide first, midpoint as the fallback.
    const targets: number[] = [];
    if (issue.type === 'port-off-diamond-corner') {
      targets.push(mid);
    } else {
      const inboard = INBOARD_FRACTION * (hi - lo);
      targets.push(cur - lo < hi - cur ? lo + inboard : hi - inboard, mid);
    }
    // The exit stub must be perpendicular to the slide, or moving the port
    // sideways would need a whole rail restructure — skip those.
    const stubPerpendicular =
      lateral === 'y' ? Math.abs(pN.y - pAdj.y) <= EPS : Math.abs(pN.x - pAdj.x) <= EPS;
    if (!stubPerpendicular) {
      continue;
    }

    for (const target of targets) {
      // Re-read from the array each rung and restore IN PLACE: replacing array
      // entries with snapshot copies leaves the loop holding detached, mutated
      // objects, and the next rejected rung writes that stale geometry back —
      // the exact stale-reference bug the endpoint-band ladder hit (silent
      // no-ops there; minted diagonals here).
      const p0 = pts[idx];
      const p1 = pts[adjIdx];
      const delta = target - (lateral === 'y' ? p0.y : p0.x);
      if (Math.abs(delta) <= EPS) {
        continue;
      }
      const snap0 = { x: p0.x, y: p0.y };
      const snap1 = { x: p1.x, y: p1.y };
      if (lateral === 'y') {
        p0.y += delta;
        p1.y += delta;
      } else {
        p0.x += delta;
        p1.x += delta;
      }

      const next = checkLayout(layout);
      if (next.ok && next.score > current.score) {
        current = next;
        log.debug(
          `DIAMSNAP: commit ${issue.type} edge=${String(edge.id)} ${terminal} delta=${delta.toFixed(1)} score=${next.score.toFixed(1)}`
        );
        break;
      }
      log.debug(
        `DIAMSNAP: reject ${issue.type} edge=${String(edge.id)} ${terminal} delta=${delta.toFixed(1)} ok=${next.ok} score ${current.score.toFixed(1)}->${next.score.toFixed(1)}`
      );
      p0.x = snap0.x;
      p0.y = snap0.y;
      p1.x = snap1.x;
      p1.y = snap1.y;
    }
  }
}
