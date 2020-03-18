import intersect from './intersect/index.js';
import { logger } from '../logger'; // eslint-disable-line
import createLabel from './createLabel';

const labelHelper = (parent, node) => {
  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'node default')
    .attr('id', node.id);

  // Create the label and insert it after the rect
  const label = shapeSvg.insert('g').attr('class', 'label');

  const text = label.node().appendChild(createLabel(node.labelText, node.labelStyle));

  // Get the size of the label
  const bbox = text.getBBox();

  const halfPadding = node.padding / 2;

  // Center the label
  label.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');

  return { shapeSvg, bbox, halfPadding, label };
};

const updateNodeBounds = (node, element) => {
  const bbox = element.node().getBBox();
  node.width = bbox.width;
  node.height = bbox.height;
};

function insertPolygonShape(parent, w, h, points) {
  return parent
    .insert('polygon', ':first-child')
    .attr(
      'points',
      points
        .map(function(d) {
          return d.x + ',' + d.y;
        })
        .join(' ')
    )
    .attr('transform', 'translate(' + -w / 2 + ',' + h / 2 + ')');
}
const question = (parent, node) => {
  const { shapeSvg, bbox } = labelHelper(parent, node);

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const s = (w + h) * 0.9;
  const points = [
    { x: s / 2, y: 0 },
    { x: s, y: -s / 2 },
    { x: s / 2, y: -s },
    { x: 0, y: -s / 2 }
  ];

  const questionElem = insertPolygonShape(shapeSvg, s, s, points);
  updateNodeBounds(node, questionElem);
  node.intersect = function(point) {
    return intersect.polugon(node, points, point);
  };

  return shapeSvg;
};

const hexagon = (parent, node) => {
  const { shapeSvg, bbox } = labelHelper(parent, node);

  const f = 4;
  const h = bbox.height + node.padding;
  const m = h / f;
  const w = bbox.width + 2 * m + node.padding;
  const points = [
    { x: m, y: 0 },
    { x: w - m, y: 0 },
    { x: w, y: -h / 2 },
    { x: w - m, y: -h },
    { x: m, y: -h },
    { x: 0, y: -h / 2 }
  ];
  const hex = insertPolygonShape(shapeSvg, w, h, points);
  updateNodeBounds(node, hex);

  node.intersect = function(point) {
    return intersect.polygon(node, point);
  };

  return shapeSvg;
};

const rect_left_inv_arrow = (parent, node) => {
  const { shapeSvg, bbox } = labelHelper(parent, node);

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: -h / 2, y: 0 },
    { x: w, y: 0 },
    { x: w, y: -h },
    { x: -h / 2, y: -h },
    { x: 0, y: -h / 2 }
  ];

  const el = insertPolygonShape(shapeSvg, w, h, points);
  updateNodeBounds(node, el);

  node.intersect = function(point) {
    return intersect.polygon(node, point);
  };

  return shapeSvg;
};
const lean_right = (parent, node) => {
  const { shapeSvg, bbox } = labelHelper(parent, node);

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: (-2 * h) / 6, y: 0 },
    { x: w - h / 6, y: 0 },
    { x: w + (2 * h) / 6, y: -h },
    { x: h / 6, y: -h }
  ];

  const el = insertPolygonShape(shapeSvg, w, h, points);
  updateNodeBounds(node, el);

  node.intersect = function(point) {
    return intersect.polygon(node, point);
  };

  return shapeSvg;
};

const lean_left = (parent, node) => {
  const { shapeSvg, bbox } = labelHelper(parent, node);

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: (2 * h) / 6, y: 0 },
    { x: w + h / 6, y: 0 },
    { x: w - (2 * h) / 6, y: -h },
    { x: -h / 6, y: -h }
  ];

  const el = insertPolygonShape(shapeSvg, w, h, points);
  updateNodeBounds(node, el);

  node.intersect = function(point) {
    return intersect.polygon(node, point);
  };

  return shapeSvg;
};

