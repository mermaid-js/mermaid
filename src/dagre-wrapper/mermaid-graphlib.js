/**
 * Decorates with functions required by mermaids dagre-wrapper.
 */
import { logger } from '../logger';
import graphlib from 'graphlib';

export let clusterDb = {};
let decendants = {};
let parents = {};

export const clear = () => {
  decendants = {};
  parents = {};
  clusterDb = {};
};

const isDecendant = (id, ancenstorId) => {
  // if (id === ancenstorId) return true;

  logger.debug(
    'In isDecendant',
    ancenstorId,
    ' ',
    id,
    ' = ',
    decendants[ancenstorId].indexOf(id) >= 0
  );
  if (decendants[ancenstorId].indexOf(id) >= 0) return true;

  return false;
};

const edgeInCluster = (edge, clusterId) => {
  logger.info('Decendants of ', clusterId, ' is ', decendants[clusterId]);
  logger.info('Edge is ', edge);
  // Edges to/from the cluster is not in the cluster, they are in the parent
  if (edge.v === clusterId) return false;
  if (edge.w === clusterId) return false;

  if (!decendants[clusterId]) {
    logger.debug('Tilt, ', clusterId, ',not in decendants');
    return false;
  }
  logger.info('Here ');

  if (decendants[clusterId].indexOf(edge.v) >= 0) return true;
  if (isDecendant(edge.v, clusterId)) return true;
  if (isDecendant(edge.w, clusterId)) return true;
  if (decendants[clusterId].indexOf(edge.w) >= 0) return true;

  return false;
};

const copy = (clusterId, graph, newGraph, rootId) => {
  logger.warn(
    'Copying children of ',
    clusterId,
    'root',
    rootId,
    'data',
    graph.node(clusterId),
    rootId
  );
  const nodes = graph.children(clusterId) || [];

  // Include cluster node if it is not the root
  if (clusterId !== rootId) {
    nodes.push(clusterId);
  }

  logger.warn('Copying (nodes) clusterId', clusterId, 'nodes', nodes);

  nodes.forEach(node => {
    if (graph.children(node).length > 0) {
      copy(node, graph, newGraph, rootId);
    } else {
      const data = graph.node(node);
      logger.info('cp ', node, ' to ', rootId, ' with parent ', clusterId); //,node, data, ' parent is ', clusterId);
      newGraph.setNode(node, data);
      if (rootId !== graph.parent(node)) {
        logger.warn('Setting parent', node, graph.parent(node));
        newGraph.setParent(node, graph.parent(node));
      }

      if (clusterId !== rootId && node !== clusterId) {
        logger.debug('Setting parent', node, clusterId);
        newGraph.setParent(node, clusterId);
      } else {
        logger.info('In copy ', clusterId, 'root', rootId, 'data', graph.node(clusterId), rootId);
        logger.debug(
          'Not Setting parent for node=',
          node,
          'cluster!==rootId',
          clusterId !== rootId,
          'node!==clusterId',
          node !== clusterId
        );
      }
      const edges = graph.edges(node);
      logger.debug('Copying Edges', edges);
      edges.forEach(edge => {
        logger.info('Edge', edge);
        const data = graph.edge(edge.v, edge.w, edge.name);
        logger.info('Edge data', data, rootId);
        try {
          // Do not copy edges in and out of the root cluster, they belong to the parent graph
          if (edgeInCluster(edge, rootId)) {
            logger.info('Copying as ', edge.v, edge.w, data, edge.name);
            newGraph.setEdge(edge.v, edge.w, data, edge.name);
            logger.info('newGraph edges ', newGraph.edges(), newGraph.edge(newGraph.edges()[0]));
          } else {
            logger.info(
              'Skipping copy of edge ',
              edge.v,
              '-->',
              edge.w,
              ' rootId: ',
              rootId,
              ' clusterId:',
              clusterId
            );
          }
        } catch (e) {
          logger.error(e);
        }
      });
    }
    logger.debug('Removing node', node);
    graph.removeNode(node);
  });
};
export const extractDecendants = (id, graph) => {
  // logger.debug('Extracting ', id);
  const children = graph.children(id);
  let res = [].concat(children);

  for (let i = 0; i < children.length; i++) {
    parents[children[i]] = id;
    res = res.concat(extractDecendants(children[i], graph));
  }

  return res;
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
  // const children = graph.children(id).reverse();
  const children = graph.children(id); //.reverse();
  logger.trace('Searching children of id ', id, children);
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

export const adjustClustersAndEdges = (graph, depth) => {
  if (!graph || depth > 10) {
    logger.debug('Opting out, no graph ');
    return;
  } else {
    logger.debug('Opting in, graph ');
  }
  // Go through the nodes and for each cluster found, save a replacment node, this can be used when
  // faking a link to a cluster
  graph.nodes().forEach(function(id) {
    const children = graph.children(id);
    if (children.length > 0) {
      logger.warn(
        'Cluster identified',
        id,
        ' Replacement id in edges: ',
        findNonClusterChild(id, graph)
      );
      decendants[id] = extractDecendants(id, graph);
      clusterDb[id] = { id: findNonClusterChild(id, graph), clusterData: graph.node(id) };
    }
  });

  // Check incoming and outgoing edges for each cluster
  graph.nodes().forEach(function(id) {
    const children = graph.children(id);
    const edges = graph.edges();
    if (children.length > 0) {
      logger.debug('Cluster identified', id, decendants);
      edges.forEach(edge => {
        // logger.debug('Edge, decendants: ', edge, decendants[id]);

        // Check if any edge leaves the cluster (not the actual cluster, thats a link from the box)
        if (edge.v !== id && edge.w !== id) {
          // Any edge where either the one of the nodes is decending to the cluster but not the other
          // if (decendants[id].indexOf(edge.v) < 0 && decendants[id].indexOf(edge.w) < 0) {

          const d1 = isDecendant(edge.v, id);
          const d2 = isDecendant(edge.w, id);

          // d1 xor d2 - if either d1 is true and d2 is false or the other way around
          if (d1 ^ d2) {
            logger.warn('Edge: ', edge, ' leaves cluster ', id);
            logger.warn('Decendants of XXX ', id, ': ', decendants[id]);
            clusterDb[id].externalConnections = true;
          }
        }
      });
    } else {
      logger.debug('Not a cluster ', id, decendants);
    }
  });

  // For clusters with incoming and/or outgoing edges translate those edges to a real node
  // in the cluster inorder to fake the edge
  graph.edges().forEach(function(e) {
    const edge = graph.edge(e);
    logger.warn('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    logger.warn('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));

    let v = e.v;
    let w = e.w;
    // Check if link is either from or to a cluster
    logger.warn(
      'Fix XXX',
      clusterDb,
      'ids:',
      e.v,
      e.w,
      'Translateing: ',
      clusterDb[e.v],
      ' --- ',
      clusterDb[e.w]
    );
    if (clusterDb[e.v] || clusterDb[e.w]) {
      logger.warn('Fixing and trixing - removing XXX', e.v, e.w, e.name);
      v = getAnchorId(e.v);
      w = getAnchorId(e.w);
      graph.removeEdge(e.v, e.w, e.name);
      if (v !== e.v) edge.fromCluster = e.v;
      if (w !== e.w) edge.toCluster = e.w;
      logger.warn('Fix Replacing with XXX', v, w, e.name);
      graph.setEdge(v, w, edge, e.name);
    }
  });
  logger.warn('Adjusted Graph', graphlib.json.write(graph));
  extractor(graph, 0);

  logger.trace(clusterDb);

  // Remove references to extracted cluster
  // graph.edges().forEach(edge => {
  //   if (isDecendant(edge.v, clusterId) || isDecendant(edge.w, clusterId)) {
  //     graph.removeEdge(edge);
  //   }
  // });
};

