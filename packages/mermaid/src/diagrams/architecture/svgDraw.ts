import type { D3Element } from '../../mermaidAPI.js';
import { createText } from '../../rendering-util/createText.js';
import type { ArchitectureDB, ArchitectureService } from './architectureTypes.js';
import type { MermaidConfig } from '../../config.type.js';
import type cytoscape from 'cytoscape';
import { log } from '../../logger.js';
import {getIcon, isIconNameInUse} from '../../rendering-util/svgRegister.js';

declare module 'cytoscape' {
  interface EdgeSingular {
    _private: {
      bodyBounds: unknown;
      rscratch: {
        startX: number;
        startY: number;
        midX: number;
        midY: number;
        endX: number;
        endY: number;
      };
    };
  }
}

/**
 * Creates a temporary path which can be used to compute the line thickness. 
 * @param root root element to add the temporary path to
 * @returns callback function which gets the bounding box dimensions and removes the path from root
 */
export const getEdgeThicknessCallback = function (root: D3Element) {
  const tempPath = root.insert('path')
  .attr(
    'd',
    `M 10,10 L 10,20`
  )
  .attr('class', 'edge')
  .attr('id', 'temp-thickness-edge');

  return () => {
    const dims = tempPath.node().getBBox();
    tempPath.remove();
    return dims.height as number;
  }
}

export const drawEdges = function (edgesEl: D3Element, edgeThickness: number, cy: cytoscape.Core) {
  cy.edges().map((edge, id) => {
    const data = edge.data();
    if (edge[0]._private.bodyBounds) {
      const bounds = edge[0]._private.rscratch;
      const translateX = bounds.startX === bounds.endX ? ((edgeThickness + 2) / 1.5) : 0;
      const translateY = bounds.startY === bounds.endY ? ((edgeThickness + 2) / 1.5) : 0;

    log.trace('Edge: ', id, data);
    edgesEl
      .insert('path')
      .attr(
        'd',
        `M ${bounds.startX},${bounds.startY} L ${bounds.midX},${bounds.midY} L${bounds.endX},${bounds.endY} `
      )
      .attr('class', 'edge')
      .attr(
        'transform',
        'translate(' + translateX + ', ' + translateY + ')'
      );
    }
  })
}

export const drawService = function (
  db: ArchitectureDB,
  elem: D3Element,
  service: ArchitectureService,
  conf: MermaidConfig
): number {
  const serviceElem = elem.append('g');

  if (service.title) {
      const textElem = serviceElem.append('g');
      createText(textElem, service.title, {
        useHtmlLabels: false,
        width: 80,
        classes: 'architecture-service-label',
      });
      textElem
      .attr('dy', '1em')
      .attr('alignment-baseline', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle');

      textElem.attr(
        'transform',
        'translate(' + 80 / 2 + ', ' + 80 + ')'
      );

  }

  let bkgElem = serviceElem.append('g');
  if (service.icon) {
    if (!isIconNameInUse(service.icon)) {
      throw new Error(`Invalid SVG Icon name: "${service.icon}"`)
    }
    bkgElem = getIcon(service.icon)?.(bkgElem);
  } else {
    bkgElem.append('path').attr('class', 'node-bkg').attr('id', 'node-' + service.id).attr(
      'd',
      `M0 ${80 - 0} v${-80 + 2 * 0} q0,-5 5,-5 h${
        80 - 2 * 0
      } q5,0 5,5 v${80 - 0} H0 Z`
    );
  }

  serviceElem.attr('class', 'architecture-service');

  const icon = serviceElem.append('foreignObject').attr('height', '80px').attr('width', '80px');
  icon.append('div').attr('class', 'icon-container').append('i').attr('class', 'service-icon fa fa-phone')

  db.setElementForId(service.id, serviceElem);
  return 0;
};
