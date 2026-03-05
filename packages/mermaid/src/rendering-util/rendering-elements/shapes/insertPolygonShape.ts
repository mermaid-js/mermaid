import type { D3Selection } from '../../../types.js';

export function insertPolygonShape<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  w: number,
  h: number,
  points: { x: number; y: number }[]
) {
  return parent
    .insert('polygon', ':first-child')
    .attr(
      'points',
      points
        .map(function (d) {
          return d.x + ',' + d.y;
        })
        .join(' ')
    )
    .attr('class', 'label-container')
    .attr('transform', 'translate(' + -w / 2 + ',' + h / 2 + ')');
}
