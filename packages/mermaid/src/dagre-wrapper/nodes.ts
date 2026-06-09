import { select } from 'd3';
import { getConfig } from '../diagram-api/diagramAPI.js';
import { getEffectiveHtmlLabels } from '../config.js';
import { log } from '../logger.js';
import { getArrowPoints } from './blockArrowHelper.js';
import createLabel from './createLabel.js';
import intersect from './intersect/index.js';
import note from './shapes/note.js';
import { insertPolygonShape, labelHelper, updateNodeBounds } from './shapes/util.js';
import type { Graph } from 'dagre-d3-es/src/graphlib/index.js';
import type { MermaidConfig } from '../config.type.js';
import type { Direction } from '../diagrams/block/blockTypes.js';
import type { ClassNode } from '../diagrams/class/classTypes.js';
import type { D3Element, D3Selection, Point } from '../types.js';

/**
 * The mutable node object used by the (legacy) dagre-wrapper when rendering nodes.
 *
 * See `GraphObjects.md` in this directory for a description of the properties.
 */
export interface Node {
  id: string;
  domId?: string;
  shape: string;
  labelText?: string | string[];
  labelType?: string;
  labelStyle: string;
  style: string;
  class?: string;
  classes?: string;
  rx: number;
  ry: number;
  padding: number;
  width: number;
  height: number;
  x: number;
  y: number;
  /** When `true` the node is already positioned (used by block diagrams). */
  positioned?: boolean;
  intersect?: (point: Point) => Point;
  type?: string;
  link?: string;
  linkTarget?: string;
  tooltip?: string;
  haveCallback?: boolean;
  /** `true` when this node represents a cluster that is rendered recursively. */
  clusterNode?: boolean;
  clusterData?: { dir?: string } & Record<string, unknown>;
  /** Difference in width between the cluster and its label, set by cluster shapes. */
  diff?: number;
  /** The sub-graph attached to a clusterNode. */
  graph?: Graph;
  props?: { borders?: string } & Record<string, unknown>;
  /** Class diagram specific data, used by the `class_box` shape. */
  classData?: ClassNode;
  useHtmlLabels?: boolean;
  centerLabel?: boolean;
  directions?: string[];
  widthInColumns?: number;
}

/** Options passed by the renderer to {@link insertNode}. */
export interface ShapeRenderOptions {
  config: MermaidConfig;
  dir?: string;
}

type ShapeFunction = (
  parent: D3Selection<SVGGElement>,
  node: Node,
  options?: ShapeRenderOptions | string
) => D3Selection<SVGGElement> | Promise<D3Selection<SVGGElement>>;

const formatClass = (str?: string) => {
  if (str) {
    return ' ' + str;
  }
  return '';
};
const getClassesFromNode = (node: Node, otherClasses?: string) => {
  return `${otherClasses ? otherClasses : 'node default'}${formatClass(node.classes)} ${formatClass(
    node.class
  )}`;
};

const question: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const s = w + h;

  const points = [
    { x: s / 2, y: 0 },
    { x: s, y: -s / 2 },
    { x: s / 2, y: -s },
    { x: 0, y: -s / 2 },
  ];

  log.info('Question main (Circle)');

  const questionElem = insertPolygonShape(shapeSvg, s, s, points);
  questionElem.attr('style', node.style);
  updateNodeBounds(node, questionElem);

  node.intersect = function (point) {
    log.warn('Intersect called');
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

const choice: ShapeFunction = (parent, node) => {
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);

  const s = 28;
  const points = [
    { x: 0, y: s / 2 },
    { x: s / 2, y: 0 },
    { x: 0, y: -s / 2 },
    { x: -s / 2, y: 0 },
  ];

  const choice = shapeSvg.insert('polygon', ':first-child').attr(
    'points',
    points
      .map(function (d) {
        return d.x + ',' + d.y;
      })
      .join(' ')
  );
  // center the circle around its coordinate
  choice.attr('class', 'state-start').attr('r', 7).attr('width', 28).attr('height', 28);
  node.width = 28;
  node.height = 28;

  node.intersect = function (point) {
    return intersect.circle(node, 14, point);
  };

  return shapeSvg;
};

