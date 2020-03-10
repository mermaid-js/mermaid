import graphlib from 'graphlib';
import * as d3 from 'd3';
import erDb from './erDb';
import erParser from './parser/erDiagram';
import dagre from 'dagre';
import { getConfig } from '../../config';
import { logger } from '../../logger';
import erMarkers from './erMarkers';

const conf = {};
export const setConf = function(cnf) {
  const keys = Object.keys(cnf);
  for (let i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};

/**
 * Function that adds the entities as vertices in the graph prior to laying out
 * @param entities The entities to be added to the graph
 * @param g The graph that is to be drawn
 * @returns {Object} The object containing all the entities as properties
 */
const addEntities = function(entities, g) {
  const keys = Object.keys(entities);

  keys.forEach(function(id) {
    const entity = entities[id];
    const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    g.setNode(entity, {
      labelType: 'svg',
      width: 100,
      height: 75,
      shape: 'rect',
      label: svgLabel,
      id: entity
    });
  });
  return entities;
};

/**
 * Use D3 to construct the svg elements for the entities
 * @param diagram the svg node that contains the diagram
 * @param entities the entities to be drawn
 * @param g the dagre graph that contains the vertex and edge definitions post-layout
 */
const drawEntities = function(diagram, entities, g, svgId) {
  // For each vertex in the graph:
  // - append the text label centred in the right place
  // - get it's bounding box and calculate the size of the enclosing rectangle
  // - insert the enclosing rectangle

  g.nodes().forEach(function(v) {
    console.debug('Handling node ', v);

    // Get the centre co-ordinate of the node so that we can centre the entity name
    const centre = { x: g.node(v).x, y: g.node(v).y };

    // Label the entity - this is done first so that we can get the bounding box
    // which then determines the size of the rectangle
    const textId = 'entity-' + v + '-' + svgId;
    const textNode = diagram
      .append('text')
      .attr('id', textId)
      .attr('x', centre.x)
      .attr('y', centre.y)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .attr('style', 'font-family: ' + getConfig().fontFamily)
      .text(v);

    const textBBox = textNode.node().getBBox();
    const entityWidth = Math.max(conf.minEntityWidth, textBBox.width + conf.entityPadding * 2);
    const entityHeight = Math.max(conf.minEntityHeight, textBBox.height + conf.entityPadding * 2);

    // Add info to the node so that we can retrieve it later when drawing relationships
    g.node(v).width = entityWidth;
    g.node(v).height = entityHeight;

    // Draw the rectangle - insert it before the text so that the text is not obscured
    const rectX = centre.x - entityWidth / 2;
    const rectY = centre.y - entityHeight / 2;
    diagram
      .insert('rect', '#' + textId)
      .attr('fill', conf.fill)
      .attr('fill-opacity', conf.fillOpacity)
      .attr('stroke', conf.stroke)
      .attr('x', rectX)
      .attr('y', rectY)
      .attr('width', entityWidth)
      .attr('height', entityHeight);
  });
}; // drawEntities

/**
 * Add each relationship to the graph
 * @param relationships the relationships to be added
 * @param g the graph
 * @return {Array} The array of relationships
 */
const addRelationships = function(relationships, g) {
  relationships.forEach(function(r) {
    g.setEdge(r.entityA, r.entityB, { relationship: r });
  });
  return relationships;
}; // addRelationships

/**
 *
 */
const drawRelationships = function(diagram, relationships, g) {
  relationships.forEach(function(rel) {
    drawRelationshipFromLayout(diagram, rel, g);
  });
}; // drawRelationships

/**
 * Draw a relationship using edge information from the graph
 * @param diagram the svg node
 * @param rel the relationship to draw in the svg
 * @param g the graph containing the edge information
 */
const drawRelationshipFromLayout = function(diagram, rel, g) {
  // Find the edge relating to this relationship
  const edge = g.edge({ v: rel.entityA, w: rel.entityB });

  // Get a function that will generate the line path
  const lineFunction = d3
    .line()
    .x(function(d) {
      return d.x;
    })
    .y(function(d) {
      return d.y;
    })
    .curve(d3.curveBasis);

  // Append the line to the diagram node
  const svgPath = diagram
    .append('path')
    .attr('d', lineFunction(edge.points))
    .attr('stroke', conf.stroke)
    .attr('fill', 'none');

  // TODO: Understand this better
  let url = '';
  if (conf.arrowMarkerAbsolute) {
    url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  // Decide which start and end markers it needs. It may be possible to be more concise here
  // by reversing a start marker to make an end marker...but this will do for now
  switch (rel.cardinality) {
    case erDb.Cardinality.ONLY_ONE_TO_ONE_OR_MORE:
      svgPath.attr('marker-start', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_START + ')');
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_END + ')');
      break;
    case erDb.Cardinality.ONLY_ONE_TO_ZERO_OR_MORE:
      svgPath.attr('marker-start', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_START + ')');
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_END + ')');
      break;
    case erDb.Cardinality.ZERO_OR_ONE_TO_ZERO_OR_MORE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_END + ')');
      break;
    case erDb.Cardinality.ZERO_OR_ONE_TO_ONE_OR_MORE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_END + ')');
      break;
    case erDb.Cardinality.ONE_OR_MORE_TO_ONLY_ONE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_END + ')');
      break;
    case erDb.Cardinality.ZERO_OR_MORE_TO_ONLY_ONE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_END + ')');
      break;
    case erDb.Cardinality.ZERO_OR_MORE_TO_ZERO_OR_ONE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_END + ')');
      break;
    case erDb.Cardinality.ONE_OR_MORE_TO_ZERO_OR_ONE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_END + ')');
      break;
    case erDb.Cardinality.ZERO_OR_ONE_TO_ONLY_ONE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_END + ')');
      break;
    case erDb.Cardinality.ONLY_ONE_TO_ONLY_ONE:
      svgPath.attr('marker-start', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_START + ')');
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_END + ')');
      break;
    case erDb.Cardinality.ONLY_ONE_TO_ZERO_OR_ONE:
      svgPath.attr('marker-start', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_START + ')');
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_END + ')');
      break;
    case erDb.Cardinality.ZERO_OR_ONE_TO_ZERO_OR_ONE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_END + ')');
      break;
    case erDb.Cardinality.ZERO_OR_MORE_TO_ZERO_OR_MORE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_END + ')');
      break;
    case erDb.Cardinality.ZERO_OR_MORE_TO_ONE_OR_MORE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_END + ')');
      break;
    case erDb.Cardinality.ONE_OR_MORE_TO_ZERO_OR_MORE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_END + ')');
      break;
    case erDb.Cardinality.ONE_OR_MORE_TO_ONE_OR_MORE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_START + ')'
      );
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_END + ')');
      break;
  }
};

