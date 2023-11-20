const expandAndDeduplicateDirections = (directions) => {
  const uniqueDirections = new Set();

  for (const direction of directions) {
    switch (direction) {
      case 'x':
        uniqueDirections.add('right');
        uniqueDirections.add('left');
        break;
      case 'y':
        uniqueDirections.add('up');
        uniqueDirections.add('down');
        break;
      default:
        uniqueDirections.add(direction);
        break;
    }
  }

  return uniqueDirections;
};
export const getArrowPoints = (directions, bbox, node) => {
  const ud = expandAndDeduplicateDirections(directions);

  // console.log('block_arrow abc123', node.id, node.directions, ud);

  const f = 2;
  const h = bbox.height + 2 * node.padding;
  const m = h / f;
  const w = bbox.width + 2 * m + node.padding;
  const p = node.padding / 2;

  let points = [];

  if (ud.has('right') && ud.has('left') && ud.has('up') && ud.has('down')) {
    // SQUARE
    points = [
      // Bottom
      { x: 0, y: 0 },
      { x: m, y: 0 },
      { x: w / 2, y: 2 * p },
      { x: w - m, y: 0 },
      { x: w, y: 0 },

      // Right
      { x: w, y: -h / 3 },
      { x: w + 2 * p, y: -h / 2 },
      { x: w, y: (-2 * h) / 3 },
      { x: w, y: -h },

      // Top
      { x: w - m, y: -h },
      { x: w / 2, y: -h - 2 * p },
      { x: m, y: -h },

      // Left
      { x: 0, y: -h },
      { x: 0, y: (-2 * h) / 3 },
      { x: -2 * p, y: -h / 2 },
      { x: 0, y: -h / 3 },
    ];
  } else if (ud.has('right') && ud.has('left') && ud.has('up')) {
    // RECTANGLE_VERTICAL (Top Open)
    points = [
      { x: m, y: 0 },
      { x: w - m, y: 0 },
      { x: w, y: -h / 2 },
      { x: w - m, y: -h },
      { x: m, y: -h },
      { x: 0, y: -h / 2 },
    ];
  } else if (ud.has('right') && ud.has('left') && ud.has('down')) {
    // RECTANGLE_VERTICAL (Bottom Open)
    points = [
      { x: 0, y: 0 },
      { x: m, y: -h },
      { x: w - m, y: -h },
      { x: w, y: 0 },
    ];
  } else if (ud.has('right') && ud.has('up') && ud.has('down')) {
    // RECTANGLE_HORIZONTAL (Right Open)
    points = [
      { x: 0, y: 0 },
      { x: w, y: -m },
      { x: w, y: -h + m },
      { x: 0, y: -h },
    ];
  } else if (ud.has('left') && ud.has('up') && ud.has('down')) {
    // RECTANGLE_HORIZONTAL (Left Open)
    points = [
      { x: w, y: 0 },
      { x: 0, y: -m },
      { x: 0, y: -h + m },
      { x: w, y: -h },
    ];
  } else if (ud.has('right') && ud.has('left')) {
    // HORIZONTAL_LINE
    points = [
      { x: m, y: 0 },
      { x: m, y: -p },
      { x: w - m, y: -p },
      { x: w - m, y: 0 },
      { x: w, y: -h / 2 },
      { x: w - m, y: -h },
      { x: w - m, y: -h + p },
      { x: m, y: -h + p },
      { x: m, y: -h },
      { x: 0, y: -h / 2 },
    ];
  } else if (ud.has('up') && ud.has('down')) {
    // VERTICAL_LINE
    points = [
      // Bottom center
      { x: w / 2, y: 0 },
      // Left pont of bottom arrow
      { x: 0, y: -p },
      { x: m, y: -p },
      // Left top over vertical section
      { x: m, y: -h + p },
      { x: 0, y: -h + p },
      // Top of arrow
      { x: w / 2, y: -h },
      { x: w, y: -h + p },
      // Top of right vertical bar
      { x: w - m, y: -h + p },
      { x: w - m, y: -p },
      { x: w, y: -p },
    ];
  } else if (ud.has('right') && ud.has('up')) {
    // ANGLE_RT
    points = [
      { x: 0, y: 0 },
      { x: w, y: -m },
      { x: 0, y: -h },
    ];
  } else if (ud.has('right') && ud.has('down')) {
    // ANGLE_RB
    points = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: 0, y: -h },
    ];
  } else if (ud.has('left') && ud.has('up')) {
    // ANGLE_LT
    points = [
      { x: w, y: 0 },
      { x: 0, y: -m },
      { x: w, y: -h },
    ];
  } else if (ud.has('left') && ud.has('down')) {
    // ANGLE_LB
    points = [
      { x: w, y: 0 },
      { x: 0, y: 0 },
      { x: w, y: -h },
    ];
  } else if (ud.has('right')) {
    // ARROW_RIGHT
    points = [
      { x: m, y: -p },
      { x: m, y: -p },
      { x: w - m, y: -p },
      { x: w - m, y: 0 },
      { x: w, y: -h / 2 },
      { x: w - m, y: -h },
      { x: w - m, y: -h + p },
      // top left corner of arrow
      { x: m, y: -h + p },
      { x: m, y: -h + p },
    ];
  } else if (ud.has('left')) {
    // ARROW_LEFT
    points = [
      { x: m, y: 0 },
      { x: m, y: -p },
      // Two points, the right corners
      { x: w - m, y: -p },
      { x: w - m, y: -h + p },
      { x: m, y: -h + p },
      { x: m, y: -h },
      { x: 0, y: -h / 2 },
    ];
  } else if (ud.has('up')) {
    // ARROW_TOP
    points = [
      // Bottom center
      { x: m, y: -p },
      // Left top over vertical section
      { x: m, y: -h + p },
      { x: 0, y: -h + p },
      // Top of arrow
      { x: w / 2, y: -h },
      { x: w, y: -h + p },
      // Top of right vertical bar
      { x: w - m, y: -h + p },
      { x: w - m, y: -p },
    ];
  } else if (ud.has('down')) {
    // ARROW_BOTTOM
    points = [
      // Bottom center
      { x: w / 2, y: 0 },
      // Left pont of bottom arrow
      { x: 0, y: -p },
      { x: m, y: -p },
      // Left top over vertical section
      { x: m, y: -h + p },
      { x: w - m, y: -h + p },
      { x: w - m, y: -p },
      { x: w, y: -p },
    ];
  } else {
    // POINT
    points = [{ x: 0, y: 0 }];
  }

  return points;
};
