import intersectRect from './intersect/intersect-rect';
import { log } from '../logger';
import createLabel from './createLabel';
import { select } from 'd3';
import { getConfig } from '../config';
import { evaluate } from '../diagrams/common/common';

const rect = (parent, node) => {
  log.trace('Creating subgraph rect for ', node.id, node);

  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'cluster' + (node.class ? ' ' + node.class : ''))
    .attr('id', node.id);

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  // Create the label and insert it after the rect
  const label = shapeSvg.insert('g').attr('class', 'cluster-label');

  const text = label
    .node()
    .appendChild(createLabel(node.labelText, node.labelStyle, undefined, true));

  // Get the size of the label
  let bbox = text.getBBox();

  if (evaluate(getConfig().flowchart.htmlLabels)) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  const padding = 0 * node.padding;
  const halfPadding = padding / 2;

  const width = node.width <= bbox.width + padding ? bbox.width + padding : node.width;
  if (node.width <= bbox.width + padding) {
    node.diff = (bbox.width - node.width) / 2;
  } else {
    node.diff = -node.padding / 2;
  }

  log.trace('Data ', node, JSON.stringify(node));
  // center the rect around its coordinate
  rect
    .attr('style', node.style)
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('x', node.x - width / 2)
    .attr('y', node.y - node.height / 2 - halfPadding)
    .attr('width', width)
    .attr('height', node.height + padding);

  // Center the label
  label.attr(
    'transform',
    'translate(' +
      (node.x - bbox.width / 2) +
      ', ' +
      (node.y - node.height / 2 + node.padding / 3) +
      ')'
  );

  const rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return shapeSvg;
};

/**
 * Non visiable cluster where the note is group with its
 */
const noteGroup = (parent, node) => {
  // Add outer g element
  const shapeSvg = parent.insert('g').attr('class', 'note-cluster').attr('id', node.id);

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  const padding = 0 * node.padding;
  const halfPadding = padding / 2;

  // center the rect around its coordinate
  rect
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('x', node.x - node.width / 2 - halfPadding)
    .attr('y', node.y - node.height / 2 - halfPadding)
    .attr('width', node.width + padding)
    .attr('height', node.height + padding)
    .attr('fill', 'none');

  const rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return shapeSvg;
};
const roundedWithTitle = (parent, node) => {
  // Add outer g element
  const shapeSvg = parent.insert('g').attr('class', node.classes).attr('id', node.id);

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  // Create the label and insert it after the rect
  const label = shapeSvg.insert('g').attr('class', 'cluster-label');
  const innerRect = shapeSvg.append('rect');

  const text = label
    .node()
    .appendChild(createLabel(node.labelText, node.labelStyle, undefined, true));

  // Get the size of the label
  let bbox = text.getBBox();
  if (evaluate(getConfig().flowchart.htmlLabels)) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }
  bbox = text.getBBox();
  const padding = 0 * node.padding;
  const halfPadding = padding / 2;

  const width = node.width <= bbox.width + node.padding ? bbox.width + node.padding : node.width;
  if (node.width <= bbox.width + node.padding) {
    node.diff = (bbox.width + node.padding * 0 - node.width) / 2;
  } else {
    node.diff = -node.padding / 2;
  }

  // center the rect around its coordinate
  rect
    .attr('class', 'outer')
    .attr('x', node.x - width / 2 - halfPadding)
    .attr('y', node.y - node.height / 2 - halfPadding)
    .attr('width', width + padding)
    .attr('height', node.height + padding);
  innerRect
    .attr('class', 'inner')
    .attr('x', node.x - width / 2 - halfPadding)
    .attr('y', node.y - node.height / 2 - halfPadding + bbox.height - 1)
    .attr('width', width + padding)
    .attr('height', node.height + padding - bbox.height - 3);

  // Center the label
  label.attr(
    'transform',
    'translate(' +
      (node.x - bbox.width / 2) +
      ', ' +
      (node.y -
        node.height / 2 -
        node.padding / 3 +
        (evaluate(getConfig().flowchart.htmlLabels) ? 5 : 3)) +
      ')'
  );

  const rectBox = rect.node().getBBox();
  node.height = rectBox.height;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return shapeSvg;
};

const divider = (parent, node) => {
  // Add outer g element
  const shapeSvg = parent.insert('g').attr('class', node.classes).attr('id', node.id);

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  const padding = 0 * node.padding;
  const halfPadding = padding / 2;

  // center the rect around its coordinate
  rect
    .attr('class', 'divider')
    .attr('x', node.x - node.width / 2 - halfPadding)
    .attr('y', node.y - node.height / 2)
    .attr('width', node.width + padding)
    .attr('height', node.height + padding);

  const rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;
  node.diff = -node.padding / 2;
  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return shapeSvg;
};

const shapes = { rect, roundedWithTitle, noteGroup, divider };

let clusterElems = {};

export const insertCluster = (elem, node) => {
  log.trace('Inserting cluster');
  const shape = node.shape || 'rect';
  clusterElems[node.id] = shapes[shape](elem, node);
};
export const getClusterTitleWidth = (elem, node) => {
  const label = createLabel(node.labelText, node.labelStyle, undefined, true);
  elem.node().appendChild(label);
  const width = label.getBBox().width;
  elem.node().removeChild(label);
  return width;
};

export const clear = () => {
  clusterElems = {};
};

export const positionCluster = (node) => {
  log.info('Position cluster (' + node.id + ', ' + node.x + ', ' + node.y + ')');
  const el = clusterElems[node.id];

  el.attr('transform', 'translate(' + node.x + ', ' + node.y + ')');
};
