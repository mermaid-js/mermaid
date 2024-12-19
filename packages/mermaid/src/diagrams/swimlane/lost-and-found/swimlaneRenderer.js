import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { select, curveLinear, selectAll } from 'd3';
import { swimlaneLayout } from './swimlane-layout.js';
import insertMarkers from '../../../dagre-wrapper/markers.js';
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
import { insertEdge,positionEdgeLabel } from '../../../dagre-wrapper/edges.js';
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
 * @param vert
 * @param elem
 * @param g
 * @param id
 * @param conf
 */
async function swimlaneRender(layout,vert, elem,g, id, conf) {

  let renderedNodes = [];
 // draw nodes from layout.graph to element
  const nodes = layout.graph.nodes();

  // lanes are the swimlanes
  const lanes = layout.lanes;



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
        nodeEl.attr('transform', `translate(${nodeObj.x}, ${nodeObj.y / 2})`);

        // add to rendered nodes
        renderedNodes.push({id: vertex.id, nodeObj: nodeObj, boundingBox: boundingBox});

  }


  return renderedNodes;
}

/**
 * Returns the all the styles from classDef statements in the graph definition.
 *
 * @param text
 * @param diagObj
 * @returns {object} ClassDef styles
 */
// export const getClasses = function (text, diagObj) {
//   log.info('Extracting classes');
//   diagObj.db.clear();
//   try {
//     // Parse the graph definition
//     diagObj.parse(text);
//     return diagObj.db.getClasses();
//   } catch (e) {
//     return;
//   }
// };

/**
 * Returns the all the styles from classDef statements in the graph definition.
 *
 * @param text
 * @param diagObj
 * @returns {Record<string, import('../../../diagram-api/types.js').DiagramStyleClassDef>} ClassDef styles
 */
export const getClasses = function (text, diagObj) {
  log.info('Extracting classes');
  return diagObj.db.getClasses();
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


  // insert markers
    // Define the supported markers for the diagram
  const markers = ['point', 'circle', 'cross'];
  insertMarkers(svg, markers, 'flowchart', id);
  // draw lanes as vertical lines
  const lanesElements = svg.insert('g').attr('class', 'lanes');


  let laneCount = 0;

  for (const lane of layout.lanes) {

    laneCount++;

    //draw lane header as rectangle with lane title centered in it
    const laneHeader = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    // Set attributes for the rectangle
    laneHeader.setAttribute("x",lane.x);         // x-coordinate of the top-left corner
    laneHeader.setAttribute("y", -50);         // y-coordinate of the top-left corner
    laneHeader.setAttribute("width", lane.width);    // width of the rectangle
    laneHeader.setAttribute("height", "50");   // height of the rectangle
    if(laneCount % 2 == 0){
        //set light blue color for even lanes
        laneHeader.setAttribute("fill", "blue");    // fill color of the rectangle
      }else{
        //set white color odd lanes
        laneHeader.setAttribute("fill", "grey");    // fill color of the rectangle
      }

    laneHeader.setAttribute("stroke", "black"); // color of the stroke/border
    laneHeader.setAttribute("stroke-width", "2"); // width of the stroke/border

    // Append the rectangle to the SVG element
    lanesElements.node().appendChild(laneHeader);

    //draw lane title
    const laneTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");

    // Set attributes for the rectangle
    laneTitle.setAttribute("x",lane.x + lane.width/2);         // x-coordinate of the top-left corner
    laneTitle.setAttribute("y", -50 + 50/2);         // y-coordinate of the top-left corner
    laneTitle.setAttribute("width", lane.width);    // width of the rectangle
    laneTitle.setAttribute("height", "50");   // height of the rectangle
    laneTitle.setAttribute("fill", "white");    // fill color of the rectangle
    laneTitle.setAttribute("stroke-width", "1"); // width of the stroke/border
    laneTitle.setAttribute("text-anchor", "middle"); // width of the stroke/border
    laneTitle.setAttribute("alignment-baseline", "middle"); // width of the stroke/border
    laneTitle.setAttribute("font-size", "20"); // width of the stroke/border
    laneTitle.textContent = lane.title;

    // Append the rectangle to the SVG element
    lanesElements.node().appendChild(laneTitle);

    //draw lane

      // Create a <rect> element
      const rectangle = document.createElementNS("http://www.w3.org/2000/svg", "rect");

      // Set attributes for the rectangle
      rectangle.setAttribute("x",lane.x);         // x-coordinate of the top-left corner
      rectangle.setAttribute("y", 0);         // y-coordinate of the top-left corner
      rectangle.setAttribute("width", lane.width);    // width of the rectangle
      rectangle.setAttribute("height", "500");   // height of the rectangle

      if(laneCount % 2 == 0){
        //set light blue color for even lanes
        rectangle.setAttribute("fill", "lightblue");    // fill color of the rectangle
      }else{
        //set white color odd lanes
        rectangle.setAttribute("fill", "#ffffff");    // fill color of the rectangle
      }

      rectangle.setAttribute("stroke", "black"); // color of the stroke/border
      rectangle.setAttribute("stroke-width", "2"); // width of the stroke/border

      // Append the rectangle to the SVG element
      lanesElements.node().appendChild(rectangle);
  }

  // append lanesElements to elem
  svg.node().appendChild(lanesElements.node());

  // add lane headers
  const laneHeaders = svg.insert('g').attr('class', 'laneHeaders');

   let drawnEdges =[];

   //get edge markers






 let renderedNodes = await swimlaneRender(layout,vert, svg,g,id, conf);
let renderedEdgePaths= [];
 addEdges(edges, g, diagObj,svg);

    g.edges().forEach(function (e) {
    const edge = g.edge(e);
    log.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge), edge);
    const edgePaths = svg.insert('g').attr('class', 'edgePaths');



    //get start node x, y coordinates

    let sourceNode = {x:layout.graph.node(e.v).x, y:layout.graph.node(e.v).y/2, id: e.v};
    //get end node x, y coordinates=
    const targetNode =  {x:layout.graph.node(e.w).x, y:layout.graph.node(e.w).y/2, id: e.w};


    //create edge points based on start and end node
     edge.points = getEdgePoints(sourceNode, targetNode, drawnEdges, renderedNodes,renderedEdgePaths);


     // add to drawn edges
      drawnEdges.push(edge);

    const paths = insertEdge(edgePaths, e, edge, clusterDb, 'flowchart', g);
    //positionEdgeLabel(edge, paths);
  });




  // utils.insertTitle(svg, 'flowchartTitleText', conf.titleTopMargin, diagObj.db.getDiagramTitle());

  setupGraphViewbox(g, svg, conf.diagramPadding, conf.useMaxWidth);
};

