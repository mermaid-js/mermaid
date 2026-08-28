import {
  applyLineJumpsToSvg,
  type EdgeGeom,
} from '../../rendering-elements/lineJump.js';
import type { CommonLayoutPaintContext } from '../common/index.js';
import type { LayoutData } from '../../types.js';
/**
 * Radius of the arc drawn where one edge hops another.
 *
 * Fixed rather than configurable: a hop reads as a hop because every one in the
 * diagram is the same size, and `lineJump` already shrinks or drops an
 * individual arc where a bend leaves it no room. `elk.lineHops` therefore
 * exposes the STYLE (`arc` or `gap`) but not the radius, since a per-diagram
 * radius would be a knob whose only good value is this one.
 */
const JUMP_RADIUS = 6;

/**
 * The paint groups `applyElkLineJumps` needs off the measure context.
 *
 * The selection type is taken from `applyLineJumpsToSvg`'s own signature rather
 * than named here: `D3Selection` is not part of mermaid's public surface, and
 * deriving it keeps the two in step without widening that surface.
 */
interface EdgePaintGroups {
  groups: { edgePaths: Parameters<typeof applyLineJumpsToSvg>[0] };
}

/**
 * Draw a hop where two edges cross.
 *
 * Runs as `afterPaint`, because a hop is a property of the rendered path rather
 * than of the layout: the crossings are only known once every edge has been
 * emitted, and the fix is to rewrite the `d` of the edge that gives way.
 *
 * ELK's curve is compatible either way — `applyElkEdgeLayout` sets `rounded`
 * for a routed edge and `linear` for its straight-line fallback, and
 * `curveSupportsLineHops` accepts both. An edge that takes a hop loses its
 * corner rounding in exchange, which is the trade the line-jump module
 * documents.
 */
export function applyElkLineJumps(
  data4Layout: LayoutData,
  { measure }: CommonLayoutPaintContext<unknown, EdgePaintGroups>
): void {
  const lineHops = (data4Layout.config as { elk?: { lineHops?: boolean | string } })?.elk?.lineHops;
  if (lineHops === false) {
    return;
  }

  const edgeGeometries: EdgeGeom[] = data4Layout.edges
    .filter(
      (edge): edge is typeof edge & { points: EdgeGeom['points'] } =>
        Array.isArray(edge.points) && edge.points.length >= 2
    )
    .map((edge) => ({
      id: edge.id,
      points: edge.points,
      curve: edge.curve,
      arrowTypeStart: edge.arrowTypeStart,
      arrowTypeEnd: edge.arrowTypeEnd,
    }));

  applyLineJumpsToSvg(measure.groups.edgePaths, edgeGeometries, {
    enabled: true,
    jumpRadius: JUMP_RADIUS,
    jumpStyle: lineHops === 'gap' ? 'gap' : 'arc',
  });
}
