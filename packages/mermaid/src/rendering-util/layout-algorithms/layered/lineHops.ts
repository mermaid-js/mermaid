import {
  applyLineJumpsToSvg,
  normalizeLineHops,
  type EdgeGeom,
} from '../../rendering-elements/lineJump.js';
import type { LayoutData } from '../../types.js';
import type { CommonLayoutPaintContext } from '../common/index.js';

/** Radius of the arc drawn where one edge hops another, the same as the `elk` layout's. */
const JUMP_RADIUS = 6;

/** The paint groups `applyLayeredLineJumps` needs off the measure context. */
interface EdgePaintGroups {
  groups: { edgePaths: Parameters<typeof applyLineJumpsToSvg>[0] };
}

/**
 * Draws a hop where two edges cross (`layered.lineHops`), as the `elk` layout does (#8835).
 *
 * Runs as `afterPaint`: the crossings are only known once every edge is drawn, and the fix is
 * to rewrite the `d` of the edge that gives way. The `rounded`, `stepped` and `straight`
 * routings draw curves the line-jump module rewrites; `curved` keeps the edge's own smoothing
 * curve, which it skips.
 */
export function applyLayeredLineJumps(
  data: LayoutData,
  { measure }: CommonLayoutPaintContext<unknown, EdgePaintGroups>
): void {
  const lineHops = normalizeLineHops(data.config?.layered?.lineHops);
  if (lineHops === false) {
    return;
  }

  const edges: EdgeGeom[] = data.edges
    .filter(
      (edge): edge is typeof edge & { points: EdgeGeom['points'] } =>
        Array.isArray(edge.points) && edge.points.length >= 2
    )
    .map((edge) => ({
      id: edge.id,
      points: edge.points,
      curve: edge.curve,
      cornerRadius: edge.cornerRadius,
      arrowTypeStart: edge.arrowTypeStart,
      arrowTypeEnd: edge.arrowTypeEnd,
    }));

  applyLineJumpsToSvg(measure.groups.edgePaths, edges, {
    enabled: true,
    jumpRadius: JUMP_RADIUS,
    jumpStyle: lineHops,
  });
}
