import { layout as dagreLayout } from 'dagre-d3-es/src/dagre/index.js';
import * as graphlibJson from 'dagre-d3-es/src/graphlib/json.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import insertMarkers from '../../rendering-elements/markers.js';
import { updateNodeBounds } from '../../rendering-elements/shapes/util.js';
import {
  clear as clearGraphlib,
  clusterDb,
  adjustClustersAndEdges,
  findNonClusterChild,
  sortNodesByHierarchy,
} from './mermaid-graphlib.js';
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
import { log } from '$root/logger.js';
import { getSubGraphTitleMargins } from '../../../utils/subGraphTitleMargins.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';

const recursiveRender = async (_elem, graph, diagramtype, id, parentCluster, siteConfig) => {
  log.info('Graph in recursive render: XXX', graphlibJson.write(graph), parentCluster);
  const dir = graph.graph().rankdir;
  log.trace('Dir in recursive render - dir:', dir);

  const elem = _elem.insert('g').attr('class', 'root');
  if (!graph.nodes()) {
    log.info('No nodes found for', graph);
  } else {
    log.info('Recursive render XXX', graph.nodes());
  }
  if (graph.edges().length > 0) {
    log.trace('Recursive edges', graph.edge(graph.edges()[0]));
  }
  const clusters = elem.insert('g').attr('class', 'clusters');
  const edgePaths = elem.insert('g').attr('class', 'edgePaths');
  const edgeLabels = elem.insert('g').attr('class', 'edgeLabels');
  const nodes = elem.insert('g').attr('class', 'nodes');

  // Insert nodes, this will insert them into the dom and each node will get a size. The size is updated
  // to the abstract node and is later used by dagre for the layout
  await Promise.all(
    graph.nodes().map(async function (v) {
      const node = graph.node(v);
      if (parentCluster !== undefined) {
        const data = JSON.parse(JSON.stringify(parentCluster.clusterData));
        // data.clusterPositioning = true;
        log.info('Setting data for cluster XXX (', v, ') ', data, parentCluster);
        graph.setNode(parentCluster.id, data);
        if (!graph.parent(v)) {
          log.trace('Setting parent', v, parentCluster.id);
          graph.setParent(v, parentCluster.id, data);
        }
      }
      log.info('(Insert) Node XXX' + v + ': ' + JSON.stringify(graph.node(v)));
      if (node && node.clusterNode) {
        // const children = graph.children(v);
        log.info('Cluster identified', v, node.width, graph.node(v));
        const o = await recursiveRender(
          nodes,
          node.graph,
          diagramtype,
          id,
          graph.node(v),
          siteConfig
        );
        const newEl = o.elem;
        updateNodeBounds(node, newEl);
        node.diff = o.diff || 0;
        log.info('Node bounds (abc123)', v, node, node.width, node.x, node.y);
        setNodeElem(newEl, node);

        log.warn('Recursive render complete ', newEl, node);
      } else {
        if (graph.children(v).length > 0) {
          // This is a cluster but not to be rendered recursively
          // Render as before
          log.info('Cluster - the non recursive path XXX', v, node.id, node, graph);
          log.info(findNonClusterChild(node.id, graph));
          clusterDb[node.id] = { id: findNonClusterChild(node.id, graph), node };
          // insertCluster(clusters, graph.node(v));
        } else {
          log.info('Node - the non recursive path', v, node.id, node);
          await insertNode(nodes, graph.node(v), dir);
        }
      }
    })
  );

  // Insert labels, this will insert them into the dom so that the width can be calculated
  // Also figure out which edges point to/from clusters and adjust them accordingly
  // Edges from/to clusters really points to the first child in the cluster.
  // TODO: pick optimal child in the cluster to us as link anchor
  graph.edges().forEach(function (e) {
    const edge = graph.edge(e.v, e.w, e.name);
    log.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    log.info('Edge ' + e.v + ' -> ' + e.w + ': ', e, ' ', JSON.stringify(graph.edge(e)));

    // Check if link is either from or to a cluster
    log.info('Fix', clusterDb, 'ids:', e.v, e.w, 'Translateing: ', clusterDb[e.v], clusterDb[e.w]);
    insertEdgeLabel(edgeLabels, edge);
  });

  graph.edges().forEach(function (e) {
    log.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
  });
  log.info('#############################################');
  log.info('###                Layout                 ###');
  log.info('#############################################');
  log.info(graph);
  dagreLayout(graph);
  log.info('Graph after layout:', graphlibJson.write(graph));
  // Move the nodes to the correct place
  let diff = 0;
  const { subGraphTitleTotalMargin } = getSubGraphTitleMargins(siteConfig);
  sortNodesByHierarchy(graph).forEach(function (v) {
    const node = graph.node(v);
    log.info('Position ' + v + ': ' + JSON.stringify(graph.node(v)));
    log.info(
      'Position ' + v + ': (' + node.x,
      ',' + node.y,
      ') width: ',
      node.width,
      ' height: ',
      node.height
    );
    if (node && node.clusterNode) {
      // clusterDb[node.id].node = node;
      node.y += subGraphTitleTotalMargin;
      positionNode(node);
    } else {
      // Non cluster node
      if (graph.children(v).length > 0) {
        // A cluster in the non-recursive way
        // positionCluster(node);
        node.height += subGraphTitleTotalMargin;
        insertCluster(clusters, node);
        clusterDb[node.id].node = node;
      } else {
        node.y += subGraphTitleTotalMargin / 2;
        positionNode(node);
      }
    }
  });

  // Move the edge labels to the correct place after layout
  graph.edges().forEach(function (e) {
    const edge = graph.edge(e);
    log.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge), edge);

    edge.points.forEach((point) => (point.y += subGraphTitleTotalMargin / 2));
    const paths = insertEdge(edgePaths, e, edge, clusterDb, diagramtype, graph, id);
    positionEdgeLabel(edge, paths);
  });

  graph.nodes().forEach(function (v) {
    const n = graph.node(v);
    log.info(v, n.type, n.diff);
    if (n.type === 'group') {
      diff = n.diff;
    }
  });
  return { elem, diff };
};

