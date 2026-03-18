/** Decorates with functions required by mermaids dagre-wrapper. */
import { log } from '../logger.js';
import * as graphlibJson from 'dagre-d3-es/src/graphlib/json.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';

export let clusterDb = new Map();
let descendants = new Map();
let parents = new Map();

export const clear = () => {
  descendants.clear();
  parents.clear();
  clusterDb.clear();
};

const isDescendant = (id, ancestorId) => {
  // if (id === ancestorId) return true;

  const ancestorDescendants = descendants.get(ancestorId) || [];
  log.trace('In isDescendant', ancestorId, ' ', id, ' = ', ancestorDescendants.includes(id));
  if (ancestorDescendants.includes(id)) {
    return true;
  }

  return false;
};

const edgeInCluster = (edge, clusterId) => {
  const clusterDescendants = descendants.get(clusterId) || [];
  log.info('Descendants of ', clusterId, ' is ', clusterDescendants);
  log.info('Edge is ', edge);
  // Edges to/from the cluster is not in the cluster, they are in the parent
  if (edge.v === clusterId) {
    return false;
  }
  if (edge.w === clusterId) {
    return false;
  }

  if (!clusterDescendants) {
    log.debug('Tilt, ', clusterId, ',not in descendants');
    return false;
  }
  return (
    clusterDescendants.includes(edge.v) ||
    isDescendant(edge.v, clusterId) ||
    isDescendant(edge.w, clusterId) ||
    clusterDescendants.includes(edge.w)
  );
};

