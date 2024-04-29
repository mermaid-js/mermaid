import * as graphlibJson from 'dagre-d3-es/src/graphlib/json.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import insertMarkers from '../../rendering-elements/markers.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import {
  insertNode,
  positionNode,
  clear as clearNodes,
  setNodeElem,
} from '../../rendering-elements/nodes.js';
import { insertCluster, clear as clearClusters } from '../../rendering-elements/clusters.js';
import {
  insertEdgeLabel,
  positionEdgeLabel,
  insertEdge,
  clear as clearEdges,
} from '../../rendering-elements/edges.js';
import common from '$root/diagrams/common/common.js';
import { log } from '$root/logger.js';

import ELK from 'elkjs/lib/elk.bundled.js';

const nodeDb = {};
let clusterDb = {};

const addSubGraphs = function (db) {
  const parentLookupDb = { parentById: {}, childrenById: {} };
  const subgraphs = db.getSubGraphs();
  log.info('Subgraphs - ', subgraphs);
  subgraphs.forEach(function (subgraph) {
    subgraph.nodes.forEach(function (node) {
      parentLookupDb.parentById[node] = subgraph.id;
      if (parentLookupDb.childrenById[subgraph.id] === undefined) {
        parentLookupDb.childrenById[subgraph.id] = [];
      }
      parentLookupDb.childrenById[subgraph.id].push(node);
    });
  });

  subgraphs.forEach(function (subgraph) {
    const data = { id: subgraph.id };
    if (parentLookupDb.parentById[subgraph.id] !== undefined) {
      data.parent = parentLookupDb.parentById[subgraph.id];
    }
  });
  return parentLookupDb;
};

