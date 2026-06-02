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
import { log } from '../../../logger.js';
import { getSubGraphTitleMargins } from '../../../utils/subGraphTitleMargins.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getDefaultSelfLoopSide = (rankdir = 'TB') => {
  switch (rankdir) {
    case 'BT':
      return 'bottom';
    case 'LR':
      return 'right';
    case 'RL':
      return 'left';
    case 'TB':
    default:
      return 'top';
  }
};

// Class diagrams also use dagre, but self-referential multiplicity labels rely on
// the existing segmented self-loop rendering path for terminal label placement.
const shouldMergeSelfLoopSegments = (diagramType) =>
  diagramType === 'flowchart' || diagramType === 'flowchart-v2' || diagramType === 'stateDiagram';

// Use dagre's dummy self-loop placement as a hint, so loops are not always forced above the node.
const getSelfLoopSide = (graph, node, segments, originalNodeId, rankdir) => {
  const layoutHints = [];
  const dummyNodeIds = new Set();

  segments.forEach(({ start, end }) => {
    if (start !== originalNodeId) {
      dummyNodeIds.add(start);
    }
    if (end !== originalNodeId) {
      dummyNodeIds.add(end);
    }
  });

  dummyNodeIds.forEach((id) => {
    const dummyNode = graph.node(id);
    if (typeof dummyNode?.x === 'number' && typeof dummyNode?.y === 'number') {
      layoutHints.push(dummyNode);
    }
  });

  if (layoutHints.length === 0) {
    segments.forEach(({ edge }) => {
      (edge.points ?? []).forEach((point) => {
        if (typeof point?.x === 'number' && typeof point?.y === 'number') {
          layoutHints.push(point);
        }
      });
    });
  }

  if (layoutHints.length === 0) {
    return getDefaultSelfLoopSide(rankdir);
  }

  const center = layoutHints.reduce(
    (acc, point) => ({
      x: acc.x + point.x / layoutHints.length,
      y: acc.y + point.y / layoutHints.length,
    }),
    { x: 0, y: 0 }
  );
  const dx = center.x - node.x;
  const dy = center.y - node.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  if (Math.abs(dy) > 0) {
    return dy > 0 ? 'bottom' : 'top';
  }
  return getDefaultSelfLoopSide(rankdir);
};

// Build a compact loop around the node instead of rendering dagre's long dummy-edge route.
const getSelfLoopPoints = (node, side = 'top', yOffset = 0, labelWidth = 0) => {
  const x = node.x;
  const y = node.y - yOffset;
  const halfWidth = node.width / 2;
  const halfHeight = node.height / 2;
  const maxSpan = Math.max(36, Math.min(100, node.width * 0.8));
  const span = clamp(Math.max(labelWidth, node.width * 0.35), 36, maxSpan);
  const depth = clamp(Math.min(node.width, node.height) * 0.45, 24, 48);

  switch (side) {
    case 'bottom': {
      const bottom = y + halfHeight;
      return [
        { x: x - span / 2, y: bottom },
        { x: x - span / 2, y: bottom + depth },
        { x: x + span / 2, y: bottom + depth },
        { x: x + span / 2, y: bottom },
      ];
    }
    case 'right': {
      const right = x + halfWidth;
      return [
        { x: right, y: y - span / 2 },
        { x: right + depth, y: y - span / 2 },
        { x: right + depth, y: y + span / 2 },
        { x: right, y: y + span / 2 },
      ];
    }
    case 'left': {
      const left = x - halfWidth;
      return [
        { x: left, y: y - span / 2 },
        { x: left - depth, y: y - span / 2 },
        { x: left - depth, y: y + span / 2 },
        { x: left, y: y + span / 2 },
      ];
    }
    case 'top':
    default: {
      const top = y - halfHeight;
      return [
        { x: x - span / 2, y: top },
        { x: x - span / 2, y: top - depth },
        { x: x + span / 2, y: top - depth },
        { x: x + span / 2, y: top },
      ];
    }
  }
};

const getSelfLoopLabelPosition = (node, points, side = 'top', yOffset = 0, label = {}) => {
  const gap = 4;
  const x = node.x;
  const y = node.y - yOffset;
  const labelWidth = label.width ?? 0;
  const labelHeight = label.height ?? 0;

  switch (side) {
    case 'bottom':
      return { x, y: Math.max(...points.map((point) => point.y)) + labelHeight / 2 + gap };
    case 'right':
      return { x: Math.max(...points.map((point) => point.x)) + labelWidth / 2 + gap, y };
    case 'left':
      return { x: Math.min(...points.map((point) => point.x)) - labelWidth / 2 - gap, y };
    case 'top':
    default:
      return { x, y: Math.min(...points.map((point) => point.y)) - labelHeight / 2 - gap };
  }
};

