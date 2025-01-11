import { registerIconPacks } from '../../rendering-util/icons.js';
import type { Position } from 'cytoscape';
import cytoscape from 'cytoscape';
import type { FcoseLayoutOptions } from 'cytoscape-fcose';
import fcose from 'cytoscape-fcose';
import { select } from 'd3';
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import type { Diagram } from '../../Diagram.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import { getConfigField } from './architectureDb.js';
import { architectureIcons } from './architectureIcons.js';
import type {
  ArchitectureAlignment,
  ArchitectureDataStructures,
  ArchitectureGroupAlignments,
  ArchitectureJunction,
  ArchitectureSpatialMap,
  EdgeSingular,
  EdgeSingularData,
  NodeSingularData,
} from './architectureTypes.js';
import {
  type ArchitectureDB,
  type ArchitectureDirection,
  type ArchitectureEdge,
  type ArchitectureGroup,
  type ArchitectureService,
  ArchitectureDirectionName,
  edgeData,
  getOppositeArchitectureDirection,
  isArchitectureDirectionXY,
  isArchitectureDirectionY,
  nodeData,
} from './architectureTypes.js';
import { drawEdges, drawGroups, drawJunctions, drawServices } from './svgDraw.js';

registerIconPacks([
  {
    name: architectureIcons.prefix,
    icons: architectureIcons,
  },
]);
cytoscape.use(fcose);

function addServices(services: ArchitectureService[], cy: cytoscape.Core) {
  services.forEach((service) => {
    cy.add({
      group: 'nodes',
      data: {
        type: 'service',
        id: service.id,
        icon: service.icon,
        label: service.title,
        parent: service.in,
        width: getConfigField('iconSize'),
        height: getConfigField('iconSize'),
      } as NodeSingularData,
      classes: 'node-service',
    });
  });
}

function addJunctions(junctions: ArchitectureJunction[], cy: cytoscape.Core) {
  junctions.forEach((junction) => {
    cy.add({
      group: 'nodes',
      data: {
        type: 'junction',
        id: junction.id,
        parent: junction.in,
        width: getConfigField('iconSize'),
        height: getConfigField('iconSize'),
      } as NodeSingularData,
      classes: 'node-junction',
    });
  });
}

function positionNodes(db: ArchitectureDB, cy: cytoscape.Core) {
  cy.nodes().map((node) => {
    const data = nodeData(node);
    if (data.type === 'group') {
      return;
    }
    data.x = node.position().x;
    data.y = node.position().y;

    const nodeElem = db.getElementById(data.id);
    nodeElem.attr('transform', 'translate(' + (data.x || 0) + ',' + (data.y || 0) + ')');
  });
}

function addGroups(groups: ArchitectureGroup[], cy: cytoscape.Core) {
  groups.forEach((group) => {
    cy.add({
      group: 'nodes',
      data: {
        type: 'group',
        id: group.id,
        icon: group.icon,
        label: group.title,
        parent: group.in,
      } as NodeSingularData,
      classes: 'node-group',
    });
  });
}

function addEdges(edges: ArchitectureEdge[], cy: cytoscape.Core) {
  edges.forEach((parsedEdge) => {
    const { lhsId, rhsId, lhsInto, lhsGroup, rhsInto, lhsDir, rhsDir, rhsGroup, title } =
      parsedEdge;
    const edgeType = isArchitectureDirectionXY(parsedEdge.lhsDir, parsedEdge.rhsDir)
      ? 'segments'
      : 'straight';
    const edge: EdgeSingularData = {
      id: `${lhsId}-${rhsId}`,
      label: title,
      source: lhsId,
      sourceDir: lhsDir,
      sourceArrow: lhsInto,
      sourceGroup: lhsGroup,
      sourceEndpoint:
        lhsDir === 'L'
          ? '0 50%'
          : lhsDir === 'R'
            ? '100% 50%'
            : lhsDir === 'T'
              ? '50% 0'
              : '50% 100%',
      target: rhsId,
      targetDir: rhsDir,
      targetArrow: rhsInto,
      targetGroup: rhsGroup,
      targetEndpoint:
        rhsDir === 'L'
          ? '0 50%'
          : rhsDir === 'R'
            ? '100% 50%'
            : rhsDir === 'T'
              ? '50% 0'
              : '50% 100%',
    };
    cy.add({
      group: 'edges',
      data: edge,
      classes: edgeType,
    });
  });
}