// /**
//  * Function that adds the vertices found during parsing to the graph to be rendered.
//  *
//  * @param vert Object containing the vertices.
//  * @param g The graph that is to be drawn.
//  * @param svgId
//  * @param root
//  * @param doc
//  * @param diagObj
//  */
export const addVertices = async function (svg, data4Layout, parentLookupDb, graph) {
  const nodes = svg.insert('g').attr('class', 'nodes');

  console.log('data4Layout (node)', data4Layout);
  // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
  await Promise.all(
    data4Layout.nodes.map(async (node) => {
      console.log('node', node);
      // const node = vert[id];

      //     /**
      //      * Variable for storing the classes for the vertex
      //      *
      //      * @type {string}
      //      */
      //     let classStr = 'default';
      //     if (node.classes.length > 0) {
      //       classStr = node.classes.join(' ');
      //     }
      //     classStr = classStr + ' flowchart-label';
      //     const styles = getStylesFromArray(node.styles);

      //     // Use vertex id as text in the box if no text is provided by the graph definition
      //     let vertexText = node.text !== undefined ? node.text : node.id;

      //     // We create a SVG label, either by delegating to addHtmlLabel or manually
      //     let vertexNode;
      //     const labelData = { width: 0, height: 0 };

      const ports = [
        {
          id: node.id + '-west',
          layoutOptions: {
            'port.side': 'WEST',
          },
        },
        {
          id: node.id + '-east',
          layoutOptions: {
            'port.side': 'EAST',
          },
        },
        {
          id: node.id + '-south',
          layoutOptions: {
            'port.side': 'SOUTH',
          },
        },
        {
          id: node.id + '-north',
          layoutOptions: {
            'port.side': 'NORTH',
          },
        },
      ];

      let boundingBox;
      let nodeEl;

      //     // Add the element to the DOM
      if (node.type !== 'group') {
        nodeEl = await insertNode(nodes, node, node.dir);
        boundingBox = nodeEl.node().getBBox();
        graph.children.push({
          ...node,
          domId: nodeEl,
        });
      }
      // else {
      //       const svgLabel = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      //       // svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));
      //       // const rows = vertexText.split(common.lineBreakRegex);
      //       // for (const row of rows) {
      //       //   const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      //       //   tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
      //       //   tspan.setAttribute('dy', '1em');
      //       //   tspan.setAttribute('x', '1');
      //       //   tspan.textContent = row;
      //       //   svgLabel.appendChild(tspan);
      //       // }
      //       // vertexNode = svgLabel;
      //       // const bbox = vertexNode.getBBox();
      //       const { shapeSvg, bbox } = await labelHelper(nodes, node, undefined, true);
      //       labelData.width = bbox.width;
      //       labelData.wrappingWidth = getConfig().flowchart.wrappingWidth;
      //       labelData.height = bbox.height;
      //       labelData.labelNode = shapeSvg.node();
      //       node.labelData = labelData;
      //     }
      //     // const { shapeSvg, bbox } = await labelHelper(svg, node, undefined, true);

      // const data = {
      //   id: node.id,
      //   ports: node.type === 'diamond' ? ports : [],
      //   // labelStyle: styles.labelStyle,
      //   // shape: _shape,
      //   layoutOptions,
      //   labelText: vertexText,
      //   labelData,
      //   // labels: [{ text: vertexText }],
      //   // rx: radius,
      //   // ry: radius,
      //   // class: classStr,
      //   // style: styles.style,
      //   // link: vertex.link,
      //   // linkTarget: vertex.linkTarget,
      //   // tooltip: diagObj.db.getTooltip(vertex.id) || '',
      //   domId: diagObj.db.lookUpDomId(node.id),
      //   // haveCallback: vertex.haveCallback,
      //   width: boundingBox?.width,
      //   height: boundingBox?.height,
      //   // dir: vertex.dir,
      //   type: node.type,
      //   // props: vertex.props,
      //   // padding: getConfig().flowchart.padding,
      //   // boundingBox,
      //   el: nodeEl,
      //   parent: parentLookupDb.parentById[node.id],
      // };
      //     // if (!Object.keys(parentLookupDb.childrenById).includes(vertex.id)) {
      //     // graph.children.push({
      //     //   ...data,
      //     // });
      //     // }
      //     nodeDb[node.id] = data;
      //     // log.trace('setNode', {
      //     //   labelStyle: styles.labelStyle,
      //     //   shape: _shape,
      //     //   labelText: vertexText,
      //     //   rx: radius,
      //     //   ry: radius,
      //     //   class: classStr,
      //     //   style: styles.style,
      //     //   id: vertex.id,
      //     //   domId: diagObj.db.lookUpDomId(vertex.id),
      //     //   width: vertex.type === 'group' ? 500 : undefined,
      //     //   type: vertex.type,
      //     //   dir: vertex.dir,
      //     //   props: vertex.props,
      //     //   padding: getConfig().flowchart.padding,
      //     //   parent: parentLookupDb.parentById[vertex.id],
      //     // });
    })
  );
  return graph;
};

const drawNodes = (relX, relY, nodeArray, svg, subgraphsEl, depth) => {
  nodeArray.forEach(function (node) {
    if (node) {
      nodeDb[node.id] = node;
      nodeDb[node.id].offset = {
        posX: node.x + relX,
        posY: node.y + relY,
        x: relX,
        y: relY,
        depth,
        width: node.width,
        height: node.height,
      };
      //     if (node.type === 'group') {
      //       const subgraphEl = subgraphsEl.insert('g').attr('class', 'subgraph');
      //       subgraphEl
      //         .insert('rect')
      //         .attr('class', 'subgraph subgraph-lvl-' + (depth % 5) + ' node')
      //         .attr('x', node.x + relX)
      //         .attr('y', node.y + relY)
      //         .attr('width', node.width)
      //         .attr('height', node.height);
      //       const label = subgraphEl.insert('g').attr('class', 'label');
      //       const labelCentering = getConfig().flowchart.htmlLabels ? node.labelData.width / 2 : 0;
      //       label.attr(
      //         'transform',
      //         `translate(${node.labels[0].x + relX + node.x + labelCentering}, ${
      //           node.labels[0].y + relY + node.y + 3
      //         })`
      //       );
      //       label.node().appendChild(node.labelData.labelNode);

      //       log.info('Id (UGH)= ', node.type, node.labels);
      //     } else {
      log.info('Id (UGH)= ', node.id);
      node.domId.attr(
        'transform',
        `translate(${node.x + relX + node.width / 2}, ${node.y + relY + node.height / 2})`
      );
    }
    //   }
    // });
    // nodeArray.forEach(function (node) {
    //   if (node && node.type === 'group') {
    //     drawNodes(relX + node.x, relY + node.y, node.children, svg, subgraphsEl, diagObj, depth + 1);
    //   }
  });
};

