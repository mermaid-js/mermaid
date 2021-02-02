import dagre from 'dagre';
import graphlib from 'graphlib';
import insertMarkers from './markers';
import { updateNodeBounds } from './shapes/util';
import {
  clear as clearGraphlib,
  clusterDb,
  adjustClustersAndEdges,
  findNonClusterChild,
  sortNodesByHierarchy
} from './mermaid-graphlib';
import { insertNode, positionNode, clear as clearNodes, setNodeElem } from './nodes';
import { insertCluster, clear as clearClusters } from './clusters';
import { insertEdgeLabel, positionEdgeLabel, insertEdge, clear as clearEdges } from './edges';
import { logger } from '../logger';

const recursiveRender = (_elem, graph, diagramtype, parentCluster) => {
  logger.info('Graph in recursive render: XXX', graphlib.json.write(graph), parentCluster);
  const dir = graph.graph().rankdir;
  logger.warn('Dir in recursive render - dir:', dir);

  const elem = _elem.insert('g').attr('class', 'root'); // eslint-disable-line
  if (!graph.nodes()) {
    logger.info('No nodes found for', graph);
  } else {
    logger.info('Recursive render XXX', graph.nodes());
  }
  if (graph.edges().length > 0) {
    logger.info('Recursive edges', graph.edge(graph.edges()[0]));
  }
  const clusters = elem.insert('g').attr('class', 'clusters'); // eslint-disable-line
  const edgePaths = elem.insert('g').attr('class', 'edgePaths');
  const edgeLabels = elem.insert('g').attr('class', 'edgeLabels');
  const nodes = elem.insert('g').attr('class', 'nodes');

  // Insert nodes, this will insert them into the dom and each node will get a size. The size is updated
  // to the abstract node and is later used by dagre for the layout
  graph.nodes().forEach(function(v) {
    const node = graph.node(v);
    if (typeof parentCluster !== 'undefined') {
      const data = JSON.parse(JSON.stringify(parentCluster.clusterData));
      // data.clusterPositioning = true;
      logger.info('Setting data for cluster XXX (', v, ') ', data, parentCluster);
      graph.setNode(parentCluster.id, data);
      if (!graph.parent(v)) {
        logger.warn('Setting parent', v, parentCluster.id);
        graph.setParent(v, parentCluster.id, data);
      }
    }
    logger.info('(Insert) Node XXX' + v + ': ' + JSON.stringify(graph.node(v)));
    if (node && node.clusterNode) {
      // const children = graph.children(v);
      logger.info('Cluster identified', v, node, graph.node(v));
      const newEl = recursiveRender(nodes, node.graph, diagramtype, graph.node(v));
      updateNodeBounds(node, newEl);
      setNodeElem(newEl, node);

      logger.warn('Recursive render complete', newEl, node);
    } else {
      if (graph.children(v).length > 0) {
        // This is a cluster but not to be rendered recusively
        // Render as before
        logger.info('Cluster - the non recursive path XXX', v, node.id, node, graph);
        logger.info(findNonClusterChild(node.id, graph));
        clusterDb[node.id] = { id: findNonClusterChild(node.id, graph), node };
        // insertCluster(clusters, graph.node(v));
      } else {
        logger.info('Node - the non recursive path', v, node.id, node);
        insertNode(nodes, graph.node(v), dir);
      }
    }
  });

  // Insert labels, this will insert them into the dom so that the width can be calculated
  // Also figure out which edges point to/from clusters and adjust them accordingly
  // Edges from/to clusters really points to the first child in the cluster.
  // TODO: pick optimal child in the cluster to us as link anchor
  graph.edges().forEach(function(e) {
    const edge = graph.edge(e.v, e.w, e.name);
    logger.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    logger.info('Edge ' + e.v + ' -> ' + e.w + ': ', e, ' ', JSON.stringify(graph.edge(e)));

    // Check if link is either from or to a cluster
    logger.info(
      'Fix',
      clusterDb,
      'ids:',
      e.v,
      e.w,
      'Translateing: ',
      clusterDb[e.v],
      clusterDb[e.w]
    );
    insertEdgeLabel(edgeLabels, edge);
  });

  graph.edges().forEach(function(e) {
    logger.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
  });
  logger.info('#############################################');
  logger.info('###                Layout                 ###');
  logger.info('#############################################');
  logger.info(graph);
  dagre.layout(graph);
  logger.info('Graph after layout:', graphlib.json.write(graph));
  // Move the nodes to the correct place
  sortNodesByHierarchy(graph).forEach(function(v) {
    const node = graph.node(v);
    logger.info('Position ' + v + ': ' + JSON.stringify(graph.node(v)));
    logger.info(
      'Position ' + v + ': (' + node.x,
      ',' + node.y,
      ') width: ',
      node.width,
      ' height: ',
      node.height
    );
    if (node && node.clusterNode) {
      // clusterDb[node.id].node = node;

      positionNode(node);
    } else {
      // Non cluster node
      if (graph.children(v).length > 0) {
        // A cluster in the non-recurive way
        // positionCluster(node);
        insertCluster(clusters, node);
        clusterDb[node.id].node = node;
      } else {
        positionNode(node);
      }
    }
  });

  // Move the edge labels to the correct place after layout
  graph.edges().forEach(function(e) {
    const edge = graph.edge(e);
    logger.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge), edge);

    const paths = insertEdge(edgePaths, e, edge, clusterDb, diagramtype, graph);
    positionEdgeLabel(edge, paths);
  });

  return elem;
};

export const render = (elem, graph, markers, diagramtype, id) => {
  insertMarkers(elem, markers, diagramtype, id);
  clearNodes();
  clearEdges();
  clearClusters();
  clearGraphlib();

  logger.warn('Graph at first:', graphlib.json.write(graph));
  adjustClustersAndEdges(graph);
  logger.warn('Graph after:', graphlib.json.write(graph));
  // logger.warn('Graph ever  after:', graphlib.json.write(graph.node('A').graph));
  recursiveRender(elem, graph, diagramtype);
};

// const shapeDefinitions = {};
// export const addShape = ({ shapeType: fun }) => {
//   shapeDefinitions[shapeType] = fun;
// };

// const arrowDefinitions = {};
// export const addArrow = ({ arrowType: fun }) => {
//   arrowDefinitions[arrowType] = fun;
// };
