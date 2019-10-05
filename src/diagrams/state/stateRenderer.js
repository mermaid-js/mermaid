import * as d3 from 'd3';
import dagre from 'dagre-layout';
import graphlib from 'graphlibrary';
import { logger } from '../../logger';
import stateDb from './stateDb';
import { parser } from './parser/stateDiagram';
import utils from '../../utils';
import idCache from './id-cache';
import { drawState, addIdAndBox, drawEdge } from './shapes';

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
  stateDb.logDocuments();
  logger.info('Rendering diagram ' + text);

  // /// / Fetch the default direction, use TD if none was found
  const diagram = d3.select(`[id='${id}']`);
  insertMarkers(diagram);

  // // Layout graph, Create a new directed graph
  const graph = new graphlib.Graph({
    multigraph: false,
    // compound: true,
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
  diagram.attr('viewBox', '0 0 ' + bounds.width + ' ' + (bounds.height + 50));
};
const getLabelWidth = text => {
  return text ? text.length * 5.02 : 1;
};

const renderDoc = (doc, diagram, parentId) => {
  // // Layout graph, Create a new directed graph
  const graph = new graphlib.Graph({});

  // Set an object for the graph label
  if (parentId)
    graph.setGraph({
      rankdir: 'LR',
      multigraph: false,
      compound: false,
      // acyclicer: 'greedy',
      rankdir: 'LR',
      ranker: 'tight-tree'
      // isMultiGraph: false
    });
  else {
    graph.setGraph({
      rankdir: 'TB',
      // acyclicer: 'greedy'
      ranker: 'longest-path'
      // isMultiGraph: false
    });
  }

  // // Default to assigning a new object as a label for each new edge.
  graph.setDefaultEdgeLabel(function() {
    return {};
  });

  stateDb.extract(doc);
  const states = stateDb.getStates();
  const relations = stateDb.getRelations();

  const keys = Object.keys(states);
  console.warn('rendering doc 2', states, relations);

  total = keys.length;
  for (let i = 0; i < keys.length; i++) {
    const stateDef = states[keys[i]];
    console.warn('keys[i]', keys[i]);
    let node;
    if (stateDef.doc) {
      let sub = diagram
        .append('g')
        .attr('id', stateDef.id)
        .attr('class', 'classGroup');
      node = renderDoc2(stateDef.doc, sub, stateDef.id);

      sub = addIdAndBox(sub, stateDef);
      let boxBounds = sub.node().getBBox();
      node.width = boxBounds.width;
      node.height = boxBounds.height + 10;
      transformationLog[stateDef.id] = { y: 35 };
      // node.x = boxBounds.y;
      // node.y = boxBounds.x;
    } else {
      node = drawState(diagram, stateDef, graph);
    }

    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    graph.setNode(node.id, node);
    // if (parentId) {
    //   console.warn('apa1 P>', node.id, parentId);
    //   // graph.setParent(node.id, parentId);
    // }
    // graph.setNode(node.id + 'note', nodeAppendix);

    // let parent = 'p1';
    // if (node.id === 'XState1') {
    //   parent = 'p2';
    // }

    // graph.setParent(node.id, parent);
    // graph.setParent(node.id + 'note', parent);

    // logger.info('Org height: ' + node.height);
  }

  console.info('Count=', graph.nodeCount());
  relations.forEach(function(relation) {
    console.warn('Rendering edge', relation);
    graph.setEdge(relation.id1, relation.id2, {
      relation: relation,
      width: getLabelWidth(relation.title),
      height: 16,
      labelpos: 'c'
    });
    console.warn(getGraphId(relation.id1), relation.id2, {
      relation: relation
    });
    // graph.setEdge(getGraphId(relation.id1), getGraphId(relation.id2));
  });

  dagre.layout(graph);

  graph.nodes().forEach(function(v) {
    if (typeof v !== 'undefined' && typeof graph.node(v) !== 'undefined') {
      console.warn('Node ' + v + ': ' + JSON.stringify(graph.node(v)));
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
    }
  });
  let stateBox = diagram.node().getBBox();
  console.warn('Node before labels ', stateBox.width);

  graph.edges().forEach(function(e) {
    if (typeof e !== 'undefined' && typeof graph.edge(e) !== 'undefined') {
      logger.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));
      drawEdge(diagram, graph.edge(e), graph.edge(e).relation);
    }
  });

  stateBox = diagram.node().getBBox();
  console.warn('Node after labels ', stateBox.width);
  const stateInfo = {
    id: parentId ? parentId : 'root',
    label: parentId ? parentId : 'root',
    width: 0,
    height: 0
  };

  stateInfo.width = stateBox.width + 2 * conf.padding;
  stateInfo.height = stateBox.height + 2 * conf.padding;

  console.warn('Doc rendered', stateInfo, graph);
  return stateInfo;
};

export default {
  setConf,
  draw
};
