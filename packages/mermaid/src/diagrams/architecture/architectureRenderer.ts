import cytoscape from 'cytoscape';
import type { Diagram } from '../../Diagram.js';
import fcose, { FcoseLayoutOptions } from 'cytoscape-fcose';
import type { MermaidConfig } from '../../config.type.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DrawDefinition, SVG } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import {
  isArchitectureDirectionX,
  type ArchitectureDB,
  type ArchitectureDirection,
  type ArchitectureGroup,
  type ArchitectureLine,
  type ArchitectureService,
  isArchitectureDirectionY,
} from './architectureTypes.js';
import { select } from 'd3';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import defaultConfig from '../../defaultConfig.js';
import type { D3Element } from '../../mermaidAPI.js';
import { drawEdges, drawGroups, drawService } from './svgDraw.js';

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
        // TODO: dynamic size
        width: 80,
        height: 80,
      },
      classes: 'node-service'
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
        parent: group.in
      },
      classes: 'node-group'
    });
  });
}

function positionServices(db: ArchitectureDB, cy: cytoscape.Core) {
  cy.nodes().map((node, id) => {

    const data = node.data();
    if (data.type === 'group') return;
    data.x = node.position().x;
    data.y = node.position().y;

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
  lines: ArchitectureLine[]
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
          }
        },
        {
          selector: 'node[label]',
          style: {
            'text-valign': 'bottom',
            'text-halign': 'center',
            'font-size': '16px',
          }
        },
        {
          selector: '.node-service',
          style: {
            'label': 'data(label)',
            'width': 'data(width)',
            'height': 'data(height)',
          }
        },
        {
          selector: '.node-group',
          style: {
            //@ts-ignore
            "padding": '30px'
          }
        }
      ],
    });
    // Remove element after layout
    renderEl.remove();

    addGroups(groups, cy);
    addServices(services, cy);
    addEdges(lines, cy);   

    /**
     * Merge alignment pairs together if they share a common node.
     * 
     * Example: [["a", "b"], ["b", "c"], ["d", "e"]] -> [["a", "b", "c"], ["d", "e"]]
     */
    const mergeAlignments = (orig: string[][]): string[][] => {
      console.log('Start: ', orig);
      // Mapping of discovered ids to their index in the new alignment array
      const map: Record<string, number> = {};
      const newAlignments: string[][] = [orig[0]];
      map[orig[0][0]] = 0;
      map[orig[0][1]] = 0;
      orig = orig.slice(1);
      while (orig.length > 0) {
        const pair = orig[0];
        const pairLHSIdx = map[pair[0]];
        const pairRHSIdx = map[pair[1]];
        console.log(pair);
        console.log(map);
        console.log(newAlignments);
        // If neither id appears in the new array, add the pair to the new array
        if (pairLHSIdx === undefined && pairRHSIdx === undefined) {
          newAlignments.push(pair);
          map[pair[0]] = newAlignments.length - 1;
          map[pair[1]] = newAlignments.length - 1;
          // If the LHS of the pair doesn't appear in the new array, add the LHS to the existing array it shares an id with
        } else if (pairLHSIdx === undefined) {
          newAlignments[pairRHSIdx].push(pair[0]);
          map[pair[0]] = pairRHSIdx;
          // If the RHS of the pair doesn't appear in the new array, add the RHS to the existing array it shares an id with
        } else if (pairRHSIdx === undefined) {
          newAlignments[pairLHSIdx].push(pair[1]);
          map[pair[1]] = pairLHSIdx;
          // If both ids already have been added to the new array and their index is different, merge all 3 arrays
        } else if (pairLHSIdx != pairRHSIdx) {
          console.log('ELSE');
          newAlignments.push(pair);
        }
        orig = orig.slice(1);
      }

      console.log('End: ', newAlignments);
      return newAlignments;
    }

    const horizontalAlignments = cy
      .edges()
      .filter(
        (edge) =>
          isArchitectureDirectionX(edge.data('sourceDir')) &&
          isArchitectureDirectionX(edge.data('targetDir'))
      )
      .map((edge) => [edge.data('source'), edge.data('target')]);

    const verticalAlignments = cy
      .edges()
      .filter(
        (edge) =>
          isArchitectureDirectionY(edge.data('sourceDir')) &&
          isArchitectureDirectionY(edge.data('targetDir'))
      )
      .map((edge) => [edge.data('source'), edge.data('target')]);

    cy.layout({
      name: 'fcose',
      quality: 'proof',
      styleEnabled: false,
      animate: false,
      nodeDimensionsIncludeLabels: true,
      alignmentConstraint: {
        horizontal: mergeAlignments(horizontalAlignments),
        vertical: mergeAlignments(verticalAlignments)
      },
      relativePlacementConstraint: cy.edges().map((edge) => {
        const sourceDir = edge.data('sourceDir') as ArchitectureDirection;
        const targetDir = edge.data('targetDir') as ArchitectureDirection;
        const sourceId = edge.data('source') as string;
        const targetId = edge.data('target') as string;

        if (
          isArchitectureDirectionX(sourceDir) &&
          isArchitectureDirectionX(targetDir)
        ) {
          return { left: sourceDir === 'R' ? sourceId : targetId, right: sourceDir === 'L' ? sourceId : targetId, gap: 180 }
        } else if (
          isArchitectureDirectionY(sourceDir) &&
          isArchitectureDirectionY(targetDir)
        ) {
          return { top: sourceDir === 'B' ? sourceId : targetId, bottom: sourceDir === 'T' ? sourceId : targetId, gap: 180 }
        }
        // TODO: fallback case + RB, TL, etc

      }),
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

  const cy = await layoutArchitecture(services, groups, lines);

  drawEdges(edgesElem, cy);
  drawGroups(groupElem, cy);
  positionServices(db, cy);

  setupGraphViewbox(
    undefined,
    svg,
    conf.architecture?.padding ?? defaultConfig.architecture.padding,
    conf.architecture?.useMaxWidth ?? defaultConfig.architecture.useMaxWidth
  );


};

export const renderer = { draw };
