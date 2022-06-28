/** Created by knut on 14-12-11. */
import { select } from 'd3';
import db from './infoDb';
import infoParser from './parser/info';
import { log } from '../../logger';
import { getConfig } from '../../config';

const conf = {};
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);

  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};

/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 *
 * @param {any} text
 * @param {any} id
 * @param {any} version
 */
export const draw = (text, id, version) => {
  try {
    const parser = infoParser.parser;
    parser.yy = db;
    log.debug('Renering info diagram\n' + text);

    const securityLevel = getConfig().securityLevel;
    // Handle root and Document for when rendering in sanbox mode
    let sandboxElement;
    if (securityLevel === 'sandbox') {
      sandboxElement = select('#i' + id);
    }
    const root =
      securityLevel === 'sandbox'
        ? select(sandboxElement.nodes()[0].contentDocument.body)
        : select('body');
    const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

    // Parse the graph definition
    parser.parse(text);
    log.debug('Parsed info diagram');
    // Fetch the default direction, use TD if none was found
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
    // svg.attr('viewBox', '0 0 300 150');
  } catch (e) {
    log.error('Error while rendering info diagram');
    log.error(e.message);
  }
};

export default {
  setConf,
  draw,
};
