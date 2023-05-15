import { log } from '../../../logger.js';
import flowDb from '../flowDb.js';

export const getSubgraphLookupTable = function (diagObj) {
  const subGraphs = diagObj.db.getSubGraphs();
  const subgraphDb = {};
  log.info('Subgraphs - ', subGraphs);
  for (let i = subGraphs.length - 1; i >= 0; i--) {
    const subG = subGraphs[i];
    log.info('Subgraph - ', subG);
    for (let j = 0; j < subG.nodes.length; j++) {
      log.info('Setting up subgraphs', subG.nodes[j], subG.id);
      subgraphDb[flowDb.lookUpId(subG.nodes[j])] = subG.id;
    }
  }
  return subgraphDb;
};

/**
 *
 * @param graph
 * @param subgraphLÖookupTable
 * @param subgraphLookupTable
 */
export function assignRanks(graph, subgraphLookupTable) {
  const visited = new Set();
  const ranks = new Map();

  // DFS function for graph traversal
  /**
   *
   * @param nodeId
   * @param currentRank
   * @param previousNodeId
   */
  function dfs(nodeId, currentRank, previousNodeId) {
    if (visited.has(nodeId)) {
      return;
    }
    visited.add(nodeId);

    // Assign the maximum rank between the current rank and previously assigned rank
    const existingRank = ranks.get(nodeId) || 0;

    ranks.set(nodeId, Math.max(existingRank, currentRank));

    graph.successors(nodeId).forEach((targetId) => {
      // Special swimlane case if the previous node is from another swimlane, keep the rank
      if (subgraphLookupTable[targetId] !== subgraphLookupTable[nodeId]) {
        dfs(targetId, currentRank, nodeId);
      } else {
        dfs(targetId, currentRank + 1, nodeId);
      }
    });
  }

  // Start DFS from nodes with no incoming edges
  graph.nodes().forEach((nodeId) => {
    if (graph.predecessors(nodeId).length === 0) {
      dfs(nodeId, 0);
    }
  });

  return ranks;
}

/**
 *
 * @param graph
 * @param diagObj
 */
export function swimlaneLayout(graph, diagObj) {
  const subgraphLookupTable = getSubgraphLookupTable(diagObj);
  const ranks = assignRanks(graph, subgraphLookupTable);

  const subGraphs = diagObj.db.getSubGraphs();
  const lanes = [];
  const laneDb = {};
  for (let i = subGraphs.length - 1; i >= 0; i--) {
    const subG = subGraphs[i];
    const lane = {
      title: subG.title,
      x: i * 200,
      width: 200,
    };
    lanes.push(lane);
    laneDb[subG.id] = lane;
  }

  const rankWidth = [];
  // Basic layout
  graph.nodes().forEach((nodeId) => {
    const rank = ranks.get(nodeId);
    if (!rankWidth[rank]) {
    const laneId = subgraphLookupTable[nodeId];
    const lane = laneDb[laneId];
    const n = graph.node(nodeId);
    console.log('Node', nodeId, n);
    graph.setNode(nodeId, { y: rank * 200 + 50, x: lane.x + lane.width / 2 });
  });

  return { graph, lanes };
}
