import { log } from '$root/logger.js';
import { state } from './shapes/state.ts';
import { roundedRect } from './shapes/roundedRect.ts';
import { squareRect } from './shapes/squareRect.ts';
import { stateStart } from './shapes/stateStart.ts';
import { stateEnd } from './shapes/stateEnd.ts';
import { forkJoin } from './shapes/forkJoin.ts';
import { choice } from './shapes/choice.ts';
import { note } from './shapes/note.ts';
import { stadium } from './shapes/stadium.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import { subroutine } from './shapes/subroutine.js';
import { cylinder } from './shapes/cylinder.js';
import { circle } from './shapes/circle.js';
import { doublecircle } from './shapes/doubleCircle.js';
import { rect_left_inv_arrow } from './shapes/rectLeftInvArrow.js';
import { question } from './shapes/question.js';
import { hexagon } from './shapes/hexagon.js';
import { lean_right } from './shapes/leanRight.js';
import { lean_left } from './shapes/leanLeft.js';
import { trapezoid } from './shapes/trapezoid.js';
import { inv_trapezoid } from './shapes/invertedTrapezoid.js';
const formatClass = (str) => {
  if (str) {
    return ' ' + str;
  }
  return '';
};

const shapes = {
  state,
  stateStart,
  stateEnd,
  fork: forkJoin,
  join: forkJoin,
  choice,
  note,
  roundedRect,
  rectWithTitle: roundedRect,
  squareRect,
  stadium,
  subroutine,
  cylinder,
  circle,
  doublecircle,
  odd: rect_left_inv_arrow,
  diamond: question,
  hexagon,
  lean_right,
  lean_left,
  trapezoid,
  inv_trapezoid,
};

let nodeElems = {};

export const insertNode = async (elem, node, dir) => {
  let newEl;
  let el;

  //special check for rect shape (with or without rounded corners)
  if (node.shape === 'rect') {
    if (node.rx && node.ry) {
      node.shape = 'roundedRect';
    } else {
      node.shape = 'squareRect';
    }
  }

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
  // MC Special
  newEl.attr('data-id', node.id);
  newEl.attr('data-node', true);
  newEl.attr('data-et', 'node');
  newEl.attr('data-look', node.look);

  if (node.tooltip) {
    el.attr('title', node.tooltip);
  }
  // if (node.class) {
  //   el.attr('class', 'node default ' + node.class);
  // }

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

  const diff = 0;
  if (node.clusterNode) {
    el.attr(
      'transform',
      'translate(' + (node.x + diff - node.width / 2) + ', ' + (node.y - node.height / 2) + ')'
    );
  } else {
    el.attr('transform', 'translate(' + node.x + ', ' + node.y + ')');
  }
  return diff;
};