const hexagon: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );

  const f = 4;
  const h = node.positioned ? node.height : bbox.height + node.padding;
  const m = h / f;
  const w = node.positioned ? node.width : bbox.width + 2 * m + node.padding;
  const points = [
    { x: m, y: 0 },
    { x: w - m, y: 0 },
    { x: w, y: -h / 2 },
    { x: w - m, y: -h },
    { x: m, y: -h },
    { x: 0, y: -h / 2 },
  ];

  const hex = insertPolygonShape(shapeSvg, w, h, points);
  hex.attr('style', node.style);
  updateNodeBounds(node, hex);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

const block_arrow: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(parent, node, undefined, true);

  const f = 2;
  const h = bbox.height + 2 * node.padding;
  const m = h / f;
  const naturalW = bbox.width + 2 * m + node.padding;
  // Only use the layout-computed width when the block explicitly spans multiple columns
  const isSpanning = node.positioned && (node.widthInColumns ?? 1) > 1 && node.width > naturalW;
  const w = isSpanning ? node.width : naturalW;

  const points = getArrowPoints(node.directions as Direction[], bbox, node, w);

  const blockArrow = insertPolygonShape(shapeSvg, w, h, points);
  blockArrow.attr('style', node.style);
  updateNodeBounds(node, blockArrow);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

const rect_left_inv_arrow: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: -h / 2, y: 0 },
    { x: w, y: 0 },
    { x: w, y: -h },
    { x: -h / 2, y: -h },
    { x: 0, y: -h / 2 },
  ];

  const el = insertPolygonShape(shapeSvg, w, h, points);
  el.attr('style', node.style);

  node.width = w + h;
  node.height = h;

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

const lean_right: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(parent, node, getClassesFromNode(node), true);

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: (-2 * h) / 6, y: 0 },
    { x: w - h / 6, y: 0 },
    { x: w + (2 * h) / 6, y: -h },
    { x: h / 6, y: -h },
  ];

  const el = insertPolygonShape(shapeSvg, w, h, points);
  el.attr('style', node.style);
  updateNodeBounds(node, el);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

const lean_left: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: (2 * h) / 6, y: 0 },
    { x: w + h / 6, y: 0 },
    { x: w - (2 * h) / 6, y: -h },
    { x: -h / 6, y: -h },
  ];

  const el = insertPolygonShape(shapeSvg, w, h, points);
  el.attr('style', node.style);
  updateNodeBounds(node, el);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

const trapezoid: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: (-2 * h) / 6, y: 0 },
    { x: w + (2 * h) / 6, y: 0 },
    { x: w - h / 6, y: -h },
    { x: h / 6, y: -h },
  ];

  const el = insertPolygonShape(shapeSvg, w, h, points);
  el.attr('style', node.style);
  updateNodeBounds(node, el);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

const inv_trapezoid: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: h / 6, y: 0 },
    { x: w - h / 6, y: 0 },
    { x: w + (2 * h) / 6, y: -h },
    { x: (-2 * h) / 6, y: -h },
  ];

  const el = insertPolygonShape(shapeSvg, w, h, points);
  el.attr('style', node.style);
  updateNodeBounds(node, el);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

const rect_right_inv_arrow: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: 0, y: 0 },
    { x: w + h / 2, y: 0 },
    { x: w, y: -h / 2 },
    { x: w + h / 2, y: -h },
    { x: 0, y: -h },
  ];

  const el = insertPolygonShape(shapeSvg, w, h, points);
  el.attr('style', node.style);
  updateNodeBounds(node, el);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

