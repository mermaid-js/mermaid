import { layout as dagreLayout } from 'dagre-d3-es/src/dagre/index.js';
import * as graphlibJson from 'dagre-d3-es/src/graphlib/json.js';
import insertMarkers from './markers.js';
import { updateNodeBounds } from './shapes/util.js';
import {
  clear as clearGraphlib,
  clusterDb,
  adjustClustersAndEdges,
  findNonClusterChild,
  sortNodesByHierarchy,
} from './mermaid-graphlib.js';
import { insertNode, positionNode, clear as clearNodes, setNodeElem } from './nodes.js';
import { insertCluster, clear as clearClusters } from './clusters.js';
import { insertEdgeLabel, positionEdgeLabel, insertEdge, clear as clearEdges } from './edges.js';
import { log } from '../logger.js';
import { getSubGraphTitleMargins } from '../utils/subGraphTitleMargins.js';
import { getConfig } from '../diagram-api/diagramAPI.js';

const recursiveRender = async (_elem, graph, diagramType, id, parentCluster, siteConfig) => {
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
        // `node.graph.setGraph` applies the graph configurations such as nodeSpacing to subgraphs as without this the default values would be used
        // We override only the `ranksep` and `nodesep` configurations to allow for setting subgraph spacing while avoiding overriding other properties
        const { ranksep, nodesep } = graph.graph();
        node.graph.setGraph({
          ...node.graph.graph(),
          ranksep,
          nodesep,
        });
        const o = await recursiveRender(
          nodes,
          node.graph,
          diagramType,
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
    log.info('Fix', clusterDb, 'ids:', e.v, e.w, 'Translating: ', clusterDb[e.v], clusterDb[e.w]);
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
    const paths = insertEdge(edgePaths, e, edge, clusterDb, diagramType, graph, id);
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

export const render = async (elem, graph, markers, diagramType, id) => {
  insertMarkers(elem, markers, diagramType, id);
  clearNodes();
  clearEdges();
  clearClusters();
  clearGraphlib();

  log.warn('Graph at first:', JSON.stringify(graphlibJson.write(graph)));
  adjustClustersAndEdges(graph);
  log.warn('Graph after:', JSON.stringify(graphlibJson.write(graph)));
  // log.warn('Graph ever  after:', graphlibJson.write(graph.node('A').graph));
  const siteConfig = getConfig();
  await recursiveRender(elem, graph, diagramType, id, undefined, siteConfig);
};

// const shapeDefinitions = {};
// export const addShape = ({ shapeType: fun }) => {
//   shapeDefinitions[shapeType] = fun;
// };

// const arrowDefinitions = {};
// export const addArrow = ({ arrowType: fun }) => {
//   arrowDefinitions[arrowType] = fun;
// };
