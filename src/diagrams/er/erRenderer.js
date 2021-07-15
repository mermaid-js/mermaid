import graphlib from 'graphlib';
import { line, curveBasis, select } from 'd3';
import erDb from './erDb';
import erParser from './parser/erDiagram';
import dagre from 'dagre';
import { getConfig } from '../../config';
import { log } from '../../logger';
import erMarkers from './erMarkers';
import { configureSvgSize } from '../../utils';

const conf = {};

/**
 * Allows the top-level API module to inject config specific to this renderer,
 * storing it in the local conf object. Note that generic config still needs to be
 * retrieved using getConfig() imported from the config module
 */
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (let i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};

/**
 * Draw attributes for an entity
 * @param groupNode the svg group node for the entity
 * @param entityTextNode the svg node for the entity label text
 * @param attributes an array of attributes defined for the entity (each attribute has a type and a name)
 * @return the bounding box of the entity, after attributes have been added
 */
const drawAttributes = (groupNode, entityTextNode, attributes) => {
  const heightPadding = conf.entityPadding / 3; // Padding internal to attribute boxes
  const widthPadding = conf.entityPadding / 3; // Ditto
  const attrFontSize = conf.fontSize * 0.85;
  const labelBBox = entityTextNode.node().getBBox();
  const attributeNodes = []; // Intermediate storage for attribute nodes created so that we can do a second pass
  let maxTypeWidth = 0;
  let maxNameWidth = 0;
  let cumulativeHeight = labelBBox.height + heightPadding * 2;
  let attrNum = 1;

  attributes.forEach((item) => {
    const attrPrefix = `${entityTextNode.node().id}-attr-${attrNum}`;

    // Add a text node for the attribute type
    const typeNode = groupNode
      .append('text')
      .attr('class', 'er entityLabel')
      .attr('id', `${attrPrefix}-type`)
      .attr('x', 0)
      .attr('y', 0)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'left')
      .attr(
        'style',
        'font-family: ' + getConfig().fontFamily + '; font-size: ' + attrFontSize + 'px'
      )
      .text(item.attributeType);

    // Add a text node for the attribute name
    const nameNode = groupNode
      .append('text')
      .attr('class', 'er entityLabel')
      .attr('id', `${attrPrefix}-name`)
      .attr('x', 0)
      .attr('y', 0)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'left')
      .attr(
        'style',
        'font-family: ' + getConfig().fontFamily + '; font-size: ' + attrFontSize + 'px'
      )
      .text(item.attributeName);

    // Keep a reference to the nodes so that we can iterate through them later
    attributeNodes.push({ tn: typeNode, nn: nameNode });

    const typeBBox = typeNode.node().getBBox();
    const nameBBox = nameNode.node().getBBox();

    maxTypeWidth = Math.max(maxTypeWidth, typeBBox.width);
    maxNameWidth = Math.max(maxNameWidth, nameBBox.width);

    cumulativeHeight += Math.max(typeBBox.height, nameBBox.height) + heightPadding * 2;
    attrNum += 1;
  });

  // Calculate the new bounding box of the overall entity, now that attributes have been added
  const bBox = {
    width: Math.max(
      conf.minEntityWidth,
      Math.max(
        labelBBox.width + conf.entityPadding * 2,
        maxTypeWidth + maxNameWidth + widthPadding * 4
      )
    ),
    height:
      attributes.length > 0
        ? cumulativeHeight
        : Math.max(conf.minEntityHeight, labelBBox.height + conf.entityPadding * 2),
  };

  // There might be some spare width for padding out attributes if the entity name is very long
  const spareWidth = Math.max(0, bBox.width - (maxTypeWidth + maxNameWidth) - widthPadding * 4);

  if (attributes.length > 0) {
    // Position the entity label near the top of the entity bounding box
    entityTextNode.attr(
      'transform',
      'translate(' + bBox.width / 2 + ',' + (heightPadding + labelBBox.height / 2) + ')'
    );

    // Add rectangular boxes for the attribute types/names
    let heightOffset = labelBBox.height + heightPadding * 2; // Start at the bottom of the entity label
    let attribStyle = 'attributeBoxOdd'; // We will flip the style on alternate rows to achieve a banded effect

    attributeNodes.forEach((nodePair) => {
      // Calculate the alignment y co-ordinate for the type/name of the attribute
      const alignY =
        heightOffset +
        heightPadding +
        Math.max(nodePair.tn.node().getBBox().height, nodePair.nn.node().getBBox().height) / 2;

      // Position the type of the attribute
      nodePair.tn.attr('transform', 'translate(' + widthPadding + ',' + alignY + ')');

      // Insert a rectangle for the type
      const typeRect = groupNode
        .insert('rect', '#' + nodePair.tn.node().id)
        .attr('class', `er ${attribStyle}`)
        .attr('fill', conf.fill)
        .attr('fill-opacity', '100%')
        .attr('stroke', conf.stroke)
        .attr('x', 0)
        .attr('y', heightOffset)
        .attr('width', maxTypeWidth + widthPadding * 2 + spareWidth / 2)
        .attr('height', nodePair.tn.node().getBBox().height + heightPadding * 2);

      // Position the name of the attribute
      nodePair.nn.attr(
        'transform',
        'translate(' + (parseFloat(typeRect.attr('width')) + widthPadding) + ',' + alignY + ')'
      );

      // Insert a rectangle for the name
      groupNode
        .insert('rect', '#' + nodePair.nn.node().id)
        .attr('class', `er ${attribStyle}`)
        .attr('fill', conf.fill)
        .attr('fill-opacity', '100%')
        .attr('stroke', conf.stroke)
        .attr('x', `${typeRect.attr('x') + typeRect.attr('width')}`)
        //.attr('x', maxTypeWidth + (widthPadding * 2))
        .attr('y', heightOffset)
        .attr('width', maxNameWidth + widthPadding * 2 + spareWidth / 2)
        .attr('height', nodePair.nn.node().getBBox().height + heightPadding * 2);

      // Increment the height offset to move to the next row
      heightOffset +=
        Math.max(nodePair.tn.node().getBBox().height, nodePair.nn.node().getBBox().height) +
        heightPadding * 2;

      // Flip the attribute style for row banding
      attribStyle = attribStyle == 'attributeBoxOdd' ? 'attributeBoxEven' : 'attributeBoxOdd';
    });
  } else {
    // Ensure the entity box is a decent size without any attributes
    bBox.height = Math.max(conf.minEntityHeight, cumulativeHeight);

    // Position the entity label in the middle of the box
    entityTextNode.attr('transform', 'translate(' + bBox.width / 2 + ',' + bBox.height / 2 + ')');
  }

  return bBox;
};

