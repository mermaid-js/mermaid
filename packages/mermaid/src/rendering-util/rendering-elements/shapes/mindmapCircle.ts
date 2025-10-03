import type { Node } from '../../types.js';
import type { D3Selection } from '../../../types.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import { styles2String } from './handDrawnShapeStyles.js';
import intersect from '../intersect/index.js';
import {
  getMindmapIconConfig,
  calculateMindmapDimensions,
  insertMindmapIcon,
} from '../../../diagrams/mindmap/mindmapIconHelper.js';

export async function mindmapCircle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const halfPadding = (node.padding ?? 0) / 2;

  const iconConfig = getMindmapIconConfig('circle');
  const baseRadius = bbox.width / 2 + halfPadding;
  const baseDiameter = baseRadius * 2;

  const dimensions = calculateMindmapDimensions(
    node,
    bbox,
    baseDiameter,
    baseDiameter,
    halfPadding,
    iconConfig
  );

  const radius = dimensions.width / 2;
  node.width = dimensions.width;
  node.height = dimensions.height;

  label.attr('transform', `translate(${dimensions.labelOffset.x}, ${dimensions.labelOffset.y})`);

  const circle = shapeSvg
    .insert('circle', ':first-child')
    .attr('r', radius)
    .attr('class', 'basic label-container')
    .attr('style', styles2String(node).nodeStyles);

  shapeSvg.append(() => label.node());

  if (node.icon) {
    await insertMindmapIcon(shapeSvg, node, iconConfig);
  }

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    return intersect.circle(node, radius, point);
  };

  return shapeSvg;
}
