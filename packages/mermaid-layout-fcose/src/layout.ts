import type { LayoutData } from 'mermaid';
import type { LayoutOptions, Position } from 'cytoscape';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { select } from 'd3';
import type {
  ArchitectureAlignment,
  ArchitectureDataStructures,
  ArchitectureGroupAlignments,
  ArchitectureSpatialMap,
  LayoutResult,
  PositionedNode,
  PositionedEdge,
} from './types.js';

cytoscape.use(fcose as any);

/**
 * Architecture direction types
 */
export type ArchitectureDirection = 'L' | 'R' | 'T' | 'B';

const ArchitectureDirectionName = {
  L: 'left',
  R: 'right',
  T: 'top',
  B: 'bottom',
} as const;

function isArchitectureDirectionY(x: ArchitectureDirection): boolean {
  return x === 'T' || x === 'B';
}

function isArchitectureDirectionXY(a: ArchitectureDirection, b: ArchitectureDirection): boolean {
  const aX = a === 'L' || a === 'R';
  const bY = b === 'T' || b === 'B';
  const aY = a === 'T' || a === 'B';
  const bX = b === 'L' || b === 'R';
  return (aX && bY) || (aY && bX);
}

function getOppositeArchitectureDirection(x: ArchitectureDirection): ArchitectureDirection {
  if (x === 'L' || x === 'R') {
    return x === 'L' ? 'R' : 'L';
  } else {
    return x === 'T' ? 'B' : 'T';
  }
}

/**
 * Execute the fcose layout algorithm on architecture diagram data
 *
 * This function takes layout data and uses cytoscape-fcose to calculate
 * optimal node positions for architecture diagrams with spatial constraints.
 *
 * @param data - The layout data containing nodes, edges, and configuration
 * @returns Promise resolving to layout result with positioned nodes and edges
 */
