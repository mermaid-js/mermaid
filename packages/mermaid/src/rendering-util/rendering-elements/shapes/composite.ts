import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import intersect from '../intersect/index.js';
import { labelHelper, updateNodeBounds } from './util.js';

type CompositeNode = Node & {
  class?: string;
  positioned?: boolean;
  style?: string;
};

export async function composite<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const compositeNode = node as CompositeNode;
  const classes = ['node', compositeNode.cssClasses, compositeNode.class].filter(Boolean).join(' ');
  const { shapeSvg, bbox, halfPadding } = await labelHelper(parent, compositeNode, classes);
  const rect = shapeSvg.insert('rect', ':first-child');
  const nodePadding = compositeNode.padding ?? 0;
  const totalWidth = compositeNode.positioned
    ? (compositeNode.width ?? 0)
    : bbox.width + nodePadding;
  const totalHeight = compositeNode.positioned
    ? (compositeNode.height ?? 0)
    : bbox.height + nodePadding;
  const x = compositeNode.positioned ? -totalWidth / 2 : -bbox.width / 2 - halfPadding;
  const y = compositeNode.positioned ? -totalHeight / 2 : -bbox.height / 2 - halfPadding;

  rect
    .attr('class', 'basic cluster composite label-container')
    .attr('style', compositeNode.style ?? null)
    .attr('rx', compositeNode.rx ?? null)
    .attr('ry', compositeNode.ry ?? null)
    .attr('x', x)
    .attr('y', y)
    .attr('width', totalWidth)
    .attr('height', totalHeight);

  updateNodeBounds(compositeNode, rect);

  compositeNode.intersect = function (point) {
    return intersect.rect(compositeNode, point);
  };

  return shapeSvg;
}
