import cytoscape, { Position } from 'cytoscape';
import type { Diagram } from '../../Diagram.js';
import fcose, { FcoseLayoutOptions } from 'cytoscape-fcose';
import type { MermaidConfig } from '../../config.type.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import {
  type ArchitectureDB,
  type ArchitectureDirection,
  type ArchitectureGroup,
  type ArchitectureLine,
  type ArchitectureService,
  ArchitectureDataStructures,
  ArchitectureDirectionName,
  getOppositeArchitectureDirection,
  isArchitectureDirectionXY,
  isArchitectureDirectionY,
  ArchitectureSpatialMap,
  EdgeSingularData,
  EdgeSingular,
  NodeSingular,
  NodeSingularData,
  nodeData,
  edgeData
} from './architectureTypes.js';
import { select } from 'd3';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import type { D3Element } from '../../mermaidAPI.js';
import { drawEdges, drawGroups, drawServices } from './svgDraw.js';
import { getConfigField } from './architectureDb.js';

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
      },
      classes: 'node-service',
    });
  });
}

function positionServices(db: ArchitectureDB, cy: cytoscape.Core) {
  cy.nodes().map((node, id) => {
    const data = nodeData(node)
    if (data.type === 'group') return;
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
      },
      classes: 'node-group',
    });
  });
}

function addEdges(lines: ArchitectureLine[], cy: cytoscape.Core) {
  lines.forEach((line) => {
    const { lhs_id, rhs_id, lhs_into, rhs_into, lhs_dir, rhs_dir } = line;
    const edgeType = isArchitectureDirectionXY(line.lhs_dir, line.rhs_dir)
      ? 'segments'
      : 'straight';
    const edge: EdgeSingularData = {
      id: `${lhs_id}-${rhs_id}`,
      source: lhs_id,
      sourceDir: lhs_dir,
      sourceArrow: lhs_into,
      sourceEndpoint:
        lhs_dir === 'L'
          ? '0 50%'
          : lhs_dir === 'R'
          ? '100% 50%'
          : lhs_dir === 'T'
          ? '50% 0'
          : '50% 100%',
      target: rhs_id,
      targetDir: rhs_dir,
      targetArrow: rhs_into,
      targetEndpoint:
        rhs_dir === 'L'
          ? '0 50%'
          : rhs_dir === 'R'
          ? '100% 50%'
          : rhs_dir === 'T'
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

function getAlignments(spatialMaps: ArchitectureSpatialMap[]): fcose.FcoseAlignmentConstraint {
  const alignments = spatialMaps.map((spatialMap) => {
    const horizontalAlignments: Record<number, string[]> = {};
    const verticalAlignments: Record<number, string[]> = {};
    // Group service ids in an object with their x and y coordinate as the key
    Object.entries(spatialMap).forEach(([id, [x, y]]) => {
      if (!horizontalAlignments[y]) horizontalAlignments[y] = [];
      if (!verticalAlignments[x]) verticalAlignments[x] = [];
      horizontalAlignments[y].push(id);
      verticalAlignments[x].push(id);
    });
    // Merge the values of each object into a list if the inner list has at least 2 elements
    return {
      horiz: Object.values(horizontalAlignments).filter((arr) => arr.length > 1),
      vert: Object.values(verticalAlignments).filter((arr) => arr.length > 1),
    };
  });

  // Merge the alginment lists for each spatial map into one 2d array per axis
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
  groups: ArchitectureGroup[],
  lines: ArchitectureLine[],
  { spatialMaps }: ArchitectureDataStructures
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
            //@ts-ignore
            'edge-distances': 'endpoints',
            'source-endpoint': 'data(sourceEndpoint)',
            'target-endpoint': 'data(targetEndpoint)',
          },
        },
        {
          selector: 'node',
          style: {
            //@ts-ignore
            'compound-sizing-wrt-labels': 'include',
          },
        },
        {
          selector: 'node[label]',
          style: {
            'text-valign': 'bottom',
            'text-halign': 'center',
            'font-size': '16px',
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
          selector: '.node-group',
          style: {
            //@ts-ignore
            padding: '30px',
          },
        },
      ],
    });
    // Remove element after layout
    renderEl.remove();

    addGroups(groups, cy);
    addServices(services, cy);
    addEdges(lines, cy);

    // Use the spatial map to create alignment arrays for fcose
    const alignmentConstraint = getAlignments(spatialMaps);

    // Create the relative constraints for fcose by using an inverse of the spatial map and performing BFS on it
    const relativePlacementConstraint = getRelativeConstraints(spatialMaps);

    console.log(`Horizontal Alignments:`);
    console.log(alignmentConstraint.horizontal);
    console.log(`Vertical Alignments:`);
    console.log(alignmentConstraint.vertical);
    console.log(`Relative Alignments:`);
    console.log(relativePlacementConstraint);

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
        const { parent: parentA } = nodeData(nodeA)
        const { parent: parentB } = nodeData(nodeB)
        const elasticity =
          parentA === parentB ? 1.5 * getConfigField('iconSize') : 0.5 * getConfigField('iconSize');
        return elasticity;
      },
      edgeElasticity(edge: EdgeSingular) {
        const [nodeA, nodeB] = edge.connectedNodes();
        const { parent: parentA } = nodeData(nodeA)
        const { parent: parentB } = nodeData(nodeB)
        const elasticity = parentA === parentB ? 0.45 : 0.001;
        return elasticity;
      },
      alignmentConstraint,
      relativePlacementConstraint,
    } as FcoseLayoutOptions);

    // Once the diagram has been generated and the service's position cords are set, adjust the XY edges to have a 90deg bend
    layout.one('layoutstop', (_event) => {
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
      for (let edge of Object.values(cy.edges())) {
        if (edge.data?.()) {
          let { x: s_x, y: s_y } = edge.source().position();
          let { x: t_x, y: t_y } = edge.target().position();
          if (s_x !== t_x && s_y !== t_y) {
            let sEP = edge.sourceEndpoint();
            let tEP = edge.targetEndpoint();
            const { sourceDir } = edgeData(edge)
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
  const conf: MermaidConfig = getConfig();

  const services = db.getServices();
  const groups = db.getGroups();
  const lines = db.getEdges();
  const ds = db.getDataStructures();
  console.log('Services: ', services);
  console.log('Lines: ', lines);
  console.log('Groups: ', groups);

  const svg: SVG = selectSvgElement(id);

  const edgesElem = svg.append('g');
  edgesElem.attr('class', 'architecture-edges');

  const servicesElem = svg.append('g');
  servicesElem.attr('class', 'architecture-services');

  const groupElem = svg.append('g');
  groupElem.attr('class', 'architecture-groups');

  drawServices(db, servicesElem, services);

  const cy = await layoutArchitecture(services, groups, lines, ds);

  drawEdges(edgesElem, cy);
  drawGroups(groupElem, cy);
  positionServices(db, cy);

  setupGraphViewbox(undefined, svg, getConfigField('padding'), getConfigField('useMaxWidth'));

  console.log('==============================================================');
};

export const renderer = { draw };
