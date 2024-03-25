import type { D3Element } from '../../mermaidAPI.js';
import { createText } from '../../rendering-util/createText.js';
import type {
  ArchitectureDB,
  ArchitectureService,
} from './architectureTypes.js';
import type { MermaidConfig } from '../../config.type.js';
import type cytoscape from 'cytoscape';
import { log } from '../../logger.js';
import { getIcon, isIconNameInUse } from '../../rendering-util/svgRegister.js';
import { getConfigField } from './architectureDb.js';

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
  interface NodeSingular {
    _private: {
      bodyBounds: {
        h: number;
        w: number;
        x1: number;
        x2: number;
        y1: number;
        y2: number;
      };
      children: cytoscape.NodeSingular[];
    };
    data: () =>
      | {
          type: 'service';
          id: string;
          icon?: string;
          label?: string;
          parent?: string;
          width: number;
          height: number;
          [key: string]: any;
        }
      | {
          type: 'group';
          id: string;
          icon?: string;
          label?: string;
          parent?: string;
          [key: string]: any;
        };
  }
}

export const drawEdges = function (edgesEl: D3Element, cy: cytoscape.Core) {
  cy.edges().map((edge, id) => {
    const data = edge.data();
    if (edge[0]._private.bodyBounds) {
      const bounds = edge[0]._private.rscratch;

      log.trace('Edge: ', id, data);
      edgesEl
        .insert('path')
        .attr(
          'd',
          `M ${bounds.startX},${bounds.startY} L ${bounds.midX},${bounds.midY} L${bounds.endX},${bounds.endY} `
        )
        .attr('class', 'edge');
    }
  });
};

export const drawGroups = function (groupsEl: D3Element, cy: cytoscape.Core) {
  const iconSize = getConfigField('iconSize')
  const halfIconSize = iconSize / 2

  cy.nodes().map((node, id) => {
    const data = node.data();
    if (data.type === 'group') {
      const { h, w, x1, x2, y1, y2 } = node.boundingBox();
      let bkgElem = groupsEl
        .append('rect')
        .attr('x', x1 + halfIconSize)
        .attr('y', y1 + halfIconSize)
        .attr('width', w)
        .attr('height', h)
        .attr('class', 'node-bkg');

      const textElem = groupsEl.append('g');
      createText(textElem, data.label, {
        useHtmlLabels: false,
        width: w,
        classes: 'architecture-service-label',
      });
      textElem
        .attr('dy', '1em')
        .attr('alignment-baseline', 'middle')
        .attr('dominant-baseline', 'start')
        .attr('text-anchor', 'start');

      textElem.attr('transform', 'translate(' + (x1 + halfIconSize + 4) + ', ' + (y1 + halfIconSize + 2) + ')');
    }
  });
};

export const drawService = function (
  db: ArchitectureDB,
  elem: D3Element,
  service: ArchitectureService,
  conf: MermaidConfig
): number {
  const serviceElem = elem.append('g');
  const iconSize = getConfigField('iconSize')

  if (service.title) {
    const textElem = serviceElem.append('g');
    createText(textElem, service.title, {
      useHtmlLabels: false,
      width: 110,
      classes: 'architecture-service-label',
    });
    textElem
      .attr('dy', '1em')
      .attr('alignment-baseline', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle');

    textElem.attr(
      'transform',
      // TODO: dynamic size
      'translate(' + (iconSize / 2) + ', ' + iconSize + ')'
    );
  }

  let bkgElem = serviceElem.append('g');
  if (service.icon) {
    if (!isIconNameInUse(service.icon)) {
      throw new Error(`Invalid SVG Icon name: "${service.icon}"`);
    }
    bkgElem = getIcon(service.icon)?.(bkgElem, iconSize);
  } else {
    bkgElem
      .append('path')
      .attr('class', 'node-bkg')
      .attr('id', 'node-' + service.id)
      .attr('d', `M0 ${iconSize - 0} v${-iconSize + 2 * 0} q0,-5 5,-5 h${iconSize - 2 * 0} q5,0 5,5 v${iconSize - 0} H0 Z`);
  }

  serviceElem.attr('class', 'architecture-service');

  const { width, height } = serviceElem._groups[0][0].getBBox();
  service.width = width;
  service.height = height;

  db.setElementForId(service.id, serviceElem);
  return 0;
};
