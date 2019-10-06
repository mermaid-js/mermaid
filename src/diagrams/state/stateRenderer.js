import * as d3 from 'd3';
import dagre from 'dagre-layout';
import graphlib from 'graphlibrary';
import { logger } from '../../logger';
import stateDb from './stateDb';
import { parser } from './parser/stateDiagram';
import utils from '../../utils';
import idCache from './id-cache';
import { drawState, addIdAndBox, drawEdge, drawNote } from './shapes';

parser.yy = stateDb;

let total = 0;

// TODO Move conf object to main conf in mermaidAPI
const conf = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10
};

const transformationLog = {};

export const setConf = function(cnf) {};

// Todo optimize
const getGraphId = function(label) {
  const keys = idCache.keys();

  for (let i = 0; i < keys.length; i++) {
    if (idCache.get(keys[i]).label === label) {
      return keys[i];
    }
  }

  return undefined;
};

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
  parser.yy.clear();
  parser.parse(text);
  logger.warn('Rendering diagram ' + text);

  // /// / Fetch the default direction, use TD if none was found
  const diagram = d3.select(`[id='${id}']`);
  insertMarkers(diagram);

  // // Layout graph, Create a new directed graph
  const graph = new graphlib.Graph({
    multigraph: false,
    compound: true,
    // acyclicer: 'greedy',
    rankdir: 'RL'
  });

  // // Set an object for the graph label
  // graph.setGraph({
  //   isMultiGraph: false,
  //   rankdir: 'RL'
  // });

  // // Default to assigning a new object as a label for each new edge.
  graph.setDefaultEdgeLabel(function() {
    return {};
  });

  const rootDoc = stateDb.getRootDoc();
  const n = renderDoc(rootDoc, diagram);

  const bounds = diagram.node().getBBox();

  diagram.attr('height', '100%');
  diagram.attr('width', '100%');
  diagram.attr('viewBox', '0 0 ' + bounds.width * 2 + ' ' + (bounds.height + 50));
};
const getLabelWidth = text => {
  return text ? text.length * 5.02 : 1;
};

const renderDoc = (doc, diagram, parentId) => {
  // // Layout graph, Create a new directed graph
  const graph = new graphlib.Graph({
    compound: true
  });

  // Set an object for the graph label
  if (parentId)
    graph.setGraph({
      rankdir: 'LR',
      // multigraph: false,
      compound: true,
      // acyclicer: 'greedy',
      rankdir: 'LR',
      ranker: 'tight-tree',
      ranksep: '20'
      // isMultiGraph: false
    });
  else {
    graph.setGraph({
      rankdir: 'TB',
      compound: true,
      // isCompound: true,
      // acyclicer: 'greedy',
      // ranker: 'longest-path'
      ranker: 'tight-tree'
      // ranker: 'network-simplex'
      // isMultiGraph: false
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

  total = keys.length;
  let first = true;
  for (let i = 0; i < keys.length; i++) {
    const stateDef = states[keys[i]];

    let node;
    if (stateDef.doc) {
      let sub = diagram
        .append('g')
        .attr('id', stateDef.id)
        .attr('class', 'classGroup');
      node = renderDoc(stateDef.doc, sub, stateDef.id);

      if (first) {
        first = false;
        sub = addIdAndBox(sub, stateDef);
        let boxBounds = sub.node().getBBox();
        node.width = boxBounds.width;
        node.height = boxBounds.height + 10;
        transformationLog[stateDef.id] = { y: 35 };
      } else {
        // sub = addIdAndBox(sub, stateDef);
        let boxBounds = sub.node().getBBox();
        node.width = boxBounds.width;
        node.height = boxBounds.height;
        // transformationLog[stateDef.id] = { y: 35 };
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

  logger.info('Count=', graph.nodeCount());
  relations.forEach(function(relation) {
    graph.setEdge(relation.id1, relation.id2, {
      relation: relation,
      width: getLabelWidth(relation.title),
      height: 16,
      labelpos: 'c'
    });
  });

  dagre.layout(graph);

  logger.debug('Graph after layout', graph.nodes());

  graph.nodes().forEach(function(v) {
    if (typeof v !== 'undefined' && typeof graph.node(v) !== 'undefined') {
      logger.debug('Node ' + v + ': ' + JSON.stringify(graph.node(v)));
      d3.select('#' + v).attr(
        'transform',
        'translate(' +
          (graph.node(v).x - graph.node(v).width / 2) +
          ',' +
          (graph.node(v).y +
            (transformationLog[v] ? transformationLog[v].y : 0) -
            graph.node(v).height / 2) +
          ' )'
      );
      d3.select('#' + v).attr('data-x-shift', graph.node(v).x - graph.node(v).width / 2);
      const dividers = document.querySelectorAll('#' + v + ' .divider');
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
        divider.setAttribute('x1', 0 - pShift);
        divider.setAttribute('x2', pWidth - pShift);
      });
    } else {
      logger.debug('No Node ' + v + ': ' + JSON.stringify(graph.node(v)));
    }
  });

  let stateBox = diagram.node().getBBox();

  graph.edges().forEach(function(e) {
    if (typeof e !== 'undefined' && typeof graph.edge(e) !== 'undefined') {
      logger.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));
      drawEdge(diagram, graph.edge(e), graph.edge(e).relation);
    }
  });

  stateBox = diagram.node().getBBox();
  const stateInfo = {
    id: parentId ? parentId : 'root',
    label: parentId ? parentId : 'root',
    width: 0,
    height: 0
  };

  stateInfo.width = stateBox.width + 2 * conf.padding;
  stateInfo.height = stateBox.height + 2 * conf.padding;

  logger.info('Doc rendered', stateInfo, graph);
  return stateInfo;
};

export default {
  setConf,
  draw
};
