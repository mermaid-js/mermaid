import { select } from 'd3';
import { layout as dagreLayout } from 'dagre-d3-es/src/dagre/index.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { log } from '../../logger.js';
import svgDraw from './svgDraw.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';

let idCache = {};
const padding = 20;

/**
 * Gets the ID with the same label as in the cache
 *
 * @param {string} label The label to look for
 * @returns {string} The resulting ID
 */
const getGraphId = function (label) {
  const foundEntry = Object.entries(idCache).find((entry) => entry[1].label === label);

  if (foundEntry) {
    return foundEntry[0];
  }
};

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 *
 * @param {SVGSVGElement} elem The SVG element to append to
 */
const insertMarkers = function (elem) {
  elem
    .append('defs')
    .append('marker')
    .attr('id', 'extensionStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,7 L18,13 V 1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'extensionEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 V 13 L18,7 Z'); // this is actual shape for arrowhead

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'compositionStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'compositionEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'aggregationStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'aggregationEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'dependencyStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 5,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'dependencyEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L14,7 L9,1 Z');
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 *
 * @param {string} text
 * @param {string} id
 * @param {any} _version
 * @param diagObj
 */
export const draw = function (text, id, _version, diagObj) {
  const conf = getConfig().class;
  idCache = {};

  log.info('Rendering diagram ' + text);

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

  // Fetch the default direction, use TD if none was found
  const diagram = root.select(`[id='${id}']`);
  insertMarkers(diagram);

  // Layout graph, Create a new directed graph
  const g = new graphlib.Graph({
    multigraph: true,
  });

  // Set an object for the graph label
  g.setGraph({
    isMultiGraph: true,
  });

  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(function () {
    return {};
  });

  const classes = diagObj.db.getClasses();
  const keys = Object.keys(classes);

  for (const key of keys) {
    const classDef = classes[key];
    const node = svgDraw.drawClass(diagram, classDef, conf, diagObj);
    idCache[node.id] = node;

    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    g.setNode(node.id, node);

    log.info('Org height: ' + node.height);
  }

  const relations = diagObj.db.getRelations();
  relations.forEach(function (relation) {
    log.info(
      // cspell:ignore tjoho
      'tjoho' + getGraphId(relation.id1) + getGraphId(relation.id2) + JSON.stringify(relation)
    );
    g.setEdge(
      getGraphId(relation.id1),
      getGraphId(relation.id2),
      {
        relation: relation,
      },
      relation.title || 'DEFAULT'
    );
  });

  const notes = diagObj.db.getNotes();
  notes.forEach(function (note) {
    log.debug(`Adding note: ${JSON.stringify(note)}`);
    const node = svgDraw.drawNote(diagram, note, conf, diagObj);
    idCache[node.id] = node;

    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    g.setNode(node.id, node);
    if (note.class && note.class in classes) {
      g.setEdge(
        note.id,
        getGraphId(note.class),
        {
          relation: {
            id1: note.id,
            id2: note.class,
            relation: {
              type1: 'none',
              type2: 'none',
              lineType: 10,
            },
          },
        },
        'DEFAULT'
      );
    }
  });

  dagreLayout(g);
  g.nodes().forEach(function (v) {
    if (v !== undefined && g.node(v) !== undefined) {
      log.debug('Node ' + v + ': ' + JSON.stringify(g.node(v)));
      root
        .select('#' + (diagObj.db.lookUpDomId(v) || v))
        .attr(
          'transform',
          'translate(' +
            (g.node(v).x - g.node(v).width / 2) +
            ',' +
            (g.node(v).y - g.node(v).height / 2) +
            ' )'
        );
    }
  });

  g.edges().forEach(function (e) {
    if (e !== undefined && g.edge(e) !== undefined) {
      log.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
      svgDraw.drawEdge(diagram, g.edge(e), g.edge(e).relation, conf, diagObj);
    }
  });

  const svgBounds = diagram.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;

  configureSvgSize(diagram, height, width, conf.useMaxWidth);

  // Ensure the viewBox includes the whole svgBounds area with extra space for padding
  const vBox = `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`;
  log.debug(`viewBox ${vBox}`);
  diagram.attr('viewBox', vBox);
};

export default {
  draw,
};