export const extractor = (graph, depth) => {
  logger.warn('extractor - ', depth, graphlib.json.write(graph), graph.children('D'));
  if (depth > 10) {
    logger.error('Bailing out');
    return;
  }
  // For clusters without incoming and/or outgoing edges, create a new cluster-node
  // containing the nodes and edges in the custer in a new graph
  // for (let i = 0;)
  let nodes = graph.nodes();
  let hasChildren = false;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const children = graph.children(node);
    hasChildren = hasChildren || children.length > 0;
  }

  if (!hasChildren) {
    logger.debug('Done, no node has children', graph.nodes());
    return;
  }
  // const clusters = Object.keys(clusterDb);
  // clusters.forEach(clusterId => {
  logger.debug('Nodes = ', nodes, depth);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    logger.debug(
      'Extracting node',
      node,
      clusterDb,
      clusterDb[node] && !clusterDb[node].externalConnections,
      !graph.parent(node),
      graph.node(node),
      graph.children('D'),
      ' Depth ',
      depth
    );
    // Note that the node might have been removed after the Object.keys call so better check
    // that it still is in the game
    if (!clusterDb[node]) {
      // Skip if the node is not a cluster
      logger.debug('Not a cluster', node, depth);
      // break;
    } else if (
      !clusterDb[node].externalConnections &&
      // !graph.parent(node) &&
      graph.children(node) &&
      graph.children(node).length > 0
    ) {
      logger.warn(
        'Cluster without external connections, without a parent and with children',
        node,
        depth
      );

      const graphSettings = graph.graph();

      const clusterGraph = new graphlib.Graph({
        multigraph: true,
        compound: true
      })
        .setGraph({
          rankdir: graphSettings.rankdir === 'TB' ? 'LR' : 'TB',
          // Todo: set proper spacing
          nodesep: 50,
          ranksep: 50,
          marginx: 8,
          marginy: 8
        })
        .setDefaultEdgeLabel(function() {
          return {};
        });

      logger.warn('Old graph before copy', graphlib.json.write(graph));
      copy(node, graph, clusterGraph, node);
      graph.setNode(node, {
        clusterNode: true,
        id: node,
        clusterData: clusterDb[node].clusterData,
        labelText: clusterDb[node].labelText,
        graph: clusterGraph
      });
      logger.warn('New graph after copy node: (', node, ')', graphlib.json.write(clusterGraph));
      logger.debug('Old graph after copy', graphlib.json.write(graph));
    } else {
      logger.warn(
        'Cluster ** ',
        node,
        ' **not meeting the criteria !externalConnections:',
        !clusterDb[node].externalConnections,
        ' no parent: ',
        !graph.parent(node),
        ' children ',
        graph.children(node) && graph.children(node).length > 0,
        graph.children('D'),
        depth
      );
      logger.debug(clusterDb);
    }
  }

  nodes = graph.nodes();
  logger.warn('New list of nodes', nodes);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const data = graph.node(node);
    logger.warn(' Now next level', node, data);
    if (data.clusterNode) {
      extractor(data.graph, depth + 1);
    }
  }
};

const sorter = (graph, nodes) => {
  if (nodes.length === 0) return [];
  let result = Object.assign(nodes);
  nodes.forEach(node => {
    const children = graph.children(node);
    const sorted = sorter(graph, children);
    result = result.concat(sorted);
  });

  return result;
};

export const sortNodesByHierarchy = graph => sorter(graph, graph.children());
