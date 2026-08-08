import type { Selection } from 'd3';

/**
 * Shared SVG drawing helper functions for wireframe components
 */

export const drawBox = (
  parent: Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number,
  width: number,
  height: number,
  className = 'wireframe-container',
  rx = 5
) => {
  return parent
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', width)
    .attr('height', height)
    .attr('rx', rx)
    .attr('ry', rx)
    .attr('class', className);
};

export const drawText = (
  parent: Selection<SVGGElement, unknown, null, undefined>,
  text: string,
  x: number,
  y: number,
  className = 'wireframe-text',
  textAnchor: 'start' | 'middle' | 'end' = 'start'
) => {
  return parent
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('text-anchor', textAnchor)
    .attr('class', className)
    .text(text);
};

export const drawCheckmark = (
  parent: Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number
) => {
  return parent
    .append('path')
    .attr('d', `M ${x + 3} ${y + 8} L ${x + 7} ${y + 13} L ${x + 14} ${y + 4}`)
    .attr('class', 'wireframe-checkmark')
    .attr('stroke-width', 2)
    .attr('fill', 'none');
};

export const drawRadioDot = (
  parent: Selection<SVGGElement, unknown, null, undefined>,
  cx: number,
  cy: number,
  r = 4
) => {
  return parent
    .append('circle')
    .attr('cx', cx)
    .attr('cy', cy)
    .attr('r', r)
    .attr('class', 'wireframe-radio-dot');
};

export const drawDropdownArrow = (
  parent: Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number
) => {
  return parent
    .append('path')
    .attr('d', `M ${x} ${y} L ${x + 8} ${y} L ${x + 4} ${y + 6} Z`)
    .attr('class', 'wireframe-dropdown-arrow');
};

export const drawIconPlaceholder = (
  parent: Selection<SVGGElement, unknown, null, undefined>,
  glyph: string,
  x: number,
  y: number,
  size = 24
) => {
  const g = parent.append('g').attr('class', 'wireframe-icon');
  g.append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', size)
    .attr('height', size)
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('class', 'wireframe-icon-box');

  const char = glyph ? glyph.charAt(0).toUpperCase() : '*';
  g.append('text')
    .attr('x', x + size / 2)
    .attr('y', y + size / 2 + 5)
    .attr('text-anchor', 'middle')
    .attr('class', 'wireframe-text wireframe-icon-text')
    .text(char);

  return g;
};