// Convert internal dagre layout edges into the public SVG edges we actually render.
export const getEdgesToRender = (graph, yOffset = 0, { mergeSelfLoops = true } = {}) => {
  const selfLoopEdgeGroups = new Map();
  const edgesToRender = [];
  const rankdir = graph.graph()?.rankdir;

  graph.edges().forEach((e) => {
    const edge = graph.edge(e);
    if (mergeSelfLoops && edge.selfLoop) {
      const key = edge.selfLoop.id;
      if (!selfLoopEdgeGroups.has(key)) {
        selfLoopEdgeGroups.set(key, []);
      }
      selfLoopEdgeGroups.get(key).push({ edge, start: e.v, end: e.w });
    } else {
      edgesToRender.push({ edge, start: e.v, end: e.w });
    }
  });

  selfLoopEdgeGroups.forEach((segments) => {
    if (segments.length !== 3) {
      // Unexpected self-loop state: preserve the old rendering behavior rather than dropping edges.
      segments.forEach((segment) => edgesToRender.push(segment));
      return;
    }

    segments.sort((a, b) => a.edge.selfLoop.order - b.edge.selfLoop.order);
    const [firstSegment, middleSegment, lastSegment] = segments;
    const originalEdge =
      firstSegment.edge.originalEdge ??
      middleSegment.edge.originalEdge ??
      lastSegment.edge.originalEdge ??
      middleSegment.edge;
    const node = graph.node(originalEdge.start);
    if (!node) {
      segments.forEach((segment) => edgesToRender.push(segment));
      return;
    }
    const label = {
      width: middleSegment.edge.width,
      height: middleSegment.edge.height,
    };
    // Dagre uses the dummy route for layout; the SVG output should still be one logical edge.
    const side = getSelfLoopSide(graph, node, segments, originalEdge.start, rankdir);
    const points = getSelfLoopPoints(node, side, yOffset, label.width ?? 0);
    const labelPosition = getSelfLoopLabelPosition(node, points, side, yOffset, label);
    const mergedEdge = {
      ...middleSegment.edge,
      ...originalEdge,
      id: originalEdge.id,
      points,
      start: originalEdge.start,
      end: originalEdge.end,
      x: labelPosition.x,
      y: labelPosition.y,
      width: label.width,
      height: label.height,
      labelStyle: middleSegment.edge.labelStyle,
      fromCluster:
        firstSegment.edge.fromCluster ??
        middleSegment.edge.fromCluster ??
        lastSegment.edge.fromCluster,
      toCluster:
        firstSegment.edge.toCluster ?? middleSegment.edge.toCluster ?? lastSegment.edge.toCluster,
    };
    delete mergedEdge.selfLoop;
    delete mergedEdge.originalEdge;

    edgesToRender.push({ edge: mergedEdge, start: mergedEdge.start, end: mergedEdge.end });
  });

  return edgesToRender;
};

