import type { LayoutData } from '../../types.js';
import { applyLineJumpsToSvg, normalizeLineHops } from '../../rendering-elements/lineJump.js';
import type { CommonLayoutPaintContext } from '../common/index.js';

export function applySwimlaneLineJumps(
  data4Layout: LayoutData,
  { measure }: CommonLayoutPaintContext
): void {
  const lineHops = normalizeLineHops(data4Layout.config?.swimlane?.lineHops);
  if (lineHops === false) {
    return;
  }

  const edgeGeometries = data4Layout.edges
    .filter((edge) => Array.isArray(edge.points) && edge.points.length >= 2)
    .map((edge) => ({
      // The shared line-hop pass must reconstruct the same corners the renderer originally drew.
      id: edge.id,
      points: edge.points!,
      curve: edge.curve,
      cornerRadius: edge.cornerRadius,
      arrowTypeStart: edge.arrowTypeStart,
      arrowTypeEnd: edge.arrowTypeEnd,
    }));

  applyLineJumpsToSvg(measure.groups.edgePaths, edgeGeometries, {
    enabled: true,
    jumpRadius: 6,
    jumpStyle: lineHops,
  });
}
