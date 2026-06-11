/**
 * Score-gated arrowhead-bend clearance (finalize stage).
 *
 * `validateLayout` flags `edge-bend-overlaps-arrowhead` (a SOFT penalty) when a
 * terminal segment is no longer than the arrowhead marker body, so the first
 * interior bend sits inside the arrowhead graphic. The producer emits these
 * when a short port stub turns immediately (e.g. edge-types' L_R2_C_0: a 10px
 * start stub that turns up into the start marker).
 *
 * This pass lengthens the offending terminal stub by sliding the perpendicular
 * rail away from the tip — the bend moves out of the marker footprint while the
 * port (and its side) stay fixed. It is fully score-gated: a candidate is kept
 * only when the unified validator score strictly improves, so it can clear the
 * arrowhead overlap (and recover the soft 50) without ever making a layout
 * worse. Only 4+ point edges are eligible — the rail's far end must be an
 * interior vertex we may move (a 3-point L's far end is the fixed target port).
 */
import type { LayoutData } from '../../../types.js';
import { validateLayout } from '../../layout-utils/validateLayout.js';

interface Point {
  x: number;
  y: number;
}

const EPS = 1e-6;
/** Mirrors validateLayout's EPS_MARKER_CLEARANCE_LENGTH. */
const MARKER_LEN = 10;
/** Target stub lengths to try (all clear of the 10px marker, with margin). */
const STUB_TARGETS = [13, 17, 21];

type Terminal = 'start' | 'end';

/** Mirror of validateLayout's hasTerminalMarker (kept local; that helper is
 * internal to the validator module). */
function hasTerminalMarker(
  e: { arrowTypeStart?: unknown; arrowTypeEnd?: unknown; type?: unknown },
  terminal: Terminal
): boolean {
  const markerType = terminal === 'start' ? e.arrowTypeStart : e.arrowTypeEnd;
  if (typeof markerType === 'string') {
    const trimmed = markerType.trim();
    if (trimmed.length > 0 && trimmed !== 'none' && trimmed !== 'arrow_open') {
      return true;
    }
  }
  if (typeof e.type !== 'string') {
    return false;
  }
  if (terminal === 'start' && e.type.startsWith('double_')) {
    return true;
  }
  return terminal === 'end' && /arrow_(point|cross|circle|barb)|double_arrow/.test(e.type);
}

export function clearArrowheadBendsWhenScoreImproves(layout: LayoutData): void {
  let current = validateLayout(layout);

  for (const e of layout.edges ?? []) {
    const pts = e?.points as Point[] | undefined;
    if (!Array.isArray(pts) || pts.length < 4) {
      continue;
    }

    for (const terminal of ['start', 'end'] as const) {
      if (!hasTerminalMarker(e, terminal)) {
        continue;
      }
      // tip = the port vertex; inner = the first interior bend; rail = the next
      // interior vertex (the far end of the perpendicular rail we slide).
      const tipIdx = terminal === 'start' ? 0 : pts.length - 1;
      const innerIdx = terminal === 'start' ? 1 : pts.length - 2;
      const railIdx = terminal === 'start' ? 2 : pts.length - 3;
      const tip = pts[tipIdx];
      const inner = pts[innerIdx];
      const rail = pts[railIdx];

      const dx = inner.x - tip.x;
      const dy = inner.y - tip.y;
      const horiz = Math.abs(dy) <= EPS && Math.abs(dx) > EPS;
      const vert = Math.abs(dx) <= EPS && Math.abs(dy) > EPS;
      if (!horiz && !vert) {
        continue;
      }
      const stubLen = horiz ? Math.abs(dx) : Math.abs(dy);
      if (stubLen > MARKER_LEN + 1) {
        continue; // bend already clears the marker
      }
      // inner→rail must be perpendicular to the stub (a proper orthogonal L), so
      // moving inner AND rail along the stub axis keeps that rail straight.
      const perpAligned = horiz
        ? Math.abs(inner.x - rail.x) <= EPS
        : Math.abs(inner.y - rail.y) <= EPS;
      if (!perpAligned) {
        continue;
      }
      const sign = horiz ? Math.sign(dx) : Math.sign(dy);

      for (const target of STUB_TARGETS) {
        const delta = sign * (target - stubLen);
        const oldInner = { x: inner.x, y: inner.y };
        const oldRail = { x: rail.x, y: rail.y };
        if (horiz) {
          inner.x += delta;
          rail.x += delta;
        } else {
          inner.y += delta;
          rail.y += delta;
        }
        const next = validateLayout(layout);
        if (next.score > current.score) {
          current = next;
          break;
        }
        inner.x = oldInner.x;
        inner.y = oldInner.y;
        rail.x = oldRail.x;
        rail.y = oldRail.y;
      }
    }
  }
}
