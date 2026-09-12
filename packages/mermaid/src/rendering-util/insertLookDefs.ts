import type { MermaidConfig } from '../config.type.js';
import type { SVG } from '../diagram-api/types.js';

/**
 * Append the `<defs>` that the look-specific stylesheet rules point at.
 *
 * `styles.ts` emits, for `look: neo`, declarations of the form
 * `stroke: url(#<svgId>-gradient)` and `filter: url(#<svgId>-drop-shadow)`. An `url(#…)`
 * paint that resolves to nothing is painted as **none**, not as a fallback colour — so a
 * diagram that carries `data-look="neo"` without these definitions loses its borders
 * entirely rather than degrading to a plain stroke.
 *
 * Every diagram going through `rendering-util/render.ts` gets them from there. Block
 * diagrams run their own render loop and so have to ask for them; extracted here rather
 * than duplicated so the two cannot drift into producing different gradients.
 *
 * Idempotent by id: calling it twice on one svg would append duplicate definitions, so
 * call it once per render.
 *
 * @param svg - The diagram's root `svg` selection. Its `id` scopes every definition, so
 * several diagrams on one page do not collide.
 * @param config - The merged config, read for `theme` and `themeVariables`.
 */
export const insertLookDefs = (svg: SVG, config: MermaidConfig): void => {
  const { theme, themeVariables } = config;
  const { useGradient, gradientStart, gradientStop } = themeVariables ?? {};
  const svgId = svg.attr('id');
  // The shadow is tinted against the background rather than always black: on a dark theme
  // a black shadow is invisible.
  const floodColor = theme?.includes('dark') ? '#FFFFFF' : '#000000';

  const dropShadow = (id: string, size: string, offset: string) =>
    svg
      .append('defs')
      .append('filter')
      .attr('id', id)
      .attr('height', size)
      .attr('width', size)
      .append('feDropShadow')
      .attr('dx', offset)
      .attr('dy', offset)
      .attr('stdDeviation', 0)
      .attr('flood-opacity', '0.06')
      .attr('flood-color', floodColor);

  dropShadow(`${svgId}-drop-shadow`, '130%', '4');
  dropShadow(`${svgId}-drop-shadow-small`, '150%', '2');

  if (!useGradient) {
    return;
  }

  const gradient = svg
    .append('linearGradient')
    .attr('id', `${svgId}-gradient`)
    .attr('gradientUnits', 'objectBoundingBox')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%');

  gradient
    .append('svg:stop')
    .attr('offset', '0%')
    .attr('stop-color', gradientStart)
    .attr('stop-opacity', 1);

  gradient
    .append('svg:stop')
    .attr('offset', '100%')
    .attr('stop-color', gradientStop)
    .attr('stop-opacity', 1);
};
