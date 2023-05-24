import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { line, curveBasis, select } from 'd3';
import { layout as dagreLayout } from 'dagre-d3-es/src/dagre/index.js';
import { getConfig } from '../../config.js';
import { log } from '../../logger.js';
import utils from '../../utils.js';
import erMarkers from './erMarkers.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { parseGenericTypes } from '../common/common.js';
import { v5 as uuid5 } from 'uuid';

/** Regex used to remove chars from the entity name so the result can be used in an id */
const BAD_ID_CHARS_REGEXP = /[^\dA-Za-z](\W)*/g;

// Configuration
let conf = {};

// Map so we can look up the id of an entity based on the name
let entityNameIds = new Map();

/**
 * Allows the top-level API module to inject config specific to this renderer, storing it in the
 * local conf object. Note that generic config still needs to be retrieved using getConfig()
 * imported from the config module
 *
 * @param cnf
 */
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (const key of keys) {
    conf[key] = cnf[key];
  }
};

/**
 * Draw attributes for an entity
 *
 * @param groupNode The svg group node for the entity
 * @param entityTextNode The svg node for the entity label text
 * @param attributes An array of attributes defined for the entity (each attribute has a type and a
 *   name)
 * @returns {object} The bounding box of the entity, after attributes have been added. The bounding
 *   box has a .width and .height
 */