const copy = (clusterId, graph, newGraph, rootId) => {
  log.warn(
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

  log.warn('Copying (nodes) clusterId', clusterId, 'nodes', nodes);

  nodes.forEach((node) => {
    if (graph.children(node).length > 0) {
      copy(node, graph, newGraph, rootId);
    } else {
      const data = graph.node(node);
      log.info('cp ', node, ' to ', rootId, ' with parent ', clusterId); //,node, data, ' parent is ', clusterId);
      newGraph.setNode(node, data);
      if (rootId !== graph.parent(node)) {
        log.warn('Setting parent', node, graph.parent(node));
        newGraph.setParent(node, graph.parent(node));
      }

      if (clusterId !== rootId && node !== clusterId) {
        log.debug('Setting parent', node, clusterId);
        newGraph.setParent(node, clusterId);
      } else {
        log.info('In copy ', clusterId, 'root', rootId, 'data', graph.node(clusterId), rootId);
        log.debug(
          'Not Setting parent for node=',
          node,
          'cluster!==rootId',
          clusterId !== rootId,
          'node!==clusterId',
          node !== clusterId
        );
      }
      const edges = graph.edges(node);
      log.debug('Copying Edges', edges);
      edges.forEach((edge) => {
        log.info('Edge', edge);
        const data = graph.edge(edge.v, edge.w, edge.name);
        log.info('Edge data', data, rootId);
        try {
          // Do not copy edges in and out of the root cluster, they belong to the parent graph
          if (edgeInCluster(edge, rootId)) {
            log.info('Copying as ', edge.v, edge.w, data, edge.name);
            newGraph.setEdge(edge.v, edge.w, data, edge.name);
            log.info('newGraph edges ', newGraph.edges(), newGraph.edge(newGraph.edges()[0]));
          } else {
            log.info(
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
          log.error(e);
        }
      });
    }
    log.debug('Removing node', node);
    if (graph.hasNode(node)) {
      graph.removeNode(node);
    } else {
      log.debug('Node already removed, skipping:', node);
    }
  });
};
export const extractDescendants = (id, graph) => {
  // log.debug('Extracting ', id);
  const children = graph.children(id);
  let res = [...children];

  for (const child of children) {
    parents.set(child, id);
    res = [...res, ...extractDescendants(child, graph)];
  }

  return res;
};

/**
 * Validates the graph, checking that all parent child relation points to existing nodes and that
 * edges between nodes also ia correct. When not correct the function logs the discrepancies.
 *
 * @param graph
 */
export const validate = (graph) => {
  const edges = graph.edges();
  log.trace('Edges: ', edges);
  for (const edge of edges) {
    if (graph.children(edge.v).length > 0) {
      log.trace('The node ', edge.v, ' is part of and edge even though it has children');
      return false;
    }
    if (graph.children(edge.w).length > 0) {
      log.trace('The node ', edge.w, ' is part of and edge even though it has children');
      return false;
    }
  }
  return true;
};

/**
 * Finds a child that is not a cluster. When faking an edge between a node and a cluster.
 *
 * @param id
 * @param {any} graph
 */
export const findNonClusterChild = (id, graph) => {
  // const node = graph.node(id);
  log.trace('Searching', id);
  // const children = graph.children(id).reverse();
  const children = graph.children(id); //.reverse();
  log.trace('Searching children of id ', id, children);
  if (children.length < 1) {
    log.trace('This is a valid node', id);
    return id;
  }
  for (const child of children) {
    const _id = findNonClusterChild(child, graph);
    if (_id) {
      log.trace('Found replacement for', id, ' => ', _id);
      return _id;
    }
  }
};

const getAnchorId = (id) => {
  if (!clusterDb.has(id)) {
    return id;
  }
  // If the cluster has no external connections
  if (!clusterDb.get(id).externalConnections) {
    return id;
  }

  // Return the replacement node
  if (clusterDb.has(id)) {
    return clusterDb.get(id).id;
  }
  return id;
};

export const adjustClustersAndEdges = (graph, depth) => {
  if (!graph || depth > 10) {
    log.debug('Opting out, no graph ');
    return;
  } else {
    log.debug('Opting in, graph ');
  }
  // Go through the nodes and for each cluster found, save a replacement node, this can be used when
  // faking a link to a cluster
  graph.nodes().forEach(function (id) {
    const children = graph.children(id);
    if (children.length > 0) {
      log.warn(
        'Cluster identified',
        id,
        ' Replacement id in edges: ',
        findNonClusterChild(id, graph)
      );
      descendants.set(id, extractDescendants(id, graph));
      clusterDb.set(id, { id: findNonClusterChild(id, graph), clusterData: graph.node(id) });
    }
  });

  // Check incoming and outgoing edges for each cluster
  graph.nodes().forEach(function (id) {
    const children = graph.children(id);
    const edges = graph.edges();
    if (children.length > 0) {
      log.debug('Cluster identified', id, descendants);
      edges.forEach((edge) => {
        // log.debug('Edge, descendants: ', edge, descendants.get(id));

        // Check if any edge leaves the cluster (not the actual cluster, that's a link from the box)
        if (edge.v !== id && edge.w !== id) {
          // Any edge where either the one of the nodes is descending to the cluster but not the other
          // if (descendants[id].indexOf(edge.v) < 0 && descendants[id].indexOf(edge.w) < 0) {

          const d1 = isDescendant(edge.v, id);
          const d2 = isDescendant(edge.w, id);

          // d1 xor d2 - if either d1 is true and d2 is false or the other way around
          if (d1 ^ d2) {
            log.warn('Edge: ', edge, ' leaves cluster ', id);
            log.warn('Descendants of XXX ', id, ': ', descendants.get(id));
            clusterDb.get(id).externalConnections = true;
          }
        }
      });
    } else {
      log.debug('Not a cluster ', id, descendants);
    }
  });

  for (let id of clusterDb.keys()) {
    const nonClusterChild = clusterDb.get(id).id;
    const parent = graph.parent(nonClusterChild);

    // Change replacement node of id to parent of current replacement node if valid
    if (parent !== id && clusterDb.has(parent) && !clusterDb.get(parent).externalConnections) {
      clusterDb.get(id).id = parent;
    }
  }

  // For clusters with incoming and/or outgoing edges translate those edges to a real node
  // in the cluster in order to fake the edge
  graph.edges().forEach(function (e) {
    const edge = graph.edge(e);
    log.warn('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    log.warn('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));

    let v = e.v;
    let w = e.w;
    // Check if link is either from or to a cluster
    log.warn(
      'Fix XXX',
      clusterDb,
      'ids:',
      e.v,
      e.w,
      'Translating: ',
      clusterDb.get(e.v),
      ' --- ',
      clusterDb.get(e.w)
    );
    if (clusterDb.get(e.v) && clusterDb.get(e.w) && clusterDb.get(e.v) === clusterDb.get(e.w)) {
      // cspell:ignore trixing
      log.warn('Fixing and trixing link to self - removing XXX', e.v, e.w, e.name);
      log.warn('Fixing and trixing - removing XXX', e.v, e.w, e.name);
      v = getAnchorId(e.v);
      w = getAnchorId(e.w);
      graph.removeEdge(e.v, e.w, e.name);
      const specialId = e.w + '---' + e.v;
      graph.setNode(specialId, {
        domId: specialId,
        id: specialId,
        labelStyle: '',
        labelText: edge.label,
        padding: 0,
        shape: 'labelRect',
        style: '',
      });
      const edge1 = structuredClone(edge);
      const edge2 = structuredClone(edge);
      edge1.label = '';
      edge1.arrowTypeEnd = 'none';
      edge2.label = '';
      edge1.fromCluster = e.v;
      edge2.toCluster = e.v;

      graph.setEdge(v, specialId, edge1, e.name + '-cyclic-special');
      graph.setEdge(specialId, w, edge2, e.name + '-cyclic-special');
    } else if (clusterDb.get(e.v) || clusterDb.get(e.w)) {
      log.warn('Fixing and trixing - removing XXX', e.v, e.w, e.name);
      v = getAnchorId(e.v);
      w = getAnchorId(e.w);
      graph.removeEdge(e.v, e.w, e.name);
      if (v !== e.v) {
        const parent = graph.parent(v);
        clusterDb.get(parent).externalConnections = true;
        edge.fromCluster = e.v;
      }
      if (w !== e.w) {
        const parent = graph.parent(w);
        clusterDb.get(parent).externalConnections = true;
        edge.toCluster = e.w;
      }
      log.warn('Fix Replacing with XXX', v, w, e.name);
      graph.setEdge(v, w, edge, e.name);
    }
  });
  log.warn('Adjusted Graph', graphlibJson.write(graph));
  extractor(graph, 0);

  log.trace(clusterDb);

  // Remove references to extracted cluster
  // graph.edges().forEach(edge => {
  //   if (isDescendant(edge.v, clusterId) || isDescendant(edge.w, clusterId)) {
  //     graph.removeEdge(edge);
  //   }
  // });
};

export const extractor = (graph, depth) => {
  log.warn('extractor - ', depth, graphlibJson.write(graph), graph.children('D'));
  if (depth > 10) {
    log.error('Bailing out');
    return;
  }
  // For clusters without incoming and/or outgoing edges, create a new cluster-node
  // containing the nodes and edges in the cluster in a new graph
  // for (let i = 0;)
  let nodes = graph.nodes();
  let hasChildren = false;
  for (const node of nodes) {
    const children = graph.children(node);
    hasChildren = hasChildren || children.length > 0;
  }

  if (!hasChildren) {
    log.debug('Done, no node has children', graph.nodes());
    return;
  }
  // const clusters = Object.keys(clusterDb);
  // clusters.forEach(clusterId => {
  log.debug('Nodes = ', nodes, depth);
  for (const node of nodes) {
    // Skip nodes that have been removed during previous extractions
    if (!graph.hasNode(node)) {
      log.debug('Node no longer exists, skipping extraction for:', node);
      continue;
    }
    log.debug(
      'Extracting node',
      node,
      clusterDb,
      clusterDb.get(node) && !clusterDb.get(node).externalConnections,
      !graph.parent(node),
      graph.node(node),
      graph.children('D'),
      ' Depth ',
      depth
    );
    // Note that the node might have been removed after the Object.keys call so better check
    // that it still is in the game
    if (!clusterDb.has(node)) {
      // Skip if the node is not a cluster
      log.debug('Not a cluster', node, depth);
      // break;
    } else if (
      !clusterDb.get(node).externalConnections &&
      // !graph.parent(node) &&
      graph.children(node) &&
      graph.children(node).length > 0
    ) {
      log.warn(
        'Cluster without external connections, without a parent and with children',
        node,
        depth
      );

      const graphSettings = graph.graph();
      let dir = graphSettings.rankdir === 'TB' ? 'LR' : 'TB';
      const clusterMeta = clusterDb.get(node);
      if (clusterMeta?.clusterData?.dir) {
        dir = clusterMeta.clusterData.dir;
        log.warn('Fixing dir', clusterMeta.clusterData.dir, dir);
      }

      const clusterGraph = new graphlib.Graph({
        multigraph: true,
        compound: true,
      })
        .setGraph({
          rankdir: dir, // Todo: set proper spacing
          nodesep: 50,
          ranksep: 50,
          marginx: 8,
          marginy: 8,
        })
        .setDefaultEdgeLabel(function () {
          return {};
        });

      log.warn('Old graph before copy', graphlibJson.write(graph));
      copy(node, graph, clusterGraph, node);

      // When a subgraph cluster that has an explicitly declared direction
      // contains no edges, Dagre places all nodes in a single rank and lays
      // them out along the cross-axis of that rankdir (e.g. `direction LR`
      // produces a vertical column). To honour the user's declared direction
      // we inject temporary, layout-only ordering edges (A → B → C → D …) that
      // force Dagre to distribute the nodes across separate ranks. The edges
      // are marked with `_virtual: true` so they can be stripped out in the
      // rendering phase before any SVG paths are drawn.
      if (clusterMeta?.clusterData?.dir && clusterGraph.edges().length === 0) {
        const clusterNodes = clusterGraph.nodes();
        log.warn('Cluster has no edges, adding virtual ordering edges for layout', clusterNodes);
        for (let i = 0; i < clusterNodes.length - 1; i++) {
          clusterGraph.setEdge(clusterNodes[i], clusterNodes[i + 1], {
            _virtual: true,
            weight: 0,
            minlen: 1,
          });
        }
      }

      const existingNodeData = graph.node(node) || {};
      graph.setNode(node, {
        ...existingNodeData,
        clusterNode: true,
        clusterData: clusterMeta.clusterData,
        graph: clusterGraph,
      });
      log.warn('New graph after copy node: (', node, ')', graphlibJson.write(clusterGraph));
      log.debug('Old graph after copy', graphlibJson.write(graph));
    } else {
      log.warn(
        'Cluster ** ',
        node,
        ' **not meeting the criteria !externalConnections:',
        !clusterDb.get(node).externalConnections,
        ' no parent: ',
        !graph.parent(node),
        ' children ',
        graph.children(node) && graph.children(node).length > 0,
        graph.children('D'),
        depth
      );
      log.debug(clusterDb);
    }
  }

  nodes = graph.nodes();
  log.warn('New list of nodes', nodes);
  for (const node of nodes) {
    const data = graph.node(node);
    log.warn(' Now next level', node, data);
    if (data.clusterNode) {
      extractor(data.graph, depth + 1);
    }
  }
};

const sorter = (graph, nodes) => {
  if (nodes.length === 0) {
    return [];
  }
  let result = Object.assign(nodes);
  nodes.forEach((node) => {
    const children = graph.children(node);
    const sorted = sorter(graph, children);
    result = [...result, ...sorted];
  });

  return result;
};

export const sortNodesByHierarchy = (graph) => sorter(graph, graph.children());
