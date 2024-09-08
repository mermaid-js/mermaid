/** Decorates with functions required by mermaids dagre-wrapper. */
import { log } from '../../../logger.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import * as graphlibJson from 'dagre-d3-es/src/graphlib/json.js';

export let clusterDb = new Map();
let descendants = new Map();
let parents = new Map();

export const clear = () => {
  descendants.clear();
  parents.clear();
  clusterDb.clear();
};

const isDescendant = (id, ancestorId) => {
  const ancestorDescendants = descendants.get(ancestorId) || [];
  log.trace('In isDescendant', ancestorId, ' ', id, ' = ', ancestorDescendants.includes(id));
  return ancestorDescendants.includes(id);
};

const edgeInCluster = (edge, clusterId) => {
  const clusterDescendants = descendants.get(clusterId) || [];
  log.info('Descendants of ', clusterId, ' is ', clusterDescendants);
  log.info('Edge is ', edge);
  if (edge.v === clusterId || edge.w === clusterId) {
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

  if (clusterId !== rootId) {
    nodes.push(clusterId);
  }

  log.warn('Copying (nodes) clusterId', clusterId, 'nodes', nodes);

  nodes.forEach((node) => {
    if (graph.children(node).length > 0) {
      copy(node, graph, newGraph, rootId);
    } else {
      const data = graph.node(node);
      log.info('cp ', node, ' to ', rootId, ' with parent ', clusterId);
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
    graph.removeNode(node);
  });
};

export const extractDescendants = (id, graph) => {
  const children = graph.children(id);
  let res = [...children];

  for (const child of children) {
    parents.set(child, id);
    res = [...res, ...extractDescendants(child, graph)];
  }

  return res;
};

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

const findCommonEdges = (graph, id1, id2) => {
  const edges1 = graph.edges().filter((edge) => edge.v === id1 || edge.w === id1);
  const edges2 = graph.edges().filter((edge) => edge.v === id2 || edge.w === id2);
  const edges1Prim = edges1.map((edge) => {
    return { v: edge.v === id1 ? id2 : edge.v, w: edge.w === id1 ? id1 : edge.w };
  });
  const edges2Prim = edges2.map((edge) => {
    return { v: edge.v, w: edge.w };
  });
  const result = edges1Prim.filter((edgeIn1) => {
    return edges2Prim.some((edge) => edgeIn1.v === edge.v && edgeIn1.w === edge.w);
  });

  return result;
};

export const findNonClusterChild = (id, graph, clusterId) => {
  const children = graph.children(id);
  log.trace('Searching children of id ', id, children);
  if (children.length < 1) {
    return id;
  }
  let reserve;
  for (const child of children) {
    const _id = findNonClusterChild(child, graph, clusterId);

    const commonEdges = findCommonEdges(graph, clusterId, _id);

    if (_id) {
      if (commonEdges.length > 0) {
        reserve = _id;
      } else {
        return _id;
      }
    }
  }
  return reserve;
};

const getAnchorId = (id) => {
  if (!clusterDb.has(id)) {
    return id;
  }
  if (!clusterDb.get(id).externalConnections) {
    return id;
  }

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

  graph.nodes().forEach(function (id) {
    const children = graph.children(id);
    if (children.length > 0) {
      log.warn(
        'Cluster identified',
        id,
        ' Replacement id in edges: ',
        findNonClusterChild(id, graph, id)
      );
      descendants.set(id, extractDescendants(id, graph));
      clusterDb.set(id, { id: findNonClusterChild(id, graph, id), clusterData: graph.node(id) });
    }
  });

  graph.nodes().forEach(function (id) {
    const children = graph.children(id);
    const edges = graph.edges();
    if (children.length > 0) {
      log.debug('Cluster identified', id, descendants);
      edges.forEach((edge) => {
        const d1 = isDescendant(edge.v, id);
        const d2 = isDescendant(edge.w, id);

        if (d1 ^ d2) {
          log.warn('Edge: ', edge, ' leaves cluster ', id);
          log.warn('Descendants of XXX ', id, ': ', descendants.get(id));
          clusterDb.get(id).externalConnections = true;
        }
      });
    } else {
      log.debug('Not a cluster ', id, descendants);
    }
  });

  for (let id of clusterDb.keys()) {
    const nonClusterChild = clusterDb.get(id).id;
    const parent = graph.parent(nonClusterChild);

    if (parent !== id && clusterDb.has(parent) && !clusterDb.get(parent).externalConnections) {
      clusterDb.get(id).id = parent;
    }
  }

  graph.edges().forEach(function (e) {
    const edge = graph.edge(e);
    log.warn('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    log.warn('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));

    let v = e.v;
    let w = e.w;
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
    if (clusterDb.get(e.v) || clusterDb.get(e.w)) {
      log.warn('Fixing and trying - removing XXX', e.v, e.w, e.name);
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
};

export const extractor = (graph, depth) => {
  log.warn('extractor - ', depth, graphlibJson.write(graph), graph.children('D'));
  if (depth > 10) {
    log.error('Bailing out');
    return;
  }
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
  log.debug('Nodes = ', nodes, depth);
  for (const node of nodes) {
    log.debug(
      'Extracting node',
      node,
      clusterDb,
      clusterDb.has(node) && !clusterDb.get(node).externalConnections,
      !graph.parent(node),
      graph.node(node),
      graph.children('D'),
      ' Depth ',
      depth
    );
    if (!clusterDb.has(node)) {
      log.debug('Not a cluster', node, depth);
    } else if (
      !clusterDb.get(node).externalConnections &&
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
      if (clusterDb.get(node)?.clusterData?.dir) {
        dir = clusterDb.get(node).clusterData.dir;
        log.warn('Fixing dir', clusterDb.get(node).clusterData.dir, dir);
      }

      const clusterGraph = new graphlib.Graph({
        multigraph: true,
        compound: true,
      })
        .setGraph({
          rankdir: dir,
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
      graph.setNode(node, {
        clusterNode: true,
        id: node,
        clusterData: clusterDb.get(node).clusterData,
        label: clusterDb.get(node).label,
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
    if (data?.clusterNode) {
      extractor(data.graph, depth + 1);
    }
  }
};

const sorter = (graph, nodes) => {
  if (nodes.length === 0) {
    return [];
  }
  let result = Object.assign([], nodes);
  nodes.forEach((node) => {
    const children = graph.children(node);
    const sorted = sorter(graph, children);
    result = [...result, ...sorted];
  });

  return result;
};

export const sortNodesByHierarchy = (graph) => sorter(graph, graph.children());
