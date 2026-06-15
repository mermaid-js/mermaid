import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';

/** C4 browser shape: a rounded box with a window chrome bar, for single-page applications. */
export async function c4Browser<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const padding = node.padding ?? 12;
  const barHeight = 16;
  const w = Math.max(bbox.width + padding * 2, 80);
  const h = bbox.height + padding * 2 + barHeight;
  const top = -h / 2;

  const group = shapeSvg.insert('g', ':first-child').attr('class', 'basic label-container');

  group
    .append('rect')
    .attr('x', -w / 2)
    .attr('y', top)
    .attr('width', w)
    .attr('height', h)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('style', nodeStyles);

  group
    .append('line')
    .attr('x1', -w / 2)
    .attr('y1', top + barHeight)
    .attr('x2', w / 2)
    .attr('y2', top + barHeight)
    .attr('style', nodeStyles)
    .style('fill', 'none');

  for (let i = 0; i < 3; i++) {
    group
      .append('circle')
      .attr('cx', -w / 2 + 12 + i * 10)
      .attr('cy', top + barHeight / 2)
      .attr('r', 2.5)
      .attr('style', 'fill:rgba(255,255,255,0.7);stroke:none');
  }

  updateNodeBounds(node, group);

  const bodyCenterY = top + barHeight + (h - barHeight) / 2;
  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${bodyCenterY - bbox.height / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