const cylinder: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );

  const w = bbox.width + node.padding;
  const rx = w / 2;
  const ry = rx / (2.5 + w / 50);
  const h = bbox.height + ry + node.padding;

  const shape =
    'M 0,' +
    ry +
    ' a ' +
    rx +
    ',' +
    ry +
    ' 0,0,0 ' +
    w +
    ' 0 a ' +
    rx +
    ',' +
    ry +
    ' 0,0,0 ' +
    -w +
    ' 0 l 0,' +
    h +
    ' a ' +
    rx +
    ',' +
    ry +
    ' 0,0,0 ' +
    w +
    ' 0 l 0,' +
    -h;

  const el = shapeSvg
    .attr('label-offset-y', ry)
    .insert('path', ':first-child')
    .attr('style', node.style)
    .attr('d', shape)
    .attr('transform', 'translate(' + -w / 2 + ',' + -(h / 2 + ry) + ')');

  updateNodeBounds(node, el);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    const x = pos.x - node.x;

    if (
      rx != 0 &&
      (Math.abs(x) < node.width / 2 ||
        (Math.abs(x) == node.width / 2 && Math.abs(pos.y - node.y) > node.height / 2 - ry))
    ) {
      // ellipsis equation: x*x / a*a + y*y / b*b = 1
      // solve for y to get adjusted value for pos.y
      let y = ry * ry * (1 - (x * x) / (rx * rx));
      if (y != 0) {
        y = Math.sqrt(y);
      }
      y = ry - y;
      if (point.y - node.y > 0) {
        y = -y;
      }

      pos.y += y;
    }

    return pos;
  };

  return shapeSvg;
};

