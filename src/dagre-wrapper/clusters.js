import intersectRect from './intersect/intersect-rect';
import { logger } from '../logger'; // eslint-disable-line
import createLabel from './createLabel';

const rect = (parent, node) => {
  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'cluster')
    .attr('id', node.id);

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  // Create the label and insert it after the rect
  const label = shapeSvg.insert('g').attr('class', 'cluster-label');

  const text = label.node().appendChild(createLabel(node.labelText, node.labelStyle));

  // Get the size of the label
  const bbox = text.getBBox();

  const padding = 0 * node.padding;
  const halfPadding = padding / 2;

  // center the rect around its coordinate
  rect
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('x', node.x - node.width / 2 - halfPadding)
    .attr('y', node.y - node.height / 2 - halfPadding)
    .attr('width', node.width + padding)
    .attr('height', node.height + padding);

  // logger.info('bbox', bbox.width, node.x, node.width);
  // Center the label
  // label.attr('transform', 'translate(' + adj + ', ' + (node.y - node.height / 2) + ')');
  label.attr(
    'transform',
    'translate(' +
      (node.x - bbox.width / 2) +
      ', ' +
      (node.y - node.height / 2 - node.padding / 3 + 3) +
      ')'
  );

  const rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;

  node.intersect = function(point) {
    return intersectRect(node, point);
  };

  return shapeSvg;
};

const shapes = { rect };

let clusterElems = {};

export const insertCluster = (elem, node) => {
  clusterElems[node.id] = shapes[node.shape](elem, node);
};
export const getClusterTitleWidth = (elem, node) => {
  const label = createLabel(node.labelText, node.labelStyle);
  elem.node().appendChild(label);
  const width = label.getBBox().width;
  elem.node().removeChild(label);
  return width;
};

export const clear = () => {
  clusterElems = {};
};

export const positionCluster = node => {
  const el = clusterElems[node.id];
  el.attr('transform', 'translate(' + node.x + ', ' + node.y + ')');
};
