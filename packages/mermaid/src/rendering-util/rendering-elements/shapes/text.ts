import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';

export async function text<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));

  const totalWidth = Math.max(bbox.width + node.padding, node?.width || 0);
  const totalHeight = Math.max(bbox.height + node.padding, node?.height || 0);
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;

  const rect = shapeSvg.insert('rect', ':first-child');

  rect
    .attr('class', 'text')
    .attr('style', nodeStyles)
    .attr('rx', 0)
    .attr('ry', 0)
    .attr('x', x)
    .attr('y', y)
    .attr('width', totalWidth)
    .attr('height', totalHeight);

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
