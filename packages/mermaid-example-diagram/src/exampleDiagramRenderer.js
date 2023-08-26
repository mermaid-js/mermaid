/** Created by knut on 14-12-11. */
import { select } from 'd3';
import { log, getConfig, setupGraphViewbox } from './mermaidUtils.js';

/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 *
 * @param {any} text
 * @param {any} id
 * @param {any} version
 */
export const draw = (text, id, version) => {
  try {
    const conf = getConfig();
    log.debug('Rendering example diagram\n' + text, 'Conf: ');
    const THEME_COLOR_LIMIT = getConfig().themeVariables.THEME_COLOR_LIMIT;
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

    let i;
    for (i = 0; i < THEME_COLOR_LIMIT; i++) {
      const section = g.append('g').attr('class', 'section-' + i);
      section
        .append('rect')
        .attr('x', (i % 5) * 110)
        .attr('y', Math.floor(i / 5) * 90 + 60)
        .attr('width', 100)
        .attr('height', 60);
      section
        .append('rect')
        .attr('x', (i % 5) * 110)
        .attr('y', Math.floor(i / 5) * 90 + 120)
        .attr('class', 'inverted')
        .attr('width', 100)
        .attr('height', 20);
      section
        .append('text', 'section-' + i)
        .text('Section ' + i)
        .attr('x', (i % 5) * 110 + 15)
        .attr('y', Math.floor(i / 5) * 90 + 95)
        .attr('class', 'section-text-' + i);
    }

    g.append('text') // text label for the x axis
      .attr('x', 100)
      .attr('y', 40)
      .attr('class', 'version')
      .attr('font-size', '32px')
      .style('text-anchor', 'middle')
      .text('v ' + version);

    // Setup the view box and size of the svg element
    setupGraphViewbox(undefined, svg, conf.mindmap.padding, conf.mindmap.useMaxWidth);
  } catch (e) {
    log.error('Error while rendering info diagram');
    log.error(e.message);
  }
};

export default {
  draw,
};
