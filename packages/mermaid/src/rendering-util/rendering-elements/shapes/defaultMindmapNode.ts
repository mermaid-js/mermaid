import type { Bounds, D3Selection, Point } from '../../../types.js';
import type { Node } from '../../types.js';
import intersect from '../intersect/index.js';
import { styles2String } from './handDrawnShapeStyles.js';
import { getNodeClasses, labelHelper, updateNodeBounds } from './util.js';

const ICON_SIZE = 30;
const ICON_PADDING = 15;

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

  let w = bbox.width + 8 * halfPadding;
  let h = bbox.height + 2 * halfPadding;

  if (node.icon) {
    const minWidthWithIcon = bbox.width + ICON_SIZE + ICON_PADDING * 2 + 8 * halfPadding;
    w = Math.max(w, minWidthWithIcon);
    h = Math.max(h, ICON_SIZE + 2 * halfPadding);

    node.width = w;
    node.height = h;

    const availableTextSpace = w - ICON_SIZE - ICON_PADDING * 2;
    const labelXOffset =
      -w / 2 + ICON_SIZE + ICON_PADDING + availableTextSpace / 2 - bbox.width / 2;
    label.attr('transform', `translate(${labelXOffset}, ${-bbox.height / 2})`);
  } else {
    label.attr('transform', `translate(${-bbox.width / 2}, ${-bbox.height / 2})`);
  }

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

  updateNodeBounds(node, bg);
  node.calcIntersect = function (bounds: Bounds, point: Point) {
    return intersect.rect(bounds, point);
  };
  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
