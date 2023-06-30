import { select } from 'd3';
import { log } from '../../logger.js';
import { getConfig } from '../../config.js';
import type { DrawDefinition, HTML, SVG } from '../../diagram-api/types.js';

/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 *
 * @param text - The text of the diagram.
 * @param id - The id of the diagram which will be used as a DOM element id.
 * @param version - MermaidJS version.
 */
const draw: DrawDefinition = (text, id, version) => {
  try {
    log.debug('rendering info diagram\n' + text);

    const { securityLevel } = getConfig();
    // handle root and document for when rendering in sandbox mode
    let sandboxElement: HTML | undefined;
    let document: Document | null | undefined;
    if (securityLevel === 'sandbox') {
      sandboxElement = select('#i' + id);
      document = sandboxElement.nodes()[0].contentDocument;
    }

    // @ts-ignore - figure out how to assign HTML to document type
    const root: HTML =
      sandboxElement !== undefined && document !== undefined && document !== null
        ? select(document)
        : select('body');

    const svg: SVG = root.select('#' + id);
    svg.attr('height', 100);
    svg.attr('width', 400);

    const g = svg.append('g');

    g.append('text') // text label for the x axis
      .attr('x', 100)
      .attr('y', 40)
      .attr('class', 'version')
      .attr('font-size', '32px')
      .style('text-anchor', 'middle')
      .text('v ' + version);
  } catch (e) {
    log.error('error while rendering info diagram', e);
  }
};

export const renderer = { draw };
