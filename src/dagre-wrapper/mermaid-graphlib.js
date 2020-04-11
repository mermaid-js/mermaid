/**
 * Decorates with functions required by mermaids dagre-wrapper.
 */
import { logger } from '../logger';
import graphlib from 'graphlib';

export let clusterDb = {};
let decendants = {};

export const clear = () => {
  decendants = {};
  clusterDb = {};
};

const copy = (clusterId, graph, newGraph, rootId) => {
  logger.info('Copying ', clusterId, graph.node(clusterId));
  const nodes = graph.children(clusterId);
  nodes.forEach(node => {
    if (graph.children(node).length > 0) {
      copy(node, graph, newGraph, rootId);
    }

    const data = graph.node(node);
    logger.info(node, data, ' parent is ', clusterId);
    newGraph.setNode(node, data);
    newGraph.setParent(node, clusterId);
    const edges = graph.edges(node);
    logger.info('Copying Edges', edges);
    edges.forEach(edge => {
      logger.info('Edge', edge);
      const data = graph.edge(edge.v, edge.w, edge.name);
      logger.info('Edge data', data, rootId);
      try {
        // Do not copy edges in and out of the root cluster, they belong to the parent graph
        if (!(edge.v === rootId || edge.w === rootId)) {
          logger.info('Copying as ', edge.v, edge.w, data, edge.name);
          newGraph.setEdge(edge.v, edge.w, data, edge.name);
          logger.info('newgrapg edges ', newGraph.edges(), newGraph.edge(newGraph.edges()[0]));
        } else {
          logger.info('Skipping copy of edge as ', rootId, edge.v, edge.w, clusterId);
        }
      } catch (e) {
        logger.error(e);
      }
    });
    graph.removeNode(node);
  });
  newGraph.setNode(clusterId, graph.node(clusterId));
};

const extractDecendants = (id, graph) => {
  const children = graph.children(id);
  let res = [].concat(children);

  for (let i = 0; i < children.length; i++) {
    res = res.concat(extractDecendants(children[i], graph));
  }

  return res;
};

export const extractGraphFromCluster = (clusterId, graph) => {
  const clusterGraph = new graphlib.Graph({
    multigraph: true,
    compound: true
  })
    .setGraph({
      rankdir: 'TB',
      // Todo: set proper spacing
      nodesep: 50,
      ranksep: 50,
      marginx: 8,
      marginy: 8
    })
    .setDefaultEdgeLabel(function() {
      return {};
    });

  // const conf = getConfig().flowchart;
  // const nodeSpacing = conf.nodeSpacing || 50;
  // const rankSpacing = conf.rankSpacing || 50;

  // // Create the input mermaid.graph
  // const g = new graphlib.Graph({
  //   multigraph: true,
  //   compound: true
  // })
  //   .setGraph({
  //     rankdir: 'TB',
  //     nodesep: nodeSpacing,
  //     ranksep: rankSpacing,
  //     marginx: 8,
  //     marginy: 8
  //   })
  //   .setDefaultEdgeLabel(function() {
  //     return {};
  //   });

  copy(clusterId, graph, clusterGraph, clusterId);

  return clusterGraph;
};

/**
 * Validates the graph, checking that all parent child relation points to existing nodes and that
 * edges between nodes also ia correct. When not correct the function logs the discrepancies.
 * @param {graphlib graph} g
 */
export const validate = graph => {
  const edges = graph.edges();
  logger.trace('Edges: ', edges);
  for (let i = 0; i < edges.length; i++) {
    if (graph.children(edges[i].v).length > 0) {
      logger.trace('The node ', edges[i].v, ' is part of and edge even though it has children');
      return false;
    }
    if (graph.children(edges[i].w).length > 0) {
      logger.trace('The node ', edges[i].w, ' is part of and edge even though it has children');
      return false;
    }
  }
  return true;
};

/**
 * Finds a child that is not a cluster. When faking a edge between a node and a cluster.
 * @param {Finds a } id
 * @param {*} graph
 */
export const findNonClusterChild = (id, graph) => {
  // const node = graph.node(id);
  logger.trace('Searching', id);
  const children = graph.children(id);
  if (children.length < 1) {
    logger.trace('This is a valid node', id);
    return id;
  }
  for (let i = 0; i < children.length; i++) {
    const _id = findNonClusterChild(children[i], graph);
    if (_id) {
      logger.trace('Found replacement for', id, ' => ', _id);
      return _id;
    }
  }
};

