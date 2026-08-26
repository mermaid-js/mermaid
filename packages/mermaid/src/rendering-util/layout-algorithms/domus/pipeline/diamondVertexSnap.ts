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
 * The repair slides a flagged terminal ALONG its side to the side's midpoint,
 * translating the perpendicular exit stub laterally with it so the departing
 * segment keeps its orientation (the segment after the stub absorbs the
 * shift). Each move is kept only when the unified score strictly improves, so
 * a snap that would collide two ports on the same vertex, deform a straight
 * edge, or trade the 40 for something worse is rejected wholesale.
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

export function snapDiamondPortsToVertexWhenScoreImproves(layout: LayoutData): void {
  let current = checkLayout(layout);
  const flagged = current.issues.filter((i) => i.type === 'port-off-diamond-corner');
  log.debug(`DIAMSNAP: enter ok=${current.ok} flags=${flagged.length}`);
  if (!current.ok) {
    return; // score-gated only — a clamped score cannot grade a candidate
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

  // Worst offset first — the farthest port has the most to gain and the least
  // chance of fighting a sibling for the same vertex slot.
  const sorted = [...flagged].sort(
    (a, b) => ((b.details?.offset as number) ?? 0) - ((a.details?.offset as number) ?? 0)
  );

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
    const target = lateral === 'y' ? (rect.top + rect.bottom) / 2 : (rect.left + rect.right) / 2;
    const delta = target - (lateral === 'y' ? pN.y : pN.x);
    if (Math.abs(delta) <= EPS) {
      continue;
    }
    // The exit stub must be perpendicular to the slide, or moving the port
    // sideways would need a whole rail restructure — skip those.
    const stubPerpendicular =
      lateral === 'y' ? Math.abs(pN.y - pAdj.y) <= EPS : Math.abs(pN.x - pAdj.x) <= EPS;
    if (!stubPerpendicular) {
      continue;
    }

    const snapN = { ...pN };
    const snapAdj = { ...pAdj };
    if (lateral === 'y') {
      pN.y += delta;
      pAdj.y += delta;
    } else {
      pN.x += delta;
      pAdj.x += delta;
    }

    const next = checkLayout(layout);
    if (next.ok && next.score > current.score) {
      current = next;
      log.debug(
        `DIAMSNAP: commit edge=${String(edge.id)} ${terminal} delta=${delta.toFixed(1)} score=${next.score.toFixed(1)}`
      );
    } else {
      log.debug(
        `DIAMSNAP: reject edge=${String(edge.id)} ${terminal} delta=${delta.toFixed(1)} ok=${next.ok} score ${current.score.toFixed(1)}->${next.score.toFixed(1)}`
      );
      pts[idx] = snapN;
      pts[adjIdx] = snapAdj;
    }
  }
}
