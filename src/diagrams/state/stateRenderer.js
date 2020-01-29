import * as d3 from 'd3';
import dagre from 'dagre';
import graphlib from 'graphlib';
import { logger } from '../../logger';
import stateDb from './stateDb';
import { parser } from './parser/stateDiagram';
// import idCache from './id-cache';
import { drawState, addTitleAndBox, drawEdge } from './shapes';
import { getConfig } from '../../config';

parser.yy = stateDb;

// TODO Move conf object to main conf in mermaidAPI
let conf;

const transformationLog = {};

export const setConf = function() {};

// Todo optimize

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
const insertMarkers = function(elem) {
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
    .attr('d', 'M 19,7 L9,13 L14,7 L9,1 Z');
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function(text, id) {
  conf = getConfig().state;
  parser.yy.clear();
  parser.parse(text);
  logger.debug('Rendering diagram ' + text);

  // Fetch the default direction, use TD if none was found
  const diagram = d3.select(`[id='${id}']`);
  insertMarkers(diagram);

  // Layout graph, Create a new directed graph
  const graph = new graphlib.Graph({
    multigraph: true,
    compound: true,
    // acyclicer: 'greedy',
    rankdir: 'RL'
    // ranksep: '20'
  });

  // Default to assigning a new object as a label for each new edge.
  graph.setDefaultEdgeLabel(function() {
    return {};
  });

  const rootDoc = stateDb.getRootDoc();
  renderDoc(rootDoc, diagram, undefined, false);

  const padding = conf.padding;
  const bounds = diagram.node().getBBox();

  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;

  // diagram.attr('height', '100%');
  // diagram.attr('style', `width: ${bounds.width * 3 + conf.padding * 2};`);
  // diagram.attr('height', height);

  // Zoom in a bit
  diagram.attr('width', width * 1.75);
  // diagram.attr('height', bounds.height * 3 + conf.padding * 2);
  diagram.attr(
    'viewBox',
    `${bounds.x - conf.padding}  ${bounds.y - conf.padding} ` + width + ' ' + height
  );
  // diagram.attr('transform', `translate(, 0)`);

  // diagram.attr(
  //   'viewBox',
  //   `${conf.padding * -1} ${conf.padding * -1} ` +
  //     (bounds.width * 1.5 + conf.padding * 2) +
  //     ' ' +
  //     (bounds.height + conf.padding * 5)
  // );
};
const getLabelWidth = text => {
  return text ? text.length * conf.fontSizeFactor : 1;
};

/* TODO: REMOVE DUPLICATION, SEE SHAPES */
const getRows = s => {
  if (!s) return 1;
  let str = s.replace(/<br\s*\/?>/gi, '#br#');
  str = str.replace(/\\n/g, '#br#');
  return str.split('#br#');
};

const renderDoc = (doc, diagram, parentId, altBkg) => {
  // // Layout graph, Create a new directed graph
  const graph = new graphlib.Graph({
    compound: true,
    multigraph: true
  });

  let i;
  let edgeFreeDoc = true;
  for (i = 0; i < doc.length; i++) {
    if (doc[i].stmt === 'relation') {
      edgeFreeDoc = false;
      break;
    }
  }

  // Set an object for the graph label
  if (parentId)
    graph.setGraph({
      rankdir: 'LR',
      multigraph: true,
      compound: true,
      // acyclicer: 'greedy',
      ranker: 'tight-tree',
      ranksep: edgeFreeDoc ? 1 : conf.edgeLengthFactor,
      nodeSep: edgeFreeDoc ? 1 : 50,
      isMultiGraph: true
      // ranksep: 5,
      // nodesep: 1
    });
  else {
    graph.setGraph({
      rankdir: 'TB',
      multigraph: true,
      compound: true,
      // isCompound: true,
      // acyclicer: 'greedy',
      // ranker: 'longest-path'
      ranksep: edgeFreeDoc ? 1 : conf.edgeLengthFactor,
      nodeSep: edgeFreeDoc ? 1 : 50,
      ranker: 'tight-tree',
      // ranker: 'network-simplex'
      isMultiGraph: true
    });
  }

  // Default to assigning a new object as a label for each new edge.
  graph.setDefaultEdgeLabel(function() {
    return {};
  });

  stateDb.extract(doc);
  const states = stateDb.getStates();
  const relations = stateDb.getRelations();

  const keys = Object.keys(states);

  let first = true;

  for (let i = 0; i < keys.length; i++) {
    const stateDef = states[keys[i]];

    if (parentId) {
      stateDef.parentId = parentId;
    }

    let node;
    if (stateDef.doc) {
      let sub = diagram
        .append('g')
        .attr('id', stateDef.id)
        .attr('class', 'stateGroup');
      node = renderDoc(stateDef.doc, sub, stateDef.id, !altBkg);

      if (first) {
        // first = false;
        sub = addTitleAndBox(sub, stateDef, altBkg);
        let boxBounds = sub.node().getBBox();
        node.width = boxBounds.width;
        node.height = boxBounds.height + conf.padding / 2;
        transformationLog[stateDef.id] = { y: conf.compositTitleSize };
      } else {
        // sub = addIdAndBox(sub, stateDef);
        let boxBounds = sub.node().getBBox();
        node.width = boxBounds.width;
        node.height = boxBounds.height;
        // transformationLog[stateDef.id] = { y: conf.compositTitleSize };
      }
    } else {
      node = drawState(diagram, stateDef, graph);
    }

    if (stateDef.note) {
      // Draw note note
      const noteDef = {
        descriptions: [],
        id: stateDef.id + '-note',
        note: stateDef.note,
        type: 'note'
      };
      const note = drawState(diagram, noteDef, graph);

      // graph.setNode(node.id, node);
      if (stateDef.note.position === 'left of') {
        graph.setNode(node.id + '-note', note);
        graph.setNode(node.id, node);
      } else {
        graph.setNode(node.id, node);
        graph.setNode(node.id + '-note', note);
      }
      // graph.setNode(node.id);
      graph.setParent(node.id, node.id + '-group');
      graph.setParent(node.id + '-note', node.id + '-group');
    } else {
      // Add nodes to the graph. The first argument is the node id. The second is
      // metadata about the node. In this case we're going to add labels to each of
      // our nodes.
      graph.setNode(node.id, node);
    }
  }

  logger.debug('Count=', graph.nodeCount(), graph);
  let cnt = 0;
  relations.forEach(function(relation) {
    cnt++;
    logger.debug('Setting edge', relation);
    graph.setEdge(
      relation.id1,
      relation.id2,
      {
        relation: relation,
        width: getLabelWidth(relation.title),
        height: conf.labelHeight * getRows(relation.title).length,
        labelpos: 'c'
      },
      'id' + cnt
    );
  });

  dagre.layout(graph);

  logger.debug('Graph after layout', graph.nodes());
  const svgElem = diagram.node();

  graph.nodes().forEach(function(v) {
    if (typeof v !== 'undefined' && typeof graph.node(v) !== 'undefined') {
      logger.warn('Node ' + v + ': ' + JSON.stringify(graph.node(v)));
      d3.select('#' + svgElem.id + ' #' + v).attr(
        'transform',
        'translate(' +
          (graph.node(v).x - graph.node(v).width / 2) +
          ',' +
          (graph.node(v).y +
            (transformationLog[v] ? transformationLog[v].y : 0) -
            graph.node(v).height / 2) +
          ' )'
      );
      d3.select('#' + svgElem.id + ' #' + v).attr(
        'data-x-shift',
        graph.node(v).x - graph.node(v).width / 2
      );
      const dividers = document.querySelectorAll('#' + svgElem.id + ' #' + v + ' .divider');
      dividers.forEach(divider => {
        const parent = divider.parentElement;
        let pWidth = 0;
        let pShift = 0;
        if (parent) {
          if (parent.parentElement) pWidth = parent.parentElement.getBBox().width;
          pShift = parseInt(parent.getAttribute('data-x-shift'), 10);
          if (Number.isNaN(pShift)) {
            pShift = 0;
          }
        }
        divider.setAttribute('x1', 0 - pShift + 8);
        divider.setAttribute('x2', pWidth - pShift - 8);
      });
    } else {
      logger.debug('No Node ' + v + ': ' + JSON.stringify(graph.node(v)));
    }
  });

  let stateBox = svgElem.getBBox();

  graph.edges().forEach(function(e) {
    if (typeof e !== 'undefined' && typeof graph.edge(e) !== 'undefined') {
      logger.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));
      drawEdge(diagram, graph.edge(e), graph.edge(e).relation);
    }
  });

  stateBox = svgElem.getBBox();

  const stateInfo = {
    id: parentId ? parentId : 'root',
    label: parentId ? parentId : 'root',
    width: 0,
    height: 0
  };

  stateInfo.width = stateBox.width + 2 * conf.padding;
  stateInfo.height = stateBox.height + 2 * conf.padding;

  logger.debug('Doc rendered', stateInfo, graph);
  return stateInfo;
};

export default {
  setConf,
  draw
};
