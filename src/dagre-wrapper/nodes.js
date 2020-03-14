import intersectRect from './intersect/intersect-rect';
import { logger } from '../logger'; // eslint-disable-line
import createLabel from './createLabel';

const rect = (parent, node) => {
  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.id);

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  // Create the label and insert it after the rect
  const label = shapeSvg.insert('g').attr('class', 'label');

  const text = label.node().appendChild(createLabel(node.labelText, node.labelStyle));

  // Get the size of the label
  const bbox = text.getBBox();

  const halfPadding = node.padding / 2;

  // center the rect around its coordinate
  rect
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('x', -bbox.width / 2 - halfPadding)
    .attr('y', -bbox.height / 2 - halfPadding)
    .attr('width', bbox.width + node.padding)
    .attr('height', bbox.height + node.padding);

  // Center the label
  label.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');

  const rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;

  node.intersect = function(point) {
    return intersectRect(node, point);
  };

  return shapeSvg;
};

const shapes = { rect };

let nodeElems = {};

export const insertNode = (elem, node) => {
  nodeElems[node.id] = shapes[node.shape](elem, node);
};
export const clear = () => {
  nodeElems = {};
};

export const positionNode = node => {
  const el = nodeElems[node.id];
  el.attr('transform', 'translate(' + node.x + ', ' + node.y + ')');
};