// function to find edge path points based on start and end node
/**
 *
 * @param startNode
 * @param endNode
 * @param drawnEdges
 * @param renderedNodes
 */
function getEdgePoints(startNode, endNode, drawnEdges, renderedNodes) {

  let potentialEdgePaths = [];

  for(let i=1;i<=3;i++){
     const points = [];

  // add start point
  points.push({ x: startNode.x, y: startNode.y })

  // Point in the middle, if both nodes do not have same x or y
  if (startNode.x !== endNode.x && startNode.y !== endNode.y && i!=1) {

    if(i==2){
    points.push({ x: startNode.x, y: endNode.y });
    }else{
      points.push({ x: endNode.x, y: startNode.y });
    }
  }
  // add end point
  points.push({ x: endNode.x, y: endNode.y });


  //print points
  console.log('points before intersection', points);

  // get start and end node objects from array of rendered nodes
  const startNodeObj = renderedNodes.find(node => node.id === startNode.id);
  const endNodeObj = renderedNodes.find(node => node.id === endNode.id);

  console.log(" intersection startNodeObj", startNodeObj);
  console.log(" intersection endNodeObj", endNodeObj);
  startNodeObj.nodeObj.x = startNode.x;
  startNodeObj.nodeObj.y = startNode.y;
  // the first point should be the intersection of the start node and the edge
  let startInsection = startNodeObj.nodeObj.intersect(points[1]);
  points[0] = startInsection;

  //log intersection
  console.log('start intersection', startInsection);

  endNodeObj.nodeObj.x = endNode.x;
  endNodeObj.nodeObj.y = endNode.y;
  // the last point should be the intersection of the end node and the edge
  let endInsection = endNodeObj.nodeObj.intersect(points[points.length - 2]);
  points[points.length - 1] = endInsection;

  //log intersection
  console.log('end intersection', endInsection);

  //push points to potential edge paths
  potentialEdgePaths.push({points: points});
  }

  // Create a new list of renderedNodes without the start and end node
  const filteredRenderedNodes = renderedNodes.filter(node => node.id !== startNode.id && node.id !== endNode.id);

  //Rank the potential edge path
  const rankedEdgePaths = rankEdgePaths(potentialEdgePaths, filteredRenderedNodes);
  if(startNode.id==='sheep' && endNode.id === 'dog'){
    console.log('sheep--> dog rankedEdgePaths', rankedEdgePaths);
  }

  return rankedEdgePaths[0].edgePath.points;

}

// Function to check if a point is inside a nodes bounding box
/**
 *
 * @param point
 * @param nodes
 */
function isPointInsideNode(point, nodes) {
  let isInside = false;
  for (const node of nodes) {
    if (
      point.x >= node.nodeObj.x &&
      point.x <= node.nodeObj.x + node.boundingBox.width &&
      point.y >= node.nodeObj.y &&
      point.y <= node.nodeObj.y + node.boundingBox.height
    ) {
      isInside = true;
    }
  }
  return isInside;
}

// Ranks edgePaths (points) based on the number of intersections with nodes
/**
 *
 * @param edgePaths
 * @param nodes
 */
function rankEdgePaths(edgePaths, nodes) {
  let rankedEdgePaths = [];
  for (const edgePath of edgePaths) {
    let rank = 10 + edgePath.points.length;
    for (const point of edgePath.points) {
      if (isPointInsideNode(point, nodes)) {
        // remove edge path

      }
    }
    rankedEdgePaths.push({ rank: rank, edgePath: edgePath });
  }

  //sort on the basis of rank, highest rank first
  rankedEdgePaths.sort((a, b) => (a.rank < b.rank ? 1 : -1));
  return rankedEdgePaths;
}


/**
 *  Function to find if edge path is intersecting with any other edge path
 * @param edgePath
 * @param renderedEdgePaths
 * @returns {boolean}
 */
function isEdgePathIntersecting(edgePath, renderedEdgePaths) {
  let isIntersecting = false;
  for (const renderedEdgePath of renderedEdgePaths) {
    // check if line drawn from start point of edge path to start point of rendered edge path is intersecting with any other edge path

    if (
      common.isLineIntersecting(
        edgePath.points[0],
        renderedEdgePath.points[0],
        edgePath.points[1],
        renderedEdgePath.points[1]
      )
    ) {
      isIntersecting = true;
    }
  }
  return isIntersecting;
}



export default {
  setConf,
  addVertices,
  addEdges,
  getClasses,
  draw,
};
