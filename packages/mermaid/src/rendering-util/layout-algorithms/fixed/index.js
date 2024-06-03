import { layout as dagreLayout } from 'dagre-d3-es/src/dagre/index.js';
import * as graphlibJson from 'dagre-d3-es/src/graphlib/json.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import insertMarkers from '../../rendering-elements/markers.js';
import { updateNodeBounds } from '../../rendering-elements/shapes/util.js';
// import {
//   clear as clearGraphlib,
//   clusterDb,
//   adjustClustersAndEdges,
//   findNonClusterChild,
//   sortNodesByHierarchy,
// } from './mermaid-graphlib.js';
import {
  insertNode,
  positionNode,
  clear as clearNodes,
  setNodeElem,
} from '../../rendering-elements/nodes.js';
import {
  insertCluster,
  clear as clearClusters,
  positionCluster,
} from '../../rendering-elements/clusters.js';
import {
  insertEdgeLabel,
  positionEdgeLabel,
  insertEdge,
  clear as clearEdges,
} from '../../rendering-elements/edges.js';
import { log } from '$root/logger.js';
import { getSubGraphTitleMargins } from '../../../utils/subGraphTitleMargins.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';

const fixInterSections = (points, startNode, endNode) => {
  console.log('Fixing intersections - ', points, startNode, endNode);

  // Get the intersections
  const startIntersection = startNode.intersect(points[1]);
  const endIntersection = endNode.intersect(points[points.length - 2]);

  // Replace the first and last points with their respective intersections
  const fixedPoints = [startIntersection, ...points.slice(1, -1), endIntersection];

  return fixedPoints;
};

