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
 * Function that adds the entities as vertices
 * @param entities The entities to be added to the graph
 * @param g The graph that is to be drawn
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

const addRelationships = function(relationships, g) {
  relationships.forEach(function(r) {
    g.setEdge(r.entityA, r.entityB, { relationship: r });
  });
}; // addRelationships

const drawRelationships = function(diagram, relationships, g) {
  relationships.forEach(function(rel) {
    //drawRelationship(diagram, rel, g);
    drawRelationshipFromLayout(diagram, rel, g);
  });
}; // drawRelationships

const drawRelationshipFromLayout = function(diagram, rel, g) {
  // Find the edge relating to this relationship
  const edge = g.edge({ v: rel.entityA, w: rel.entityB });

  // Using it's points, generate a line function
  edge.points = edge.points.filter(p => !Number.isNaN(p.y)); // TODO: why is necessary?

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

  // TODO: Understand this
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

  // TODO: change the way enums are imported
  // Decide which start and end markers it needs
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

/*
const drawRelationship = function(diagram, relationship, g) {
  // Set the from and to co-ordinates using the graph vertices

  let from = {
    x: g.node(relationship.entityA).x,
    y: g.node(relationship.entityA).y
  };

  let to = {
    x: g.node(relationship.entityB).x,
    y: g.node(relationship.entityB).y
  };

  diagram
    .append('line')
    .attr('x1', from.x)
    .attr('y1', from.y)
    .attr('x2', to.x)
    .attr('y2', to.y)
    .attr('stroke', conf.stroke);
}; // drawRelationship
*/

/*
const drawFeet = function(diagram, relationships, g) {
  relationships.forEach(function(rel) {
    // Get the points of intersection with the entities
    const nodeA = g.node(rel.entityA);
    const nodeB = g.node(rel.entityB);

    const fromIntersect = getIntersection(
      nodeB.x - nodeA.x,
      nodeB.y - nodeA.y,
      nodeA.x,
      nodeA.y,
      nodeA.width / 2,
      nodeA.height / 2
    );

    dot(diagram, fromIntersect, conf.intersectColor);

    const toIntersect = getIntersection(
      nodeA.x - nodeB.x,
      nodeA.y - nodeB.y,
      nodeB.x,
      nodeB.y,
      nodeB.width / 1,
      nodeB.height / 2
    );

    dot(diagram, toIntersect, conf.intersectColor);

    // Get the ankle and heel points
    const anklePoints = getJoints(rel, fromIntersect, toIntersect, conf.ankleDistance);

    dot(diagram, { x: anklePoints.from.x, y: anklePoints.from.y }, conf.ankleColor);
    dot(diagram, { x: anklePoints.to.x, y: anklePoints.to.y }, conf.ankleColor);

    const heelPoints = getJoints(rel, fromIntersect, toIntersect, conf.heelDistance);

    dot(diagram, { x: heelPoints.from.x, y: heelPoints.from.y }, conf.heelColor);
    dot(diagram, { x: heelPoints.to.x, y: heelPoints.to.y }, conf.heelColor);

    // Get the toe points
    const toePoints = getToes(rel, fromIntersect, toIntersect, conf.toeDistance);

    if (toePoints) {
      dot(diagram, { x: toePoints.from.top.x, y: toePoints.from.top.y }, conf.toeColor);
      dot(diagram, { x: toePoints.from.bottom.x, y: toePoints.from.bottom.y }, conf.toeColor);
      dot(diagram, { x: toePoints.to.top.x, y: toePoints.to.top.y }, conf.toeColor);
      dot(diagram, { x: toePoints.to.bottom.x, y: toePoints.to.bottom.y }, conf.toeColor);

      let paths = [];
      paths.push(getToePath(heelPoints.from, toePoints.from.top, nodeA));
      paths.push(getToePath(heelPoints.from, toePoints.from.bottom, nodeA));
      paths.push(getToePath(heelPoints.to, toePoints.to.top, nodeB));
      paths.push(getToePath(heelPoints.to, toePoints.to.bottom, nodeB));

      for (const path of paths) {
        diagram
          .append('path')
          .attr('d', path)
          .attr('stroke', conf.stroke)
          .attr('fill', 'none');
      }
    }
  });
}; // drawFeet

const getToePath = function(heel, toe, tip) {
  if (conf.toeStyle === 'straight') {
    return `M ${heel.x} ${heel.y} L ${toe.x} ${toe.y} L ${tip.x} ${tip.y}`;
  } else {
    return `M ${heel.x} ${heel.y} Q ${toe.x} ${toe.y} ${tip.x} ${tip.y}`;
  }
};
*/
/*
const getToes = function(relationship, fromPoint, toPoint, distance) {
  if (conf.toeStyle === 'curved') {
    distance *= 2;
  }

  const gradient = (fromPoint.y - toPoint.y) / (fromPoint.x - toPoint.x);
  const toeYDelta = getXDelta(distance, gradient);
  const toeXDelta = toeYDelta * Math.abs(gradient);

  if (gradient > 0) {
    const topToe = function(point) {
      return {
        x: point.x + toeXDelta,
        y: point.y - toeYDelta
      };
    };

    const bottomToe = function(point) {
      return {
        x: point.x - toeXDelta,
        y: point.y + toeYDelta
      };
    };

    const lower = {
      top: fromPoint.x < toPoint.x ? topToe(toPoint) : topToe(fromPoint),
      bottom: fromPoint.x < toPoint.x ? bottomToe(toPoint) : bottomToe(fromPoint)
    };

    const upper = {
      top: fromPoint.x < toPoint.x ? topToe(fromPoint) : topToe(toPoint),
      bottom: fromPoint.x < toPoint.x ? bottomToe(fromPoint) : bottomToe(toPoint)
    };

    return {
      to: fromPoint.x < toPoint.x ? lower : upper,
      from: fromPoint.x < toPoint.x ? upper : lower
    };
  }
*/
/*
  if (fromPoint.x < toPoint.x) {
    // Scenario A

    return {
      to: {
        top: {
          x: toPoint.x + toeXDelta,
          y: toPoint.y - toeYDelta
        },
        bottom: {
          x: toPoint.x - toeXDelta,
          y: toPoint.y + toeYDelta
        }
      },
      from: {
        top: {
          x: fromPoint.x + toeXDelta,
          y: fromPoint.y - toeYDelta
        },
        bottom: {
          x: fromPoint.x - toeXDelta,
          y: fromPoint.y + toeYDelta
        }
      }
    };
  } else {
    // Scenario E
  }
*/
/*
}; // getToes
*/
/*
const getJoints = function(relationship, fromPoint, toPoint, distance) {
  const gradient = (fromPoint.y - toPoint.y) / (fromPoint.x - toPoint.x);
  let jointXDelta = getXDelta(distance, gradient);
  let jointYDelta = jointXDelta * Math.abs(gradient);

  let toX, toY;
  let fromX, fromY;

  if (gradient > 0) {
    if (fromPoint.x < toPoint.x) {
      // Scenario A
    } else {
      // Scenario E
      jointXDelta *= -1;
      jointYDelta *= -1;
    }

    toX = toPoint.x - jointXDelta;
    toY = toPoint.y - jointYDelta;
    fromX = fromPoint.x + jointXDelta;
    fromY = fromPoint.y + jointYDelta;
  }

  if (gradient < 0) {
    if (fromPoint.x < toPoint.x) {
      // Scenario C
      jointXDelta *= -1;
      jointYDelta *= -1;
    } else {
      // Scenario G
    }

    toX = toPoint.x + jointXDelta;
    toY = toPoint.y - jointYDelta;
    fromX = fromPoint.x - jointXDelta;
    fromY = fromPoint.y + jointYDelta;
  }

  if (!isFinite(gradient)) {
    if (fromPoint.y < toPoint.y) {
      // Scenario B
    } else {
      // Scenario F
      jointXDelta *= -1;
      jointYDelta *= -1;
    }

    toX = toPoint.x;
    toY = toPoint.y - distance;
    fromX = fromPoint.x;
    fromY = fromPoint.y + distance;
  }

  if (gradient === 0) {
    if (fromPoint.x < toPoint.x) {
      // Scenario D
    } else {
      // Scenario H
      jointXDelta *= -1;
      jointYDelta *= -1;
    }

    toX = toPoint.x - distance;
    toY = toPoint.y;
    fromX = fromPoint.x + distance;
    fromY = fromPoint.y;
  }

  return {
    from: { x: fromX, y: fromY },
    to: { x: toX, y: toY }
  };
};
*/

/*
const getXDelta = function(hypotenuse, gradient) {
  return Math.sqrt((hypotenuse * hypotenuse) / (Math.abs(gradient) + 1));
};

const getIntersection = function(dx, dy, cx, cy, w, h) {
  if (Math.abs(dy / dx) < h / w) {
    // Hit vertical edge of box
    return { x: cx + (dx > 0 ? w : -w), y: cy + (dy * w) / Math.abs(dx) };
  } else {
    // Hit horizontal edge of box
    return { x: cx + (dx * h) / Math.abs(dy), y: cy + (dy > 0 ? h : -h) };
  }
}; // getIntersection

const dot = function(diagram, p, color) {
  // stick a small circle at point p
  if (conf.dots) {
    diagram
      .append('circle')
      .attr('cx', p.x)
      .attr('cy', p.y)
      .attr('r', conf.dotRadius)
      .attr('fill', color);
  }
}; // dot
*/
/**
 * Draw en E-R diagram in the tag with id: id based on the text definition of the graph
 * @param text
 * @param id
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
  const diagram = d3.select(`[id='${id}']`);

  // Add cardinality 'marker' definitions to the svg
  erMarkers.insertMarkers(diagram, conf);

  // Create the graph
  let g;

  // TODO: Explore directed vs undirected graphs, and how the layout is affected
  // An E-R diagram could be said to be undirected, but there is merit in setting
  // the direction from parent to child (1 to many) as this influences graphlib to
  // put the parent above the child, which is intuitive
  g = new graphlib.Graph({
    multigraph: true,
    directed: true,
    compound: false
  })
    .setGraph({
      rankdir: 'TB',
      marginx: 20,
      marginy: 20,
      nodesep: 100,
      ranksep: 100
    })
    .setDefaultEdgeLabel(function() {
      return {};
    });

  // Fetch the entities (which will become vertices)
  const entities = erDb.getEntities();

  // Add all the entities to the graph
  addEntities(entities, g);

  const relationships = erDb.getRelationships();
  // Add all the relationships as edges on the graph
  addRelationships(relationships, g);

  // Set up an SVG group so that we can translate the final graph.
  // TODO: This is redundant -just use diagram from above
  const svg = d3.select(`[id="${id}"]`);

  dagre.layout(g); // Node and edge positions will be updated

  // Run the renderer. This is what draws the final graph.
  //const element = d3.select('#' + id + ' g');
  //render(element, g);

  //drawFeet(diagram, relationships, g);
  drawRelationships(diagram, relationships, g);
  drawEntities(diagram, entities, g, id);

  const padding = 8;

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