const rect: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    'node ' + node.classes + ' ' + node.class,
    true
  );

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  // console.log('Rect node:', node, 'bbox:', bbox, 'halfPadding:', halfPadding, 'node.padding:', node.padding);
  // const totalWidth = bbox.width + node.padding * 2;
  // const totalHeight = bbox.height + node.padding * 2;
  const totalWidth = node.positioned ? node.width : bbox.width + node.padding;
  const totalHeight = node.positioned ? node.height : bbox.height + node.padding;
  const x = node.positioned ? -totalWidth / 2 : -bbox.width / 2 - halfPadding;
  const y = node.positioned ? -totalHeight / 2 : -bbox.height / 2 - halfPadding;
  rect
    .attr('class', 'basic label-container')
    .attr('style', node.style)
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('x', x)
    .attr('y', y)
    .attr('width', totalWidth)
    .attr('height', totalHeight);

  if (node.props) {
    const propKeys = new Set(Object.keys(node.props));
    if (node.props.borders) {
      applyNodePropertyBorders(rect, node.props.borders, totalWidth, totalHeight);
      propKeys.delete('borders');
    }
    propKeys.forEach((propKey) => {
      log.warn(`Unknown node property ${propKey}`);
    });
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

const composite: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    'node ' + node.classes,
    true
  );

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  // const totalWidth = bbox.width + node.padding * 2;
  // const totalHeight = bbox.height + node.padding * 2;
  const totalWidth = node.positioned ? node.width : bbox.width + node.padding;
  const totalHeight = node.positioned ? node.height : bbox.height + node.padding;
  const x = node.positioned ? -totalWidth / 2 : -bbox.width / 2 - halfPadding;
  const y = node.positioned ? -totalHeight / 2 : -bbox.height / 2 - halfPadding;
  rect
    .attr('class', 'basic cluster composite label-container')
    .attr('style', node.style)
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('x', x)
    .attr('y', y)
    .attr('width', totalWidth)
    .attr('height', totalHeight);

  if (node.props) {
    const propKeys = new Set(Object.keys(node.props));
    if (node.props.borders) {
      applyNodePropertyBorders(rect, node.props.borders, totalWidth, totalHeight);
      propKeys.delete('borders');
    }
    propKeys.forEach((propKey) => {
      log.warn(`Unknown node property ${propKey}`);
    });
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

const labelRect: ShapeFunction = async (parent, node) => {
  const { shapeSvg } = await labelHelper(parent, node, 'label', true);

  log.trace('Classes = ', node.class);
  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  // Hide the rect we are only after the label
  const totalWidth = 0;
  const totalHeight = 0;
  rect.attr('width', totalWidth).attr('height', totalHeight);
  shapeSvg.attr('class', 'label edgeLabel');

  if (node.props) {
    const propKeys = new Set(Object.keys(node.props));
    if (node.props.borders) {
      applyNodePropertyBorders(rect, node.props.borders, totalWidth, totalHeight);
      propKeys.delete('borders');
    }
    propKeys.forEach((propKey) => {
      log.warn(`Unknown node property ${propKey}`);
    });
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

function applyNodePropertyBorders(
  rect: D3Selection<SVGRectElement>,
  borders: string,
  totalWidth: number,
  totalHeight: number
) {
  const strokeDashArray: number[] = [];
  const addBorder = (length: number) => {
    strokeDashArray.push(length, 0);
  };
  const skipBorder = (length: number) => {
    strokeDashArray.push(0, length);
  };
  if (borders.includes('t')) {
    log.debug('add top border');
    addBorder(totalWidth);
  } else {
    skipBorder(totalWidth);
  }
  if (borders.includes('r')) {
    log.debug('add right border');
    addBorder(totalHeight);
  } else {
    skipBorder(totalHeight);
  }
  if (borders.includes('b')) {
    log.debug('add bottom border');
    addBorder(totalWidth);
  } else {
    skipBorder(totalWidth);
  }
  if (borders.includes('l')) {
    log.debug('add left border');
    addBorder(totalHeight);
  } else {
    skipBorder(totalHeight);
  }
  rect.attr('stroke-dasharray', strokeDashArray.join(' '));
}

const rectWithTitle: ShapeFunction = async (parent, node) => {
  // const { shapeSvg, bbox, halfPadding } = labelHelper(parent, node, 'node ' + node.classes);

  let classes;
  if (!node.classes) {
    classes = 'node default';
  } else {
    classes = 'node ' + node.classes;
  }
  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', classes)
    .attr('id', node.domId || node.id);

  // Create the title label and insert it after the rect
  const rect = shapeSvg.insert('rect', ':first-child');
  // const innerRect = shapeSvg.insert('rect');
  const innerLine = shapeSvg.insert('line');

  const label = shapeSvg.insert('g').attr('class', 'label');

  const text2 = (node.labelText as string[]).flat
    ? (node.labelText as string[]).flat()
    : node.labelText;
  // const text2 = typeof text2prim === 'object' ? text2prim[0] : text2prim;

  let title = '';
  if (typeof text2 === 'object') {
    title = text2[0];
  } else {
    title = text2!;
  }
  log.info('Label text abc79', title, text2, typeof text2 === 'object');

  const text = await createLabel(label, title, node.labelStyle, true, true);
  let bbox = { width: 0, height: 0 };
  if (getEffectiveHtmlLabels(getConfig())) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }
  log.info('Text 2', text2);
  const textRows = text2!.slice(1, text2!.length);
  const titleBox = text.getBBox();
  const descr = await createLabel(
    label,
    (textRows as string[]).join ? (textRows as string[]).join('<br/>') : textRows,
    node.labelStyle,
    true,
    true
  );

  if (getEffectiveHtmlLabels(getConfig())) {
    const div = descr.children[0];
    const dv = select(descr);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }
  // bbox = label.getBBox();
  // log.info(descr);
  const halfPadding = node.padding / 2;
  select(descr).attr(
    'transform',
    'translate( ' +
      // (titleBox.width - bbox.width) / 2 +
      (bbox.width > titleBox.width ? 0 : (titleBox.width - bbox.width) / 2) +
      ', ' +
      (titleBox.height + halfPadding + 5) +
      ')'
  );
  select(text).attr(
    'transform',
    'translate( ' +
      // (titleBox.width - bbox.width) / 2 +
      (bbox.width < titleBox.width ? 0 : -(titleBox.width - bbox.width) / 2) +
      ', ' +
      0 +
      ')'
  );
  // Get the size of the label

  // Bounding box for title and text
  bbox = label.node()!.getBBox();

  // Center the label
  label.attr(
    'transform',
    'translate(' + -bbox.width / 2 + ', ' + (-bbox.height / 2 - halfPadding + 3) + ')'
  );

  rect
    .attr('class', 'outer title-state')
    .attr('x', -bbox.width / 2 - halfPadding)
    .attr('y', -bbox.height / 2 - halfPadding)
    .attr('width', bbox.width + node.padding)
    .attr('height', bbox.height + node.padding);

  innerLine
    .attr('class', 'divider')
    .attr('x1', -bbox.width / 2 - halfPadding)
    .attr('x2', bbox.width / 2 + halfPadding)
    .attr('y1', -bbox.height / 2 - halfPadding + titleBox.height + halfPadding)
    .attr('y2', -bbox.height / 2 - halfPadding + titleBox.height + halfPadding);

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

const stadium: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );

  const h = bbox.height + node.padding;
  const w = bbox.width + h / 4 + node.padding;

  // add the rect
  const rect = shapeSvg
    .insert('rect', ':first-child')
    .attr('style', node.style)
    .attr('rx', h / 2)
    .attr('ry', h / 2)
    .attr('x', -w / 2)
    .attr('y', -h / 2)
    .attr('width', w)
    .attr('height', h);

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

const circle: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );
  const circle = shapeSvg.insert('circle', ':first-child');

  // center the circle around its coordinate
  circle
    .attr('style', node.style)
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('r', bbox.width / 2 + halfPadding)
    .attr('width', bbox.width + node.padding)
    .attr('height', bbox.height + node.padding);

  log.info('Circle main');

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    log.info('Circle intersect', node, bbox.width / 2 + halfPadding, point);
    return intersect.circle(node, bbox.width / 2 + halfPadding, point);
  };

  return shapeSvg;
};

