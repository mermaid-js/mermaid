/**
 * DOMUS-specific check: an edge polyline must not contain a zero-length segment
 * (two coincident consecutive points).
 *
 * A zero-length segment is invisible to the core bend/point score —
 * `normalizePolyline` collapses coincident points before any check runs, so a
 * degenerate route scores identically to its clean form and sails through every
 * score-gated pass. The renderer, however, feeds the RAW points to its curve
 * interpolation, which divides by the segment length and emits NaN path
 * coordinates — the browser draws up to the last finite point and truncates the
 * edge mid-air (observed on `subgraph-variation-2`'s three→two group edge,
 * routed as `[start, end, end]`).
 *
 * Making this a HARD DOMUS check closes that blind spot: no score-gated pass can
 * accept a candidate carrying such a tail (its monotone/`ok` gate now sees the
 * issue), and any that slips through is caught at final validation. It is
 * belt-and-braces with `index.ts`'s `stripDegenerateEdgePoints`, which cleans
 * the geometry so this never fires in a healthy run.
 *
 * Scope: DOMUS only. It is wired through `validateLayoutProxy`, never the bare
 * core validator, so swimlanes / cose-bilkent scoring is untouched — those
 * backends have their own edge pipelines and are out of this loop's remit.
 */
import type { LayoutData } from '../../../types.js';
import type {
  Issue,
  LayoutValidationExtension,
  ValidateLayoutResult,
} from '../../layout-utils/validateLayout.js';

/**
 * Two consecutive points closer than this count as coincident. Kept tight so
 * only true duplicates / float noise trip it, never a legitimately short (but
 * nonzero) orthogonal segment.
 */
const EPS_ZERO_LENGTH = 1e-3;

export const edgeZeroLengthSegmentExtension: LayoutValidationExtension = {
  id: 'domus:edgeZeroLengthSegment',

  check(layout: LayoutData, _core: Readonly<ValidateLayoutResult>): Issue[] {
    const issues: Issue[] = [];
    for (const e of layout.edges ?? []) {
      const pts = (e as { points?: { x: number; y: number }[] }).points;
      if (!Array.isArray(pts) || pts.length < 2) {
        continue;
      }
      const edgeId = e?.id != null ? String(e.id) : '';
      for (let i = 0; i < pts.length - 1; i++) {
        const dx = pts[i].x - pts[i + 1].x;
        const dy = pts[i].y - pts[i + 1].y;
        if (Math.hypot(dx, dy) <= EPS_ZERO_LENGTH) {
          issues.push({
            type: 'edge-zero-length-segment',
            message: `Edge "${edgeId}" has a zero-length segment at point index ${i}`,
            edgeId,
            details: { segmentIndex: i, a: pts[i], b: pts[i + 1] },
          });
          break; // one per edge is enough to invalidate
        }
      }
    }
    return issues;
  },
};
