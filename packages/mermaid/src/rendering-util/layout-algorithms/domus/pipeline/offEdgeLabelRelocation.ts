/**
 * Score-gated off-edge label relocation (finalize stage).
 *
 * `validateLayout` flags `edge-label-off-edge` when an edge's label rect does
 * not sit on its polyline. This happens when the edge-label dummy node reserved
 * a slot that the final route never passed through, leaving the label stranded
 * far from the edge (e.g. Company's L_USCompany_HongKongCompany_0: label anchor
 * at (140,203) while the polyline runs x[584..757]).
 *
 * Unlike `finalizeOverlayLabels` (which SLIDES a label already on its polyline
 * to dodge overlaps), this pass PLACES a stranded label back onto the polyline.
 * It tries anchors along the route — segment midpoints and quarter points, the
 * longest (roomiest) segments first — and keeps the first that the unified
 * validator scores strictly higher while staying valid, so it clears the
 * off-edge flag without parking the label on a node or another edge.
 */
import type { LayoutData } from '../../../types.js';
import { validateLayout } from '../validateLayoutProxy.js';

interface Point {
  x: number;
  y: number;
}

/** Edge ids the validator reports as having an off-edge label. */
function offEdgeLabelEdgeIds(issues: { type: string; message?: string }[]): Set<string> {
  const ids = new Set<string>();
  for (const issue of issues) {
    if (issue.type === 'edge-label-off-edge' && typeof issue.message === 'string') {
      const m = /"([^"]+)"/.exec(issue.message);
      if (m) {
        ids.add(m[1]);
      }
    }
  }
  return ids;
}

export function relocateOffEdgeLabelsWhenScoreImproves(layout: LayoutData): void {
  let current = validateLayout(layout);
  const flagged = offEdgeLabelEdgeIds(current.issues);
  if (flagged.size === 0) {
    return;
  }

  for (const e of layout.edges ?? []) {
    if (e?.id == null || !flagged.has(String(e.id))) {
      continue;
    }
    const pts = (e as { points?: Point[] }).points;
    if (!Array.isArray(pts) || pts.length < 2) {
      continue;
    }
    const anchored = e as { x?: number; y?: number };

    // Candidate anchors along the polyline: a spread of fractions per segment,
    // roomiest (longest) segments tried first.
    const candidates: { x: number; y: number; len: number }[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      for (const t of [0.5, 0.35, 0.65, 0.25, 0.75]) {
        candidates.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, len });
      }
    }
    candidates.sort((p, q) => q.len - p.len);

    const ox = anchored.x;
    const oy = anchored.y;
    let placed = false;
    for (const c of candidates) {
      anchored.x = c.x;
      anchored.y = c.y;
      const next = validateLayout(layout);
      if (next.ok && next.score > current.score) {
        current = next;
        placed = true;
        break;
      }
    }
    if (!placed) {
      anchored.x = ox;
      anchored.y = oy;
    }
  }
}
