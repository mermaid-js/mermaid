import graphlib from 'graphlib';
import { select } from 'd3';
import stateDb from './stateDb';
import state from './parser/stateDiagram';
import { getConfig } from '../../config';
// import { evaluate } from '../common/common';
import { render } from '../../dagre-wrapper/index.js';
import { log } from '../../logger';
import { configureSvgSize } from '../../utils';

const conf = {};
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (let i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};

let nodeDb = {};

/**
 * Returns the all the styles from classDef statements in the graph definition.
 * @returns {object} classDef styles
 */
export const getClasses = function (text) {
  log.trace('Extracting classes');
  stateDb.clear();
  const parser = state.parser;
  parser.yy = stateDb;

  // Parse the graph definition
  parser.parse(text);
  return stateDb.getClasses();
};

const setupNode = (g, parent, node, altFlag) => {
  // Add the node
  if (node.id !== 'root') {
    let shape = 'rect';
    if (node.start === true) {
      shape = 'start';
    }
    if (node.start === false) {
      shape = 'end';
    }
    if (node.type !== 'default') {
      shape = node.type;
    }

    if (!nodeDb[node.id]) {
      nodeDb[node.id] = {
        id: node.id,
        shape,
        description: node.id,
        classes: 'statediagram-state',
      };
    }

    // Build of the array of description strings accordinging
    if (node.description) {
      if (Array.isArray(nodeDb[node.id].description)) {
        // There already is an array of strings,add to it
        nodeDb[node.id].shape = 'rectWithTitle';
        nodeDb[node.id].description.push(node.description);
      } else {
        if (nodeDb[node.id].description.length > 0) {
          // if there is a description already transformit to an array
          nodeDb[node.id].shape = 'rectWithTitle';
          if (nodeDb[node.id].description === node.id) {
            // If the previous description was the is, remove it
            nodeDb[node.id].description = [node.description];
          } else {
            nodeDb[node.id].description = [nodeDb[node.id].description, node.description];
          }
        } else {
          nodeDb[node.id].shape = 'rect';
          nodeDb[node.id].description = node.description;
        }
      }
    }

    // Save data for description and group so that for instance a statement without description overwrites
    // one with description

    // group
    if (!nodeDb[node.id].type && node.doc) {
      log.info('Setting cluster for ', node.id, getDir(node));
      nodeDb[node.id].type = 'group';
      nodeDb[node.id].dir = getDir(node);
      nodeDb[node.id].shape = node.type === 'divider' ? 'divider' : 'roundedWithTitle';
      nodeDb[node.id].classes =
        nodeDb[node.id].classes +
        ' ' +
        (altFlag ? 'statediagram-cluster statediagram-cluster-alt' : 'statediagram-cluster');
    }

    const nodeData = {
      labelStyle: '',
      shape: nodeDb[node.id].shape,
      labelText: nodeDb[node.id].description,
      // typeof nodeDb[node.id].description === 'object'
      //   ? nodeDb[node.id].description[0]
      //   : nodeDb[node.id].description,
      classes: nodeDb[node.id].classes, //classStr,
      style: '', //styles.style,
      id: node.id,
      dir: nodeDb[node.id].dir,
      domId: 'state-' + node.id + '-' + cnt,
      type: nodeDb[node.id].type,
      padding: 15, //getConfig().flowchart.padding
    };

    if (node.note) {
      // Todo: set random id
      const noteData = {
        labelStyle: '',
        shape: 'note',
        labelText: node.note.text,
        classes: 'statediagram-note', //classStr,
        style: '', //styles.style,
        id: node.id + '----note-' + cnt,
        domId: 'state-' + node.id + '----note-' + cnt,
        type: nodeDb[node.id].type,
        padding: 15, //getConfig().flowchart.padding
      };
      const groupData = {
        labelStyle: '',
        shape: 'noteGroup',
        labelText: node.note.text,
        classes: nodeDb[node.id].classes, //classStr,
        style: '', //styles.style,
        id: node.id + '----parent',
        domId: 'state-' + node.id + '----parent-' + cnt,
        type: 'group',
        padding: 0, //getConfig().flowchart.padding
      };
      cnt++;

      g.setNode(node.id + '----parent', groupData);

      g.setNode(noteData.id, noteData);
      g.setNode(node.id, nodeData);

      g.setParent(node.id, node.id + '----parent');
      g.setParent(noteData.id, node.id + '----parent');

      let from = node.id;
      let to = noteData.id;

      if (node.note.position === 'left of') {
        from = noteData.id;
        to = node.id;
      }
      g.setEdge(from, to, {
        arrowhead: 'none',
        arrowType: '',
        style: 'fill:none',
        labelStyle: '',
        classes: 'transition note-edge',
        arrowheadStyle: 'fill: #333',
        labelpos: 'c',
        labelType: 'text',
        thickness: 'normal',
      });
    } else {
      g.setNode(node.id, nodeData);
    }
  }

  if (parent) {
    if (parent.id !== 'root') {
      log.trace('Setting node ', node.id, ' to be child of its parent ', parent.id);
      g.setParent(node.id, parent.id);
    }
  }
  if (node.doc) {
    log.trace('Adding nodes children ');
    setupDoc(g, node, node.doc, !altFlag);
  }
};
let cnt = 0;
const setupDoc = (g, parent, doc, altFlag) => {
  // cnt = 0;
  log.trace('items', doc);
  doc.forEach((item) => {
    if (item.stmt === 'state' || item.stmt === 'default') {
      setupNode(g, parent, item, altFlag);
    } else if (item.stmt === 'relation') {
      setupNode(g, parent, item.state1, altFlag);
      setupNode(g, parent, item.state2, altFlag);
      const edgeData = {
        id: 'edge' + cnt,
        arrowhead: 'normal',
        arrowTypeEnd: 'arrow_barb',
        style: 'fill:none',
        labelStyle: '',
        label: item.description,
        arrowheadStyle: 'fill: #333',
        labelpos: 'c',
        labelType: 'text',
        thickness: 'normal',
        classes: 'transition',
      };
      let startId = item.state1.id;
      let endId = item.state2.id;

      g.setEdge(startId, endId, edgeData, cnt);
      cnt++;
    }
  });
};
const getDir = (nodes, defaultDir) => {
  let dir = defaultDir || 'TB';
  if (nodes.doc) {
    for (let i = 0; i < nodes.doc.length; i++) {
      const node = nodes.doc[i];
      if (node.stmt === 'dir') {
        dir = node.value;
      }
    }
  }
  return dir;
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function (text, id) {
  log.info('Drawing state diagram (v2)', id);
  stateDb.clear();
  nodeDb = {};
  const parser = state.parser;
  parser.yy = stateDb;

  // Parse the graph definition
  parser.parse(text);

  // Fetch the default direction, use TD if none was found
  let dir = stateDb.getDirection();
  if (typeof dir === 'undefined') {
    dir = 'LR';
  }

  const conf = getConfig().state;
  const nodeSpacing = conf.nodeSpacing || 50;
  const rankSpacing = conf.rankSpacing || 50;

  log.info(stateDb.getRootDocV2());
  stateDb.extract(stateDb.getRootDocV2());
  log.info(stateDb.getRootDocV2());

  // Create the input mermaid.graph
  const g = new graphlib.Graph({
    multigraph: true,
    compound: true,
  })
    .setGraph({
      rankdir: getDir(stateDb.getRootDocV2()),
      nodesep: nodeSpacing,
      ranksep: rankSpacing,
      marginx: 8,
      marginy: 8,
    })
    .setDefaultEdgeLabel(function () {
      return {};
    });

  setupNode(g, undefined, stateDb.getRootDocV2(), true);

  // Set up an SVG group so that we can translate the final graph.
  const svg = select(`[id="${id}"]`);

  // Run the renderer. This is what draws the final graph.
  const element = select('#' + id + ' g');
  render(element, g, ['barb'], 'statediagram', id);

  const padding = 8;

  const bounds = svg.node().getBBox();

  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;

  // Zoom in a bit
  svg.attr('class', 'statediagram');

  const svgBounds = svg.node().getBBox();

  configureSvgSize(svg, height, width * 1.75, conf.useMaxWidth);

  // Ensure the viewBox includes the whole svgBounds area with extra space for padding
  const vBox = `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`;
  log.debug(`viewBox ${vBox}`);
  svg.attr('viewBox', vBox);

  // Add label rects for non html labels
  // if (!evaluate(conf.htmlLabels) || true) {
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

    label.insertBefore(rect, label.firstChild);
    // }
  }
};

export default {
  setConf,
  getClasses,
  draw,
};
