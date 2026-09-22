import type { LayoutData } from '../../types.js';
import { applyLineJumpsToSvg } from '../../rendering-elements/lineJump.js';
import type { CommonLayoutPaintContext } from '../common/index.js';

export function applySwimlaneLineJumps(
  data4Layout: LayoutData,
  { measure }: CommonLayoutPaintContext
): void {
  const lineHopsConfig = data4Layout.config?.swimlane?.lineHops;
  if (lineHopsConfig === false) {
    return;
  }

  const jumpStyle: 'arc' | 'gap' = lineHopsConfig === 'gap' ? 'gap' : 'arc';
  const edgeGeometries = data4Layout.edges
    .filter((edge) => Array.isArray(edge.points) && edge.points.length >= 2)
    .map((edge) => ({
      id: edge.id,
      points: edge.points!,
      curve: edge.curve,
      arrowTypeStart: edge.arrowTypeStart,
      arrowTypeEnd: edge.arrowTypeEnd,
    }));

  applyLineJumpsToSvg(measure.groups.edgePaths, edgeGeometries, {
    enabled: true,
    jumpRadius: 6,
    jumpStyle,
  });
}