const getAnchorId = id => {
  if (!clusterDb[id]) {
    return id;
  }
  // If the cluster has no external connections
  if (!clusterDb[id].externalConnections) {
    return id;
  }

  // Return the replacement node
  if (clusterDb[id]) {
    return clusterDb[id].id;
  }
  return id;
};

export const adjustClustersAndEdges = graph => {
  // calc decendants, sa

  // Go through the nodes and for each cluster found, save a replacment node, this can be used when
  // faking a link to a cluster
  graph.nodes().forEach(function(id) {
    const children = graph.children(id);
    if (children.length > 0) {
      logger.info(
        'Cluster identified',
        id,
        ' Replacement id in edges: ',
        findNonClusterChild(id, graph)
      );
      decendants[id] = extractDecendants(id, graph);
      clusterDb[id] = { id: findNonClusterChild(id, graph) };
    }
  });

  // Check incoming and outgoing edges for each cluster
  graph.nodes().forEach(function(id) {
    const children = graph.children(id);
    const edges = graph.edges();
    if (children.length > 0) {
      logger.info('Cluster identified', id);
      edges.forEach(edge => {
        logger.info('Edge: ', edge, decendants[id]);
        // Check if any edge leaves the cluster (not the actual cluster, thats a link from the box)
        if (edge.v !== id && edge.w !== id) {
          if (decendants[id].indexOf(edge.v) < 0 || decendants[id].indexOf(edge.w) < 0) {
            logger.info('Edge: ', edge, ' leaves cluster ', id);
            clusterDb[id].externalConnections = true;
          }
        }
      });
    }
  });

  // For clusters without incoming and/or outgoing edges, create a new cluster-node
  // containing the nodes and edges in the custer in a new graph
  // for (let i = 0;)
  const clusters = Object.keys(clusterDb);
  // clusters.forEach(clusterId => {
  for (let i = 0; i < clusters.length; i++) {
    const clusterId = clusters[i];
    if (!clusterDb[clusterId].externalConnections) {
      logger.trace('Cluster without external connections', clusterId);
      const edges = graph.nodeEdges(clusterId);

      // New graph with the nodes in the cluster
      const clusterGraph = extractGraphFromCluster(clusterId, graph);
      logger.trace('Cluster graph', clusterGraph.nodes());
      logger.trace('Graph', graph.nodes());

      // Create a new node in the original graph, this new node is not a cluster
      // but a regular node with the cluster dontent as a new attached graph
      graph.setNode(clusterId, {
        clusterNode: true,
        id: clusterId,
        clusterData: clusterDb[clusterId],
        labelText: clusterDb[clusterId].labelText,
        graph: clusterGraph
      });

      // The original edges in and out of the cluster is applied
      edges.forEach(edge => {
        logger.trace('Setting edge', edge);
        const data = graph.edge(edge);
        graph.setEdge(edge.v, edge.w, data);
      });
    }
  }
  logger.trace('Graph', graph.nodes());
  // For clusters with incoming and/or outgoing edges translate those edges to a real node
  // in the cluster inorder to fake the edge
  graph.edges().forEach(function(e) {
    const edge = graph.edge(e);
    logger.trace('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    logger.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));

    let v = e.v;
    let w = e.w;
    // Check if link is either from or to a cluster
    logger.trace(
      'Fix',
      clusterDb,
      'ids:',
      e.v,
      e.w,
      'Translateing: ',
      clusterDb[e.v],
      clusterDb[e.w]
    );
    if (clusterDb[e.v] || clusterDb[e.w]) {
      logger.trace('Fixing and trixing - removing', e.v, e.w, e.name);
      v = getAnchorId(e.v);
      w = getAnchorId(e.w);
      graph.removeEdge(e.v, e.w, e.name);
      if (v !== e.v) edge.fromCluster = e.v;
      if (w !== e.w) edge.toCluster = e.w;
      logger.trace('Replacing with', v, w, e.name);
      graph.setEdge(v, w, edge, e.name);
    }
  });
  logger.trace('Graph', graph.nodes());

  logger.trace(clusterDb);
};
