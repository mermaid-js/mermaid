import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';

/**
 * C4 person shape: a circular head above a rounded-rectangle body, as used in
 * C4 model notation for Person / Person_Ext elements.
 */
export async function c4Person<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const padding = node.padding ?? 20;
  const w = Math.max(bbox.width + padding * 2, 100);
  const bodyHeight = bbox.height + padding * 2;
  // Proportions taken from the c4model.com person: head radius 0.23x the body
  // width, overlapping the body by 0.27x the head radius, body corners 0.177x
  // the width.
  const headRadius = Math.max(w * 0.23, 16);
  const overlap = headRadius * 0.27;
  const bodyRadius = Math.min(w * 0.177, bodyHeight * 0.45);
  const totalHeight = bodyHeight + 2 * headRadius - overlap;
  const top = -totalHeight / 2;
  const bodyTop = top + 2 * headRadius - overlap;

  const group = shapeSvg.insert('g', ':first-child').attr('class', 'basic label-container');

  // Body first, then the head drawn on top so the full circle stays visible.
  // The radius is set inline so it overrides the shared .c4-shape rect rule.
  group
    .append('rect')
    .attr('x', -w / 2)
    .attr('y', bodyTop)
    .attr('width', w)
    .attr('height', bodyHeight)
    .attr('rx', bodyRadius)
    .attr('ry', bodyRadius)
    .attr('style', `${nodeStyles};rx:${bodyRadius}px;ry:${bodyRadius}px`);

  group
    .append('circle')
    .attr('cx', 0)
    .attr('cy', top + headRadius)
    .attr('r', headRadius)
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