const recursiveRender = async (_elem, graph, diagramType, id, parentCluster, siteConfig) => {
  log.warn('Graph in recursive render:XAX', graphlibJson.write(graph), parentCluster);
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
  const mergeSelfLoops = shouldMergeSelfLoopSegments(diagramType);

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
      if (node?.clusterNode) {
        // const children = graph.children(v);
        log.info('Cluster identified XBX', v, node.width, graph.node(v));

        // `node.graph.setGraph` applies the graph configurations such as nodeSpacing to subgraphs as without this the default values would be used
        // We override only the `ranksep` and `nodesep` configurations to allow for setting subgraph spacing while avoiding overriding other properties
        const { ranksep, nodesep } = graph.graph();
        node.graph.setGraph({
          ...node.graph.graph(),
          ranksep: ranksep + 25,
          nodesep,
        });

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
        // node.height = o.diff;
        node.diff = o.diff || 0;
        log.info(
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
          log.trace(
            'Cluster - the non recursive path XBX',
            v,
            node.id,
            node,
            node.width,
            'Graph:',
            graph
          );
          log.trace(findNonClusterChild(node.id, graph));
          clusterDb.set(node.id, { id: findNonClusterChild(node.id, graph), node });
          // insertCluster(clusters, graph.node(v));
        } else {
          log.trace('Node - the non recursive path XAX', v, nodes, graph.node(v), dir);
          await insertNode(nodes, graph.node(v), { config: siteConfig, dir });
        }
      }
    })
  );

  const processEdges = async () => {
    const edgePromises = graph.edges().map(async function (e) {
      const edge = graph.edge(e.v, e.w, e.name);
      log.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
      log.info('Edge ' + e.v + ' -> ' + e.w + ': ', e, ' ', JSON.stringify(graph.edge(e)));

      // Check if link is either from or to a cluster
      log.info(
        'Fix',
        clusterDb,
        'ids:',
        e.v,
        e.w,
        'Translating: ',
        clusterDb.get(e.v),
        clusterDb.get(e.w)
      );
      if (mergeSelfLoops && edge.selfLoop) {
        // Only the middle layout segment owns the label, using the original edge id for lookup.
        if (edge.selfLoop.order !== 1) {
          return;
        }
        const segmentId = edge.id;
        edge.id = edge.selfLoop.id;
        await insertEdgeLabel(edgeLabels, edge);
        edge.id = segmentId;
        return;
      }
      await insertEdgeLabel(edgeLabels, edge);
    });

    await Promise.all(edgePromises);
  };

  await processEdges();

  log.info('Graph before layout:', JSON.stringify(graphlibJson.write(graph)));

  log.info('############################################# XXX');
  log.info('###                Layout                 ### XXX');
  log.info('############################################# XXX');

  dagreLayout(graph);

  log.info('Graph after layout:', JSON.stringify(graphlibJson.write(graph)));
  // Move the nodes to the correct place
  let diff = 0;
  let { subGraphTitleTotalMargin } = getSubGraphTitleMargins(siteConfig);
  await Promise.all(
    sortNodesByHierarchy(graph).map(async function (v) {
      const node = graph.node(v);
      log.info(
        'Position XBX => ' + v + ': (' + node.x,
        ',' + node.y,
        ') width: ',
        node.width,
        ' height: ',
        node.height
      );
      if (node?.clusterNode) {
        // Adjust for padding when on root level
        node.y += subGraphTitleTotalMargin;

        log.info(
          'A tainted cluster node XBX1',
          v,
          node.id,
          node.width,
          node.height,
          node.x,
          node.y,
          graph.parent(v)
        );
        clusterDb.get(node.id).node = node;
        positionNode(node);
      } else {
        // A tainted cluster node
        if (graph.children(v).length > 0) {
          log.info(
            'A pure cluster node XBX1',
            v,
            node.id,
            node.x,
            node.y,
            node.width,
            node.height,
            graph.parent(v)
          );
          node.height += subGraphTitleTotalMargin;
          graph.node(node.parentId);
          const halfPadding = node?.padding / 2 || 0;
          const labelHeight = node?.labelBBox?.height || 0;
          const offsetY = labelHeight - halfPadding || 0;
          log.debug('OffsetY', offsetY, 'labelHeight', labelHeight, 'halfPadding', halfPadding);
          await insertCluster(clusters, node);

          // A cluster in the non-recursive way
          clusterDb.get(node.id).node = node;
        } else {
          // Regular node
          const parent = graph.node(node.parentId);
          node.y += subGraphTitleTotalMargin / 2;
          log.info(
            'A regular node XBX1 - using the padding',
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
            parent?.offsetY,
            node
          );

          positionNode(node);
        }
      }
    })
  );

  // Move the edge labels to the correct place after layout
  const edgeOffsetY = subGraphTitleTotalMargin / 2;
  const edgesToRender = getEdgesToRender(graph, edgeOffsetY, { mergeSelfLoops });

  edgesToRender.forEach(function ({ edge, start, end }) {
    log.info('Edge ' + start + ' -> ' + end + ': ' + JSON.stringify(edge), edge);

    edge.points.forEach((point) => (point.y += edgeOffsetY));
    const startNode = graph.node(start);
    const endNode = graph.node(end);
    const paths = insertEdge(edgePaths, edge, clusterDb, diagramType, startNode, endNode, id);
    positionEdgeLabel(edge, paths);
  });

  graph.nodes().forEach(function (v) {
    const n = graph.node(v);
    log.info(v, n.type, n.diff);
    if (n.isGroup) {
      diff = n.diff;
    }
  });
  log.warn('Returning from recursive render XAX', elem, diff);
  return { elem, diff };
};