const doRender = async (_elem, data4Layout, siteConfig, positions) => {
  const elem = _elem.insert('g').attr('class', 'root');
  const clusters = elem.insert('g').attr('class', 'clusters');
  const edgePaths = elem.insert('g').attr('class', 'edgePaths');
  const edgeLabels = elem.insert('g').attr('class', 'edgeLabels');
  const nodes = elem.insert('g').attr('class', 'nodes');

  // Insert nodes, this will insert them into the dom and each node will get a size. The size is updated
  // to the abstract node and is later used by dagre for the layout
  let freePos = 0;
  const nodeDB = {};
  await Promise.all(
    data4Layout.nodes.map(async function (node) {
      let pos;
      if (node.x === undefined || node.y === undefined) {
        pos = positions.nodes[node.id];
        node.height = pos?.height || 0;
        node.width = pos?.width || 0;
      }
      if (node.isGroup) {
        node.x = 0;
        node.y = 0;
        await insertCluster(nodes, node, 'TB');
        // Don't set the coordinates before they "layout", this will mess up the positioning
        if (pos) {
          node.x = pos?.x || 0;
          node.y = pos?.y || 0;
        }
      } else {
        if (pos) {
          node.x = pos?.x || 0;
          node.y = pos?.y || 0;
        }
        await insertNode(nodes, node, 'TB');
      }
      nodeDB[node.id] = node;
    })
  );

  data4Layout.edges.forEach(function (edge) {
    edge.x = edge?.x || 0;
    edge.y = edge?.y || 0;
    insertEdgeLabel(edgeLabels, edge);
  });

  // log.info('############################################# XXX');
  // log.info('###                Layout                 ### XXX');
  // log.info('############################################# XXX');

  // Position the nodes
  await Promise.all(
    data4Layout.nodes.map(async function (node) {
      if (node.isGroup) {
        positionCluster(node);
      } else {
        positionNode(node);
      }
    })
  );

  // Insert the edges and position the edge labels
  data4Layout.edges.forEach(function (edge) {
    console.log('Edge: ', edge, nodes[edge.start]);
    //   log.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge), edge);

    edge.points = fixInterSections(
      positions.edges[edge.id].points,
      nodeDB[edge.start],
      nodeDB[edge.end]
    );
    const paths = insertEdge(
      edgePaths,
      edge,
      {},
      data4Layout.type,
      undefined,
      data4Layout.diagramId
    );
    paths.updatedPath = paths.originalPath;
    console.log('Paths = ', paths);
    positionEdgeLabel(edge, paths);
  });

  // log.info('Graph after layout:', graphlibJson.write(graph));
  // // Move the nodes to the correct place
  // let diff = 0;
  // log.info('Need the size here XAX', graph.node('T1')?.height);
  // let { subGraphTitleTotalMargin } = getSubGraphTitleMargins(siteConfig);
  // subGraphTitleTotalMargin = 0;
  // sortNodesByHierarchy(graph).forEach(function (v) {
  //   const node = graph.node(v);
  //   const p = graph.node(node?.parentId);
  //   subGraphTitleTotalMargin = p?.offsetY || subGraphTitleTotalMargin;

  //   log.info(
  //     'Position XAX' + v + ': (' + node.x,
  //     ',' + node.y,
  //     ') width: ',
  //     node.width,
  //     ' height: ',
  //     node.height
  //   );
  //   if (node && node.clusterNode) {
  //     const parentId = graph.parent(v);
  //     // Adjust for padding when on root level
  //     node.y = parentId ? node.y + 2 : node.y - 8;
  //     node.x -= 8;

  //     log.info(
  //       'A tainted cluster node XBX',
  //       v,
  //       node.id,
  //       node.width,
  //       node.height,
  //       node.x,
  //       node.y,
  //       graph.parent(v)
  //     );
  //     clusterDb[node.id].node = node;
  //     // node.y += subGraphTitleTotalMargin - 10;
  //     node.y -= (node.offsetY || 0) / 2;
  //     positionNode(node);
  //   } else {
  //     // Non cluster node
  //     if (graph.children(v).length > 0) {
  //       node.height += 0;
  //       const parent = graph.node(node.parentId);
  //       const halfPadding = node?.padding / 2 || 0;
  //       const labelHeight = node?.labelBBox?.height || 0;
  //       const offsetY = labelHeight - halfPadding || 0;
  //       node.y += offsetY / 2 + 2;
  //       insertCluster(clusters, node);

  //       // A cluster in the non-recursive way
  //       log.info(
  //         'A pure cluster node with children XBX',
  //         v,
  //         node.id,
  //         node.width,
  //         node.height,
  //         node.x,
  //         node.y,
  //         'offset',
  //         parent?.offsetY
  //       );
  //       clusterDb[node.id].node = node;
  //     } else {
  //       const parent = graph.node(node.parentId);
  //       node.y += (parent?.offsetY || 0) / 2;
  //       log.info(
  //         'A regular node XBX - using the padding',
  //         v,
  //         node.id,
  //         'parent',
  //         node.parentId,
  //         node.width,
  //         node.height,
  //         node.x,
  //         node.y,
  //         'offsetY',
  //         node.offsetY,
  //         'parent',
  //         parent,
  //         node
  //       );

  //       positionNode(node);
  //     }
  //   }
  // });

  // // Move the edge labels to the correct place after layout
  // graph.edges().forEach(function (e) {
  //   const edge = graph.edge(e);
  //   log.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge), edge);

  //   edge.points.forEach((point) => (point.y += subGraphTitleTotalMargin / 2));
  //   const paths = insertEdge(edgePaths, edge, clusterDb, diagramType, graph, id);
  //   positionEdgeLabel(edge, paths);
  // });

  // graph.nodes().forEach(function (v) {
  //   const n = graph.node(v);
  //   log.info(v, n.type, n.diff);
  //   if (n.isGroup) {
  //     diff = n.diff;
  //   }
  // });
  // log.trace('Returning from recursive render XAX', elem, diff);
  return { elem, diff: 0 };
};
/**
 * ###############################################################
 * Render the graph
 * ###############################################################
 * @param data4Layout
 * @param svg
 * @param element
 * @param algoritm
 * @param algorithm
 * @param positions
 */
export const render = async (data4Layout, svg, element, algorithm, positions) => {
  console.log('Graph in render, positions: ', positions);
  // Org
  insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);
  clearNodes();
  clearEdges();
  clearClusters();
  // clearGraphlib();

  // log.warn('Graph at first:', JSON.stringify(graphlibJson.write(graph)));
  const siteConfig = getConfig();
  await doRender(element, data4Layout, siteConfig, positions);
};
