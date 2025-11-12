import type { Bounds, D3Selection, Point } from '../../../types.js';
import type { Node } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String } from './handDrawnShapeStyles.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';
import {
  getMindmapIconConfig,
  calculateMindmapDimensions,
  insertMindmapIcon,
} from '../../../diagrams/mindmap/mindmapIconHelper.js';

export async function defaultMindmapNode<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, halfPadding, label } = await labelHelper(
    parent,
    node,
    getNodeClasses(node)
  );

  const baseWidth = bbox.width + 8 * halfPadding;
  const baseHeight = bbox.height + 2 * halfPadding;

  const iconConfig = getMindmapIconConfig('default');
  const dimensions = calculateMindmapDimensions(
    node,
    bbox,
    baseWidth,
    baseHeight,
    halfPadding,
    iconConfig
  );

  const w = dimensions.width;
  const h = dimensions.height;

  node.width = w;
  node.height = h;

  label.attr('transform', `translate(${dimensions.labelOffset.x}, ${dimensions.labelOffset.y})`);

  const RD = 5;
  const rectPath = `M${-w / 2} ${h / 2 - RD} 
    v${-h + 2 * RD} 
    q0,-${RD} ${RD},-${RD} 
    h${w - 2 * RD} 
    q${RD},0 ${RD},${RD} 
    v${h - 2 * RD} 
    q0,${RD} -${RD},${RD} 
    h${-w + 2 * RD} 
    q-${RD},0 -${RD},-${RD} 
    Z`;

  const bg = shapeSvg
    .append('path')
    .attr('id', 'node-' + node.id)
    .attr('class', 'node-bkg node-' + node.type)
    .attr('style', nodeStyles)
    .attr('d', rectPath);

  shapeSvg
    .append('line')
    .attr('class', 'node-line-')
    .attr('x1', -w / 2)
    .attr('y1', h / 2)
    .attr('x2', w / 2)
    .attr('y2', h / 2);

  shapeSvg.append(() => label.node());

  if (node.icon) {
    await insertMindmapIcon(shapeSvg, node, iconConfig);
  }

  updateNodeBounds(node, bg);
  node.calcIntersect = function (bounds: Bounds, point: Point) {
    return intersect.rect(bounds, point);
  };
  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