export const render = async (data4Layout, svg) => {
  const graph = new graphlib.Graph({
    multigraph: true,
    compound: true,
  })
    .setGraph({
      rankdir: data4Layout.direction,
      nodesep:
        data4Layout.config?.nodeSpacing ||
        data4Layout.config?.flowchart?.nodeSpacing ||
        data4Layout.nodeSpacing,
      ranksep:
        data4Layout.config?.rankSpacing ||
        data4Layout.config?.flowchart?.rankSpacing ||
        data4Layout.rankSpacing,
      marginx: 8,
      marginy: 8,
    })
    .setDefaultEdgeLabel(function () {
      return {};
    });
  const element = svg.select('g');
  insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);
  clearNodes();
  clearEdges();
  clearClusters();
  clearGraphlib();

  data4Layout.nodes.forEach((node) => {
    graph.setNode(node.id, { ...node });
    if (node.parentId) {
      graph.setParent(node.id, node.parentId);
    }
  });

  log.debug('Edges:', data4Layout.edges);
  data4Layout.edges.forEach((edge) => {
    if (edge.start === edge.end) {
      // Keep the dagre dummy-node workaround for layout, then merge these segments before rendering.
      const nodeId = edge.start;
      const specialId1 = nodeId + '---' + nodeId + '---1';
      const specialId2 = nodeId + '---' + nodeId + '---2';
      const node = graph.node(nodeId);
      graph.setNode(specialId1, {
        domId: specialId1,
        id: specialId1,
        parentId: node.parentId,
        labelStyle: '',
        label: '',
        padding: 0,
        shape: 'labelRect',
        // shape: 'rect',
        style: '',
        width: 10,
        height: 10,
      });
      graph.setParent(specialId1, node.parentId);
      graph.setNode(specialId2, {
        domId: specialId2,
        id: specialId2,
        parentId: node.parentId,
        labelStyle: '',
        padding: 0,
        // shape: 'rect',
        shape: 'labelRect',
        label: '',
        style: '',
        width: 10,
        height: 10,
      });
      graph.setParent(specialId2, node.parentId);

      const originalEdge = structuredClone(edge);
      const edge1 = structuredClone(edge);
      const edgeMid = structuredClone(edge);
      const edge2 = structuredClone(edge);
      // Preserve the original edge so the final SVG path uses the logical self-loop id and data.
      edge1.originalEdge = originalEdge;
      edge1.selfLoop = { id: originalEdge.id, order: 0 };
      edgeMid.originalEdge = originalEdge;
      edgeMid.selfLoop = { id: originalEdge.id, order: 1 };
      edge2.originalEdge = originalEdge;
      edge2.selfLoop = { id: originalEdge.id, order: 2 };
      edge1.label = '';
      edge1.arrowTypeEnd = 'none';
      edge1.endLabelLeft = '';
      edge1.endLabelRight = ''; // defensive
      edge1.startLabelLeft = ''; // defensive
      edge1.id = nodeId + '-cyclic-special-1';
      edgeMid.startLabelRight = '';
      edgeMid.startLabelLeft = ''; // defensive
      edgeMid.endLabelLeft = '';
      edgeMid.endLabelRight = ''; // defensive
      edgeMid.arrowTypeStart = 'none';
      edgeMid.arrowTypeEnd = 'none';
      edgeMid.id = nodeId + '-cyclic-special-mid';
      edge2.label = '';
      edge2.startLabelRight = '';
      edge2.startLabelLeft = ''; // defensive
      edge2.arrowTypeStart = 'none';
      if (node.isGroup) {
        edge1.fromCluster = nodeId;
        edge2.toCluster = nodeId;
      }
      edge2.id = nodeId + '-cyclic-special-2';
      edge2.arrowTypeStart = 'none';
      graph.setEdge(nodeId, specialId1, edge1, nodeId + '-cyclic-special-0');
      graph.setEdge(specialId1, specialId2, edgeMid, nodeId + '-cyclic-special-1');
      graph.setEdge(specialId2, nodeId, edge2, nodeId + '-cyclic-special-2');
    } else {
      graph.setEdge(edge.start, edge.end, { ...edge }, edge.id);
    }
  });

  log.warn('Graph at first:', JSON.stringify(graphlibJson.write(graph)));
  adjustClustersAndEdges(graph);
  log.warn('Graph after XAX:', JSON.stringify(graphlibJson.write(graph)));
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
