export const createRoundedRectPathD = (
  x: number,
  y: number,
  totalWidth: number,
  totalHeight: number,
  radius: number
) =>
  [
    'M',
    x + radius,
    y, // Move to the first point
    'H',
    x + totalWidth - radius, // Draw horizontal line to the beginning of the right corner
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x + totalWidth,
    y + radius, // Draw arc to the right top corner
    'V',
    y + totalHeight - radius, // Draw vertical line down to the beginning of the right bottom corner
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x + totalWidth - radius,
    y + totalHeight, // Draw arc to the right bottom corner
    'H',
    x + radius, // Draw horizontal line to the beginning of the left bottom corner
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x,
    y + totalHeight - radius, // Draw arc to the left bottom corner
    'V',
    y + radius, // Draw vertical line up to the beginning of the left top corner
    'A',
    radius,
    radius,
    0,
    0,
    1,
    x + radius,
    y, // Draw arc to the left top corner
    'Z', // Close the path
  ].join(' ');