const doublecircle: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox, halfPadding } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );
  const gap = 5;
  const circleGroup = shapeSvg.insert('g', ':first-child');
  const outerCircle = circleGroup.insert('circle');
  const innerCircle = circleGroup.insert('circle');

  circleGroup.attr('class', node.class!);

  // center the circle around its coordinate
  outerCircle
    .attr('style', node.style)
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('r', bbox.width / 2 + halfPadding + gap)
    .attr('width', bbox.width + node.padding + gap * 2)
    .attr('height', bbox.height + node.padding + gap * 2);

  innerCircle
    .attr('style', node.style)
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('r', bbox.width / 2 + halfPadding)
    .attr('width', bbox.width + node.padding)
    .attr('height', bbox.height + node.padding);

  log.info('DoubleCircle main');

  updateNodeBounds(node, outerCircle);

  node.intersect = function (point) {
    log.info('DoubleCircle intersect', node, bbox.width / 2 + halfPadding + gap, point);
    return intersect.circle(node, bbox.width / 2 + halfPadding + gap, point);
  };

  return shapeSvg;
};

const subroutine: ShapeFunction = async (parent, node) => {
  const { shapeSvg, bbox } = await labelHelper(
    parent,
    node,
    getClassesFromNode(node, undefined),
    true
  );

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: -h },
    { x: 0, y: -h },
    { x: 0, y: 0 },
    { x: -8, y: 0 },
    { x: w + 8, y: 0 },
    { x: w + 8, y: -h },
    { x: -8, y: -h },
    { x: -8, y: 0 },
  ];

  const el = insertPolygonShape(shapeSvg, w, h, points);
  el.attr('style', node.style);
  updateNodeBounds(node, el);

  node.intersect = function (point) {
    return intersect.polygon(node, points, point);
  };

  return shapeSvg;
};

const start: ShapeFunction = (parent, node) => {
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);
  const circle = shapeSvg.insert('circle', ':first-child');

  // center the circle around its coordinate
  circle.attr('class', 'state-start').attr('r', 7).attr('width', 14).attr('height', 14);

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    return intersect.circle(node, 7, point);
  };

  return shapeSvg;
};

const forkJoin: ShapeFunction = (parent, node, dir) => {
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
  node.height = node.height + node.padding / 2;
  node.width = node.width + node.padding / 2;
  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

const end: ShapeFunction = (parent, node) => {
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.domId || node.id);
  const innerCircle = shapeSvg.insert('circle', ':first-child');
  const circle = shapeSvg.insert('circle', ':first-child');

  circle.attr('class', 'state-start').attr('r', 7).attr('width', 14).attr('height', 14);

  innerCircle.attr('class', 'state-end').attr('r', 5).attr('width', 10).attr('height', 10);

  updateNodeBounds(node, circle);

  node.intersect = function (point) {
    return intersect.circle(node, 7, point);
  };

  return shapeSvg;
};

