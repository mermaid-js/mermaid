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
 */
export function swimlaneLayout(graph) {
  const ranks = assignRanks(graph);
  return graph;
}
