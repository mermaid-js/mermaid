import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { select, curveLinear, selectAll } from 'd3';
import { swimlaneLayout } from './swimlane-layout.js';
import { insertNode } from '../../../dagre-wrapper/nodes.js';
import flowDb from '../flowDb.js';
import { getConfig } from '../../../config.js';
import {getStylesFromArray} from '../../../utils.js';
import setupGraph, { addEdges, addVertices } from './setup-graph.js';
import { render } from '../../../dagre-wrapper/index.js';
import { log } from '../../../logger.js';
import { setupGraphViewbox } from '../../../setupGraphViewbox.js';
import common, { evaluate } from '../../common/common.js';
import { addHtmlLabel } from 'dagre-d3-es/src/dagre-js/label/add-html-label.js';
import { insertEdge } from '../../../dagre-wrapper/edges.js';
import {
  clear as clearGraphlib,
  clusterDb,
  adjustClustersAndEdges,
  findNonClusterChild,
  sortNodesByHierarchy,
} from '../../../dagre-wrapper/mermaid-graphlib.js';


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
async function swimlaneRender(layout,vert, elem,g, id, conf) {

 // draw nodes from layout.graph to element
  const nodes = layout.graph.nodes();

  const nodesElements = elem.insert('g').attr('class', 'nodes');
  // for each node, draw a rect, with a child text inside as label
  for (const node of nodes) {
    const nodeFromLayout = layout.graph.node(node);
    const vertex = vert[node];
    //Initialise the node
    /**
     * Variable for storing the classes for the vertex
     *
     * @type {string}
     */
    let classStr = 'default';
    if (vertex.classes.length > 0) {
      classStr = vertex.classes.join(' ');
    }
    classStr = classStr + ' swimlane-label';
    const styles = getStylesFromArray(vertex.styles);

    // Use vertex id as text in the box if no text is provided by the graph definition
    let vertexText = vertex.text !== undefined ? vertex.text : vertex.id;

    // We create a SVG label, either by delegating to addHtmlLabel or manually
    let vertexNode;
    log.info('vertex', vertex, vertex.labelType);
    if (vertex.labelType === 'markdown') {
      log.info('vertex', vertex, vertex.labelType);
    } else {
      if (evaluate(getConfig().flowchart.htmlLabels)) {
        // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
        const node = {
          label: vertexText.replace(
            /fa[blrs]?:fa-[\w-]+/g,
            (s) => `<i class='${s.replace(':', ' ')}'></i>`
          ),
        };
        vertexNode = addHtmlLabel(elem, node).node();
        vertexNode.parentNode.removeChild(vertexNode);
      } else {
        const svgLabel = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
        svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));

        const rows = vertexText.split(common.lineBreakRegex);

        for (const row of rows) {
          const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
          tspan.setAttribute('dy', '1em');
          tspan.setAttribute('x', '1');
          tspan.textContent = row;
          svgLabel.appendChild(tspan);
        }
        vertexNode = svgLabel;
      }
    }

    let radious = 0;
    let _shape = '';
    // Set the shape based parameters
    switch (vertex.type) {
      case 'round':
        radious = 5;
        _shape = 'rect';
        break;
      case 'square':
        _shape = 'rect';
        break;
      case 'diamond':
        _shape = 'question';
        break;
      case 'hexagon':
        _shape = 'hexagon';
        break;
      case 'odd':
        _shape = 'rect_left_inv_arrow';
        break;
      case 'lean_right':
        _shape = 'lean_right';
        break;
      case 'lean_left':
        _shape = 'lean_left';
        break;
      case 'trapezoid':
        _shape = 'trapezoid';
        break;
      case 'inv_trapezoid':
        _shape = 'inv_trapezoid';
        break;
      case 'odd_right':
        _shape = 'rect_left_inv_arrow';
        break;
      case 'circle':
        _shape = 'circle';
        break;
      case 'ellipse':
        _shape = 'ellipse';
        break;
      case 'stadium':
        _shape = 'stadium';
        break;
      case 'subroutine':
        _shape = 'subroutine';
        break;
      case 'cylinder':
        _shape = 'cylinder';
        break;
      case 'group':
        _shape = 'rect';
        break;
      case 'doublecircle':
        _shape = 'doublecircle';
        break;
      default:
        _shape = 'rect';
    }
    // Add the node
    let nodeObj ={
      labelStyle: styles.labelStyle,
      shape: _shape,
      labelText: vertexText,
      labelType: vertex.labelType,
      rx: radious,
      ry: radious,
      class: classStr,
      style: styles.style,
      id: vertex.id,
      link: vertex.link,
      linkTarget: vertex.linkTarget,
      // tooltip: diagObj.db.getTooltip(vertex.id) || '',
      // domId: diagObj.db.lookUpDomId(vertex.id),
      haveCallback: vertex.haveCallback,
      width: vertex.type === 'group' ? 500 : undefined,
      dir: vertex.dir,
      type: vertex.type,
      props: vertex.props,
      padding: getConfig().flowchart.padding,
      x: nodeFromLayout.x,
      y: nodeFromLayout.y,
    };

     let boundingBox;
      let nodeEl;

      // Add the element to the DOM

        nodeEl = await insertNode(nodesElements, nodeObj, vertex.dir);
        boundingBox = nodeEl.node().getBBox();
        nodeEl.attr('transform', `translate(${nodeObj.x / 2}, ${nodeObj.y / 2})`);

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

  const edges = diagObj.db.getEdges();

  log.info('Edges', edges);

  const svg = root.select('#' + id);

  svg.append('g');

  // Run the renderer. This is what draws the final graph.
 // const element = root.select('#' + id + ' g');
console.log('diagObj',diagObj);
  console.log('subGraphs', diagObj.db.getSubGraphs());
  const layout = swimlaneLayout(g, diagObj);
  console.log('custom layout',layout);
 await swimlaneRender(layout,vert, svg,g,id, conf);

  //  addEdges(edges, g, diagObj);

  //   g.edges().forEach(function (e) {
  //   const edge = g.edge(e);
  //   log.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge), edge);
  //   const edgePaths = svg.insert('g').attr('class', 'edgePaths');
  //   const paths = insertEdge(edgePaths, e, edge, clusterDb, 'flowchart', g);
  //   positionEdgeLabel(edge, paths);
  // });
  // utils.insertTitle(svg, 'flowchartTitleText', conf.titleTopMargin, diagObj.db.getDiagramTitle());

  setupGraphViewbox(g, svg, conf.diagramPadding, conf.useMaxWidth);
};



export default {
  setConf,
  addVertices,
  addEdges,
  getClasses,
  draw,
};