/**
 * Use D3 to construct the svg elements for the entities
 * @param svgNode the svg node that contains the diagram
 * @param entities The entities to be drawn
 * @param graph The graph that contains the vertex and edge definitions post-layout
 * @return The first entity that was inserted
 */
const drawEntities = function (svgNode, entities, graph) {
  const keys = Object.keys(entities);
  let firstOne;

  keys.forEach(function (id) {
    // Create a group for each entity
    const groupNode = svgNode.append('g').attr('id', id);

    firstOne = firstOne === undefined ? id : firstOne;

    // Label the entity - this is done first so that we can get the bounding box
    // which then determines the size of the rectangle
    const textId = 'entity-' + id;
    const textNode = groupNode
      .append('text')
      .attr('class', 'er entityLabel')
      .attr('id', textId)
      .attr('x', 0)
      .attr('y', 0)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .attr(
        'style',
        'font-family: ' + getConfig().fontFamily + '; font-size: ' + conf.fontSize + 'px'
      )
      .text(id);

    const { width: entityWidth, height: entityHeight } = drawAttributes(
      groupNode,
      textNode,
      entities[id].attributes
    );

    // Draw the rectangle - insert it before the text so that the text is not obscured
    const rectNode = groupNode
      .insert('rect', '#' + textId)
      .attr('class', 'er entityBox')
      .attr('fill', conf.fill)
      .attr('fill-opacity', '100%')
      .attr('stroke', conf.stroke)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', entityWidth)
      .attr('height', entityHeight);

    const rectBBox = rectNode.node().getBBox();

    // Add the entity to the graph
    graph.setNode(id, {
      width: rectBBox.width,
      height: rectBBox.height,
      shape: 'rect',
      id: id,
    });
  });
  return firstOne;
}; // drawEntities

