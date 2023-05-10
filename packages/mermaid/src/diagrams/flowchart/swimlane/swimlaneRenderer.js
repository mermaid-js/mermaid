import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { select, curveLinear, selectAll } from 'd3';
import { swimlaneLayout } from './swimlane-layout.js';

import flowDb from '../flowDb.js';
import { getConfig } from '../../../config.js';
import utils from '../../../utils.js';
import setupGraph, { addEdges, addVertices } from './setup-graph.js';
import { render } from '../../../dagre-wrapper/index.js';
import { log } from '../../../logger.js';
import { setupGraphViewbox } from '../../../setupGraphViewbox.js';

const conf = {};
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (const key of keys) {
    conf[key] = cnf[key];
  }
};

/**
 *
 * @param element
 * @param graph
 * @param layout
 * @param elem
 * @param conf
 */
function swimlaneRender(layout, elem, conf) {

 // draw nodes from layout.graph to element
  const nodes = layout.graph.nodes();

  // for each node, draw a rect, with a child text inside as label
  for (const node of nodes) {
    const nodeElem = elem.append('g');
  nodeElem.attr(
    'class',
    'swimlane-node-'+node+  + (' lane-' + node.lane)
  );

  // Create the wrapped text element
  const textElem = nodeElem.append('g');
 console.log('node',node);
 console.log('node.x',layout.graph.node(node).x);
 console.log('node.y',layout.graph.node(node).y);
  const txt = textElem
    .append('text')
    .text(node)
    .attr('x', layout.graph.node(node).x)
    .attr('y', layout.graph.node(node).y)
    .attr('dy', '1em')
    .attr('alignment-baseline', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'middle')
  const bbox = txt.node().getBBox();


  textElem.attr('transform', 'translate(' + layout.graph.node(node).x/2 + ', ' + layout.graph.node(node).y/2 + ')');

  }




  return elem;
}

/**
 * Returns the all the styles from classDef statements in the graph definition.
 *
 * @param text
 * @param diagObj
 * @returns {object} ClassDef styles
 */
export const getClasses = function (text, diagObj) {
  log.info('Extracting classes');
  diagObj.db.clear();
  try {
    // Parse the graph definition
    diagObj.parse(text);
    return diagObj.db.getClasses();
  } catch (e) {
    return;
  }
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 *
 * @param text
 * @param id
 */

export const draw = async function (text, id, _version, diagObj) {
  log.info('Drawing flowchart');
  diagObj.db.clear();
  flowDb.setGen('gen-2');
  // Parse the graph definition
  diagObj.parser.parse(text);

  const { securityLevel, flowchart: conf } = getConfig();

  // Handle root and document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');
  const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

// create g as a graphlib graph using setupGraph from setup-graph.js
  const g = setupGraph(diagObj, id, root, doc);



  let subG;
  const subGraphs = diagObj.db.getSubGraphs();
  log.info('Subgraphs - ', subGraphs);
  for (let i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i];
    log.info('Subgraph - ', subG);
    diagObj.db.addVertex(
      subG.id,
      { text: subG.title, type: subG.labelType },
      'group',
      undefined,
      subG.classes,
      subG.dir
    );
  }

  // Fetch the vertices/nodes and edges/links from the parsed graph definition
  const vert = diagObj.db.getVertices();

  // const edges = diagObj.db.getEdges();

  // log.info('Edges', edges);
  // let i = 0;
  // for (i = subGraphs.length - 1; i >= 0; i--) {
  //   // for (let i = 0; i < subGraphs.length; i++) {
  //   subG = subGraphs[i];

  //   selectAll('cluster').append('text');

  //   for (let j = 0; j < subG.nodes.length; j++) {
  //     log.info('Setting up subgraphs', subG.nodes[j], subG.id);
  //     g.setParent(subG.nodes[j], subG.id);
  //   }
  // }
  // setupGraph(diagObj, id, root, doc);

  // Add custom shapes
  // flowChartShapes.addToRenderV2(addShape);

  // Set up an SVG group so that we can translate the final graph.
  // const svg = root.select(`[id="${id}"]`);
  const svg = root.select('#' + id);

  svg.append('g');

  // Run the renderer. This is what draws the final graph.
 // const element = root.select('#' + id + ' g');
console.log('diagObj',diagObj);
  console.log('subGraphs', diagObj.db.getSubGraphs());
  const layout = swimlaneLayout(g, diagObj);
  swimlaneRender(layout, svg, conf);
  // await render(element, g, ['point', 'circle', 'cross'], 'flowchart', id);

  // utils.insertTitle(svg, 'flowchartTitleText', conf.titleTopMargin, diagObj.db.getDiagramTitle());

  setupGraphViewbox(g, svg, conf.diagramPadding, conf.useMaxWidth);

  // Index nodes
  //    diagObj.db.indexNodes('subGraph' + i);

  // Add label rects for non html labels
  // if (!conf.htmlLabels) {
  //   const labels = doc.querySelectorAll('[id="' + id + '"] .edgeLabel .label');
  //   for (const label of labels) {
  //     // Get dimensions of label
  //     const dim = label.getBBox();

  //     const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
  //     rect.setAttribute('rx', 0);
  //     rect.setAttribute('ry', 0);
  //     rect.setAttribute('width', dim.width);
  //     rect.setAttribute('height', dim.height);

  //     label.insertBefore(rect, label.firstChild);
  //   }
  // }

  // If node has a link, wrap it in an anchor SVG object.
  // const keys = Object.keys(vert);
  // keys.forEach(function (key) {
  //   const vertex = vert[key];

    // if (vertex.link) {
    //   const node = select('#' + id + ' [id="' + key + '"]');
    //   if (node) {
    //     const link = doc.createElementNS('http://www.w3.org/2000/svg', 'a');
    //     link.setAttributeNS('http://www.w3.org/2000/svg', 'class', vertex.classes.join(' '));
    //     link.setAttributeNS('http://www.w3.org/2000/svg', 'href', vertex.link);
    //     link.setAttributeNS('http://www.w3.org/2000/svg', 'rel', 'noopener');
    //     if (securityLevel === 'sandbox') {
    //       link.setAttributeNS('http://www.w3.org/2000/svg', 'target', '_top');
    //     } else if (vertex.linkTarget) {
    //       link.setAttributeNS('http://www.w3.org/2000/svg', 'target', vertex.linkTarget);
    //     }

    //     const linkNode = node.insert(function () {
    //       return link;
    //     }, ':first-child');

    //     const shape = node.select('.label-container');
    //     if (shape) {
    //       linkNode.append(function () {
    //         return shape.node();
    //       });
    //     }

    //     const label = node.select('.label');
    //     if (label) {
    //       linkNode.append(function () {
    //         return label.node();
    //       });
    //     }
    //   }
    // }
  //});
};

export default {
  setConf,
  addVertices,
  addEdges,
  getClasses,
  draw,
};
