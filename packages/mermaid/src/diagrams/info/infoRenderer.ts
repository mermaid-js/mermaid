/** Created by knut on 14-12-11. */
// @ts-ignore - TODO: why
import { select } from 'd3';
import { log } from '../../logger.js';
import { getConfig } from '../../config.js';
import type { DrawDefinition } from '../../diagram-api/types.js';

/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 *
 * @param text - The text of the diagram.
 * @param id - The id of the diagram which will be used as a DOM element id.
 * @param version - MermaidJS version.
 */
export const draw: DrawDefinition = (text, id, version) => {
  try {
    log.debug('Rendering info diagram\n' + text);

    const securityLevel = getConfig().securityLevel;
    // Handle root and Document for when rendering in sandbox mode
    let sandboxElement;
    if (securityLevel === 'sandbox') {
      sandboxElement = select('#i' + id);
    }
    const root =
      securityLevel === 'sandbox'
        ? select(sandboxElement.nodes()[0].contentDocument.body)
        : select('body');

    const svg = root.select('#' + id);

    const g = svg.append('g');

    g.append('text') // text label for the x axis
      .attr('x', 100)
      .attr('y', 40)
      .attr('class', 'version')
      .attr('font-size', '32px')
      .style('text-anchor', 'middle')
      .text('v ' + version);

    svg.attr('height', 100);
    svg.attr('width', 400);
  } catch (e) {
    log.error('Error while rendering info diagram');
    if (e instanceof Error) {
      log.error(e.message);
    } else {
      log.error('Unexpected error', e);
    }
  }
};

export default draw;
