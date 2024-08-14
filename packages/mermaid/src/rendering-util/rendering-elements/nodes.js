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
import { rectWithTitle } from './shapes/rectWithTitle.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import { subroutine } from './shapes/subroutine.js';
import { cylinder } from './shapes/cylinder.js';
import { circle } from './shapes/circle.js';
import { doublecircle } from './shapes/doubleCircle.js';
import { rect_left_inv_arrow } from './shapes/rectLeftInvArrow.js';
import { question } from './shapes/question.js';
import { hexagon } from './shapes/hexagon.js';
import { text } from './shapes/text.js';
import { card } from './shapes/card.js';
import { shadedProcess } from './shapes/shadedProcess.js';
import { anchor } from './shapes/anchor.js';
import { lean_right } from './shapes/leanRight.js';
import { lean_left } from './shapes/leanLeft.js';
import { trapezoid } from './shapes/trapezoid.js';
import { inv_trapezoid } from './shapes/invertedTrapezoid.js';
import { labelRect } from './shapes/labelRect.js';
import { triangle } from './shapes/triangle.js';
import { halfRoundedRectangle } from './shapes/halfRoundedRectangle.js';
import { curvedTrapezoid } from './shapes/curvedTrapezoid.js';
import { slopedRect } from './shapes/slopedRect.js';
import { bowTieRect } from './shapes/bowTieRect.js';
import { dividedRect } from './shapes/dividedRect.js';
import { crossedCircle } from './shapes/crossedCircle.js';
import { waveRectangle } from './shapes/waveRectangle.js';
import { tiltedCylinder } from './shapes/tiltedCylinder.js';
import { trapezoidalPentagon } from './shapes/trapezoidalPentagon.js';
import { flippedTriangle } from './shapes/flippedTriangle.js';
import { hourglass } from './shapes/hourglass.js';
import { taggedRect } from './shapes/taggedRect.js';
import { multiRect } from './shapes/multiRect.js';
import { linedCylinder } from './shapes/linedCylinder.js';
import { waveEdgedRectangle } from './shapes/waveEdgedRectangle.js';
import { lightningBolt } from './shapes/lightningBolt.js';
import { filledCircle } from './shapes/filledCircle.js';

const shapes = {
  state,
  stateStart,
  stateEnd,
  fork: forkJoin,
  join: forkJoin,
  choice,
  note,
  roundedRect,
  rectWithTitle,
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
  labelRect,
  text,
  card,
  shadedProcess,
  anchor,
  triangle,
  halfRoundedRectangle,
  curvedTrapezoid,
  slopedRect,
  bowTieRect,
  dividedRect,
  crossedCircle,
  waveRectangle,
  tiltedCylinder,
  trapezoidalPentagon,
  flippedTriangle,
  hourglass,
  taggedRect,
  multiRect,
  linedCylinder,
  waveEdgedRectangle,
  lightningBolt,
  filledCircle,
};

const nodeElems = new Map();

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
  if (node.tooltip) {
    el.attr('title', node.tooltip);
  }

  nodeElems.set(node.id, newEl);

  if (node.haveCallback) {
    nodeElems.get(node.id).attr('class', nodeElems.get(node.id).attr('class') + ' clickable');
  }
  return newEl;
};
export const setNodeElem = (elem, node) => {
  nodeElems.set(node.id, elem);
};
export const clear = () => {
  nodeElems.clear();
};

export const positionNode = (node) => {
  const el = nodeElems.get(node.id);
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
