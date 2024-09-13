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
  stateEnd,
  forkJoin,
  choice,
  note,

  // Rectangles
  rectWithTitle,
  roundedRect,
  squareRect,

  // Rectangle with alias: 'process', 'rect', 'proc', 'rectangle'
  rectangle: squareRect,
  rect: squareRect,
  process: squareRect,
  proc: squareRect,

  // Rounded Rectangle with alias: 'event', 'rounded'
  rounded: roundedRect,
  event: roundedRect,

  // Stadium with alias: 'terminal','pill', 'stadium'
  stadium,
  pill: stadium,
  terminal: stadium,

  // Subprocess with alias: 'fr-rect', 'subproc', 'subprocess', 'framed-rectangle', 'subroutine'
  subroutine,
  'framed-rectangle': subroutine,
  'fr-rect': subroutine,
  subprocess: subroutine,
  subproc: subroutine,

  // Cylinder with alias: 'db', 'database', 'cylinder', 'cyl'
  cylinder,
  db: cylinder,
  cyl: cylinder,
  database: cylinder,

  // Diamond with alias: 'diam', 'decision', 'diamond'
  question,
  diam: question,
  diamond: question,
  decision: question,

  // Hexagon with alias: 'hex', 'hexagon', 'prepare'
  hexagon,
  hex: hexagon,
  prepare: hexagon,

  // Lean Right with alias: 'lean-r', 'lean-right', 'in-out'
  lean_right, // used in old syntax for flowchart
  'lean-r': lean_right,
  'lean-right': lean_right,
  'in-out': lean_right,

  // Lean Left with alias: 'lean-l', 'lean-left', 'out-in'
  lean_left, // used in old syntax for flowchart
  'lean-l': lean_left,
  'lean-left': lean_left,
  'out-in': lean_left,

  // Trapezoid with alias: 'trap-b', 'trapezoid-bottom', 'priority'
  trapezoid, // used in old syntax for flowchart
  'trap-b': trapezoid,
  'trapezoid-bottom': trapezoid,
  priority: trapezoid,

  // Inverted Trapezoid with alias: 'inv-trapezoid', 'trapezoid-top', 'trap-t', 'manual'
  inv_trapezoid, // used in old syntax for flowchart
  'inv-trapezoid': inv_trapezoid,
  'trapezoid-top': inv_trapezoid,
  'trap-t': inv_trapezoid,
  manual: inv_trapezoid,

  // Double Circle with alias: 'dbl-circ', 'double-circle'
  doublecircle, // used in old syntax for flowchart
  'dbl-circ': doublecircle,
  'double-circle': doublecircle,

  // circle with alias: 'circ', 'circle'
  circle,
  circ: circle,

  // Rect Left Inv Arrow with alias: 'odd', 'rect-left-inv-arrow'
  rect_left_inv_arrow,
  odd: rect_left_inv_arrow,

  // Notched Rectangle with alias: 'notched-rectangle', 'notch-rect', 'card'
  card,
  'notched-rectangle': card,
  'notch-rect': card,

  // Lined rectangle with alias: 'lin-rect', 'lined-rectangle', 'lin-proc', lined-process', 'shaded-process'
  'lined-rectangle': shadedProcess,
  'lin-rect': shadedProcess,
  'lin-proc': shadedProcess,
  'lined-process': shadedProcess,
  'shaded-process': shadedProcess,

  //  Small circle with alias: 'sm-circ', 'small-circle', 'start'
  'small-circle': stateStart,
  'sm-circ': stateStart,
  start: stateStart,

  // framed circle with alias: 'stop', 'framed-circle', 'fr-circ'
  stop: stateEnd,
  'framed-circle': stateEnd,
  'fr-circ': stateEnd,

  // fork with alias: 'join', 'fork'
  join: forkJoin,
  fork: forkJoin,

  // comment with alias: 'comment', 'brace-l'
  comment: curlyBraceLeft,
  'brace-l': curlyBraceLeft,

  // lightening bolt with alias: 'bolt', 'com-link', 'lightning-bolt'
  bolt: lightningBolt,
  'com-link': lightningBolt,
  'lightning-bolt': lightningBolt,

  // document with alias: 'doc', 'document'
  doc: waveEdgedRectangle,
  document: waveEdgedRectangle,

  // delay with alias: 'delay', 'half-rounded-rectangle'
  delay: halfRoundedRectangle,
  'half-rounded-rectangle': halfRoundedRectangle,

  // horizontal cylinder with alias: 'h-cyl', 'das', 'horizontal-cylinder'
  'horizontal-cylinder': tiltedCylinder,
  'h-cyl': tiltedCylinder,
  das: tiltedCylinder,

  // lined cylinder with alias: 'lin-cyl', 'lined-cylinder', 'disk'
  'lined-cylinder': linedCylinder,
  'lin-cyl': linedCylinder,
  disk: linedCylinder,

  // curved trapezoid with alias: 'curv-trap', 'curved-trapezoid', 'display'
  'curved-trapezoid': curvedTrapezoid,
  'curv-trap': curvedTrapezoid,
  display: curvedTrapezoid,

  // divided rectangle with alias: 'div-rect', 'divided-rectangle', 'div-proc', 'divided-process'
  'divided-rectangle': dividedRectangle,
  'div-rect': dividedRectangle,
  'div-proc': dividedRectangle,
  'divided-process': dividedRectangle,

  // triangle with alias: 'tri', 'triangle', 'extract'
  triangle,
  tri: triangle,
  extract: triangle,

  // window pane with alias: 'window-pane', 'win-pane', 'internal-storage'
  'window-pane': windowPane,
  'win-pane': windowPane,
  'internal-storage': windowPane,

  // filled circle with alias: 'f-circ', 'filled-circle', 'junction'
  'f-circ': filledCircle,
  junction: filledCircle,
  'filled-circle': filledCircle,

  // lined document with alias: 'lin-doc', 'lined-document'
  'lin-doc': linedWaveEdgedRect,
  'lined-document': linedWaveEdgedRect,

  // notched pentagon with alias: 'notch-pent', 'notched-pentagon', 'loop-limit'
  'notched-pentagon': trapezoidalPentagon,
  'notch-pent': trapezoidalPentagon,
  'loop-limit': trapezoidalPentagon,

  // flipped triangle with alias: 'flip-tri', 'flipped-triangle', 'manual-file'
  'flipped-triangle': flippedTriangle,
  'flip-tri': flippedTriangle,
  'manual-file': flippedTriangle,

  // sloped rectangle with alias: 'sl-rect', 'sloped-rectangle', 'manual-input'
  'sloped-rectangle': slopedRect,
  'sl-rect': slopedRect,
  'manual-input': slopedRect,

  // documents with alias: 'docs', 'documents', 'st-doc', 'stacked-document'
  docs: multiWaveEdgedRectangle,
  documents: multiWaveEdgedRectangle,
  'st-doc': multiWaveEdgedRectangle,
  'stacked-document': multiWaveEdgedRectangle,

  // 'processes' with alias: 'procs', 'processes', 'st-rect', 'stacked-rectangle'
  processes: multiRect,
  procs: multiRect,
  'stacked-rectangle': multiRect,
  'st-rect': multiRect,

  // flag with alias: 'flag', 'paper-tape'
  flag: waveRectangle,
  'paper-tape': waveRectangle,

  // bow tie rectangle with alias: 'bow-rect', 'bow-tie-rectangle', 'stored-data'
  'bow-tie-rectangle': bowTieRect,
  'bow-rect': bowTieRect,
  'stored-data': bowTieRect,

  // crossed circle with alias: 'cross-circ', 'crossed-circle', 'summary'
  'crossed-circle': crossedCircle,
  'cross-circ': crossedCircle,
  summary: crossedCircle,

  // tagged document with alias: 'tag-doc', 'tagged-document'
  'tag-doc': taggedWaveEdgedRectangle,
  'tagged-document': taggedWaveEdgedRectangle,

  // tagged rectangle with alias: 'tag-rect', 'tagged-rectangle', 'tag-proc', 'tagged-process'
  'tag-rect': taggedRect,
  'tagged-rectangle': taggedRect,
  'tag-proc': taggedRect,
  'tagged-process': taggedRect,

  // hourglass with alias: 'hourglass', 'collate'
  hourglass,
  collate: hourglass,

  text,
  anchor,

  brace: curlyBraceLeft,

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

export const insertNode = async (elem, node, renderOptions) => {
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

  if (!shapes[node.shape]) {
    throw new Error(`No such shape: ${node.shape}. Please check your syntax.`);
  }
  if (node.shape !== node.shape.toLowerCase()) {
    throw new Error(`No such shape: ${node.shape}. Shape names should be lowercase.`);
  }
  if (node.link) {
    // Add link when appropriate
    let target;
    if (renderOptions.config.securityLevel === 'sandbox') {
      target = '_top';
    } else if (node.linkTarget) {
      target = node.linkTarget || '_blank';
    }
    newEl = elem.insert('svg:a').attr('xlink:href', node.link).attr('target', target);
    el = await shapes[node.shape](newEl, node, renderOptions);
  } else {
    el = await shapes[node.shape](elem, node, renderOptions);
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
