import {
  applyLineJumpsToSvg,
  type CommonLayoutPaintContext,
  type EdgeGeom,
  type LayoutData,
} from 'mermaid';

/** Radius of the arc drawn where one edge hops another. */
const JUMP_RADIUS = 6;

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
  { measure }: CommonLayoutPaintContext<unknown, { groups: { edgePaths: unknown } }>
): void {
  const lineHops = (data4Layout.config as { elk?: { lineHops?: boolean | string } })?.elk?.lineHops;
  if (lineHops === false) {
    return;
  }

  const edgeGeometries: EdgeGeom[] = data4Layout.edges
    .filter((edge) => Array.isArray(edge.points) && edge.points.length >= 2)
    .map((edge) => ({
      id: edge.id,
      points: edge.points!,
      curve: edge.curve,
      arrowTypeStart: edge.arrowTypeStart,
      arrowTypeEnd: edge.arrowTypeEnd,
    })) as EdgeGeom[];

  applyLineJumpsToSvg(
    (measure as { groups: { edgePaths: never } }).groups.edgePaths,
    edgeGeometries,
    {
      enabled: true,
      jumpRadius: JUMP_RADIUS,
      jumpStyle: lineHops === 'gap' ? 'gap' : 'arc',
    }
  );
}
