import { log } from '$root/logger.js';
import { updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import type { SVG } from '$root/diagram-api/types.js';

export const forkJoin = (parent: SVG, node: Node, dir: string) => {
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);

  let width = 70;
  let height = 10;

  if (dir === 'LR') {
    width = 10;
    height = 70;
  }

  const shape = shapeSvg
    .append('rect')
    .attr('x', (-1 * width) / 2)
    .attr('y', (-1 * height) / 2)
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'fork-join');

  updateNodeBounds(node, shape);
  let nodeHeight = 0;
  let nodeWidth = 0;
  let nodePadding = 10;
  if (node.height) {
    nodeHeight = node.height;
  }
  if (node.width) {
    nodeWidth = node.width;
  }

  if (node.padding) {
    nodePadding = node.padding;
  }

  node.height = nodeHeight + nodePadding / 2;
  node.width = nodeWidth + nodePadding / 2;
  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};