const trapezoid = (parent, node) => {
  const { shapeSvg, bbox } = labelHelper(parent, node);

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: (-2 * h) / 6, y: 0 },
    { x: w + (2 * h) / 6, y: 0 },
    { x: w - h / 6, y: -h },
    { x: h / 6, y: -h }
  ];
  const el = insertPolygonShape(shapeSvg, w, h, points);
  updateNodeBounds(node, el);

  node.intersect = function(point) {
    return intersect.polygon(node, point);
  };

  return shapeSvg;
};

const inv_trapezoid = (parent, node) => {
  const { shapeSvg, bbox } = labelHelper(parent, node);

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: h / 6, y: 0 },
    { x: w - h / 6, y: 0 },
    { x: w + (2 * h) / 6, y: -h },
    { x: (-2 * h) / 6, y: -h }
  ];
  const el = insertPolygonShape(shapeSvg, w, h, points);
  updateNodeBounds(node, el);

  node.intersect = function(point) {
    return intersect.polygon(node, point);
  };

  return shapeSvg;
};
const rect_right_inv_arrow = (parent, node) => {
  const { shapeSvg, bbox } = labelHelper(parent, node);

  const w = bbox.width + node.padding;
  const h = bbox.height + node.padding;
  const points = [
    { x: 0, y: 0 },
    { x: w + h / 2, y: 0 },
    { x: w, y: -h / 2 },
    { x: w + h / 2, y: -h },
    { x: 0, y: -h }
  ];
  const el = insertPolygonShape(shapeSvg, w, h, points);
  updateNodeBounds(node, el);

  node.intersect = function(point) {
    return intersect.polygon(node, point);
  };

  return shapeSvg;
};
const cylinder = (parent, node) => {
  const { shapeSvg, bbox } = labelHelper(parent, node);

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
    .attr('d', shape)
    .attr('transform', 'translate(' + -w / 2 + ',' + -(h / 2 + ry) + ')');

  updateNodeBounds(node, el);

  node.intersect = function(point) {
    const pos = intersect.rect(node, point);
    const x = pos.x - node.x;

    if (
      rx != 0 &&
      (Math.abs(x) < node.width / 2 ||
        (Math.abs(x) == node.width / 2 && Math.abs(pos.y - node.y) > node.height / 2 - ry))
    ) {
      // ellipsis equation: x*x / a*a + y*y / b*b = 1
      // solve for y to get adjustion value for pos.y
      let y = ry * ry * (1 - (x * x) / (rx * rx));
      if (y != 0) y = Math.sqrt(y);
      y = ry - y;
      if (point.y - node.y > 0) y = -y;

      pos.y += y;
    }

    return pos;
  };

  return shapeSvg;
};

const rect = (parent, node) => {
  const { shapeSvg, bbox, halfPadding } = labelHelper(parent, node);

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  rect
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('x', -bbox.width / 2 - halfPadding)
    .attr('y', -bbox.height / 2 - halfPadding)
    .attr('width', bbox.width + node.padding)
    .attr('height', bbox.height + node.padding);

  updateNodeBounds(node, rect);

  node.intersect = function(point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

const stadium = (parent, node) => {
  const { shapeSvg, bbox } = labelHelper(parent, node);

  const h = bbox.height + node.padding;
  const w = bbox.width + h / 4 + node.padding;

  // add the rect
  const rect = shapeSvg
    .insert('rect', ':first-child')
    .attr('rx', h / 2)
    .attr('ry', h / 2)
    .attr('x', -w / 2)
    .attr('y', -h / 2)
    .attr('width', w)
    .attr('height', h);

  updateNodeBounds(node, rect);

  node.intersect = function(point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};
const circle = (parent, node) => {
  const { shapeSvg, bbox, halfPadding } = labelHelper(parent, node);
  const circle = shapeSvg.insert('circle', ':first-child');

  // center the circle around its coordinate
  circle
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('r', bbox.width / 2 + halfPadding)
    .attr('width', bbox.width + node.padding)
    .attr('height', bbox.height + node.padding);

  updateNodeBounds(node, circle);

  node.intersect = function(point) {
    return intersect.circle(node, point);
  };

  return shapeSvg;
};

const shapes = {
  question,
  rect,
  circle,
  stadium,
  hexagon,
  rect_left_inv_arrow,
  lean_right,
  lean_left,
  trapezoid,
  inv_trapezoid,
  rect_right_inv_arrow,
  cylinder
};

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
