import cytoscape from 'cytoscape';
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
} from './architectureTypes.js';
import { select } from 'd3';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import type { D3Element } from '../../mermaidAPI.js';
import { drawEdges, drawGroups, drawService } from './svgDraw.js';
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

function drawServices(
  db: ArchitectureDB,
  svg: D3Element,
  services: ArchitectureService[],
  conf: MermaidConfig
) {
  services.forEach((service) => drawService(db, svg, service, conf));
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

function positionServices(db: ArchitectureDB, cy: cytoscape.Core) {
  cy.nodes().map((node, id) => {
    const data = node.data();
    if (data.type === 'group') return;
    data.x = node.position().x;
    data.y = node.position().y;
    console.log(`Position service (${data.id}): (${data.x}, ${data.y})`);

    const nodeElem = db.getElementById(data.id);
    nodeElem.attr('transform', 'translate(' + (data.x || 0) + ',' + (data.y || 0) + ')');
  });
}

function addEdges(lines: ArchitectureLine[], cy: cytoscape.Core) {
  lines.forEach((line) => {
    cy.add({
      group: 'edges',
      data: {
        id: `${line.lhs_id}-${line.rhs_id}`,
        source: line.lhs_id,
        sourceDir: line.lhs_dir,
        target: line.rhs_id,
        targetDir: line.rhs_dir,
      },
    });
  });
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
            'source-endpoint': '50% 50%',
            'target-endpoint': '50% 50%',
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
    const [horizontalAlignments, verticalAlignments] = (() => {
      const alignments = spatialMaps.map((spatialMap) => {
        const _horizontalAlignments: Record<number, string[]> = {};
        const _verticalAlignments: Record<number, string[]> = {};
        // Group service ids in an object with their x and y coordinate as the key
        Object.entries(spatialMap).forEach(([id, [x, y]]) => {
          if (!_horizontalAlignments[y]) _horizontalAlignments[y] = [];
          if (!_verticalAlignments[x]) _verticalAlignments[x] = [];
          _horizontalAlignments[y].push(id);
          _verticalAlignments[x].push(id);
        });
        // Merge the values of each object into a list if the inner list has at least 2 elements
        return {
          horiz: Object.values(_horizontalAlignments).filter((arr) => arr.length > 1),
          vert: Object.values(_verticalAlignments).filter((arr) => arr.length > 1),
        };
      });

      // Merge the alginment lists for each spatial map into one 2d array per axis
      return alignments.reduce(
        ([prevHoriz, prevVert], { horiz, vert }) => {
          return [
            [...prevHoriz, ...horiz],
            [...prevVert, ...vert],
          ];
        },
        [[] as string[][], [] as string[][]]
      );
    })();

    // Create the relative constraints for fcose by using an inverse of the spatial map and performing BFS on it
    const relativeConstraints = (() => {
      const _relativeConstraints: fcose.FcoseRelativePlacementConstraint[] = [];
      const posToStr = (pos: number[]) => `${pos[0]},${pos[1]}`;
      const strToPos = (pos: string) => pos.split(',').map((p) => parseInt(p));

      spatialMaps.forEach((spatialMap) => {
        const invSpatialMap = Object.fromEntries(
          Object.entries(spatialMap).map(([id, pos]) => [posToStr(pos), id])
        );
        console.log('===== invSpatialMap =====');
        console.log(invSpatialMap);

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
                  _relativeConstraints.push({
                    [ArchitectureDirectionName[dir as ArchitectureDirection]]: newId,
                    [ArchitectureDirectionName[
                      getOppositeArchitectureDirection(dir as ArchitectureDirection)
                    ]]: currId,
                    gap: 100,
                  });
                }
              });
            }
          }
        }
      });
      return _relativeConstraints;
    })();
    console.log(`Horizontal Alignments:`);
    console.log(horizontalAlignments);
    console.log(`Vertical Alignments:`);
    console.log(verticalAlignments);
    console.log(`Relative Alignments:`);
    console.log(relativeConstraints);

    cy.layout({
      name: 'fcose',
      quality: 'proof',
      styleEnabled: false,
      animate: false,
      nodeDimensionsIncludeLabels: true,
      // Adjust the edge parameters if it passes through the border of a group
      // Hacky fix for: https://github.com/iVis-at-Bilkent/cytoscape.js-fcose/issues/67
      idealEdgeLength(edge) {
        const [nodeA, nodeB] = edge.connectedNodes();
        const { parent: parentA } = nodeA.data();
        const { parent: parentB } = nodeB.data();
        const elasticity =
          parentA === parentB
            ? 1.25 * getConfigField('iconSize')
            : 0.5 * getConfigField('iconSize');
        return elasticity;
      },
      edgeElasticity(edge) {
        const [nodeA, nodeB] = edge.connectedNodes();
        console.log(nodeA.data());
        const { parent: parentA } = nodeA.data();
        const { parent: parentB } = nodeB.data();
        const elasticity = parentA === parentB ? 0.45 : 0.001;
        return elasticity;
      },
      alignmentConstraint: {
        horizontal: horizontalAlignments,
        vertical: verticalAlignments,
      },
      relativePlacementConstraint: relativeConstraints,
    } as FcoseLayoutOptions).run();
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
  const lines = db.getLines();
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

  drawServices(db, servicesElem, services, conf);

  const cy = await layoutArchitecture(services, groups, lines, ds);
  console.log(cy.nodes().map((node) => ({ a: node.data() })));

  drawEdges(edgesElem, cy);
  drawGroups(groupElem, cy);
  positionServices(db, cy);

  setupGraphViewbox(undefined, svg, getConfigField('padding'), getConfigField('useMaxWidth'));

  console.log('==============================================================');
};

export const renderer = { draw };