const class_box: ShapeFunction = async (parent, node) => {
  const halfPadding = node.padding / 2;
  const rowPadding = 4;
  const lineHeight = 8;

  let classes;
  if (!node.classes) {
    classes = 'node default';
  } else {
    classes = 'node ' + node.classes;
  }
  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', classes)
    .attr('id', node.domId || node.id);

  // Create the title label and insert it after the rect
  const rect = shapeSvg.insert('rect', ':first-child');
  const topLine = shapeSvg.insert('line');
  const bottomLine = shapeSvg.insert('line');
  let maxWidth = 0;
  let maxHeight = rowPadding;

  const labelContainer = shapeSvg.insert('g').attr('class', 'label');
  let verticalPos = 0;
  const hasInterface = node.classData!.annotations?.[0];

  // 1. Create the labels
  const interfaceLabelText = node.classData!.annotations[0]
    ? '«' + node.classData!.annotations[0] + '»'
    : '';
  const interfaceLabel = await createLabel(
    labelContainer,
    interfaceLabelText,
    node.labelStyle,
    true,
    true
  );
  let interfaceBBox = interfaceLabel.getBBox();
  if (getEffectiveHtmlLabels(getConfig())) {
    const div = interfaceLabel.children[0];
    const dv = select(interfaceLabel);
    interfaceBBox = div.getBoundingClientRect();
    dv.attr('width', interfaceBBox.width);
    dv.attr('height', interfaceBBox.height);
  }
  if (node.classData!.annotations[0]) {
    maxHeight += interfaceBBox.height + rowPadding;
    maxWidth += interfaceBBox.width;
  }

  let classTitleString = node.classData!.label;

  if (node.classData!.type !== undefined && node.classData!.type !== '') {
    if (getEffectiveHtmlLabels(getConfig())) {
      classTitleString += '&lt;' + node.classData!.type + '&gt;';
    } else {
      classTitleString += '<' + node.classData!.type + '>';
    }
  }
  const classTitleLabel = await createLabel(
    labelContainer,
    classTitleString,
    node.labelStyle,
    true,
    true
  );
  select(classTitleLabel).attr('class', 'classTitle');
  let classTitleBBox = classTitleLabel.getBBox();
  if (getEffectiveHtmlLabels(getConfig())) {
    const div = classTitleLabel.children[0];
    const dv = select(classTitleLabel);
    classTitleBBox = div.getBoundingClientRect();
    dv.attr('width', classTitleBBox.width);
    dv.attr('height', classTitleBBox.height);
  }
  maxHeight += classTitleBBox.height + rowPadding;
  if (classTitleBBox.width > maxWidth) {
    maxWidth = classTitleBBox.width;
  }
  const classAttributes: SVGGraphicsElement[] = [];
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- the original (pre-TypeScript) code never awaited these promises
  node.classData!.members.forEach(async (member) => {
    const parsedInfo = member.getDisplayDetails();
    let parsedText = parsedInfo.displayText;
    if (getEffectiveHtmlLabels(getConfig())) {
      parsedText = parsedText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    const lbl = await createLabel(
      labelContainer,
      parsedText,
      parsedInfo.cssStyle ? parsedInfo.cssStyle : node.labelStyle,
      true,
      true
    );
    let bbox = lbl.getBBox();
    if (getEffectiveHtmlLabels(getConfig())) {
      const div = lbl.children[0];
      const dv = select(lbl);
      bbox = div.getBoundingClientRect();
      dv.attr('width', bbox.width);
      dv.attr('height', bbox.height);
    }
    if (bbox.width > maxWidth) {
      maxWidth = bbox.width;
    }
    maxHeight += bbox.height + rowPadding;
    classAttributes.push(lbl);
  });

  maxHeight += lineHeight;

  const classMethods: SVGGraphicsElement[] = [];
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- the original (pre-TypeScript) code never awaited these promises
  node.classData!.methods.forEach(async (member) => {
    const parsedInfo = member.getDisplayDetails();
    let displayText = parsedInfo.displayText;
    if (getEffectiveHtmlLabels(getConfig())) {
      displayText = displayText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    const lbl = await createLabel(
      labelContainer,
      displayText,
      parsedInfo.cssStyle ? parsedInfo.cssStyle : node.labelStyle,
      true,
      true
    );
    let bbox = lbl.getBBox();
    if (getEffectiveHtmlLabels(getConfig())) {
      const div = lbl.children[0];
      const dv = select(lbl);
      bbox = div.getBoundingClientRect();
      dv.attr('width', bbox.width);
      dv.attr('height', bbox.height);
    }
    if (bbox.width > maxWidth) {
      maxWidth = bbox.width;
    }
    maxHeight += bbox.height + rowPadding;

    classMethods.push(lbl);
  });

  maxHeight += lineHeight;

  // 2. Position the labels

  // position the interface label
  if (hasInterface) {
    const diffX = (maxWidth - interfaceBBox.width) / 2;
    select(interfaceLabel).attr(
      'transform',
      'translate( ' + ((-1 * maxWidth) / 2 + diffX) + ', ' + (-1 * maxHeight) / 2 + ')'
    );
    verticalPos = interfaceBBox.height + rowPadding;
  }
  // Position the class title label
  const diffX = (maxWidth - classTitleBBox.width) / 2;
  select(classTitleLabel).attr(
    'transform',
    'translate( ' +
      ((-1 * maxWidth) / 2 + diffX) +
      ', ' +
      ((-1 * maxHeight) / 2 + verticalPos) +
      ')'
  );
  verticalPos += classTitleBBox.height + rowPadding;

  topLine
    .attr('class', 'divider')
    .attr('x1', -maxWidth / 2 - halfPadding)
    .attr('x2', maxWidth / 2 + halfPadding)
    .attr('y1', -maxHeight / 2 - halfPadding + lineHeight + verticalPos)
    .attr('y2', -maxHeight / 2 - halfPadding + lineHeight + verticalPos);

  verticalPos += lineHeight;

  classAttributes.forEach((lbl) => {
    select(lbl).attr(
      'transform',
      'translate( ' +
        -maxWidth / 2 +
        ', ' +
        ((-1 * maxHeight) / 2 + verticalPos + lineHeight / 2) +
        ')'
    );
    //get the height of the bounding box of each member if exists
    const memberBBox = lbl?.getBBox();
    verticalPos += (memberBBox?.height ?? 0) + rowPadding;
  });

  verticalPos += lineHeight;
  bottomLine
    .attr('class', 'divider')
    .attr('x1', -maxWidth / 2 - halfPadding)
    .attr('x2', maxWidth / 2 + halfPadding)
    .attr('y1', -maxHeight / 2 - halfPadding + lineHeight + verticalPos)
    .attr('y2', -maxHeight / 2 - halfPadding + lineHeight + verticalPos);

  verticalPos += lineHeight;

  classMethods.forEach((lbl) => {
    select(lbl).attr(
      'transform',
      'translate( ' + -maxWidth / 2 + ', ' + ((-1 * maxHeight) / 2 + verticalPos) + ')'
    );
    const memberBBox = lbl?.getBBox();
    verticalPos += (memberBBox?.height ?? 0) + rowPadding;
  });

  rect
    .attr('style', node.style)
    .attr('class', 'outer title-state')
    .attr('x', -maxWidth / 2 - halfPadding)
    .attr('y', -(maxHeight / 2) - halfPadding)
    .attr('width', maxWidth + node.padding)
    .attr('height', maxHeight + node.padding);

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

const shapes: Record<string, ShapeFunction> = {
  rhombus: question,
  composite,
  question,
  rect,
  labelRect,
  rectWithTitle,
  choice,
  circle,
  doublecircle,
  stadium,
  hexagon,
  block_arrow,
  rect_left_inv_arrow,
  lean_right,
  lean_left,
  trapezoid,
  inv_trapezoid,
  rect_right_inv_arrow,
  cylinder,
  start,
  end,
  note,
  subroutine,
  fork: forkJoin,
  join: forkJoin,
  class_box,
};

let nodeElems: Record<string, D3Selection<SVGGElement>> = {};

export const insertNode = async (
  elem: D3Selection<SVGGElement>,
  node: Node,
  renderOptions: ShapeRenderOptions
): Promise<D3Element> => {
  let newEl;
  let el;

  // Add link when appropriate
  if (node.link) {
    let target: string | undefined;
    if (getConfig().securityLevel === 'sandbox') {
      target = '_top';
    } else if (node.linkTarget) {
      target = node.linkTarget || '_blank';
    }
    newEl = elem
      .insert('svg:a')
      .attr('xlink:href', node.link)
      .attr('target', target!) as unknown as D3Selection<SVGGElement>;
    el = await shapes[node.shape](newEl, node, renderOptions);
  } else {
    el = await shapes[node.shape](elem, node, renderOptions);
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
export const setNodeElem = (elem: D3Selection<SVGGElement>, node: Node) => {
  nodeElems[node.id] = elem;
};
export const clear = () => {
  nodeElems = {};
};

export const positionNode = (node: Node) => {
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
