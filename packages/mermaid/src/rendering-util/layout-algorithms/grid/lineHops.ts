import {
  applyLineJumpsToSvg,
  normalizeLineHops,
  type EdgeGeom,
} from '../../rendering-elements/lineJump.js';
import type { LayoutData } from '../../types.js';
import type { CommonLayoutPaintContext } from '../common/index.js';

interface EdgePaintGroups {
  groups: { edgePaths: Parameters<typeof applyLineJumpsToSvg>[0] };
}

export function applyGridLineJumps(
  data: LayoutData,
  { measure }: CommonLayoutPaintContext<unknown, EdgePaintGroups>
): void {
  const lineHops = normalizeLineHops(data.config.grid?.lineHops);
  if (lineHops === false) {
    return;
  }

  const edges = data.edges
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
    jumpRadius: 6,
    jumpStyle: lineHops,
  });
}
