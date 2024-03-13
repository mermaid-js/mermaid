import cytoscape from 'cytoscape';
import type { Diagram } from '../../Diagram.js';
import fcose, {FcoseLayoutOptions} from 'cytoscape-fcose';
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
import defaultConfig  from '../../defaultConfig.js';
import type { D3Element } from '../../mermaidAPI.js';
import { drawEdges, drawService, getEdgeThicknessCallback } from './svgDraw.js';

cytoscape.use(fcose);

function addServices(services: ArchitectureService[], cy: cytoscape.Core) {
  services.forEach((service) => {
    cy.add({
      group: 'nodes',
      data: {
        id: service.id,
        icon: service.icon,
        title: service.title,
        parent: service.in,
        // TODO: dynamic size
        width: 80,
        height: 80
      },
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
        id: group.id,
        icon: group.icon,
        title: group.title,
        parent: group.in
      },
    });
  });
}

function positionServices(db: ArchitectureDB, cy: cytoscape.Core) {
  cy.nodes().map((node, id) => {
    
    const data = node.data();
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
            'source-endpoint': '100% 100%',
            'target-endpoint': '100% 100%',
          },
        },
      ],
    });
    // Remove element after layout
    renderEl.remove();

    addGroups(groups, cy);
    addServices(services, cy);
    addEdges(lines, cy);

    // Make cytoscape care about the dimensions of the nodes
    cy.nodes().forEach(function (n) {
      n.layoutDimensions = () => {
        const data = n.data();
        return { w: data.width, h: data.height };
      };
    });

    cy.layout({
      name: 'fcose',
      quality: 'proof',
      styleEnabled: false,
      animate: false,
      alignmentConstraint: {
        horizontal: cy
          .edges()
          .filter(
            (edge) =>
              isArchitectureDirectionX(edge.data('sourceDir')) &&
              isArchitectureDirectionX(edge.data('targetDir'))
          )
          .map((edge) => [edge.data('source'), edge.data('target')]),
        vertical: cy
          .edges()
          .filter(
            (edge) =>
              isArchitectureDirectionY(edge.data('sourceDir')) &&
              isArchitectureDirectionY(edge.data('targetDir'))
          )
          .map((edge) => [edge.data('source'), edge.data('target')]),
      },
      relativePlacementConstraint: cy.edges().map((edge) => {
        const sourceDir = edge.data('sourceDir') as ArchitectureDirection;
        const targetDir = edge.data('targetDir') as ArchitectureDirection;
        const sourceId = edge.data('source') as ArchitectureDirection;
        const targetId = edge.data('target') as ArchitectureDirection;

        if (
            isArchitectureDirectionX(sourceDir) &&
            isArchitectureDirectionX(targetDir)
        ) {
            return {left: sourceDir === 'L' ? sourceId : targetId, right: sourceDir === 'R' ? sourceId : targetId, gap: 180}
        } else if (
            isArchitectureDirectionY(sourceDir) &&
            isArchitectureDirectionY(targetDir)
        ) {
            return {top: sourceDir === 'T' ? sourceId : targetId, bottom: sourceDir === 'B' ? sourceId : targetId, gap: 180}
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
  log.info('Services: ', services);
  log.info('Lines: ', lines);

  const svg: SVG = selectSvgElement(id);

  const edgesElem = svg.append('g');
  edgesElem.attr('class', 'architecture-edges');

  const servicesElem = svg.append('g');
  servicesElem.attr('class', 'architecture-services');

  drawServices(db, servicesElem, services, conf);
  const getEdgeThickness = getEdgeThicknessCallback(svg);

  const cy = await layoutArchitecture(services, groups, lines);

  const edgeThickness = getEdgeThickness();
  drawEdges(edgesElem, edgeThickness, cy);
  positionServices(db, cy);

  setupGraphViewbox(
    undefined,
    svg,
    conf.architecture?.padding ?? defaultConfig.architecture.padding,
    conf.architecture?.useMaxWidth ?? defaultConfig.architecture.useMaxWidth
  );


};

export const renderer = { draw };
