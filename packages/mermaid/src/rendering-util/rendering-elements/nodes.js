import { log } from '$root/logger.js';
import { rect } from './shapes/rect.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';

const formatClass = (str) => {
  if (str) {
    return ' ' + str;
  }
  return '';
};

const shapes = {
  rect,
};

let nodeElems = {};

export const insertNode = async (elem, node, dir) => {
  let newEl;
  let el;

  console.log('insertNode element', elem, elem.node(), rect);
  // debugger;
  // Add link when appropriate
  if (node.link) {
    let target;
    if (getConfig().securityLevel === 'sandbox') {
      target = '_top';
    } else if (node.linkTarget) {
      target = node.linkTarget || '_blank';
    }
    newEl = elem.insert('svg:a').attr('xlink:href', node.link).attr('target', target);
    el = await shapes[node.shape](newEl, node, dir);
  } else {
    el = await shapes[node.shape](elem, node, dir);
    newEl = el;
  }
  if (node.tooltip) {
    el.attr('title', node.tooltip);
  }
  if (node.class) {
    el.attr('class', 'node default ' + node.class);
  }

  nodeElems[node.id] = newEl;

  if (node.haveCallback) {
    nodeElems[node.id].attr('class', nodeElems[node.id].attr('class') + ' clickable');
  }
  return newEl;
};
export const setNodeElem = (elem, node) => {
  nodeElems[node.id] = elem;
};
export const clear = () => {
  nodeElems = {};
};

export const positionNode = (node) => {
  const el = nodeElems[node.id];

  log.trace(
    'Transforming node',
    node.diff,
    node,
    'translate(' + (node.x - node.width / 2 - 5) + ', ' + node.width / 2 + ')'
  );
  const padding = 8;
  const diff = node.diff || 0;
  if (node.clusterNode) {
    el.attr(
      'transform',
      'translate(' +
        (node.x + diff - node.width / 2) +
        ', ' +
        (node.y - node.height / 2 - padding) +
        ')'
    );
  } else {
    el.attr('transform', 'translate(' + node.x + ', ' + node.y + ')');
  }
  return diff;
};
