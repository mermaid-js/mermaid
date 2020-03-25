import graphlib from 'graphlib';
import * as d3 from 'd3';
import stateDb from './stateDb';
import state from './parser/stateDiagram';
import { getConfig } from '../../config';

import { render } from '../../dagre-wrapper/index.js';
import addHtmlLabel from 'dagre-d3/lib/label/add-html-label.js';
import { logger } from '../../logger';
import { interpolateToCurve, getStylesFromArray } from '../../utils';

const conf = {};
export const setConf = function(cnf) {
  const keys = Object.keys(cnf);
  for (let i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};

const nodeDb = {};

/**
 * Returns the all the styles from classDef statements in the graph definition.
 * @returns {object} classDef styles
 */
export const getClasses = function(text) {
  logger.trace('Extracting classes');
  stateDb.clear();
  const parser = state.parser;
  parser.yy = stateDb;

  // Parse the graph definition
  parser.parse(text);
  return stateDb.getClasses();
};

const setupNode = (g, parent, node, first) => {
  // Add the node
  if (node.id !== 'root') {
    let shape = 'rect';
    if (node.start === true) {
      shape = 'start';
    }
    if (node.start === false) {
      shape = 'end';
    }

    if (!nodeDb[node.id]) {
      nodeDb[node.id] = {
        id: node.id,
        shape,
        description: node.id
      };
    }

    // Description
    if (node.description) {
      nodeDb[node.id].description = node.description;
    }

    // Save data for description and group so that for instance a statement without description overwrites
    // one with description

    // group
    if (!nodeDb[node.id].type && node.doc) {
      logger.info('Setting cluser for ', node.id);
      nodeDb[node.id].type = 'group';
    }

    const nodeData = {
      labelType: 'svg',
      labelStyle: '',
      shape: nodeDb[node.id].shape,
      label: node.id,
      labelText: nodeDb[node.id].description,
      // label: nodeDb[node.id].description || node.id,
      // labelText: nodeDb[node.id].description || node.id,
      rx: 0,
      ry: 0,
      class: 'default', //classStr,
      style: '', //styles.style,
      id: node.id,
      type: nodeDb[node.id].type,
      padding: 15 //getConfig().flowchart.padding
    };

    g.setNode(node.id, nodeData);
  }

  if (parent) {
    if (parent.id !== 'root') {
      logger.trace('Setting node ', node.id, ' to be child of its parent ', parent.id);
      g.setParent(node.id, parent.id);
    }
  }
  if (node.doc) {
    logger.trace('Adding nodes children ');
    setupDoc(g, node, node.doc);
  }
};
let cnt = 0;
const setupDoc = (g, parent, doc) => {
  logger.trace('items', doc);
  doc.forEach(item => {
    if (item.stmt === 'state' || item.stmt === 'default') {
      setupNode(g, parent, item, true);
    } else if (item.stmt === 'relation') {
      setupNode(g, parent, item.state1, true);
      setupNode(g, parent, item.state2);
      const edgeData = {
        arrowhead: 'normal',
        arrowType: 'arrow_point',
        style: 'fill:none',
        labelStyle: '',
        arrowheadStyle: 'fill: #333',
        labelpos: 'c',
        labelType: 'text',
        label: '',
        // curve: d3.curveNatural,
        curve: d3.curveStep
        // curve: d3.curveMonotoneX
      };
      let startId = item.state1.id;
      let endId = item.state2.id;

      // if (parent && startId === '[*]') {
      //   startId = parent.id + '_start';
      // }

      // if (parent && endId === '[*]') {
      //   startId = parent.id + '_end';
      // }

      g.setEdge(startId, endId, edgeData, cnt);
      cnt++;
    }
  });
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function(text, id) {
  logger.trace('Drawing state diagram (v2)');
  stateDb.clear();
  const parser = state.parser;
  parser.yy = stateDb;

  // Parse the graph definition
  try {
    parser.parse(text);
  } catch (err) {
    logger.debug('Parsing failed');
  }

  // Fetch the default direction, use TD if none was found
  let dir = stateDb.getDirection();
  if (typeof dir === 'undefined') {
    dir = 'TD';
  }

  const conf = getConfig().state;
  const nodeSpacing = conf.nodeSpacing || 50;
  const rankSpacing = conf.rankSpacing || 50;

  // Create the input mermaid.graph
  const g = new graphlib.Graph({
    multigraph: true,
    compound: true
  })
    .setGraph({
      rankdir: dir,
      nodesep: nodeSpacing,
      ranksep: rankSpacing,
      marginx: 8,
      marginy: 8
    })
    .setDefaultEdgeLabel(function() {
      return {};
    });

  // logger.info(stateDb.getRootDoc());
  logger.info(stateDb.getRootDocV2());
  setupNode(g, undefined, stateDb.getRootDocV2(), true);

  // Set up an SVG group so that we can translate the final graph.
  const svg = d3.select(`[id="${id}"]`);

  // Run the renderer. This is what draws the final graph.
  const element = d3.select('#' + id + ' g');
  render(element, g, ['point', 'circle', 'cross']);

  const padding = 8;
  const svgBounds = svg.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;
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

  // Add label rects for non html labels
  if (!conf.htmlLabels) {
    const labels = document.querySelectorAll('[id="' + id + '"] .edgeLabel .label');
    for (let k = 0; k < labels.length; k++) {
      const label = labels[k];

      // Get dimensions of label
      const dim = label.getBBox();

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('rx', 0);
      rect.setAttribute('ry', 0);
      rect.setAttribute('width', dim.width);
      rect.setAttribute('height', dim.height);
      rect.setAttribute('style', 'fill:#e8e8e8;');

      label.insertBefore(rect, label.firstChild);
    }
  }
};

export default {
  setConf,
  getClasses,
  draw
};
