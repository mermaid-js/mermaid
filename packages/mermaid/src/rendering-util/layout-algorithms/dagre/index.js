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
    log.info('Recursive edges', graph.edge(graph.edges()[0]));
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
        log.trace(
          'Setting data for parent cluster XXX\n Node.id = ',
          v,
          '\n data=',
          data.height,
          '\nParent cluster',
          parentCluster.height
        );
        graph.setNode(parentCluster.id, data);
        if (!graph.parent(v)) {
          log.trace('Setting parent', v, parentCluster.id);
          graph.setParent(v, parentCluster.id, data);
        }
      }
      log.info('(Insert) Node XXX' + v + ': ' + JSON.stringify(graph.node(v)));
      if (node && node.clusterNode) {
        // const children = graph.children(v);
        log.info('Cluster identified XXX', v, node.width, graph.node(v));
        // "o" will contain the full cluster not just the children
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
        log.trace(
          'New compound node after recursive render XAX',
          v,
          'width',
          // node,
          node.width,
          'height',
          node.height
          // node.x,
          // node.y
        );
        setNodeElem(newEl, node);
      } else {
        if (graph.children(v).length > 0) {
          // This is a cluster but not to be rendered recursively
          // Render as before
          log.info('Cluster - the non recursive path XXX', v, node.id, node, graph);
          log.info(findNonClusterChild(node.id, graph));
          clusterDb[node.id] = { id: findNonClusterChild(node.id, graph), node };
          // insertCluster(clusters, graph.node(v));
        } else {
          log.trace('Node - the non recursive path XAX', v, node.id, node);
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

  log.info('############################################# XXX');
  log.info('###                Layout                 ### XXX');
  log.info('############################################# XXX');

  dagreLayout(graph);

  log.info('Graph after layout:', graphlibJson.write(graph));
  // Move the nodes to the correct place
  let diff = 0;
  log.info('Need the size here XAX', graph.node('T1')?.height);
  let { subGraphTitleTotalMargin } = getSubGraphTitleMargins(siteConfig);
  subGraphTitleTotalMargin = 0;
  sortNodesByHierarchy(graph).forEach(function (v) {
    const node = graph.node(v);
    const p = graph.node(node?.parentId);
    subGraphTitleTotalMargin = p?.offsetY || subGraphTitleTotalMargin;

    log.info(
      'Position XAX' + v + ': (' + node.x,
      ',' + node.y,
      ') width: ',
      node.width,
      ' height: ',
      node.height
    );
    if (node && node.clusterNode) {
      const parentId = graph.parent(v);
      // Adjust for padding when on root level
      node.y = parentId ? node.y + 2 : node.y - 8;
      node.x -= 8;

      log.info(
        'A tainted cluster node XBX',
        v,
        node.id,
        node.width,
        node.height,
        node.x,
        node.y,
        graph.parent(v)
      );
      clusterDb[node.id].node = node;
      // node.y += subGraphTitleTotalMargin - 10;
      node.y -= (node.offsetY || 0) / 2;
      positionNode(node);
    } else {
      // Non cluster node
      if (graph.children(v).length > 0) {
        node.height += 0;
        const parent = graph.node(node.parentId);
        node.y += (node.offsetY || 0) / 2;
        insertCluster(clusters, node);

        // A cluster in the non-recursive way
        log.info(
          'A pure cluster node with children XBX',
          v,
          node.id,
          node.width,
          node.height,
          node.x,
          node.y,
          'offset',
          parent?.offsetY
        );
        clusterDb[node.id].node = node;
      } else {
        const parent = graph.node(node.parentId);
        node.y += (parent?.offsetY || 0) / 2;
        log.info(
          'A regular node XBX - using the padding',
          v,
          node.id,
          'parent',
          node.parentId,
          node.width,
          node.height,
          node.x,
          node.y,
          'offsetY',
          node.offsetY,
          'parent',
          parent,
          node
        );

        positionNode(node);
      }
    }
  });

  // Move the edge labels to the correct place after layout
  graph.edges().forEach(function (e) {
    const edge = graph.edge(e);
    log.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge), edge);

    edge.points.forEach((point) => (point.y += subGraphTitleTotalMargin / 2));
    const paths = insertEdge(edgePaths, edge, clusterDb, diagramType, graph, id);
    positionEdgeLabel(edge, paths);
  });

  graph.nodes().forEach(function (v) {
    const n = graph.node(v);
    log.info(v, n.type, n.diff);
    if (n.isGroup) {
      diff = n.diff;
    }
  });
  log.trace('Returning from recursive render XAX', elem, diff);
  return { elem, diff };
};
/**
 * ###############################################################
 * Render the graph
 * ###############################################################
 */
export const render = async (data4Layout, svg, element) => {
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
    if (node.parentId) {
      graph.setParent(node.id, node.parentId);
    }
  });

  log.debug('Edges:', data4Layout.edges);
  data4Layout.edges.forEach((edge) => {
    graph.setEdge(edge.start, edge.end, { ...edge });
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