const adjustEntities = function (svgNode, graph) {
  graph.nodes().forEach(function (v) {
    if (typeof v !== 'undefined' && typeof graph.node(v) !== 'undefined') {
      svgNode
        .select('#' + v)
        .attr(
          'transform',
          'translate(' +
            (graph.node(v).x - graph.node(v).width / 2) +
            ',' +
            (graph.node(v).y - graph.node(v).height / 2) +
            ' )'
        );
    }
  });
  return;
};

const getEdgeName = function (rel) {
  return (rel.entityA + rel.roleA + rel.entityB).replace(/\s/g, '');
};

/**
 * Add each relationship to the graph
 * @param relationships the relationships to be added
 * @param g the graph
 * @return {Array} The array of relationships
 */
const addRelationships = function (relationships, g) {
  relationships.forEach(function (r) {
    g.setEdge(r.entityA, r.entityB, { relationship: r }, getEdgeName(r));
  });
  return relationships;
}; // addRelationships

let relCnt = 0;
/**
 * Draw a relationship using edge information from the graph
 * @param svg the svg node
 * @param rel the relationship to draw in the svg
 * @param g the graph containing the edge information
 * @param insert the insertion point in the svg DOM (because relationships have markers that need to sit 'behind' opaque entity boxes)
 */
const drawRelationshipFromLayout = function (svg, rel, g, insert) {
  relCnt++;

  // Find the edge relating to this relationship
  const edge = g.edge(rel.entityA, rel.entityB, getEdgeName(rel));

  // Get a function that will generate the line path
  const lineFunction = line()
    .x(function (d) {
      return d.x;
    })
    .y(function (d) {
      return d.y;
    })
    .curve(curveBasis);

  // Insert the line at the right place
  const svgPath = svg
    .insert('path', '#' + insert)
    .attr('class', 'er relationshipLine')
    .attr('d', lineFunction(edge.points))
    .attr('stroke', conf.stroke)
    .attr('fill', 'none');

  // ...and with dashes if necessary
  if (rel.relSpec.relType === erDb.Identification.NON_IDENTIFYING) {
    svgPath.attr('stroke-dasharray', '8,8');
  }

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

  // Note that the 'A' entity's marker is at the end of the relationship and the 'B' entity's marker is at the start
  switch (rel.relSpec.cardA) {
    case erDb.Cardinality.ZERO_OR_ONE:
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_END + ')');
      break;
    case erDb.Cardinality.ZERO_OR_MORE:
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_END + ')');
      break;
    case erDb.Cardinality.ONE_OR_MORE:
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_END + ')');
      break;
    case erDb.Cardinality.ONLY_ONE:
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_END + ')');
      break;
  }

  switch (rel.relSpec.cardB) {
    case erDb.Cardinality.ZERO_OR_ONE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_START + ')'
      );
      break;
    case erDb.Cardinality.ZERO_OR_MORE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_START + ')'
      );
      break;
    case erDb.Cardinality.ONE_OR_MORE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_START + ')'
      );
      break;
    case erDb.Cardinality.ONLY_ONE:
      svgPath.attr('marker-start', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_START + ')');
      break;
  }

  // Now label the relationship

  // Find the half-way point
  const len = svgPath.node().getTotalLength();
  const labelPoint = svgPath.node().getPointAtLength(len * 0.5);

  // Append a text node containing the label
  const labelId = 'rel' + relCnt;

  const labelNode = svg
    .append('text')
    .attr('class', 'er relationshipLabel')
    .attr('id', labelId)
    .attr('x', labelPoint.x)
    .attr('y', labelPoint.y)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr(
      'style',
      'font-family: ' + getConfig().fontFamily + '; font-size: ' + conf.fontSize + 'px'
    )
    .text(rel.roleA);

  // Figure out how big the opaque 'container' rectangle needs to be
  const labelBBox = labelNode.node().getBBox();

  // Insert the opaque rectangle before the text label
  svg
    .insert('rect', '#' + labelId)
    .attr('class', 'er relationshipLabelBox')
    .attr('x', labelPoint.x - labelBBox.width / 2)
    .attr('y', labelPoint.y - labelBBox.height / 2)
    .attr('width', labelBBox.width)
    .attr('height', labelBBox.height)
    .attr('fill', 'white')
    .attr('fill-opacity', '85%');

  return;
};