function getAlignments(
  db: ArchitectureDB,
  spatialMaps: ArchitectureSpatialMap[],
  groupAlignments: ArchitectureGroupAlignments
): fcose.FcoseAlignmentConstraint {
  /**
   * Flattens the alignment object so nodes in different groups will be in the same alignment array IFF their groups don't connect in a conflicting alignment
   *
   * i.e., two groups which connect horizontally should not have nodes with vertical alignments to one another
   *
   * See: #5952
   *
   * @param alignmentObj - alignment object with the outer key being the row/col # and the inner key being the group name mapped to the nodes on that axis in the group
   * @param alignmentDir - alignment direction
   * @returns flattened alignment object with an arbitrary key mapping to nodes in the same row/col
   */
  const flattenAlignments = (
    alignmentObj: Record<number, Record<string, string[]>>,
    alignmentDir: ArchitectureAlignment
  ): Record<string, string[]> => {
    return Object.entries(alignmentObj).reduce(
      (prev, [dir, alignments]) => {
        // prev is the mapping of x/y coordinate to an array of the nodes in that row/column
        let cnt = 0;
        const arr = Object.entries(alignments); // [group name, array of nodes within the group on axis dir]
        if (arr.length === 1) {
          // If only one group exists in the row/column, we don't need to do anything else
          prev[dir] = arr[0][1];
          return prev;
        }
        for (let i = 0; i < arr.length - 1; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            const [aGroupId, aNodeIds] = arr[i];
            const [bGroupId, bNodeIds] = arr[j];
            const alignment = groupAlignments[aGroupId]?.[bGroupId]; // Get how the two groups are intended to align (undefined if they aren't)

            if (alignment === alignmentDir) {
              // If the intended alignment between the two groups is the same as the alignment we are parsing
              prev[dir] ??= [];
              prev[dir] = [...prev[dir], ...aNodeIds, ...bNodeIds]; // add the node ids of both groups to the axis array in prev
            } else if (aGroupId === 'default' || bGroupId === 'default') {
              // If either of the groups are in the default space (not in a group), use the same behavior as above
              prev[dir] ??= [];
              prev[dir] = [...prev[dir], ...aNodeIds, ...bNodeIds];
            } else {
              // Otherwise, the nodes in the two groups are not intended to align
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

  const alignments = spatialMaps.map((spatialMap) => {
    const horizontalAlignments: Record<number, Record<string, string[]>> = {};
    const verticalAlignments: Record<number, Record<string, string[]>> = {};

    // Group service ids in an object with their x and y coordinate as the key
    Object.entries(spatialMap).forEach(([id, [x, y]]) => {
      const nodeGroup = db.getNode(id)?.in ?? 'default';

      horizontalAlignments[y] ??= {};
      horizontalAlignments[y][nodeGroup] ??= [];
      horizontalAlignments[y][nodeGroup].push(id);

      verticalAlignments[x] ??= {};
      verticalAlignments[x][nodeGroup] ??= [];
      verticalAlignments[x][nodeGroup].push(id);
    });

    // Merge the values of each object into a list if the inner list has at least 2 elements
    return {
      horiz: Object.values(flattenAlignments(horizontalAlignments, 'horizontal')).filter(
        (arr) => arr.length > 1
      ),
      vert: Object.values(flattenAlignments(verticalAlignments, 'vertical')).filter(
        (arr) => arr.length > 1
      ),
    };
  });

  // Merge the alignment lists for each spatial map into one 2d array per axis
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

function getRelativeConstraints(
  spatialMaps: ArchitectureSpatialMap[]
): fcose.FcoseRelativePlacementConstraint[] {
  const relativeConstraints: fcose.FcoseRelativePlacementConstraint[] = [];
  const posToStr = (pos: number[]) => `${pos[0]},${pos[1]}`;
  const strToPos = (pos: string) => pos.split(',').map((p) => parseInt(p));

  spatialMaps.forEach((spatialMap) => {
    const invSpatialMap = Object.fromEntries(
      Object.entries(spatialMap).map(([id, pos]) => [posToStr(pos), id])
    );

    // perform BFS
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
            // If there is an adjacent service to the current one and it has not yet been visited
            if (newId && !visited[newPos]) {
              queue.push(newPos);
              // @ts-ignore cannot determine if left/right or top/bottom are paired together
              relativeConstraints.push({
                [ArchitectureDirectionName[dir as ArchitectureDirection]]: newId,
                [ArchitectureDirectionName[
                  getOppositeArchitectureDirection(dir as ArchitectureDirection)
                ]]: currId,
                gap: 1.5 * getConfigField('iconSize'),
              });
            }
          });
        }
      }
    }
  });
  return relativeConstraints;
}

function layoutArchitecture(
  services: ArchitectureService[],
  junctions: ArchitectureJunction[],
  groups: ArchitectureGroup[],
  edges: ArchitectureEdge[],
  db: ArchitectureDB,
  { spatialMaps, groupAlignments }: ArchitectureDataStructures
): Promise<cytoscape.Core> {
  return new Promise((resolve) => {
    const renderEl = select('body').append('div').attr('id', 'cy').attr('style', 'display:none');
    const cy = cytoscape({
      container: document.getElementById('cy'),
      style: [
        {
          selector: 'edge',
          style: {
            'curve-style': 'straight',
            label: 'data(label)',
            'source-endpoint': 'data(sourceEndpoint)',
            'target-endpoint': 'data(targetEndpoint)',
          },
        },
        {
          selector: 'edge.segments',
          style: {
            'curve-style': 'segments',
            'segment-weights': '0',
            'segment-distances': [0.5],
            // @ts-ignore Incorrect library types
            'edge-distances': 'endpoints',
            'source-endpoint': 'data(sourceEndpoint)',
            'target-endpoint': 'data(targetEndpoint)',
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
            'font-size': `${getConfigField('fontSize')}px`,
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
            padding: `${getConfigField('padding')}px`,
          },
        },
      ],
    });
    // Remove element after layout
    renderEl.remove();

    addGroups(groups, cy);
    addServices(services, cy);
    addJunctions(junctions, cy);
    addEdges(edges, cy);
    // Use the spatial map to create alignment arrays for fcose
    const alignmentConstraint = getAlignments(db, spatialMaps, groupAlignments);

    // Create the relative constraints for fcose by using an inverse of the spatial map and performing BFS on it
    const relativePlacementConstraint = getRelativeConstraints(spatialMaps);

    const layout = cy.layout({
      name: 'fcose',
      quality: 'proof',
      styleEnabled: false,
      animate: false,
      nodeDimensionsIncludeLabels: false,
      // Adjust the edge parameters if it passes through the border of a group
      // Hacky fix for: https://github.com/iVis-at-Bilkent/cytoscape.js-fcose/issues/67
      idealEdgeLength(edge: EdgeSingular) {
        const [nodeA, nodeB] = edge.connectedNodes();
        const { parent: parentA } = nodeData(nodeA);
        const { parent: parentB } = nodeData(nodeB);
        const elasticity =
          parentA === parentB ? 1.5 * getConfigField('iconSize') : 0.5 * getConfigField('iconSize');
        return elasticity;
      },
      edgeElasticity(edge: EdgeSingular) {
        const [nodeA, nodeB] = edge.connectedNodes();
        const { parent: parentA } = nodeData(nodeA);
        const { parent: parentB } = nodeData(nodeB);
        const elasticity = parentA === parentB ? 0.45 : 0.001;
        return elasticity;
      },
      alignmentConstraint,
      relativePlacementConstraint,
    } as FcoseLayoutOptions);

    // Once the diagram has been generated and the service's position cords are set, adjust the XY edges to have a 90deg bend
    layout.one('layoutstop', () => {
      function getSegmentWeights(
        source: Position,
        target: Position,
        pointX: number,
        pointY: number
      ) {
        let W, D;
        const { x: sX, y: sY } = source;
        const { x: tX, y: tY } = target;

        D =
          (pointY - sY + ((sX - pointX) * (sY - tY)) / (sX - tX)) /
          Math.sqrt(1 + Math.pow((sY - tY) / (sX - tX), 2));
        W = Math.sqrt(Math.pow(pointY - sY, 2) + Math.pow(pointX - sX, 2) - Math.pow(D, 2));

        const distAB = Math.sqrt(Math.pow(tX - sX, 2) + Math.pow(tY - sY, 2));
        W = W / distAB;

        //check whether the point (pointX, pointY) is on right or left of the line src to tgt. for instance : a point C(X, Y) and line (AB).  d=(xB-xA)(yC-yA)-(yB-yA)(xC-xA). if d>0, then C is on left of the line. if d<0, it is on right. if d=0, it is on the line.
        let delta1 = (tX - sX) * (pointY - sY) - (tY - sY) * (pointX - sX);
        switch (true) {
          case delta1 >= 0:
            delta1 = 1;
            break;
          case delta1 < 0:
            delta1 = -1;
            break;
        }
        //check whether the point (pointX, pointY) is "behind" the line src to tgt
        let delta2 = (tX - sX) * (pointX - sX) + (tY - sY) * (pointY - sY);
        switch (true) {
          case delta2 >= 0:
            delta2 = 1;
            break;
          case delta2 < 0:
            delta2 = -1;
            break;
        }

        D = Math.abs(D) * delta1; //ensure that sign of D is same as sign of delta1. Hence we need to take absolute value of D and multiply by delta1
        W = W * delta2;

        return {
          distances: D,
          weights: W,
        };
      }
      cy.startBatch();
      for (const edge of Object.values(cy.edges())) {
        if (edge.data?.()) {
          const { x: sX, y: sY } = edge.source().position();
          const { x: tX, y: tY } = edge.target().position();
          if (sX !== tX && sY !== tY) {
            const sEP = edge.sourceEndpoint();
            const tEP = edge.targetEndpoint();
            const { sourceDir } = edgeData(edge);
            const [pointX, pointY] = isArchitectureDirectionY(sourceDir)
              ? [sEP.x, tEP.y]
              : [tEP.x, sEP.y];
            const { weights, distances } = getSegmentWeights(sEP, tEP, pointX, pointY);
            edge.style('segment-distances', distances);
            edge.style('segment-weights', weights);
          }
        }
      }
      cy.endBatch();
      layout.run();
    });
    layout.run();

    cy.ready((e) => {
      log.info('Ready', e);
      resolve(cy);
    });
  });
}

export const draw: DrawDefinition = async (text, id, _version, diagObj: Diagram) => {
  const db = diagObj.db as ArchitectureDB;

  const services = db.getServices();
  const junctions = db.getJunctions();
  const groups = db.getGroups();
  const edges = db.getEdges();
  const ds = db.getDataStructures();

  const svg: SVG = selectSvgElement(id);

  const edgesElem = svg.append('g');
  edgesElem.attr('class', 'architecture-edges');

  const servicesElem = svg.append('g');
  servicesElem.attr('class', 'architecture-services');

  const groupElem = svg.append('g');
  groupElem.attr('class', 'architecture-groups');

  await drawServices(db, servicesElem, services);
  drawJunctions(db, servicesElem, junctions);

  const cy = await layoutArchitecture(services, junctions, groups, edges, db, ds);

  await drawEdges(edgesElem, cy);
  await drawGroups(groupElem, cy);
  positionNodes(db, cy);

  setupGraphViewbox(undefined, svg, getConfigField('padding'), getConfigField('useMaxWidth'));
};

export const renderer = { draw };