const getEdgeStartEndPoint = (edge, dir) => {
  let source = edge.start;
  let target = edge.end;

  // Save the original source and target
  const sourceId = source;
  const targetId = target;

  const startNode = nodeDb[source];
  const endNode = nodeDb[target];

  if (!startNode || !endNode) {
    return { source, target };
  }

  if (startNode.type === 'diamond') {
    source = `${source}-${getNextPort(source, 'out', dir)}`;
  }

  if (endNode.type === 'diamond') {
    target = `${target}-${getNextPort(target, 'in', dir)}`;
  }

  // Add the edge to the graph
  return { source, target, sourceId, targetId };
};

/**
 * Add edges to graph based on parsed graph definition
 *
 * @param {object} edges The edges to add to the graph
 * @param {object} g The graph object
 * @param cy
 * @param diagObj
 * @param dataForLayout
 * @param graph
 * @param svg
 */
export const addEdges = function (dataForLayout, graph, svg) {
  log.info('abc78 edges = ', dataForLayout);
  const edges = dataForLayout.edges;
  const labelsEl = svg.insert('g').attr('class', 'edgeLabels');
  let linkIdCnt = {};
  let dir = dataForLayout.direction || 'DOWN';
  let defaultStyle;
  let defaultLabelStyle;

  // if (edges.defaultStyle !== undefined) {
  //   const defaultStyles = getStylesFromArray(edges.defaultStyle);
  //   defaultStyle = defaultStyles.style;
  //   defaultLabelStyle = defaultStyles.labelStyle;
  // }

  edges.forEach(function (edge) {
    console.log('edge abc78', edge.id);
    // Identify Link
    const linkIdBase = edge.id; // 'L-' + edge.start + '-' + edge.end;
    // count the links from+to the same node to give unique id
    if (linkIdCnt[linkIdBase] === undefined) {
      linkIdCnt[linkIdBase] = 0;
      log.info('abc78 new entry', linkIdBase, linkIdCnt[linkIdBase]);
    } else {
      linkIdCnt[linkIdBase]++;
      log.info('abc78 new entry', linkIdBase, linkIdCnt[linkIdBase]);
    }
    let linkId = linkIdBase + '-' + linkIdCnt[linkIdBase];
    log.info('abc78 new link id to be used is', linkIdBase, linkId, linkIdCnt[linkIdBase]);
    const linkNameStart = 'LS-' + edge.start;
    const linkNameEnd = 'LE-' + edge.end;

    const edgeData = { style: '', labelStyle: '' };
    edgeData.minlen = edge.length || 1;
    //edgeData.id = 'id' + cnt;

    // Set link type for rendering
    if (edge.type === 'arrow_open') {
      edgeData.arrowhead = 'none';
    } else {
      edgeData.arrowhead = 'normal';
    }

    // Check of arrow types, placed here in order not to break old rendering
    edgeData.arrowTypeStart = 'arrow_open';
    edgeData.arrowTypeEnd = 'arrow_open';

    /* eslint-disable no-fallthrough */
    switch (edge.type) {
      case 'double_arrow_cross':
        edgeData.arrowTypeStart = 'arrow_cross';
      case 'arrow_cross':
        edgeData.arrowTypeEnd = 'arrow_cross';
        break;
      case 'double_arrow_point':
        edgeData.arrowTypeStart = 'arrow_point';
      case 'arrow_point':
        edgeData.arrowTypeEnd = 'arrow_point';
        break;
      case 'double_arrow_circle':
        edgeData.arrowTypeStart = 'arrow_circle';
      case 'arrow_circle':
        edgeData.arrowTypeEnd = 'arrow_circle';
        break;
    }

    let style = '';
    let labelStyle = '';

    switch (edge.stroke) {
      case 'normal':
        style = 'fill:none;';
        if (defaultStyle !== undefined) {
          style = defaultStyle;
        }
        if (defaultLabelStyle !== undefined) {
          labelStyle = defaultLabelStyle;
        }
        edgeData.thickness = 'normal';
        edgeData.pattern = 'solid';
        break;
      case 'dotted':
        edgeData.thickness = 'normal';
        edgeData.pattern = 'dotted';
        edgeData.style = 'fill:none;stroke-width:2px;stroke-dasharray:3;';
        break;
      case 'thick':
        edgeData.thickness = 'thick';
        edgeData.pattern = 'solid';
        edgeData.style = 'stroke-width: 3.5px;fill:none;';
        break;
    }
    // if (edge.style !== undefined) {
    //   const styles = getStylesFromArray(edge.style);
    //   style = styles.style;
    //   labelStyle = styles.labelStyle;
    // }

    edgeData.style = edgeData.style += style;
    edgeData.labelStyle = edgeData.labelStyle += labelStyle;

    // if (edge.interpolate !== undefined) {
    //   edgeData.curve = interpolateToCurve(edge.interpolate, curveLinear);
    // } else if (edges.defaultInterpolate !== undefined) {
    //   edgeData.curve = interpolateToCurve(edges.defaultInterpolate, curveLinear);
    // } else {
    //   edgeData.curve = interpolateToCurve(conf.curve, curveLinear);
    // }

    if (edge.text === undefined) {
      if (edge.style !== undefined) {
        edgeData.arrowheadStyle = 'fill: #333';
      }
    } else {
      edgeData.arrowheadStyle = 'fill: #333';
      edgeData.labelpos = 'c';
    }

    edgeData.labelType = edge.labelType;
    edgeData.label = (edge?.text || '').replace(common.lineBreakRegex, '\n');

    if (edge.style === undefined) {
      edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none;';
    }

    edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');

    edgeData.id = linkId;
    edgeData.classes = 'flowchart-link ' + linkNameStart + ' ' + linkNameEnd;

    const labelEl = insertEdgeLabel(labelsEl, edgeData);

    // calculate start and end points of the edge, note that the source and target
    // can be modified for shapes that have ports
    const { source, target, sourceId, targetId } = getEdgeStartEndPoint(edge, dir);
    log.debug('abc78 source and target', source, target);
    // Add the edge to the graph
    graph.edges.push({
      id: 'e' + edge.start + edge.end,
      sources: [source],
      targets: [target],
      sourceId,
      targetId,
      labelEl: labelEl,
      labels: [
        {
          width: edgeData.width,
          height: edgeData.height,
          orgWidth: edgeData.width,
          orgHeight: edgeData.height,
          text: edgeData.label,
          layoutOptions: {
            'edgeLabels.inline': 'true',
            'edgeLabels.placement': 'CENTER',
          },
        },
      ],
      edgeData,
    });
  });
  return graph;
};

