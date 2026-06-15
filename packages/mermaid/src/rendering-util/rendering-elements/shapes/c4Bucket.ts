import { labelHelper, updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String } from './handDrawnShapeStyles.js';
import type { D3Selection } from '../../../types.js';

/** C4 bucket shape: an open-top container narrowing to a curved base, for object storage. */
export async function c4Bucket<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));

  const padding = node.padding ?? 12;
  const w = Math.max(bbox.width + padding * 2, 80);
  const rimRy = Math.max(Math.min(w * 0.08, 12), 5);
  const totalHeight = bbox.height + padding * 2 + rimRy;
  const topY = -totalHeight / 2 + rimRy;
  const bottomY = totalHeight / 2;
  const bottomW = w * 0.72;

  const group = shapeSvg.insert('g', ':first-child').attr('class', 'basic label-container');

  const body = [
    `M${-w / 2},${topY}`,
    `L${-bottomW / 2},${bottomY}`,
    `A${bottomW / 2},${rimRy} 0 0 0 ${bottomW / 2},${bottomY}`,
    `L${w / 2},${topY}`,
    `A${w / 2},${rimRy} 0 0 1 ${-w / 2},${topY}`,
    `Z`,
  ].join(' ');

  group.append('path').attr('d', body).attr('style', nodeStyles);
  group
    .append('ellipse')
    .attr('cx', 0)
    .attr('cy', topY)
    .attr('rx', w / 2)
    .attr('ry', rimRy)
    .attr('style', nodeStyles)
    .style('fill', 'none');

  updateNodeBounds(node, group);

  const bodyCenterY = topY + (bottomY - topY) / 2;
  label.attr(
    'transform',
    `translate(${-(bbox.width / 2) - (bbox.x - (bbox.left ?? 0))}, ${bodyCenterY - bbox.height / 2 - (bbox.y - (bbox.top ?? 0))})`
  );

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
