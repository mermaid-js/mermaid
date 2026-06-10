/** Decorates with functions required by mermaids dagre-wrapper. */
import { log } from '../../../logger.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import type { EdgeObj } from 'dagre-d3-es/src/graphlib/graph.js';
import * as graphlibJson from 'dagre-d3-es/src/graphlib/json.js';
import { requiredGet } from '../../../utils/guards.js';
import type { Node } from '../../types.js';

export interface ClusterDbEntry {
  id?: string;
  clusterData?: Node;
  externalConnections?: boolean;
  node?: Node;
  label?: string;
}

export const clusterDb = new Map<string, ClusterDbEntry>();
const descendants = new Map<string, string[]>();
const parents = new Map<string, string>();

export const clear = () => {
  descendants.clear();
  parents.clear();
  clusterDb.clear();
};

const isDescendant = (id: string, ancestorId: string) => {
  const ancestorDescendants = descendants.get(ancestorId) || [];
  log.trace('In isDescendant', ancestorId, ' ', id, ' = ', ancestorDescendants.includes(id));
  return ancestorDescendants.includes(id);
};

const edgeInCluster = (edge: EdgeObj, clusterId: string) => {
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

const copy = (
  clusterId: string,
  graph: graphlib.Graph,
  newGraph: graphlib.Graph,
  rootId: string
) => {
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
    if ((graph.children(node) ?? []).length > 0) {
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
      // @ts-expect-error -- graphlib's edges() takes no arguments; the argument has always been ignored at runtime.
      const edges = graph.edges(node);
      log.debug('Copying Edges', edges);
      edges.forEach((edge) => {
        log.info('Edge', edge);
        const data = graph.edge(edge.v, edge.w, edge.name);
        log.info('Edge data', data, rootId);
        try {
          if (edgeInCluster(edge, rootId)) {
            // Determine whether BOTH endpoints are strictly inside the cluster.
            // edgeInCluster uses OR logic (either endpoint inside), so a
            // cross-boundary edge (one endpoint outside rootId) also passes.
            // Copying such an edge into newGraph would auto-create the external
            // node as an orphan with no layout data, crashing the renderer.
            // Instead, rebind cross-boundary edges in the outer graph as
            //   rootId → externalNode
            // so the connection is preserved after the leaf is removed.
            const rootDescendants = descendants.get(rootId) || [];
            const vIn =
              rootDescendants.includes(edge.v) || isDescendant(edge.v, rootId) || edge.v === rootId;
            const wIn =
              rootDescendants.includes(edge.w) || isDescendant(edge.w, rootId) || edge.w === rootId;
            if (vIn && wIn) {
              log.info('Copying as ', edge.v, edge.w, data, edge.name);
              newGraph.setEdge(edge.v, edge.w, data, edge.name);
              log.info('newGraph edges ', newGraph.edges(), newGraph.edge(newGraph.edges()[0]));
            } else {
              // Cross-boundary: rebind to the cluster root in the outer graph.
              const newV = vIn ? rootId : edge.v;
              const newW = wIn ? rootId : edge.w;
              log.info('Rebinding cross-boundary edge as ', newV, newW, data, edge.name);
              graph.setEdge(newV, newW, data, edge.name);
            }
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

export const extractDescendants = (id: string, graph: graphlib.Graph): string[] => {
  const children = graph.children(id) ?? [];
  let res = [...children];

  for (const child of children) {
    parents.set(child, id);
    res = [...res, ...extractDescendants(child, graph)];
  }

  return res;
};

export const validate = (graph: graphlib.Graph) => {
  const edges = graph.edges();
  log.trace('Edges: ', edges);
  for (const edge of edges) {
    if ((graph.children(edge.v) ?? []).length > 0) {
      log.trace('The node ', edge.v, ' is part of and edge even though it has children');
      return false;
    }
    if ((graph.children(edge.w) ?? []).length > 0) {
      log.trace('The node ', edge.w, ' is part of and edge even though it has children');
      return false;
    }
  }
  return true;
};

const findCommonEdges = (
  graph: graphlib.Graph,
  id1: string | undefined,
  id2: string | undefined
) => {
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

export const findNonClusterChild = (
  id: string,
  graph: graphlib.Graph,
  clusterId?: string
): string | undefined => {
  const children = graph.children(id) ?? [];
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

const getAnchorId = (id: string): string => {
  const entry = clusterDb.get(id);
  if (!entry?.externalConnections) {
    return id;
  }
  // Anchor onto the recorded non-cluster child; fall back to the cluster id
  // itself when no anchor was found.
  return entry.id ?? id;
};

export const adjustClustersAndEdges = (graph: graphlib.Graph, depth = 0) => {
  if (!graph || depth > 10) {
    log.debug('Opting out, no graph ');
    return;
  } else {
    log.debug('Opting in, graph ');
  }

  graph.nodes().forEach(function (id) {
    const children = graph.children(id) ?? [];
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
    const children = graph.children(id) ?? [];
    const edges = graph.edges();
    if (children.length > 0) {
      log.debug('Cluster identified', id, descendants);
      edges.forEach((edge) => {
        const d1 = isDescendant(edge.v, id);
        const d2 = isDescendant(edge.w, id);

        if (d1 !== d2) {
          log.warn('Edge: ', edge, ' leaves cluster ', id);
          log.warn('Descendants of XXX ', id, ': ', descendants.get(id));
          requiredGet(clusterDb, id, 'cluster entry').externalConnections = true;
        }
      });
    } else {
      log.debug('Not a cluster ', id, descendants);
    }
  });

  for (const [id, entry] of clusterDb.entries()) {
    const nonClusterChild = entry.id;
    const parent = nonClusterChild ? graph.parent(nonClusterChild) : undefined;

    if (
      parent !== undefined &&
      parent !== id &&
      clusterDb.has(parent) &&
      !requiredGet(clusterDb, parent, 'cluster entry').externalConnections
    ) {
      entry.id = parent;
    }
    // When this cluster has a direct outgoing edge AND its current anchor sits inside
    // a sibling subgraph that will be extracted (collapsed into a clusterNode), the
    // anchor will disappear by render time and the edge endpoint becomes undefined.
    // Re-anchor onto a node that survives extraction.
    const hasDirectOutgoingEdge = graph.edges().some((edge) => edge.v === id);
    if (
      nonClusterChild &&
      entry.externalConnections &&
      hasDirectOutgoingEdge &&
      isNodeInExtractableCluster(graph, nonClusterChild, id)
    ) {
      const safeAnchor = findSafeAnchorNode(graph, id, graph.parent(nonClusterChild));
      if (safeAnchor) {
        entry.id = safeAnchor;
      }
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
        // A rebound anchor always lives inside a registered cluster.
        const parent = graph.parent(v)!;
        requiredGet(clusterDb, parent, 'cluster entry').externalConnections = true;
        edge.fromCluster = e.v;
      }
      if (w !== e.w) {
        // A rebound anchor always lives inside a registered cluster.
        const parent = graph.parent(w)!;
        requiredGet(clusterDb, parent, 'cluster entry').externalConnections = true;
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

export const extractor = (graph: graphlib.Graph, depth: number) => {
  log.warn('extractor - ', depth, graphlibJson.write(graph), graph.children('D'));
  if (depth > 10) {
    log.error('Bailing out');
    return;
  }
  let nodes = graph.nodes();
  let hasChildren = false;
  for (const node of nodes) {
    const children = graph.children(node) ?? [];
    hasChildren = hasChildren || children.length > 0;
  }

  if (!hasChildren) {
    log.debug('Done, no node has children', graph.nodes());
    return;
  }
  log.debug('Nodes = ', nodes, depth);
  for (const node of nodes) {
    const entry = clusterDb.get(node);
    log.debug(
      'Extracting node',
      node,
      clusterDb,
      entry !== undefined && !entry.externalConnections,
      !graph.parent(node),
      graph.node(node),
      graph.children('D'),
      ' Depth ',
      depth
    );
    if (!entry) {
      log.debug('Not a cluster', node, depth);
    } else if (entry.clusterData?.explicitDir && (graph.children(node)?.length ?? 0) > 0) {
      // Cluster with an explicit direction keyword — always create a subgraph,
      // even when it has external connections (fixes issue #4648).
      log.warn('Cluster with explicit dir, creating subgraph for children', node, depth);

      const dir = entry.clusterData.dir;
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

      // Copy the cluster (and any nested sub-clusters) into the subgraph
      copy(node, graph, clusterGraph, node);
      // Attach the subgraph to the cluster node for internal layout
      const clusterNodeData = graph.node(node) || {};
      graph.setNode(node, {
        ...clusterNodeData,
        clusterNode: true,
        id: node,
        clusterData: entry.clusterData,
        label: entry.label,
        graph: clusterGraph,
      });
      log.warn(
        'Subgraph for cluster with explicit dir created:',
        node,
        graphlibJson.write(clusterGraph)
      );
    } else if (!entry.externalConnections && (graph.children(node)?.length ?? 0) > 0) {
      // Original behaviour: cluster without external connections gets its own sub-graph.
      log.warn(
        'Cluster without external connections, without a parent and with children',
        node,
        depth
      );

      const graphSettings = graph.graph();
      let dir = graphSettings.rankdir === 'TB' ? 'LR' : 'TB';
      const clusterDir = entry.clusterData?.dir;
      if (clusterDir) {
        dir = clusterDir;
        log.warn('Fixing dir', clusterDir, dir);
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

      copy(node, graph, clusterGraph, node);
      const clusterNodeData = graph.node(node) || {};
      graph.setNode(node, {
        ...clusterNodeData,
        clusterNode: true,
        id: node,
        clusterData: entry.clusterData,
        label: entry.label,
        graph: clusterGraph,
      });
      log.debug('Old graph after copy', graphlibJson.write(graph));
    } else {
      log.warn(
        'Cluster ** ',
        node,
        ' **not meeting the criteria !externalConnections:',
        !entry.externalConnections,
        ' no parent: ',
        !graph.parent(node),
        ' children ',
        (graph.children(node)?.length ?? 0) > 0,
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

const sorter = (graph: graphlib.Graph, nodes: string[]): string[] => {
  if (nodes.length === 0) {
    return [];
  }
  let result: string[] = Object.assign([], nodes);
  nodes.forEach((node) => {
    const children = graph.children(node) ?? [];
    const sorted = sorter(graph, children);
    result = [...result, ...sorted];
  });

  return result;
};

export const sortNodesByHierarchy = (graph: graphlib.Graph) =>
  sorter(graph, graph.children() ?? []);

/** Checks if a node is inside a cluster that will be extracted (has no external connections). */
const isNodeInExtractableCluster = (graph: graphlib.Graph, node: string, rootId: string) => {
  let parent = graph.parent(node);

  while (parent && parent !== rootId) {
    const cluster = clusterDb.get(parent);
    if (cluster && !cluster.externalConnections) {
      return true;
    }
    parent = graph.parent(parent);
  }

  return false;
};

/** Finds an alternative anchor node for a cluster that is not inside an extractable cluster. */
const findSafeAnchorNode = (
  graph: graphlib.Graph,
  clusterId: string,
  excludedCluster: string | undefined
) => {
  const children = graph.children(clusterId) ?? [];

  for (const child of children) {
    if (
      child === excludedCluster ||
      (excludedCluster !== undefined && isDescendant(child, excludedCluster))
    ) {
      continue;
    }

    // findNonClusterChild returns the leaf itself when child is a leaf, or drills
    // into a subgraph to find a non-cluster descendant. A returned leaf sibling is
    // a perfectly valid anchor — only skip when the lookup found nothing usable.
    const candidate = findNonClusterChild(child, graph, clusterId);
    if (!candidate) {
      continue;
    }

    if (!isNodeInExtractableCluster(graph, candidate, clusterId)) {
      return candidate;
    }
  }

  return null;
};