export const render = async (data4Layout, svg, element) => {
  const elk = new ELK();

  // Org

  insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);
  // clearNodes();
  // clearEdges();
  // clearClusters();
  // clearGraphlib();

  let graph = {
    id: 'root',
    layoutOptions: {
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'org.eclipse.elk.padding': '[top=100, left=100, bottom=110, right=110]',
      'elk.layered.spacing.edgeNodeBetweenLayers': '30',
      'elk.direction': 'DOWN',
    },
    children: [],
    edges: [],
  };

  log.info('Drawing flowchart using v4 renderer', elk);

  let dir = data4Layout.direction || 'DOWN';
  switch (dir) {
    case 'BT':
      graph.layoutOptions['elk.direction'] = 'UP';
      break;
    case 'TB':
      graph.layoutOptions['elk.direction'] = 'DOWN';
      break;
    case 'LR':
      graph.layoutOptions['elk.direction'] = 'RIGHT';
      break;
    case 'RL':
      graph.layoutOptions['elk.direction'] = 'LEFT';
      break;
    default:
      graph.layoutOptions['elk.direction'] = 'DOWN';
      break;
  }

  // ###########################################################################
  // ###########################################################################
  // ###########################################################################
  // ###########################################################################
  // ###########################################################################
  // ###########################################################################

  // Create the lookup db for the subgraphs and their children to used when creating
  // the tree structured graph
  // const parentLookupDb = addSubGraphs(diagObj.db);

  // Add the nodes to the graph, this will entail creating the actual nodes
  // in order to get the size of the node. You can't get the size of a node
  // that is not in the dom so we need to add it to the dom, get the size
  // we will position the nodes when we get the layout from elkjs
  const parentLookupDb = {};
  graph = await addVertices(svg, data4Layout, parentLookupDb, graph);

  // Add the nodes and edges to the graph
  // data4Layout.nodes.forEach((node) => {
  //   graph.setNode(node.id, { ...node });
  // });

  // data4Layout.edges.forEach((edge) => {
  //   graph.setEdge(edge.start, edge.end, { ...edge });
  // });

  // Setup nodes from the subgraphs with type group, these will be used
  // as nodes with children in the subgraph
  // let subG;
  // const subGraphs = diagObj.db.getSubGraphs();
  // log.info('Subgraphs - ', subGraphs);
  // for (let i = subGraphs.length - 1; i >= 0; i--) {
  //   subG = subGraphs[i];
  //   diagObj.db.addVertex(
  //     subG.id,
  //     { text: subG.title, type: subG.labelType },
  //     'group',
  //     undefined,
  //     subG.classes,
  //     subG.dir
  //   );
  // }

  // debugger;
  // Add an element in the svg to be used to hold the subgraphs container
  // // elements
  // const subGraphsEl = svg.insert('g').attr('class', 'subgraphs');

  // // Create the lookup db for the subgraphs and their children to used when creating
  // // the tree structured graph
  // const parentLookupDb = addSubGraphs(diagObj.db);

  // Add the nodes to the graph, this will entail creating the actual nodes
  // in order to get the size of the node. You can't get the size of a node
  // that is not in the dom so we need to add it to the dom, get the size
  // we will position the nodes when we get the layout from elkjs
  // graph = await addVertices(, graph);

  // Time for the edges, we start with adding an element in the node to hold the edges
  const edgesEl = svg.insert('g').attr('class', 'edges edgePath');
  // // Fetch the edges form the parsed graph definition
  // const edges = diagObj.db.getEdges();

  // // Add the edges to the graph, this will entail creating the actual edges
  graph = addEdges(data4Layout, graph, svg);

  // Iterate through all nodes and add the top level nodes to the graph
  // const nodes = data4Layout.nodes;
  // nodes.forEach((nodeId) => {
  //   const node = nodeDb[nodeId];
  //   if (!node.parent) {
  //     graph.children.push(node);
  //   }
  //   // Subgraph
  //   if (parentLookupDb.childrenById[nodeId] !== undefined) {
  //     node.labels = [
  //       {
  //         text: node.labelText,
  //         layoutOptions: {
  //           'nodeLabels.placement': '[H_CENTER, V_TOP, INSIDE]',
  //         },
  //         width: node.labelData.width,
  //         height: node.labelData.height,
  //         // width: 100,
  //         // height: 100,
  //       },
  //     ];
  //     delete node.x;
  //     delete node.y;
  //     delete node.width;
  //     delete node.height;
  //   }
  // });

  // insertChildren(graph.children, parentLookupDb);
  // log.info('after layout', JSON.stringify(graph, null, 2));
  const g = await elk.layout(graph);
  // drawNodes(0, 0, g.children, svg, subGraphsEl, 0);
  drawNodes(0, 0, g.children, svg, null, 0);
  console.log('after layout', g);
  g.edges?.map((edge) => {
    // (elem, edge, clusterDb, diagramType, graph, id)
    insertEdge(edgesEl, edge, clusterDb, data4Layout.type, g, data4Layout.diagramId);
  });
  // setupGraphViewbox({}, svg, conf.diagramPadding, conf.useMaxWidth);
  // // Remove element after layout
  // renderEl.remove();
};

// const shapeDefinitions = {};
// export const addShape = ({ shapeType: fun }) => {
//   shapeDefinitions[shapeType] = fun;
// };

// const arrowDefinitions = {};
// export const addArrow = ({ arrowType: fun }) => {
//   arrowDefinitions[arrowType] = fun;
// };
