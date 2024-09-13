import { log } from '../../logger.js';
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
import { iconSquare } from './shapes/iconSquare.js';
import { iconCircle } from './shapes/iconCircle.js';
import { icon } from './shapes/icon.js';
import { imageSquare } from './shapes/imageSquare.js';
import { iconRounded } from './shapes/iconRounded.js';

//Use these names as the left side to render shapes.
export const shapes = {
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
  'window-pane': windowPane,
  'win-pane': windowPane,
  'internal-storage': windowPane,
  'divided-rectangle': dividedRectangle,
  'div-rect': dividedRectangle,
  'div-proc': dividedRectangle,
  'tagged-rect': taggedRect,
  'tag-rect': taggedRect,
  'tag-proc': taggedRect,
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
  'tilted-cylinder': tiltedCylinder,
  't-cyl': tiltedCylinder,
  das: tiltedCylinder,
  'lined-cylinder': linedCylinder,
  'l-cyl': linedCylinder,
  disk: linedCylinder,

  // Circles
  circle,
  'double-circle': doublecircle,
  dc: doublecircle,
  'crossed-circle': crossedCircle,
  'cross-circle': crossedCircle,
  summary: crossedCircle,
  'filled-circle': filledCircle,
  fc: filledCircle,
  junction: filledCircle,
  'lined-proc': shadedProcess,
  'lined-rect': shadedProcess,
  'shaded-proc': shadedProcess,

  // Trapezoids
  trapezoid,
  'trapezoid-bottom': trapezoid,
  'trap-b': trapezoid,
  priority: trapezoid,
  inv_trapezoid,
  'inv-trapezoid': inv_trapezoid,
  'trapezoid-top': inv_trapezoid,
  'trap-t': inv_trapezoid,
  manual: inv_trapezoid,
  'curved-trapezoid': curvedTrapezoid,
  'cur-trap': curvedTrapezoid,
  disp: curvedTrapezoid,
  display: curvedTrapezoid,

  // Hexagons & Misc Geometric
  hexagon,
  hex: hexagon,
  prepare: hexagon,
  triangle,
  'small-triangle': triangle,
  'sm-tri': triangle,
  extract: triangle,
  'flipped-triangle': flippedTriangle,
  'flip-tri': flippedTriangle,
  'manual-file': flippedTriangle,
  'notched-pentagon': trapezoidalPentagon,
  'notch-pent': trapezoidalPentagon,
  'loop-limit': trapezoidalPentagon,

  //wave Edged Rectangles
  'wave-rectangle': waveRectangle,
  'w-rect': waveRectangle,
  flag: waveRectangle,
  'paper-tape': waveRectangle,
  'wave-edge-rect': waveEdgedRectangle,
  'wave-edged-rectangle': waveEdgedRectangle,
  'wave-rect': waveEdgedRectangle,
  'we-rect': waveEdgedRectangle,
  doc: waveEdgedRectangle,
  'multi-wave-edged-rectangle': multiWaveEdgedRectangle,
  'mul-we-rect': multiWaveEdgedRectangle,
  'mul-doc': multiWaveEdgedRectangle,
  'lined-wave-edged-rect': linedWaveEdgedRect,
  'lin-we-rect': linedWaveEdgedRect,
  'lin-doc': linedWaveEdgedRect,
  'tagged-wave-edged-rectangle': taggedWaveEdgedRectangle,
  'tag-we-rect': taggedWaveEdgedRectangle,
  'tag-doc': taggedWaveEdgedRectangle,

  // Custom Rectangles
  'bow-tie-rect': bowTieRect,
  'bt-rect': bowTieRect,
  'stored-data': bowTieRect,
  'sloped-rectangle': slopedRect,
  'sloped-rect': slopedRect,
  'manual-input': slopedRect,
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
  diam: question,
  decision: question,
  'lightning-bolt': lightningBolt,
  bolt: lightningBolt,
  'com-link': lightningBolt,
  'brace-l': curlyBraceLeft,
  brace: curlyBraceLeft,
  comment: curlyBraceLeft,
  hourglass,
  odd: rect_left_inv_arrow,
  labelRect,
  'brace-r': curlyBraceRight,
  braces: curlyBraces,
  iconSquare,
  iconCircle,
  icon,
  iconRounded,
  imageSquare,
};

const nodeElems = new Map();

export const insertNode = async (elem, node, config) => {
  let newEl;
  let el;

  // console.log("node is ", node.icon, node.shape)

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
    if (config.securityLevel === 'sandbox') {
      target = '_top';
    } else if (node.linkTarget) {
      target = node.linkTarget || '_blank';
    }
    newEl = elem.insert('svg:a').attr('xlink:href', node.link).attr('target', target);
    el = await shapes[node.shape](newEl, node, config);
  } else {
    el = await shapes[node.shape](elem, node, config);
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
