import db from './exampleDb'
import exampleParser from './parser/example.js'
import d3 from '../../d3'

import { logger } from '../../logger'

/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function (txt, id, ver) {
  const parser = exampleParser.parser
  parser.yy = db
  logger.debug('Renering example diagram')
  // Parse the graph definition
  parser.parse(txt)

  // Fetch the default direction, use TD if none was found
  const svg = d3.select('#' + id)

  const g = svg.append('g')

  g.append('text')      // text label for the x axis
    .attr('x', 100)
    .attr('y', 40)
    .attr('class', 'version')
    .attr('font-size', '32px')
    .style('text-anchor', 'middle')
    .text('mermaid ' + ver)

  svg.attr('height', 100)
  svg.attr('width', 400)
}

export default {
  draw
}
