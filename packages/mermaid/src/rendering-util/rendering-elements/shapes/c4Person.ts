import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';

/**
 * C4 person shape: a rounded box body with a circular head overlapping the
 * top edge, as used in C4 model notation for Person / Person_Ext elements.
 */
export async function c4Person<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const padding = node.padding ?? 12;
  const w = Math.max(bbox.width + padding * 2, 80);
  const bodyHeight = bbox.height + padding * 2;
  const headRadius = Math.max(Math.min(w * 0.16, 24), 14);
  const totalHeight = bodyHeight + headRadius;

  const bodyTop = -totalHeight / 2 + headRadius;

  const group = shapeSvg.insert('g', ':first-child').attr('class', 'basic label-container');

  // Head first so the body covers its lower half.
  group
    .append('circle')
    .attr('cx', 0)
    .attr('cy', bodyTop)
    .attr('r', headRadius)
    .attr('style', nodeStyles);

  group
    .append('rect')
    .attr('x', -w / 2)
    .attr('y', bodyTop)
    .attr('width', w)
    .attr('height', bodyHeight)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('style', nodeStyles);

  updateNodeBounds(node, group);

  const bodyCenterY = bodyTop + bodyHeight / 2;
  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${bodyCenterY - bbox.height / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
