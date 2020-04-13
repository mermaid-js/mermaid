/**
 * Decorates with functions required by mermaids dagre-wrapper.
 */
import { logger as log } from '../logger';
import graphlib from 'graphlib';

export let clusterDb = {};
let decendants = {};
let parents = {};
let graphs = {};

export const clear = () => {
  decendants = {};
  parents = {};
  clusterDb = {};
  graphs = {};
};

const isDecendant = (id, ancenstorId) => {
  // if (id === ancenstorId) return true;

  log.info('In isDecendant', ancenstorId, ' ', id, ' = ', decendants[ancenstorId].indexOf(id) >= 0);
  if (decendants[ancenstorId].indexOf(id) >= 0) return true;

  return false;
};

const edgeInCluster = (edge, clusterId) => {
  // Edges to/from the cluster is not in the cluster, they are in the parent
  if (!(edge.v === clusterId || edge.w === clusterId)) return false;

  if (!decendants[clusterId]) {
    log.info('Tilt, ', clustedId, ',not in decendants');
    return false;
  }

  if (decendants[clusterId].indexOf(edge.v) >= 0) return true;
  if (isDecendant(edge.v, clusterId)) return true;
  if (isDecendant(edge.w, clusterId)) return true;
  if (decendants[clusterId].indexOf(edge.w) >= 0) return true;

  return false;
};

const copyOld = (clusterId, graph, newGraph, rootId) => {
  log.info('Copying to', rootId, ' from ', clusterId, graph.node(clusterId), rootId);
  const nodes = graph.children(clusterId);
  log.info('Copying (nodes)', nodes);
  if (nodes) {
    nodes.forEach(node => {
      if (graph.children(node).length > 0) {
        copy(node, graph, newGraph, rootId);
      } else {
        // if (clusterId === rootId) {
        const data = graph.node(node);
        log.info('cp ', node, ' to ', rootId, ' with parent ', clusterId); //,node, data, ' parent is ', clusterId);
        newGraph.setNode(node, data);
        newGraph.setParent(node, clusterId);
        const edges = graph.edges(node);
        log.trace('Copying Edges', edges);
        edges.forEach(edge => {
          log.trace('Edge', edge);
          const data = graph.edge(edge.v, edge.w, edge.name);
          log.trace('Edge data', data, rootId);
          try {
            // Do not copy edges in and out of the root cluster, they belong to the parent graph
            if (edgeInCluster(edge, rootId)) {
              log.trace('Copying as ', edge.v, edge.w, data, edge.name);
              newGraph.setEdge(edge.v, edge.w, data, edge.name);
              log.trace('newGraph edges ', newGraph.edges(), newGraph.edge(newGraph.edges()[0]));
            } else {
              log.trace('Skipping copy of edge as ', rootId, edge.v, edge.w, clusterId);
            }
          } catch (e) {
            log.error(e);
          }
        });
        // } else {
        //   log.info('Skipping leaf as root ', rootId, ' !== ', clusterId, ' leaf id = ', node);
        // }
      }
      // log.info('Removing node', node, graphlib.json.write(graph));
      log.info('Removing node', node);
      graph.removeNode(node);
    });
  }
  // newGraph.setNode(clusterId, graph.node(clusterId));
};
const copy = (clusterId, graph, newGraph, rootId) => {
  log.trace(
    'Copying children of ',
    clusterId,
    rootId,
    ' from ',
    clusterId,
    graph.node(clusterId),
    rootId
  );
  const nodes = graph.children(clusterId) || [];

  // Include cluster node if it is not the root
  if (clusterId !== rootId) {
    nodes.push(clusterId);
  }

  log.info('Copying (nodes)', nodes);

  nodes.forEach(node => {
    if (graph.children(node).length > 0) {
      copy(node, graph, newGraph, rootId);
    } else {
      const data = graph.node(node);
      log.trace('cp ', node, ' to ', rootId, ' with parent ', clusterId); //,node, data, ' parent is ', clusterId);
      newGraph.setNode(node, data);
      if (clusterId !== rootId && node !== clusterId) {
        log.info('Setting parent', node, clusterId);
        newGraph.setParent(node, clusterId);
      }
      const edges = graph.edges(node);
      log.info('Copying Edges', edges);
      edges.forEach(edge => {
        log.trace('Edge', edge);
        const data = graph.edge(edge.v, edge.w, edge.name);
        log.trace('Edge data', data, rootId);
        try {
          // Do not copy edges in and out of the root cluster, they belong to the parent graph
          if (edgeInCluster(edge, rootId)) {
            log.trace('Copying as ', edge.v, edge.w, data, edge.name);
            newGraph.setEdge(edge.v, edge.w, data, edge.name);
            log.trace('newGraph edges ', newGraph.edges(), newGraph.edge(newGraph.edges()[0]));
          } else {
            log.trace('Skipping copy of edge as ', rootId, edge.v, edge.w, clusterId);
          }
        } catch (e) {
          log.error(e);
        }
      });
    }
    log.info('Removing node', node);
    graph.removeNode(node);
  });
};
export const extractDecendants = (id, graph) => {
  // log.info('Extracting ', id);
  const children = graph.children(id);
  let res = [].concat(children);

  for (let i = 0; i < children.length; i++) {
    parents[children[i]] = id;
    res = res.concat(extractDecendants(children[i], graph));
  }

  return res;
};