export function executeFcoseLayout(data: LayoutData): Promise<LayoutResult> {
  return new Promise((resolve, reject) => {
    try {
      if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
        throw new Error('No nodes found in layout data');
      }

      if (!data.edges || !Array.isArray(data.edges)) {
        data.edges = [];
      }

      // Extract architecture-specific data structures if available
      const dataStructures = data.dataStructures as ArchitectureDataStructures | undefined;

      const spatialMaps = dataStructures?.spatialMaps ?? [];
      const groupAlignments = dataStructures?.groupAlignments ?? {};

      // Get icon size from config (default to 50)
      // Try to get from architecture config, or use a reasonable default
      const iconSize = data.config?.architecture?.iconSize || data.config?.iconSize || 50;

      // Create a hidden container for cytoscape
      const renderEl = select('body')
        .append('div')
        .attr('id', 'cy-fcose')
        .attr('style', 'display:none');
      const cy = cytoscape({
        container: document.getElementById('cy-fcose'),
        style: [
          {
            selector: 'edge',
            style: {
              'curve-style': 'straight',
              label: 'data(label)',
            },
          },
          {
            selector: 'edge.segments',
            style: {
              'curve-style': 'segments',
              'segment-weights': '0',
              'segment-distances': [0.5],
            },
          },
          {
            selector: 'node',
            style: {
              // @ts-ignore Incorrect library types
              'compound-sizing-wrt-labels': 'include',
            },
          },
          {
            selector: 'node[label]',
            style: {
              'text-valign': 'bottom',
              'text-halign': 'center',
            },
          },
          {
            selector: '.node-service',
            style: {
              label: 'data(label)',
              width: 'data(width)',
              height: 'data(height)',
            },
          },
          {
            selector: '.node-junction',
            style: {
              width: 'data(width)',
              height: 'data(height)',
            },
          },
          {
            selector: '.node-group',
            style: {
              // @ts-ignore Incorrect library types
              padding: `${iconSize * 0.5}px`,
            },
          },
        ],
        layout: {
          name: 'grid',
          boundingBox: {
            x1: 0,
            x2: 100,
            y1: 0,
            y2: 100,
          },
        },
      });

      // Add nodes to cytoscape
      // First add groups, then services/junctions (to ensure parents exist before children)
      const nodeMap = new Map<string, any>();
      const groups = data.nodes.filter((n) => n.isGroup);
      const services = data.nodes.filter((n) => !n.isGroup);

      // Add groups first
      groups.forEach((node) => {
        const cyNode = cy.add({
          group: 'nodes',
          data: {
            id: node.id,
            label: node.label || '',
            parent: node.parentId,
            type: 'group',
          },
          classes: 'node-group',
        });
        nodeMap.set(node.id, { node: cyNode, originalNode: node });
      });

      // Then add services and junctions
      services.forEach((node) => {
        const nodeType = (node as any).type === 'junction' ? 'junction' : 'service';
        const cyNode = cy.add({
          group: 'nodes',
          data: {
            id: node.id,
            label: node.label || '',
            parent: node.parentId,
            width: node.width || iconSize,
            height: node.height || iconSize,
            type: nodeType,
          },
          classes: nodeType === 'junction' ? 'node-junction' : 'node-service',
        });
        nodeMap.set(node.id, { node: cyNode, originalNode: node });
      });

      // Add edges to cytoscape
      const edgeMap = new Map<string, any>();
      data.edges.forEach((edge) => {
        const edgeData: any = {
          id: edge.id,
          source: edge.start || edge.source,
          target: edge.end || edge.target,
          label: edge.label || '',
        };

        // Preserve architecture-specific edge data
        if ((edge as any).lhsDir) {
          edgeData.sourceDir = (edge as any).lhsDir;
          edgeData.targetDir = (edge as any).rhsDir;
        }

        const edgeType =
          (edge as any).lhsDir && (edge as any).rhsDir
            ? isArchitectureDirectionXY((edge as any).lhsDir, (edge as any).rhsDir)
              ? 'segments'
              : 'straight'
            : 'straight';

        const cyEdge = cy.add({
          group: 'edges',
          data: edgeData,
          classes: edgeType,
        });
        edgeMap.set(edge.id, { edge: cyEdge, originalEdge: edge });
      });

      // Make cytoscape care about the dimensions of the nodes
      cy.nodes().forEach(function (n) {
        n.layoutDimensions = () => {
          const nodeData = n.data();
          return { w: nodeData.width || iconSize, h: nodeData.height || iconSize };
        };
      });

      // Get alignment constraints
      const alignmentConstraint = getAlignments(data.nodes, spatialMaps, groupAlignments);

      // Get relative placement constraints
      const relativePlacementConstraint = getRelativeConstraints(spatialMaps, data.nodes, iconSize);

      // Run fcose layout
      const layout = cy.layout({
        name: 'fcose',
        quality: 'proof',
        styleEnabled: false,
        animate: false,
        nodeDimensionsIncludeLabels: false,
        idealEdgeLength(edge: any) {
          const [nodeA, nodeB] = edge.connectedNodes();
          const parentA = nodeA.data('parent');
          const parentB = nodeB.data('parent');
          const elasticity = parentA === parentB ? 1.5 * iconSize : 0.5 * iconSize;
          return elasticity;
        },
        edgeElasticity(edge: any) {
          const [nodeA, nodeB] = edge.connectedNodes();
          const parentA = nodeA.data('parent');
          const parentB = nodeB.data('parent');
          const elasticity = parentA === parentB ? 0.45 : 0.001;
          return elasticity;
        },
        alignmentConstraint,
        relativePlacementConstraint,
      } as LayoutOptions);

      // Handle XY edges (edges with bends)
      layout.one('layoutstop', () => {
        function getSegmentWeights(
          source: Position,
          target: Position,
          pointX: number,
          pointY: number
        ) {
          const { x: sX, y: sY } = source;
          const { x: tX, y: tY } = target;

          let D =
            (pointY - sY + ((sX - pointX) * (sY - tY)) / (sX - tX)) /
            Math.sqrt(1 + Math.pow((sY - tY) / (sX - tX), 2));
          let W = Math.sqrt(Math.pow(pointY - sY, 2) + Math.pow(pointX - sX, 2) - Math.pow(D, 2));

          const distAB = Math.sqrt(Math.pow(tX - sX, 2) + Math.pow(tY - sY, 2));
          W = W / distAB;

          let delta1 = (tX - sX) * (pointY - sY) - (tY - sY) * (pointX - sX);
          delta1 = delta1 >= 0 ? 1 : -1;

          let delta2 = (tX - sX) * (pointX - sX) + (tY - sY) * (pointY - sY);
          delta2 = delta2 >= 0 ? 1 : -1;

          D = Math.abs(D) * delta1;
          W = W * delta2;

          return { distances: D, weights: W };
        }

        cy.startBatch();
        cy.edges().forEach((cyEdge) => {
          // Check if edge has data method and data exists
          if (
            cyEdge &&
            typeof cyEdge.data === 'function' &&
            typeof cyEdge.source === 'function' &&
            typeof cyEdge.target === 'function'
          ) {
            try {
              const edgeData = cyEdge.data();
              if (edgeData?.sourceDir && edgeData?.targetDir) {
                const sourceNode = cyEdge.source();
                const targetNode = cyEdge.target();
                if (
                  sourceNode &&
                  targetNode &&
                  typeof sourceNode.position === 'function' &&
                  typeof targetNode.position === 'function'
                ) {
                  const { x: sX, y: sY } = sourceNode.position();
                  const { x: tX, y: tY } = targetNode.position();
                  if (
                    sX !== tX &&
                    sY !== tY &&
                    !isNaN(sX) &&
                    !isNaN(sY) &&
                    !isNaN(tX) &&
                    !isNaN(tY)
                  ) {
                    const sourceDir = edgeData.sourceDir as ArchitectureDirection;
                    if (
                      typeof cyEdge.sourceEndpoint === 'function' &&
                      typeof cyEdge.targetEndpoint === 'function'
                    ) {
                      const sEP = cyEdge.sourceEndpoint();
                      const tEP = cyEdge.targetEndpoint();
                      if (
                        sEP &&
                        tEP &&
                        typeof sEP.x === 'number' &&
                        typeof sEP.y === 'number' &&
                        typeof tEP.x === 'number' &&
                        typeof tEP.y === 'number'
                      ) {
                        const [pointX, pointY] = isArchitectureDirectionY(sourceDir)
                          ? [sEP.x, tEP.y]
                          : [tEP.x, sEP.y];
                        const { weights, distances } = getSegmentWeights(sEP, tEP, pointX, pointY);
                        if (typeof cyEdge.style === 'function') {
                          cyEdge.style('segment-distances', distances);
                          cyEdge.style('segment-weights', weights);
                        }
                      }
                    }
                  }
                }
              }
            } catch (error) {
              // skip edges that can't be processed
              void error;
            }
          }
        });
        cy.endBatch();
        layout.run();
      });

      layout.run();

      cy.ready(() => {
        // Extract positioned nodes
        const positionedNodes: PositionedNode[] = [];
        cy.nodes().forEach((cyNode) => {
          if (cyNode && typeof cyNode.position === 'function') {
            const pos = cyNode.position();
            const nodeData = nodeMap.get(cyNode.id());
            if (nodeData && pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
              positionedNodes.push({
                id: cyNode.id(),
                x: pos.x,
                y: pos.y,
                width: typeof cyNode.data === 'function' ? cyNode.data('width') : undefined,
                height: typeof cyNode.data === 'function' ? cyNode.data('height') : undefined,
                originalNode: nodeData.originalNode,
              });
            }
          }
        });

        // Extract positioned edges
        const positionedEdges: PositionedEdge[] = [];
        cy.edges().forEach((cyEdge) => {
          if (
            cyEdge &&
            typeof cyEdge.id === 'function' &&
            typeof cyEdge.source === 'function' &&
            typeof cyEdge.target === 'function'
          ) {
            const edgeData = edgeMap.get(cyEdge.id());
            if (edgeData) {
              const sourceNode = cyEdge.source();
              const targetNode = cyEdge.target();
              if (
                sourceNode &&
                targetNode &&
                typeof sourceNode.position === 'function' &&
                typeof targetNode.position === 'function'
              ) {
                const sourcePos = sourceNode.position();
                const targetPos = targetNode.position();
                if (
                  sourcePos &&
                  targetPos &&
                  typeof sourcePos.x === 'number' &&
                  typeof sourcePos.y === 'number' &&
                  typeof targetPos.x === 'number' &&
                  typeof targetPos.y === 'number'
                ) {
                  positionedEdges.push({
                    id: cyEdge.id(),
                    source: sourceNode.id(),
                    target: targetNode.id(),
                    points: [
                      { x: sourcePos.x, y: sourcePos.y },
                      { x: targetPos.x, y: targetPos.y },
                    ],
                  });
                }
              }
            }
          }
        });

        // Clean up
        renderEl.remove();

        resolve({
          nodes: positionedNodes,
          edges: positionedEdges,
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get alignment constraints for fcose
 */
function getAlignments(
  nodes: LayoutData['nodes'],
  spatialMaps: ArchitectureSpatialMap[],
  groupAlignments: ArchitectureGroupAlignments
): fcose.FcoseAlignmentConstraint {
  const flattenAlignments = (
    alignmentObj: Record<number, Record<string, string[]>>,
    alignmentDir: ArchitectureAlignment
  ): Record<string, string[]> => {
    return Object.entries(alignmentObj).reduce(
      (prev, [dir, alignments]) => {
        let cnt = 0;
        const arr = Object.entries(alignments);
        if (arr.length === 1) {
          prev[dir] = arr[0][1];
          return prev;
        }
        for (let i = 0; i < arr.length - 1; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            const [aGroupId, aNodeIds] = arr[i];
            const [bGroupId, bNodeIds] = arr[j];
            const alignment = groupAlignments[aGroupId]?.[bGroupId];

            if (alignment === alignmentDir) {
              prev[dir] ??= [];
              prev[dir] = [...prev[dir], ...aNodeIds, ...bNodeIds];
            } else if (aGroupId === 'default' || bGroupId === 'default') {
              prev[dir] ??= [];
              prev[dir] = [...prev[dir], ...aNodeIds, ...bNodeIds];
            } else {
              const keyA = `${dir}-${cnt++}`;
              prev[keyA] = aNodeIds;
              const keyB = `${dir}-${cnt++}`;
              prev[keyB] = bNodeIds;
            }
          }
        }
        return prev;
      },
      {} as Record<string, string[]>
    );
  };

  // Create a node lookup by group
  const nodeGroupMap = new Map<string, string>();
  nodes.forEach((node) => {
    nodeGroupMap.set(node.id, node.parentId || 'default');
  });

  const alignments = spatialMaps.map((spatialMap) => {
    const horizontalAlignments: Record<number, Record<string, string[]>> = {};
    const verticalAlignments: Record<number, Record<string, string[]>> = {};

    Object.entries(spatialMap).forEach(([id, [x, y]]) => {
      const nodeGroup = nodeGroupMap.get(id) ?? 'default';

      horizontalAlignments[y] ??= {};
      horizontalAlignments[y][nodeGroup] ??= [];
      horizontalAlignments[y][nodeGroup].push(id);

      verticalAlignments[x] ??= {};
      verticalAlignments[x][nodeGroup] ??= [];
      verticalAlignments[x][nodeGroup].push(id);
    });

    return {
      horiz: Object.values(flattenAlignments(horizontalAlignments, 'horizontal')).filter(
        (arr) => arr.length > 1
      ),
      vert: Object.values(flattenAlignments(verticalAlignments, 'vertical')).filter(
        (arr) => arr.length > 1
      ),
    };
  });

  const [horizontal, vertical] = alignments.reduce(
    ([prevHoriz, prevVert], { horiz, vert }) => {
      return [
        [...prevHoriz, ...horiz],
        [...prevVert, ...vert],
      ];
    },
    [[] as string[][], [] as string[][]]
  );

  return {
    horizontal,
    vertical,
  };
}

/**
 * Get relative placement constraints for fcose
 */
function getRelativeConstraints(
  spatialMaps: ArchitectureSpatialMap[],
  nodes: LayoutData['nodes'],
  iconSize: number
): fcose.FcoseRelativePlacementConstraint[] {
  const relativeConstraints: fcose.FcoseRelativePlacementConstraint[] = [];
  const posToStr = (pos: number[]) => `${pos[0]},${pos[1]}`;
  const strToPos = (pos: string) => pos.split(',').map((p) => parseInt(p));

  spatialMaps.forEach((spatialMap) => {
    const invSpatialMap = Object.fromEntries(
      Object.entries(spatialMap).map(([id, pos]) => [posToStr(pos), id])
    );

    const queue = [posToStr([0, 0])];
    const visited: Record<string, number> = {};
    const directions: Record<ArchitectureDirection, number[]> = {
      L: [-1, 0],
      R: [1, 0],
      T: [0, 1],
      B: [0, -1],
    };

    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr) {
        visited[curr] = 1;
        const currId = invSpatialMap[curr];
        if (currId) {
          const currPos = strToPos(curr);
          Object.entries(directions).forEach(([dir, shift]) => {
            const newPos = posToStr([currPos[0] + shift[0], currPos[1] + shift[1]]);
            const newId = invSpatialMap[newPos];
            if (newId && !visited[newPos]) {
              queue.push(newPos);
              relativeConstraints.push({
                [ArchitectureDirectionName[dir as ArchitectureDirection]]: newId,
                [ArchitectureDirectionName[
                  getOppositeArchitectureDirection(dir as ArchitectureDirection)
                ]]: currId,
                gap: 1.5 * iconSize,
              } as any);
            }
          });
        }
      }
    }
  });

  return relativeConstraints;
}
