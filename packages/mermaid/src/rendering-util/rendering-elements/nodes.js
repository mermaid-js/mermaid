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
import { dividedRectangle } from './shapes/dividedRect.js';
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
import { multiWaveEdgedRectangle } from './shapes/multiWaveEdgedRectangle.js';
import { windowPane } from './shapes/windowPane.js';
import { linedWaveEdgedRect } from './shapes/linedWaveEdgedRect.js';
import { taggedWaveEdgedRectangle } from './shapes/taggedWaveEdgedRectangle.js';
import { curlyBraceLeft } from './shapes/curlyBraceLeft.js';
import { curlyBraceRight } from './shapes/curlyBraceRight.js';
import { curlyBraces } from './shapes/curlyBraces.js';

//Use these names as the left side to render shapes.
const shapes = {
  // States
  state,
  stateStart,
  'small-circle': stateStart,
  'sm-circ': stateStart,
  start: stateStart,
  stateEnd,
  'framed-circle': stateEnd,
  stop: stateEnd,

  // Rectangles
  rectWithTitle,
  roundedRect,
  rounded: roundedRect,
  event: roundedRect,
  squareRect,
  rectangle: squareRect,
  rect: squareRect,
  process: squareRect,
  proc: squareRect,
  stadium,
  pill: stadium,
  term: stadium,
  windowPane,
  'window-pane': windowPane,
  'win-pane': windowPane,
  'internal-storage': windowPane,
  dividedRectangle,
  'divided-rectangle': dividedRectangle,
  'div-rect': dividedRectangle,
  'div-proc': dividedRectangle,
  taggedRect,
  'tagged-rect': taggedRect,
  'tag-rect': taggedRect,
  'tag-proc': taggedRect,
  multiRect,
  'multi-rect': multiRect,
  'mul-rect': multiRect,
  'mul-proc': multiRect,

  // Subroutine
  subroutine,
  'framed-rectangle': subroutine,
  fr: subroutine,
  subproc: subroutine,

  // Cylinders
  cylinder,
  cyl: cylinder,
  db: cylinder,
  tiltedCylinder,
  'tilted-cylinder': tiltedCylinder,
  't-cyl': tiltedCylinder,
  das: tiltedCylinder,
  linedCylinder,
  'lined-cylinder': linedCylinder,
  'l-cyl': linedCylinder,
  disk: linedCylinder,

  // Circles
  circle,
  doublecircle,
  'double-circle': doublecircle,
  dc: doublecircle,
  crossedCircle,
  'crossed-circle': crossedCircle,
  'cross-circle': crossedCircle,
  summary: crossedCircle,
  filledCircle,
  'filled-circle': filledCircle,
  fc: filledCircle,
  junction: filledCircle,
  shadedProcess,
  'lined-proc': shadedProcess,
  'lined-rect': shadedProcess,

  // Trapezoids
  trapezoid,
  trapezoidBaseBottom: trapezoid,
  'trapezoid-bottom': trapezoid,
  'trap-b': trapezoid,
  priority: trapezoid,
  inv_trapezoid,
  'trapezoid-top': inv_trapezoid,
  'trap-t': inv_trapezoid,
  manual: inv_trapezoid,
  curvedTrapezoid,
  'curved-trapezoid': curvedTrapezoid,
  'cur-trap': curvedTrapezoid,
  disp: curvedTrapezoid,

  // Hexagons & Misc Geometric
  hexagon,
  hex: hexagon,
  prepare: hexagon,
  triangle,
  'small-triangle': triangle,
  'sm-tri': triangle,
  extract: triangle,
  flippedTriangle,
  'flipped-triangle': flippedTriangle,
  'flip-tria': flippedTriangle,
  'manual-file': flippedTriangle,
  trapezoidalPentagon,
  'notched-pentagon': trapezoidalPentagon,
  'not-pent': trapezoidalPentagon,
  'loop-limit': trapezoidalPentagon,

  //wave Edged Rectangles
  waveRectangle,
  'wave-rectangle': waveRectangle,
  'w-rect': waveRectangle,
  flag: waveRectangle,
  'paper-tape': waveRectangle,
  waveEdgedRectangle,
  'wave-edge-rect': waveEdgedRectangle,
  'wave-rect': waveEdgedRectangle,
  'we-rect': waveEdgedRectangle,
  doc: waveEdgedRectangle,
  multiWaveEdgedRectangle,
  'multi-wave-edged-rectangle': multiWaveEdgedRectangle,
  'mul-we-rect': multiWaveEdgedRectangle,
  'mul-doc': multiWaveEdgedRectangle,
  linedWaveEdgedRect,
  'lined-wave-edged-rect': linedWaveEdgedRect,
  'lin-we-rect': linedWaveEdgedRect,
  'lin-doc': linedWaveEdgedRect,
  taggedWaveEdgedRectangle,
  'tagged-wave-edged-rectangle': taggedWaveEdgedRectangle,
  'tag-we-rect': taggedWaveEdgedRectangle,
  'tag-doc': taggedWaveEdgedRectangle,

  // Custom Rectangles
  bowTieRect,
  'bow-tie-rect': bowTieRect,
  'bt-rect': bowTieRect,
  'stored-data': bowTieRect,
  slopedRect,
  'sloped-rectangle': slopedRect,
  'sloped-rect': slopedRect,
  'manual-input': slopedRect,
  halfRoundedRectangle,
  'half-rounded-rect': halfRoundedRectangle,
  delay: halfRoundedRectangle,
  card,
  'notched-rect': card,
  'notch-rect': card,
  'lean-right': lean_right,
  lean_right: lean_right,
  'l-r': lean_right,
  'in-out': lean_right,
  'lean-left': lean_left,
  lean_left: lean_left,
  'l-l': lean_left,
  'out-in': lean_left,

  // Miscellaneous
  forkJoin,
  'long-rect': forkJoin,
  fork: forkJoin,
  join: forkJoin,
  choice,
  note,
  text,
  anchor,
  diamond: question,
  lightningBolt,
  'lightning-bolt': lightningBolt,
  bolt: lightningBolt,
  'com-link': lightningBolt,
  curlyBraceLeft,
  'brace-l': curlyBraceLeft,
  comment: curlyBraceLeft,
  hourglass,
  odd: rect_left_inv_arrow,
  labelRect,
  curlyBraceRight,
  'brace-r': curlyBraceRight,
  braces: curlyBraces,
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
