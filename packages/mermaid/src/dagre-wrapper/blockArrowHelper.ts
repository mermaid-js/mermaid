import type { Direction } from '../../src/diagrams/block/blockTypes.js';

const expandAndDeduplicateDirections = (directions: Direction[]) => {
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
export const getArrowPoints = (
  duplicatedDirections: Direction[],
  bbox: { width: number; height: number },
  node: any
) => {
  // Expand and deduplicate the provided directions.
  // for instance: x, right => right, left
  const directions = expandAndDeduplicateDirections(duplicatedDirections);

  // Factor to divide height for some calculations.
  const f = 2;

  // Calculated height of the bounding box, accounting for node padding.
  const height = bbox.height + 2 * node.padding;
  // Midpoint calculation based on height.
  const midpoint = height / f;
  // Calculated width of the bounding box, accounting for additional width and node padding.
  const width = bbox.width + 2 * midpoint + node.padding;
  // Padding to use, half of the node padding.
  const padding = node.padding / 2;

  if (
    directions.has('right') &&
    directions.has('left') &&
    directions.has('up') &&
    directions.has('down')
  ) {
    // SQUARE
    return [
      // Bottom
      { x: 0, y: 0 },
      { x: midpoint, y: 0 },
      { x: width / 2, y: 2 * padding },
      { x: width - midpoint, y: 0 },
      { x: width, y: 0 },

      // Right
      { x: width, y: -height / 3 },
      { x: width + 2 * padding, y: -height / 2 },
      { x: width, y: (-2 * height) / 3 },
      { x: width, y: -height },

      // Top
      { x: width - midpoint, y: -height },
      { x: width / 2, y: -height - 2 * padding },
      { x: midpoint, y: -height },

      // Left
      { x: 0, y: -height },
      { x: 0, y: (-2 * height) / 3 },
      { x: -2 * padding, y: -height / 2 },
      { x: 0, y: -height / 3 },
    ];
  }
  if (directions.has('right') && directions.has('left') && directions.has('up')) {
    // RECTANGLE_VERTICAL (Top Open)
    return [
      { x: midpoint, y: 0 },
      { x: width - midpoint, y: 0 },
      { x: width, y: -height / 2 },
      { x: width - midpoint, y: -height },
      { x: midpoint, y: -height },
      { x: 0, y: -height / 2 },
    ];
  }
  if (directions.has('right') && directions.has('left') && directions.has('down')) {
    // RECTANGLE_VERTICAL (Bottom Open)
    return [
      { x: 0, y: 0 },
      { x: midpoint, y: -height },
      { x: width - midpoint, y: -height },
      { x: width, y: 0 },
    ];
  }
  if (directions.has('right') && directions.has('up') && directions.has('down')) {
    // RECTANGLE_HORIZONTAL (Right Open)
    return [
      { x: 0, y: 0 },
      { x: width, y: -midpoint },
      { x: width, y: -height + midpoint },
      { x: 0, y: -height },
    ];
  }
  if (directions.has('left') && directions.has('up') && directions.has('down')) {
    // RECTANGLE_HORIZONTAL (Left Open)
    return [
      { x: width, y: 0 },
      { x: 0, y: -midpoint },
      { x: 0, y: -height + midpoint },
      { x: width, y: -height },
    ];
  }
  if (directions.has('right') && directions.has('left')) {
    // HORIZONTAL_LINE
    return [
      { x: midpoint, y: 0 },
      { x: midpoint, y: -padding },
      { x: width - midpoint, y: -padding },
      { x: width - midpoint, y: 0 },
      { x: width, y: -height / 2 },
      { x: width - midpoint, y: -height },
      { x: width - midpoint, y: -height + padding },
      { x: midpoint, y: -height + padding },
      { x: midpoint, y: -height },
      { x: 0, y: -height / 2 },
    ];
  }
  if (directions.has('up') && directions.has('down')) {
    // VERTICAL_LINE
    return [
      // Bottom center
      { x: width / 2, y: 0 },
      // Left pont of bottom arrow
      { x: 0, y: -padding },
      { x: midpoint, y: -padding },
      // Left top over vertical section
      { x: midpoint, y: -height + padding },
      { x: 0, y: -height + padding },
      // Top of arrow
      { x: width / 2, y: -height },
      { x: width, y: -height + padding },
      // Top of right vertical bar
      { x: width - midpoint, y: -height + padding },
      { x: width - midpoint, y: -padding },
      { x: width, y: -padding },
    ];
  }
  if (directions.has('right') && directions.has('up')) {
    // ANGLE_RT
    return [
      { x: 0, y: 0 },
      { x: width, y: -midpoint },
      { x: 0, y: -height },
    ];
  }
  if (directions.has('right') && directions.has('down')) {
    // ANGLE_RB
    return [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: 0, y: -height },
    ];
  }
  if (directions.has('left') && directions.has('up')) {
    // ANGLE_LT
    return [
      { x: width, y: 0 },
      { x: 0, y: -midpoint },
      { x: width, y: -height },
    ];
  }
  if (directions.has('left') && directions.has('down')) {
    // ANGLE_LB
    return [
      { x: width, y: 0 },
      { x: 0, y: 0 },
      { x: width, y: -height },
    ];
  }
  if (directions.has('right')) {
    // ARROW_RIGHT
    return [
      { x: midpoint, y: -padding },
      { x: midpoint, y: -padding },
      { x: width - midpoint, y: -padding },
      { x: width - midpoint, y: 0 },
      { x: width, y: -height / 2 },
      { x: width - midpoint, y: -height },
      { x: width - midpoint, y: -height + padding },
      // top left corner of arrow
      { x: midpoint, y: -height + padding },
      { x: midpoint, y: -height + padding },
    ];
  }
  if (directions.has('left')) {
    // ARROW_LEFT
    return [
      { x: midpoint, y: 0 },
      { x: midpoint, y: -padding },
      // Two points, the right corners
      { x: width - midpoint, y: -padding },
      { x: width - midpoint, y: -height + padding },
      { x: midpoint, y: -height + padding },
      { x: midpoint, y: -height },
      { x: 0, y: -height / 2 },
    ];
  }
  if (directions.has('up')) {
    // ARROW_TOP
    return [
      // Bottom center
      { x: midpoint, y: -padding },
      // Left top over vertical section
      { x: midpoint, y: -height + padding },
      { x: 0, y: -height + padding },
      // Top of arrow
      { x: width / 2, y: -height },
      { x: width, y: -height + padding },
      // Top of right vertical bar
      { x: width - midpoint, y: -height + padding },
      { x: width - midpoint, y: -padding },
    ];
  }
  if (directions.has('down')) {
    // ARROW_BOTTOM
    return [
      // Bottom center
      { x: width / 2, y: 0 },
      // Left pont of bottom arrow
      { x: 0, y: -padding },
      { x: midpoint, y: -padding },
      // Left top over vertical section
      { x: midpoint, y: -height + padding },
      { x: width - midpoint, y: -height + padding },
      { x: width - midpoint, y: -padding },
      { x: width, y: -padding },
    ];
  }

  // POINT
  return [{ x: 0, y: 0 }];
};