export const extractGraphFromCluster = (clusterId, graph) => {
  log.info('Extracting graph ', clusterId);
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

  log.trace('Extracting before copy', graphlib.json.write(graph));
  log.trace('Extracting before copy', graphlib.json.write(graph));
  copy(clusterId, graph, clusterGraph, clusterId);
  log.trace('Extracting after copy', graphlib.json.write(graph));
  log.trace('Extracting after copy', clusterGraph.nodes());
  graphs[clusterId] = clusterGraph;

  // Remove references to extracted cluster
  // graph.edges().forEach(edge => {
  //   if (isDecendant(edge.v, clusterId) || isDecendant(edge.w, clusterId)) {
  //     graph.removeEdge(edge);
  //   }
  // });
  // graph.nodes().forEach(node => {
  //   if (isDecendant(node, clusterId)) {
  //     log.info('Removing ', node, ' from ', clusterId);
  //     graph.removeNode(node);
  //   }
  // });
  return clusterGraph;
};

/**
 * Validates the graph, checking that all parent child relation points to existing nodes and that
 * edges between nodes also ia correct. When not correct the function logs the discrepancies.
 * @param {graphlib graph} g
 */
export const validate = graph => {
  const edges = graph.edges();
  log.trace('Edges: ', edges);
  for (let i = 0; i < edges.length; i++) {
    if (graph.children(edges[i].v).length > 0) {
      log.trace('The node ', edges[i].v, ' is part of and edge even though it has children');
      return false;
    }
    if (graph.children(edges[i].w).length > 0) {
      log.trace('The node ', edges[i].w, ' is part of and edge even though it has children');
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
  log.trace('Searching', id);
  const children = graph.children(id);
  if (children.length < 1) {
    log.trace('This is a valid node', id);
    return id;
  }
  for (let i = 0; i < children.length; i++) {
    const _id = findNonClusterChild(children[i], graph);
    if (_id) {
      log.trace('Found replacement for', id, ' => ', _id);
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
    log.info('Opting out, no graph ');
    return;
  } else {
    log.info('Opting in, graph ');
  }
  // Go through the nodes and for each cluster found, save a replacment node, this can be used when
  // faking a link to a cluster
  graph.nodes().forEach(function(id) {
    const children = graph.children(id);
    if (children.length > 0) {
      log.trace(
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
      log.info('Cluster identified', id, decendants);
      edges.forEach(edge => {
        // log.info('Edge, decendants: ', edge, decendants[id]);

        // Check if any edge leaves the cluster (not the actual cluster, thats a link from the box)
        if (edge.v !== id && edge.w !== id) {
          // Any edge where either the one of the nodes is decending to the cluster but not the other
          // if (decendants[id].indexOf(edge.v) < 0 && decendants[id].indexOf(edge.w) < 0) {

          const d1 = isDecendant(edge.v, id);
          const d2 = isDecendant(edge.w, id);

          // d1 xor d2 - if either d1 is true and d2 is false or the other way around
          if (d1 ^ d2) {
            log.info('Edge: ', edge, ' leaves cluster ', id);
            log.info('Decendants of ', id, ': ', decendants[id]);
            clusterDb[id].externalConnections = true;
          }
        }
      });
    }
  });

  extractor(graph, 0);

  // For clusters with incoming and/or outgoing edges translate those edges to a real node
  // in the cluster inorder to fake the edge
  graph.edges().forEach(function(e) {
    const edge = graph.edge(e);
    log.trace('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    log.trace('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));

    let v = e.v;
    let w = e.w;
    // Check if link is either from or to a cluster
    log.trace('Fix', clusterDb, 'ids:', e.v, e.w, 'Translateing: ', clusterDb[e.v], clusterDb[e.w]);
    if (clusterDb[e.v] || clusterDb[e.w]) {
      log.trace('Fixing and trixing - removing', e.v, e.w, e.name);
      v = getAnchorId(e.v);
      w = getAnchorId(e.w);
      graph.removeEdge(e.v, e.w, e.name);
      if (v !== e.v) edge.fromCluster = e.v;
      if (w !== e.w) edge.toCluster = e.w;
      log.trace('Replacing with', v, w, e.name);
      graph.setEdge(v, w, edge, e.name);
    }
  });
  log.info('Adjusted Graph', graphlib.json.write(graph));

  log.trace(clusterDb);

  // Remove references to extracted cluster
  // graph.edges().forEach(edge => {
  //   if (isDecendant(edge.v, clusterId) || isDecendant(edge.w, clusterId)) {
  //     graph.removeEdge(edge);
  //   }
  // });
};

export const transformClustersToNodes = (graph, depth) => {
  log.info('transformClustersToNodes - ', depth);
  if (depth > 10) {
    log.error('Bailing out');
    return;
  }
  // For clusters without incoming and/or outgoing edges, create a new cluster-node
  // containing the nodes and edges in the custer in a new graph
  // for (let i = 0;)
  const nodes = graph.nodes();
  let hasChildren = false;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const children = graph.children(node);
    hasChildren = hasChildren || children.length > 0;
  }

  if (!hasChildren) {
    log.info('Done, no node has children', graph.nodes());
    return;
  }
  // const clusters = Object.keys(clusterDb);
  // clusters.forEach(clusterId => {
  log.info('Nodes = ', nodes);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    log.info(
      'Handling node',
      node,
      clusterDb,
      clusterDb[node] && !clusterDb[node].externalConnections,
      !graph.parent(node),
      graph.node(node)
    );
    // Note that the node might have been removed after the Object.keys call so better check
    // that it still is in the game
    if (clusterDb[node]) {
      if (
        !clusterDb[node].externalConnections &&
        !graph.parent(node) &&
        graph.children(node) &&
        graph.children(node).length > 0
      ) {
        log.info('Cluster without external connections', node);
        // const parentGraph = parent && graphs[parent] ? graphs[parent] : graph;
        // New graph with the nodes in the cluster
        log.info('before Extracting ', node, ' parent is ', graph.parent(node));
        const clusterGraph = extractGraphFromCluster(node, graph);

        if (clusterGraph) {
          log.trace('Cluster graph', clusterGraph.nodes());
          log.trace('Graph', graph.edges());

          log.info('Creating node in original', node, clusterGraph);

          // Create a new node in the original graph, this new node is not a cluster
          // but a regular node with the cluster content as a new attached graph
          graph.setNode(node, {
            clusterNode: true,
            id: node,
            clusterData: clusterDb[node],
            labelText: clusterDb[node].labelText,
            graph: clusterGraph
          });

          // if any node in the clusterGraph still has children
          transformClustersToNodes(clusterGraph, depth + 1);
        }

        // The original edges in and out of the cluster is applied
        // edges.forEach(edge => {
        //   log.info('Setting edge', edge);
        //   const data = graph.edge(edge);
        //   graph.setEdge(edge.v, edge.w, data);
        // });
      }
    } else {
      log.info('Not a cluster ', node);
    }
  }
};

export const extractor = (graph, depth) => {
  log.info('extractor - ', depth, graphlib.json.write(graph), graph.children('D'));
  if (depth > 10) {
    log.error('Bailing out');
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
    log.info('Done, no node has children', graph.nodes());
    return;
  }
  // const clusters = Object.keys(clusterDb);
  // clusters.forEach(clusterId => {
  log.info('Nodes = ', nodes, depth);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    log.info(
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
      log.info('Not a cluster', node, depth);
      // break;
    } else if (
      !clusterDb[node].externalConnections &&
      !graph.parent(node) &&
      graph.children(node) &&
      graph.children(node).length > 0
    ) {
      log.info(
        'Cluster without external connections, without a parent and with children',
        node,
        depth
      );

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

      copy(node, graph, clusterGraph, node);
      graph.setNode(node, {
        clusterNode: true,
        id: node,
        clusterData: clusterDb[node],
        labelText: clusterDb[node].labelText,
        graph: clusterGraph
      });
      log.info('New graph after copy', graphlib.json.write(clusterGraph));
      log.info('Old graph after copy', graphlib.json.write(graph));

      /*
      // New graph with the nodes in the cluster
      log.info('before Extracting ', node, ' parent is ', graph.parent(node));
      const clusterGraph = extractGraphFromCluster(node, graph);

      if (clusterGraph) {
        log.trace('Cluster graph', clusterGraph.nodes());
        log.trace('Graph', graph.edges());

        log.info('Creating node in original', node, clusterGraph);

        // Create a new node in the original graph, this new node is not a cluster
        // but a regular node with the cluster content as a new attached graph
        graph.setNode(node, {
          clusterNode: true,
          id: node,
          clusterData: clusterDb[node],
          labelText: clusterDb[node].labelText,
          graph: clusterGraph
        });

        // if any node in the clusterGraph still has children
        transformClustersToNodes(clusterGraph, depth + 1);
      }

      // The original edges in and out of the cluster is applied
      // edges.forEach(edge => {
      //   log.info('Setting edge', edge);
      //   const data = graph.edge(edge);
      //   graph.setEdge(edge.v, edge.w, data);
      // });
      */
    } else {
      log.info(
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
      log.info(clusterDb);
    }
  }

  nodes = graph.nodes();
  log.info('New list of nodes', nodes);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const data = graph.node(node);
    log.info(' Now next leveö', node, data);
    if (data.clusterNode) {
      extractor(data.graph, depth + 1);
    }
  }
};