const drawAttributes = (groupNode, entityTextNode, attributes) => {
  const heightPadding = conf.entityPadding / 3; // Padding internal to attribute boxes
  const widthPadding = conf.entityPadding / 3; // Ditto
  const attrFontSize = conf.fontSize * 0.85;
  const labelBBox = entityTextNode.node().getBBox();
  const attributeNodes = []; // Intermediate storage for attribute nodes created so that we can do a second pass
  let hasKeyType = false;
  let hasComment = false;
  let maxTypeWidth = 0;
  let maxNameWidth = 0;
  let maxKeyWidth = 0;
  let maxCommentWidth = 0;
  let cumulativeHeight = labelBBox.height + heightPadding * 2;
  let attrNum = 1;

  // Check to see if any of the attributes has a key or a comment
  attributes.forEach((item) => {
    if (item.attributeKeyTypeList !== undefined && item.attributeKeyTypeList.length > 0) {
      hasKeyType = true;
    }

    if (item.attributeComment !== undefined) {
      hasComment = true;
    }
  });

  attributes.forEach((item) => {
    const attrPrefix = `${entityTextNode.node().id}-attr-${attrNum}`;
    let nodeHeight = 0;

    const attributeType = parseGenericTypes(item.attributeType);

    // Add a text node for the attribute type
    const typeNode = groupNode
      .append('text')
      .classed('er entityLabel', true)
      .attr('id', `${attrPrefix}-type`)
      .attr('x', 0)
      .attr('y', 0)
      .style('dominant-baseline', 'middle')
      .style('text-anchor', 'left')
      .style('font-family', getConfig().fontFamily)
      .style('font-size', attrFontSize + 'px')
      .text(attributeType);

    // Add a text node for the attribute name
    const nameNode = groupNode
      .append('text')
      .classed('er entityLabel', true)
      .attr('id', `${attrPrefix}-name`)
      .attr('x', 0)
      .attr('y', 0)
      .style('dominant-baseline', 'middle')
      .style('text-anchor', 'left')
      .style('font-family', getConfig().fontFamily)
      .style('font-size', attrFontSize + 'px')
      .text(item.attributeName);

    const attributeNode = {};
    attributeNode.tn = typeNode;
    attributeNode.nn = nameNode;

    const typeBBox = typeNode.node().getBBox();
    const nameBBox = nameNode.node().getBBox();
    maxTypeWidth = Math.max(maxTypeWidth, typeBBox.width);
    maxNameWidth = Math.max(maxNameWidth, nameBBox.width);

    nodeHeight = Math.max(typeBBox.height, nameBBox.height);

    if (hasKeyType) {
      const keyTypeNodeText =
        item.attributeKeyTypeList !== undefined ? item.attributeKeyTypeList.join(',') : '';

      const keyTypeNode = groupNode
        .append('text')
        .classed('er entityLabel', true)
        .attr('id', `${attrPrefix}-key`)
        .attr('x', 0)
        .attr('y', 0)
        .style('dominant-baseline', 'middle')
        .style('text-anchor', 'left')
        .style('font-family', getConfig().fontFamily)
        .style('font-size', attrFontSize + 'px')
        .text(keyTypeNodeText);

      attributeNode.kn = keyTypeNode;
      const keyTypeBBox = keyTypeNode.node().getBBox();
      maxKeyWidth = Math.max(maxKeyWidth, keyTypeBBox.width);
      nodeHeight = Math.max(nodeHeight, keyTypeBBox.height);
    }

    if (hasComment) {
      const commentNode = groupNode
        .append('text')
        .classed('er entityLabel', true)
        .attr('id', `${attrPrefix}-comment`)
        .attr('x', 0)
        .attr('y', 0)
        .style('dominant-baseline', 'middle')
        .style('text-anchor', 'left')
        .style('font-family', getConfig().fontFamily)
        .style('font-size', attrFontSize + 'px')
        .text(item.attributeComment || '');

      attributeNode.cn = commentNode;
      const commentNodeBBox = commentNode.node().getBBox();
      maxCommentWidth = Math.max(maxCommentWidth, commentNodeBBox.width);
      nodeHeight = Math.max(nodeHeight, commentNodeBBox.height);
    }

    attributeNode.height = nodeHeight;
    // Keep a reference to the nodes so that we can iterate through them later
    attributeNodes.push(attributeNode);
    cumulativeHeight += nodeHeight + heightPadding * 2;
    attrNum += 1;
  });

  let widthPaddingFactor = 4;
  if (hasKeyType) {
    widthPaddingFactor += 2;
  }
  if (hasComment) {
    widthPaddingFactor += 2;
  }

  const maxWidth = maxTypeWidth + maxNameWidth + maxKeyWidth + maxCommentWidth;

  // Calculate the new bounding box of the overall entity, now that attributes have been added
  const bBox = {
    width: Math.max(
      conf.minEntityWidth,
      Math.max(
        labelBBox.width + conf.entityPadding * 2,
        maxWidth + widthPadding * widthPaddingFactor
      )
    ),
    height:
      attributes.length > 0
        ? cumulativeHeight
        : Math.max(conf.minEntityHeight, labelBBox.height + conf.entityPadding * 2),
  };

  if (attributes.length > 0) {
    // There might be some spare width for padding out attributes if the entity name is very long
    const spareColumnWidth = Math.max(
      0,
      (bBox.width - maxWidth - widthPadding * widthPaddingFactor) / (widthPaddingFactor / 2)
    );

    // Position the entity label near the top of the entity bounding box
    entityTextNode.attr(
      'transform',
      'translate(' + bBox.width / 2 + ',' + (heightPadding + labelBBox.height / 2) + ')'
    );

    // Add rectangular boxes for the attribute types/names
    let heightOffset = labelBBox.height + heightPadding * 2; // Start at the bottom of the entity label
    let attribStyle = 'attributeBoxOdd'; // We will flip the style on alternate rows to achieve a banded effect

    attributeNodes.forEach((attributeNode) => {
      // Calculate the alignment y co-ordinate for the type/name of the attribute
      const alignY = heightOffset + heightPadding + attributeNode.height / 2;

      // Position the type attribute
      attributeNode.tn.attr('transform', 'translate(' + widthPadding + ',' + alignY + ')');

      // TODO Handle spareWidth in attr('width')
      // Insert a rectangle for the type
      const typeRect = groupNode
        .insert('rect', '#' + attributeNode.tn.node().id)
        .classed(`er ${attribStyle}`, true)
        .attr('x', 0)
        .attr('y', heightOffset)
        .attr('width', maxTypeWidth + widthPadding * 2 + spareColumnWidth)
        .attr('height', attributeNode.height + heightPadding * 2);

      const nameXOffset = parseFloat(typeRect.attr('x')) + parseFloat(typeRect.attr('width'));

      // Position the name attribute
      attributeNode.nn.attr(
        'transform',
        'translate(' + (nameXOffset + widthPadding) + ',' + alignY + ')'
      );

      // Insert a rectangle for the name
      const nameRect = groupNode
        .insert('rect', '#' + attributeNode.nn.node().id)
        .classed(`er ${attribStyle}`, true)
        .attr('x', nameXOffset)
        .attr('y', heightOffset)
        .attr('width', maxNameWidth + widthPadding * 2 + spareColumnWidth)
        .attr('height', attributeNode.height + heightPadding * 2);

      let keyTypeAndCommentXOffset =
        parseFloat(nameRect.attr('x')) + parseFloat(nameRect.attr('width'));

      if (hasKeyType) {
        // Position the key type attribute
        attributeNode.kn.attr(
          'transform',
          'translate(' + (keyTypeAndCommentXOffset + widthPadding) + ',' + alignY + ')'
        );

        // Insert a rectangle for the key type
        const keyTypeRect = groupNode
          .insert('rect', '#' + attributeNode.kn.node().id)
          .classed(`er ${attribStyle}`, true)
          .attr('x', keyTypeAndCommentXOffset)
          .attr('y', heightOffset)
          .attr('width', maxKeyWidth + widthPadding * 2 + spareColumnWidth)
          .attr('height', attributeNode.height + heightPadding * 2);

        keyTypeAndCommentXOffset =
          parseFloat(keyTypeRect.attr('x')) + parseFloat(keyTypeRect.attr('width'));
      }

      if (hasComment) {
        // Position the comment attribute
        attributeNode.cn.attr(
          'transform',
          'translate(' + (keyTypeAndCommentXOffset + widthPadding) + ',' + alignY + ')'
        );

        // Insert a rectangle for the comment
        groupNode
          .insert('rect', '#' + attributeNode.cn.node().id)
          .classed(`er ${attribStyle}`, 'true')
          .attr('x', keyTypeAndCommentXOffset)
          .attr('y', heightOffset)
          .attr('width', maxCommentWidth + widthPadding * 2 + spareColumnWidth)
          .attr('height', attributeNode.height + heightPadding * 2);
      }

      // Increment the height offset to move to the next row
      heightOffset += attributeNode.height + heightPadding * 2;

      // Flip the attribute style for row banding
      attribStyle = attribStyle === 'attributeBoxOdd' ? 'attributeBoxEven' : 'attributeBoxOdd';
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
 *
 * @param svgNode The svg node that contains the diagram
 * @param entities The entities to be drawn
 * @param graph The graph that contains the vertex and edge definitions post-layout
 * @returns {object} The first entity that was inserted
 */
const drawEntities = function (svgNode, entities, graph) {
  const keys = Object.keys(entities);
  let firstOne;

  keys.forEach(function (entityName) {
    const entityId = generateId(entityName, 'entity');
    entityNameIds.set(entityName, entityId);

    // Create a group for each entity
    const groupNode = svgNode.append('g').attr('id', entityId);

    firstOne = firstOne === undefined ? entityId : firstOne;

    // Label the entity - this is done first so that we can get the bounding box
    // which then determines the size of the rectangle
    const textId = 'text-' + entityId;
    const textNode = groupNode
      .append('text')
      .classed('er entityLabel', true)
      .attr('id', textId)
      .attr('x', 0)
      .attr('y', 0)
      .style('dominant-baseline', 'middle')
      .style('text-anchor', 'middle')
      .style('font-family', getConfig().fontFamily)
      .style('font-size', conf.fontSize + 'px')
      .text(entityName);

    const { width: entityWidth, height: entityHeight } = drawAttributes(
      groupNode,
      textNode,
      entities[entityName].attributes
    );

    // Draw the rectangle - insert it before the text so that the text is not obscured
    const rectNode = groupNode
      .insert('rect', '#' + textId)
      .classed('er entityBox', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', entityWidth)
      .attr('height', entityHeight);

    const rectBBox = rectNode.node().getBBox();

    // Add the entity to the graph using the entityId
    graph.setNode(entityId, {
      width: rectBBox.width,
      height: rectBBox.height,
      shape: 'rect',
      id: entityId,
    });
  });
  return firstOne;
}; // drawEntities

const adjustEntities = function (svgNode, graph) {
  graph.nodes().forEach(function (v) {
    if (v !== undefined && graph.node(v) !== undefined) {
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
};

/**
 * Construct a name for an edge based on the names of the 2 entities and the role (relationship)
 * between them. Remove any spaces from it
 *
 * @param rel - A (parsed) relationship (e.g. one of the objects in the list returned by
 *   erDb.getRelationships)
 * @returns {string}
 */
const getEdgeName = function (rel) {
  return (rel.entityA + rel.roleA + rel.entityB).replace(/\s/g, '');
};

/**
 * Add each relationship to the graph
 *
 * @param relationships The relationships to be added
 * @param g The graph
 * @returns {Array} The array of relationships
 */
const addRelationships = function (relationships, g) {
  relationships.forEach(function (r) {
    g.setEdge(
      entityNameIds.get(r.entityA),
      entityNameIds.get(r.entityB),
      { relationship: r },
      getEdgeName(r)
    );
  });
  return relationships;
}; // addRelationships

let relCnt = 0;
/**
 * Draw a relationship using edge information from the graph
 *
 * @param svg The svg node
 * @param rel The relationship to draw in the svg
 * @param g The graph containing the edge information
 * @param insert The insertion point in the svg DOM (because relationships have markers that need to
 *   sit 'behind' opaque entity boxes)
 * @param diagObj
 */
const drawRelationshipFromLayout = function (svg, rel, g, insert, diagObj) {
  relCnt++;

  // Find the edge relating to this relationship
  const edge = g.edge(
    entityNameIds.get(rel.entityA),
    entityNameIds.get(rel.entityB),
    getEdgeName(rel)
  );

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
    .classed('er relationshipLine', true)
    .attr('d', lineFunction(edge.points))
    .style('stroke', conf.stroke)
    .style('fill', 'none');

  // ...and with dashes if necessary
  if (rel.relSpec.relType === diagObj.db.Identification.NON_IDENTIFYING) {
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
    case diagObj.db.Cardinality.ZERO_OR_ONE:
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_END + ')');
      break;
    case diagObj.db.Cardinality.ZERO_OR_MORE:
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_END + ')');
      break;
    case diagObj.db.Cardinality.ONE_OR_MORE:
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_END + ')');
      break;
    case diagObj.db.Cardinality.ONLY_ONE:
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_END + ')');
      break;
    case diagObj.db.Cardinality.MD_PARENT:
      svgPath.attr('marker-end', 'url(' + url + '#' + erMarkers.ERMarkers.MD_PARENT_END + ')');
      break;
  }

  switch (rel.relSpec.cardB) {
    case diagObj.db.Cardinality.ZERO_OR_ONE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_ONE_START + ')'
      );
      break;
    case diagObj.db.Cardinality.ZERO_OR_MORE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ZERO_OR_MORE_START + ')'
      );
      break;
    case diagObj.db.Cardinality.ONE_OR_MORE:
      svgPath.attr(
        'marker-start',
        'url(' + url + '#' + erMarkers.ERMarkers.ONE_OR_MORE_START + ')'
      );
      break;
    case diagObj.db.Cardinality.ONLY_ONE:
      svgPath.attr('marker-start', 'url(' + url + '#' + erMarkers.ERMarkers.ONLY_ONE_START + ')');
      break;
    case diagObj.db.Cardinality.MD_PARENT:
      svgPath.attr('marker-start', 'url(' + url + '#' + erMarkers.ERMarkers.MD_PARENT_START + ')');
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
    .classed('er relationshipLabel', true)
    .attr('id', labelId)
    .attr('x', labelPoint.x)
    .attr('y', labelPoint.y)
    .style('text-anchor', 'middle')
    .style('dominant-baseline', 'middle')
    .style('font-family', getConfig().fontFamily)
    .style('font-size', conf.fontSize + 'px')
    .text(rel.roleA);

  // Figure out how big the opaque 'container' rectangle needs to be
  const labelBBox = labelNode.node().getBBox();

  // Insert the opaque rectangle before the text label
  svg
    .insert('rect', '#' + labelId)
    .classed('er relationshipLabelBox', true)
    .attr('x', labelPoint.x - labelBBox.width / 2)
    .attr('y', labelPoint.y - labelBBox.height / 2)
    .attr('width', labelBBox.width)
    .attr('height', labelBBox.height);
};

/**
 * Draw en E-R diagram in the tag with id: id based on the text definition of the diagram
 *
 * @param text The text of the diagram
 * @param id The unique id of the DOM node that contains the diagram
 * @param _version
 * @param diagObj
 */
export const draw = function (text, id, _version, diagObj) {
  conf = getConfig().er;
  log.info('Drawing ER diagram');
  //  diag.db.clear();
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
  // const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

  // Parse the text to populate erDb
  // try {
  //   parser.parse(text);
  // } catch (err) {
  //   log.debug('Parsing failed');
  // }

  // Get a reference to the svg node that contains the text
  const svg = root.select(`[id='${id}']`);

  // Add cardinality marker definitions to the svg
  erMarkers.insertMarkers(svg, conf);

  // Now we have to construct the diagram in a specific way:
  // ---
  // 1. Create all the entities in the svg node at 0,0, but with the correct dimensions (allowing for text content)
  // 2. Make sure they are all added to the graph
  // 3. Add all the edges (relationships) to the graph as well
  // 4. Let dagre do its magic to lay out the graph.  This assigns:
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
  const firstEntity = drawEntities(svg, diagObj.db.getEntities(), g);

  // TODO: externalize the addition of entities to the graph - it's a bit 'buried' in the above

  // Add all the relationships to the graph
  const relationships = addRelationships(diagObj.db.getRelationships(), g);

  dagreLayout(g); // Node and edge positions will be updated

  // Adjust the positions of the entities so that they adhere to the layout
  adjustEntities(svg, g);

  // Draw the relationships
  relationships.forEach(function (rel) {
    drawRelationshipFromLayout(svg, rel, g, firstEntity, diagObj);
  });

  const padding = conf.diagramPadding;

  utils.insertTitle(svg, 'entityTitleText', conf.titleTopMargin, diagObj.db.getDiagramTitle());

  const svgBounds = svg.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;

  configureSvgSize(svg, height, width, conf.useMaxWidth);

  svg.attr('viewBox', `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`);
}; // draw

/**
 * UUID namespace for ER diagram IDs
 *
 * This can be generated via running:
 *
 * ```js
 * const { v5: uuid5 } = await import('uuid');
 * uuid5(
 *   'https://mermaid-js.github.io/mermaid/syntax/entityRelationshipDiagram.html',
 *   uuid5.URL
 * );
 * ```
 */
const MERMAID_ERDIAGRAM_UUID = '28e9f9db-3c8d-5aa5-9faf-44286ae5937c';

/**
 * Return a unique id based on the given string. Start with the prefix, then a hyphen, then the
 * simplified str, then a hyphen, then a unique uuid based on the str. (Hyphens are only included if needed.)
 * Although the official XML standard for ids says that many more characters are valid in the id,
 * this keeps things simple by accepting only A-Za-z0-9.
 *
 * @param {string} str Given string to use as the basis for the id. Default is `''`
 * @param {string} prefix String to put at the start, followed by '-'. Default is `''`
 * @returns {string}
 * @see https://www.w3.org/TR/xml/#NT-Name
 */
export function generateId(str = '', prefix = '') {
  const simplifiedStr = str.replace(BAD_ID_CHARS_REGEXP, '');
  // we use `uuid v5` so that UUIDs are consistent given a string.
  return `${strWithHyphen(prefix)}${strWithHyphen(simplifiedStr)}${uuid5(
    str,
    MERMAID_ERDIAGRAM_UUID
  )}`;
}

/**
 * Append a hyphen to a string only if the string isn't empty
 *
 * @param {string} str
 * @returns {string}
 * @todo This could be moved into a string utility file/class.
 */
function strWithHyphen(str = '') {
  return str.length > 0 ? `${str}-` : '';
}

export default {
  setConf,
  draw,
};
