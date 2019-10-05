import dagreD3 from 'dagre-d3-renderer';

function question(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const s = (w + h) * 0.9;
  const points = [
    { x: s / 2, y: 0 },
    { x: s, y: -s / 2 },
    { x: s / 2, y: -s },
    { x: 0, y: -s / 2 }
  ];
  const shapeSvg = insertPolygonShape(parent, s, s, points);
  node.intersect = function(point) {
    return dagreD3.intersect.polygon(node, points, point);
  };
  return shapeSvg;
}

function hexagon(parent, bbox, node) {
  const f = 4;
  const h = bbox.height;
  const m = h / f;
  const w = bbox.width + 2 * m;
  const points = [
    { x: m, y: 0 },
    { x: w - m, y: 0 },
    { x: w, y: -h / 2 },
    { x: w - m, y: -h },
    { x: m, y: -h },
    { x: 0, y: -h / 2 }
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function(point) {
    return dagreD3.intersect.polygon(node, points, point);
  };
  return shapeSvg;
}

function rect_left_inv_arrow(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: -h / 2, y: 0 },
    { x: w, y: 0 },
    { x: w, y: -h },
    { x: -h / 2, y: -h },
    { x: 0, y: -h / 2 }
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function(point) {
    return dagreD3.intersect.polygon(node, points, point);
  };
  return shapeSvg;
}

function lean_right(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: (-2 * h) / 6, y: 0 },
    { x: w - h / 6, y: 0 },
    { x: w + (2 * h) / 6, y: -h },
    { x: h / 6, y: -h }
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function(point) {
    return dagreD3.intersect.polygon(node, points, point);
  };
  return shapeSvg;
}

function lean_left(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: (2 * h) / 6, y: 0 },
    { x: w + h / 6, y: 0 },
    { x: w - (2 * h) / 6, y: -h },
    { x: -h / 6, y: -h }
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function(point) {
    return dagreD3.intersect.polygon(node, points, point);
  };
  return shapeSvg;
}

function trapezoid(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: (-2 * h) / 6, y: 0 },
    { x: w + (2 * h) / 6, y: 0 },
    { x: w - h / 6, y: -h },
    { x: h / 6, y: -h }
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function(point) {
    return dagreD3.intersect.polygon(node, points, point);
  };
  return shapeSvg;
}

function inv_trapezoid(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: h / 6, y: 0 },
    { x: w - h / 6, y: 0 },
    { x: w + (2 * h) / 6, y: -h },
    { x: (-2 * h) / 6, y: -h }
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function(point) {
    return dagreD3.intersect.polygon(node, points, point);
  };
  return shapeSvg;
}

function rect_right_inv_arrow(parent, bbox, node) {
  const w = bbox.width;
  const h = bbox.height;
  const points = [
    { x: 0, y: 0 },
    { x: w + h / 2, y: 0 },
    { x: w, y: -h / 2 },
    { x: w + h / 2, y: -h },
    { x: 0, y: -h }
  ];
  const shapeSvg = insertPolygonShape(parent, w, h, points);
  node.intersect = function(point) {
    return dagreD3.intersect.polygon(node, points, point);
  };
  return shapeSvg;
}

export function addToRender(render) {
  render.shapes().question = question;
  render.shapes().hexagon = hexagon;

  // Add custom shape for box with inverted arrow on left side
  render.shapes().rect_left_inv_arrow = rect_left_inv_arrow;

  // Add custom shape for box with inverted arrow on left side
  render.shapes().lean_right = lean_right;

  // Add custom shape for box with inverted arrow on left side
  render.shapes().lean_left = lean_left;

  // Add custom shape for box with inverted arrow on left side
  render.shapes().trapezoid = trapezoid;

  // Add custom shape for box with inverted arrow on left side
  render.shapes().inv_trapezoid = inv_trapezoid;

  // Add custom shape for box with inverted arrow on right side
  render.shapes().rect_right_inv_arrow = rect_right_inv_arrow;
}

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

export default {
  addToRender
};