/**
 * Draw en E-R diagram in the tag with id: id based on the text definition of the diagram
 * @param text the text of the diagram
 * @param id the unique id of the DOM node that contains the diagram
 */
export const draw = function (text, id) {
  log.info('Drawing ER diagram');
  erDb.clear();
  const parser = erParser.parser;
  parser.yy = erDb;

  // Parse the text to populate erDb
  try {
    parser.parse(text);
  } catch (err) {
    log.debug('Parsing failed');
  }

  // Get a reference to the svg node that contains the text
  const svg = select(`[id='${id}']`);

  // Add cardinality marker definitions to the svg
  erMarkers.insertMarkers(svg, conf);

  // Now we have to construct the diagram in a specific way:
  // ---
  // 1. Create all the entities in the svg node at 0,0, but with the correct dimensions (allowing for text content)
  // 2. Make sure they are all added to the graph
  // 3. Add all the edges (relationships) to the graph aswell
  // 4. Let dagre do its magic to layout the graph.  This assigns:
  //    - the centre co-ordinates for each node, bearing in mind the dimensions and edge relationships
  //    - the path co-ordinates for each edge
  //    But it has no impact on the svg child nodes - the diagram remains with every entity rooted at 0,0
  // 5. Now assign a transform to each entity in the svg node so that it gets drawn in the correct place, as determined by
  //    its centre point, which is obtained from the graph, and it's width and height
  // 6. And finally, create all the edges in the svg node using information from the graph
  // ---

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
    compound: false,
  })
    .setGraph({
      rankdir: conf.layoutDirection,
      marginx: 20,
      marginy: 20,
      nodesep: 100,
      edgesep: 100,
      ranksep: 100,
    })
    .setDefaultEdgeLabel(function () {
      return {};
    });

  // Draw the entities (at 0,0), returning the first svg node that got
  // inserted - this represents the insertion point for relationship paths
  const firstEntity = drawEntities(svg, erDb.getEntities(), g);

  // TODO: externalise the addition of entities to the graph - it's a bit 'buried' in the above

  // Add all the relationships to the graph
  const relationships = addRelationships(erDb.getRelationships(), g);

  dagre.layout(g); // Node and edge positions will be updated

  // Adjust the positions of the entities so that they adhere to the layout
  adjustEntities(svg, g);

  // Draw the relationships
  relationships.forEach(function (rel) {
    drawRelationshipFromLayout(svg, rel, g, firstEntity);
  });

  const padding = conf.diagramPadding;

  const svgBounds = svg.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;

  configureSvgSize(svg, height, width, conf.useMaxWidth);

  svg.attr('viewBox', `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`);
}; // draw

export default {
  setConf,
  draw,
};
