import { select } from 'd3';
import { layout as dagreLayout } from 'dagre-d3-es/src/dagre/index.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { log } from '../../logger.js';
import common from '../common/common.js';
import { drawState, addTitleAndBox, drawEdge } from './shapes.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';

// TODO Move conf object to main conf in mermaidAPI
let conf;

const transformationLog = {};

export const setConf = function () {
  //no-op
};

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 *
 * @param {any} elem
 */
const insertMarkers = function (elem) {
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
 *
 * @param {any} text
 * @param {any} id
 * @param _version
 * @param diagObj
 */
export const draw = function (text, id, _version, diagObj) {
  conf = getConfig().state;
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
  const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

  log.debug('Rendering diagram ' + text);

  // Fetch the default direction, use TD if none was found
  const diagram = root.select(`[id='${id}']`);
  insertMarkers(diagram);

  const rootDoc = diagObj.db.getRootDoc();
  renderDoc(rootDoc, diagram, undefined, false, root, doc, diagObj);

  const padding = conf.padding;
  const bounds = diagram.node().getBBox();

  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;

  // zoom in a bit
  const svgWidth = width * 1.75;
  configureSvgSize(diagram, height, svgWidth, conf.useMaxWidth);

  diagram.attr(
    'viewBox',
    `${bounds.x - conf.padding}  ${bounds.y - conf.padding} ` + width + ' ' + height
  );
};
const getLabelWidth = (text) => {
  return text ? text.length * conf.fontSizeFactor : 1;
};

const renderDoc = (doc, diagram, parentId, altBkg, root, domDocument, diagObj) => {
  // Layout graph, Create a new directed graph
  const graph = new graphlib.Graph({
    compound: true,
    multigraph: true,
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
  if (parentId) {
    graph.setGraph({
      rankdir: 'LR',
      multigraph: true,
      compound: true,
      // acyclicer: 'greedy',
      ranker: 'tight-tree',
      ranksep: edgeFreeDoc ? 1 : conf.edgeLengthFactor,
      nodeSep: edgeFreeDoc ? 1 : 50,
      isMultiGraph: true,
      // ranksep: 5,
      // nodesep: 1
    });
  } else {
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
      isMultiGraph: true,
    });
  }

  // Default to assigning a new object as a label for each new edge.
  graph.setDefaultEdgeLabel(function () {
    return {};
  });

  const states = diagObj.db.getStates();
  const relations = diagObj.db.getRelations();

  const keys = Object.keys(states);

  let first = true;

  for (const key of keys) {
    const stateDef = states[key];

    if (parentId) {
      stateDef.parentId = parentId;
    }

    let node;
    if (stateDef.doc) {
      let sub = diagram.append('g').attr('id', stateDef.id).attr('class', 'stateGroup');
      node = renderDoc(stateDef.doc, sub, stateDef.id, !altBkg, root, domDocument, diagObj);

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
        type: 'note',
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

  log.debug('Count=', graph.nodeCount(), graph);
  let cnt = 0;
  relations.forEach(function (relation) {
    cnt++;
    log.debug('Setting edge', relation);
    graph.setEdge(
      relation.id1,
      relation.id2,
      {
        relation: relation,
        width: getLabelWidth(relation.title),
        height: conf.labelHeight * common.getRows(relation.title).length,
        labelpos: 'c',
      },
      'id' + cnt
    );
  });

  dagreLayout(graph);

  log.debug('Graph after layout', graph.nodes());
  const svgElem = diagram.node();

  graph.nodes().forEach(function (v) {
    if (v !== undefined && graph.node(v) !== undefined) {
      log.warn('Node ' + v + ': ' + JSON.stringify(graph.node(v)));
      root
        .select('#' + svgElem.id + ' #' + v)
        .attr(
          'transform',
          'translate(' +
            (graph.node(v).x - graph.node(v).width / 2) +
            ',' +
            (graph.node(v).y +
              (transformationLog[v] ? transformationLog[v].y : 0) -
              graph.node(v).height / 2) +
            ' )'
        );
      root
        .select('#' + svgElem.id + ' #' + v)
        .attr('data-x-shift', graph.node(v).x - graph.node(v).width / 2);
      const dividers = domDocument.querySelectorAll('#' + svgElem.id + ' #' + v + ' .divider');
      dividers.forEach((divider) => {
        const parent = divider.parentElement;
        let pWidth = 0;
        let pShift = 0;
        if (parent) {
          if (parent.parentElement) {
            pWidth = parent.parentElement.getBBox().width;
          }
          pShift = parseInt(parent.getAttribute('data-x-shift'), 10);
          if (Number.isNaN(pShift)) {
            pShift = 0;
          }
        }
        divider.setAttribute('x1', 0 - pShift + 8);
        divider.setAttribute('x2', pWidth - pShift - 8);
      });
    } else {
      log.debug('No Node ' + v + ': ' + JSON.stringify(graph.node(v)));
    }
  });

  let stateBox = svgElem.getBBox();

  graph.edges().forEach(function (e) {
    if (e !== undefined && graph.edge(e) !== undefined) {
      log.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));
      drawEdge(diagram, graph.edge(e), graph.edge(e).relation);
    }
  });

  stateBox = svgElem.getBBox();

  const stateInfo = {
    id: parentId ? parentId : 'root',
    label: parentId ? parentId : 'root',
    width: 0,
    height: 0,
  };

  stateInfo.width = stateBox.width + 2 * conf.padding;
  stateInfo.height = stateBox.height + 2 * conf.padding;

  log.debug('Doc rendered', stateInfo, graph);
  return stateInfo;
};

export default {
  setConf,
  draw,
};
