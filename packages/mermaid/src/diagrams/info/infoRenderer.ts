import { log } from '../../logger.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { DrawDefinition, Group, SVG } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';

/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 *
 * @param text - The text of the diagram.
 * @param id - The id of the diagram which will be used as a DOM element id.
 * @param version - MermaidJS version.
 */
const draw: DrawDefinition = (text, id, version) => {
  log.debug('rendering info diagram\n' + text);

  const svg: SVG = selectSvgElement(id);
  configureSvgSize(svg, 100, 400, true);

  const group: Group = svg.append('g');
  group
    .append('text')
    .attr('x', 100)
    .attr('y', 40)
    .attr('class', 'version')
    .attr('font-size', 32)
    .style('text-anchor', 'middle')
    .text(`v${version}`);
};

export const renderer = { draw };