/**
 * Draw en E-R diagram in the tag with id: id based on the text definition of the diagram
 * @param text the text of the diagram
 * @param id the unique id of the DOM node that contains the diagram
 */
export const draw = function(text, id) {
  logger.info('Drawing ER diagram');
  erDb.clear();
  const parser = erParser.parser;
  parser.yy = erDb;

  // Parse the text to populate erDb
  try {
    parser.parse(text);
  } catch (err) {
    logger.debug('Parsing failed');
  }

  // Get a reference to the diagram node
  const svg = d3.select(`[id='${id}']`);

  // Add cardinality marker definitions to the svg
  erMarkers.insertMarkers(svg, conf);

  // Create the graph
  let g;

  // TODO: Explore directed vs undirected graphs, and how the layout is affected
  // An E-R diagram could be said to be undirected, but there is merit in setting
  // the direction from parent to child in a one-to-many as this influences graphlib to
  // put the parent above the child (does it?), which is intuitive.  Most relationships
  // in ER diagrams are one-to-many.
  g = new graphlib.Graph({
    multigraph: true,
    directed: true,
    compound: false
  })
    .setGraph({
      rankdir: 'LR',
      marginx: 20,
      marginy: 20,
      nodesep: 100,
      ranksep: 100
    })
    .setDefaultEdgeLabel(function() {
      return {};
    });

  // Add the entities and relationships to the graph
  const entities = addEntities(erDb.getEntities(), g);
  const relationships = addRelationships(erDb.getRelationships(), g);

  dagre.layout(g); // Node and edge positions will be updated

  // Draw the relationships first because their markers need to be
  // clipped by the entity boxes
  drawRelationships(svg, relationships, g);
  drawEntities(svg, entities, g, id);

  const padding = 8; // TODO: move this to config

  const svgBounds = svg.node().getBBox();
  const width = svgBounds.width + padding * 4;
  const height = svgBounds.height + padding * 4;
  logger.debug(
    `new ViewBox 0 0 ${width} ${height}`,
    `translate(${padding - g._label.marginx}, ${padding - g._label.marginy})`
  );

  if (conf.useMaxWidth) {
    svg.attr('width', '100%');
    svg.attr('style', `max-width: ${width}px;`);
  } else {
    svg.attr('height', height);
    svg.attr('width', width);
  }

  svg.attr('viewBox', `0 0 ${width} ${height}`);
  svg
    .select('g')
    .attr('transform', `translate(${padding - g._label.marginx}, ${padding - svgBounds.y})`);
}; // draw

export default {
  setConf,
  draw
};
