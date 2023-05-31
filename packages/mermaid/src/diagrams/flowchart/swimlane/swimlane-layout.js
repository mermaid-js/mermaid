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
 * @param subgraphLookupTable
 */
export function assignRanks(graph, subgraphLookupTable) {
  let visited = new Set();
  const lock = new Map();
  const ranks = new Map();
  let cnt = 0;
  let changesDetected = true;

  function dfs(nodeId, currentRank) {
    if (visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);
    const existingRank = ranks.get(nodeId) || 0;

    console.log('APA444 DFS Base case for', nodeId, 'to', Math.max(existingRank, currentRank));
    if (lock.get(nodeId) !== 1) {
      ranks.set(nodeId, Math.max(existingRank, currentRank));
    } else {
      console.log(
        'APA444 ',
        nodeId,
        'was locked to ',
        existingRank,
        'so not changing it',
        ranks.get(nodeId)
      );
    }

    const currentRankAdjusted = ranks.get(nodeId) || currentRank;
    graph.successors(nodeId).forEach((targetId) => {
      if (subgraphLookupTable[targetId] !== subgraphLookupTable[nodeId]) {
        dfs(targetId, currentRankAdjusted);
      } else {
        // In same line, easy increase
        dfs(targetId, currentRankAdjusted + 1);
      }
    });
  }

  function adjustSuccessors() {
    graph.nodes().forEach((nodeId) => {
      if (graph.predecessors(nodeId).length === 0) {
        graph.successors(nodeId).forEach((successorNodeId) => {
          if (subgraphLookupTable[successorNodeId] !== subgraphLookupTable[nodeId]) {
            const newRank = ranks.get(successorNodeId);
            ranks.set(nodeId, newRank);
            console.log('APA444 POST-process case for', nodeId, 'to', newRank);
            lock.set(nodeId, 1);
            changesDetected = true;
            // setRankFromTopNodes();

            // Adjust ranks of successors in the same subgraph
            graph.successors(nodeId).forEach((sameSubGraphSuccessorNodeId) => {
              if (
                subgraphLookupTable[sameSubGraphSuccessorNodeId] === subgraphLookupTable[nodeId]
              ) {
                console.log(
                  'APA444 Adjusting rank of',
                  sameSubGraphSuccessorNodeId,
                  'to',
                  newRank + 1
                );
                ranks.set(sameSubGraphSuccessorNodeId, newRank + 1);
                lock.set(sameSubGraphSuccessorNodeId, 1);
                changesDetected = true;
                // dfs(sameSubGraphSuccessorNodeId, newRank + 1);
                // setRankFromTopNodes();
              }
            });
          }
        });
      }
    });
  }

  function setRankFromTopNodes() {
    visited = new Set();
    graph.nodes().forEach((nodeId) => {
      if (graph.predecessors(nodeId).length === 0) {
        dfs(nodeId, 0);
      }
    });
    adjustSuccessors();
  }

  while (changesDetected && cnt < 10) {
    setRankFromTopNodes();
    cnt++;
  }
  // Post-process the ranks

  return ranks;
}

/**
 *
 * @param graph
 * @param subgraphLÖookupTable
 * @param subgraphLookupTable
 */
export function assignAffinities(graph, ranks, subgraphLookupTable) {
  const affinities = new Map();
  const swimlaneRankAffinities = new Map();
  const swimlaneMaxAffinity = new Map();

  graph.nodes().forEach((nodeId) => {
    const swimlane = subgraphLookupTable[nodeId];
    const rank = ranks.get(nodeId);
    const key = swimlane+':'+rank;
    let currentAffinity = swimlaneRankAffinities.get(key);
    if(typeof currentAffinity === 'undefined'){
      currentAffinity = -1;
    }
    const newAffinity = currentAffinity + 1;
    swimlaneRankAffinities.set(key, newAffinity);
    affinities.set(nodeId, newAffinity);
    let currentMaxAffinity = swimlaneMaxAffinity.get(swimlane);
    if(typeof currentMaxAffinity === 'undefined'){
      swimlaneMaxAffinity.set(swimlane, 0);
      currentMaxAffinity = 0;
    }
    if(newAffinity > currentMaxAffinity){
      swimlaneMaxAffinity.set(swimlane, newAffinity);
    }
  });

  // console.log('APA444 affinities', swimlaneRankAffinities);

  return {affinities, swimlaneMaxAffinity};
  //return affinities;
}

/**
 *
 * @param graph
 * @param diagObj
 */
export function swimlaneLayout(graph, diagObj) {
  const subgraphLookupTable = getSubgraphLookupTable(diagObj);
  const ranks = assignRanks(graph, subgraphLookupTable);

  const {affinities, swimlaneMaxAffinity} = assignAffinities(graph, ranks, subgraphLookupTable);
  // const affinities = assignAffinities(graph, ranks, subgraphLookupTable);

  const subGraphs = diagObj.db.getSubGraphs();
  const lanes = [];
  const laneDb = {};
  let xPos = 0;
  for (let i = 0; i < subGraphs.length; i++) {
    const subG = subGraphs[i];
    const maxAffinity = swimlaneMaxAffinity.get(subG.id);
    const lane = {
      title: subG.title,
      x: xPos,
      width: 200 + maxAffinity*150,
    };
    xPos += lane.width;
    lanes.push(lane);
    laneDb[subG.id] = lane;
  }

  const rankWidth = [];
  // Basic layout, calculate the node positions based on rank
  graph.nodes().forEach((nodeId) => {
    const rank = ranks.get(nodeId);
    if (!rankWidth[rank]) {
      const laneId = subgraphLookupTable[nodeId];
      const lane = laneDb[laneId];
      const n = graph.node(nodeId);
      console.log('Node', nodeId, n);
      const affinity = affinities.get(nodeId);

      console.log('APA444', nodeId, 'rank', rank, 'affinity', affinity);
      graph.setNode(nodeId, { y: rank * 200 + 50, x: lane.x + 150*affinity + lane.width / 2 });
      // lane.width = Math.max(lane.width, lane.x + 150*affinity + lane.width / 4);
    }
  });

  return { graph, lanes };
}