export const render = async (data4Layout, svg, element) => {
  console.warn('HERERERERERER');
  // Create the input mermaid.graph
  const graph = new graphlib.Graph({
    multigraph: true,
    compound: true,
  })
    .setGraph({
      rankdir: data4Layout.direction,
      nodesep: data4Layout.nodeSpacing,
      ranksep: data4Layout.rankSpacing,
      marginx: 8,
      marginy: 8,
    })
    .setDefaultEdgeLabel(function () {
      return {};
    });

  // Org

  insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);
  clearNodes();
  clearEdges();
  clearClusters();
  clearGraphlib();

  // Add the nodes and edges to the graph
  data4Layout.nodes.forEach((node) => {
    graph.setNode(node.id, { ...node });
  });

  console.log('Edges:', data4Layout.edges);
  data4Layout.edges.forEach((edge) => {
    graph.setEdge(edge.from, edge.to, { ...edge });
  });

  log.warn('Graph at first:', JSON.stringify(graphlibJson.write(graph)));
  adjustClustersAndEdges(graph);
  log.warn('Graph after:', JSON.stringify(graphlibJson.write(graph)));
  const siteConfig = getConfig();
  await recursiveRender(
    element,
    graph,
    data4Layout.type,
    data4Layout.diagramId,
    undefined,
    siteConfig
  );
};

// const shapeDefinitions = {};
// export const addShape = ({ shapeType: fun }) => {
//   shapeDefinitions[shapeType] = fun;
// };

// const arrowDefinitions = {};
// export const addArrow = ({ arrowType: fun }) => {
//   arrowDefinitions[arrowType] = fun;
// };
