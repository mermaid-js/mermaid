// TODO remove no-console
/* eslint-disable no-console */
import type { D3Element } from '../../mermaidAPI.js';
import { createText } from '../../rendering-util/createText.js';
import {
  ArchitectureDirectionArrow,
  type ArchitectureDB,
  type ArchitectureService,
  ArchitectureDirectionArrowShift,
  isArchitectureDirectionX,
  isArchitectureDirectionY,
  edgeData,
  nodeData,
  isArchitectureDirectionXY,
  getArchitectureDirectionPair,
  getArchitectureDirectionXYFactors,
  isArchitecturePairXY,
} from './architectureTypes.js';
import type cytoscape from 'cytoscape';
import { getIcon } from '../../rendering-util/svgRegister.js';
import { getConfigField } from './architectureDb.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';

export const drawEdges = function (edgesEl: D3Element, cy: cytoscape.Core) {
  const iconSize = getConfigField('iconSize');
  const arrowSize = iconSize / 6;
  const halfArrowSize = arrowSize / 2;

  cy.edges().map((edge, id) => {
    const { sourceDir, sourceArrow, targetDir, targetArrow, label } = edgeData(edge);
    const { x: startX, y: startY } = edge[0].sourceEndpoint();
    const { x: midX, y: midY } = edge[0].midpoint();
    const { x: endX, y: endY } = edge[0].targetEndpoint();
    if (edge[0]._private.rscratch) {
      const bounds = edge[0]._private.rscratch;

      const g = edgesEl.insert('g');

      g.insert('path')
        .attr('d', `M ${startX},${startY} L ${midX},${midY} L${endX},${endY} `)
        .attr('class', 'edge');

      if (sourceArrow) {
        const xShift = isArchitectureDirectionX(sourceDir)
          ? ArchitectureDirectionArrowShift[sourceDir](bounds.startX, arrowSize)
          : bounds.startX - halfArrowSize;
        const yShift = isArchitectureDirectionY(sourceDir)
          ? ArchitectureDirectionArrowShift[sourceDir](bounds.startY, arrowSize)
          : bounds.startY - halfArrowSize;

        g.insert('polygon')
          .attr('points', ArchitectureDirectionArrow[sourceDir](arrowSize))
          .attr('transform', `translate(${xShift},${yShift})`)
          .attr('class', 'arrow');
      }
      if (targetArrow) {
        const xShift = isArchitectureDirectionX(targetDir)
          ? ArchitectureDirectionArrowShift[targetDir](bounds.endX, arrowSize)
          : bounds.endX - halfArrowSize;
        const yShift = isArchitectureDirectionY(targetDir)
          ? ArchitectureDirectionArrowShift[targetDir](bounds.endY, arrowSize)
          : bounds.endY - halfArrowSize;

        g.insert('polygon')
          .attr('points', ArchitectureDirectionArrow[targetDir](arrowSize))
          .attr('transform', `translate(${xShift},${yShift})`)
          .attr('class', 'arrow');
      }

      if (label) {
        const axis = !isArchitectureDirectionXY(sourceDir, targetDir)
          ? isArchitectureDirectionX(sourceDir)
            ? 'X'
            : 'Y'
          : 'XY';

        let width = 0;
        if (axis === 'X') {
          width = Math.abs(startX - endX);
        } else if (axis === 'Y') {
          // Reduce width by a factor of 1.5 to avoid overlapping service labels
          width = Math.abs(startY - endY) / 1.5;
        } else {
          width = Math.abs(startX - endX) / 2;
        }

        const textElem = g.append('g');
        createText(
          textElem,
          label,
          {
            useHtmlLabels: false,
            width,
            classes: 'architecture-service-label',
          },
          getConfig()
        );

        textElem
          .attr('dy', '1em')
          .attr('alignment-baseline', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('text-anchor', 'middle');

        if (axis === 'X') {
          textElem.attr('transform', 'translate(' + midX + ', ' + midY + ')');
        } else if (axis === 'Y') {
          textElem.attr('transform', 'translate(' + midX + ', ' + midY + ') rotate(90)');
        } else if (axis === 'XY') {
          const pair = getArchitectureDirectionPair(sourceDir, targetDir);
          if (pair && isArchitecturePairXY(pair)) {
            const bboxOrig = textElem.node().getBoundingClientRect();
            const [x, y] = getArchitectureDirectionXYFactors(pair);

            textElem
              .attr('dominant-baseline', 'auto')
              .attr('transform', `rotate(${-1 * x * y * 45})`);

            // Calculate the new width/height with the rotation and transform to the proper position
            const bboxNew = textElem.node().getBoundingClientRect();
            textElem
              .attr('transform', `
                translate(${midX}, ${midY - (bboxOrig.height / 2)}) 
                translate(${x * bboxNew.width / 2}, ${y * bboxNew.height / 2}) 
                rotate(${-1 * x * y * 45}, 0, ${bboxOrig.height / 2})
              `);
          }
        }

      }
    }
  });
};

export const drawGroups = function (groupsEl: D3Element, cy: cytoscape.Core) {
  const iconSize = getConfigField('iconSize');
  const halfIconSize = iconSize / 2;

  cy.nodes().map((node, id) => {
    const data = nodeData(node);
    if (data.type === 'group') {
      const { h, w, x1, x2, y1, y2 } = node.boundingBox();
      console.log(`Draw group (${data.id}): pos=(${x1}, ${y1}), dim=(${w}, ${h})`);

      groupsEl
        .append('rect')
        .attr('x', x1 + halfIconSize)
        .attr('y', y1 + halfIconSize)
        .attr('width', w)
        .attr('height', h)
        .attr('class', 'node-bkg');

      if (data.label) {
        const textElem = groupsEl.append('g');
        createText(
          textElem,
          data.label,
          {
            useHtmlLabels: false,
            width: w,
            classes: 'architecture-service-label',
          },
          getConfig()
        );
        textElem
          .attr('dy', '1em')
          .attr('alignment-baseline', 'middle')
          .attr('dominant-baseline', 'start')
          .attr('text-anchor', 'start');

        textElem.attr(
          'transform',
          'translate(' + (x1 + halfIconSize + 4) + ', ' + (y1 + halfIconSize + 2) + ')'
        );
      }
    }
  });
};

export const drawServices = function (
  db: ArchitectureDB,
  elem: D3Element,
  services: ArchitectureService[]
): number {
  services.forEach((service) => {
    const serviceElem = elem.append('g');
    const iconSize = getConfigField('iconSize');

    if (service.title) {
      const textElem = serviceElem.append('g');
      createText(
        textElem,
        service.title,
        {
          useHtmlLabels: false,
          width: iconSize * 1.5,
          classes: 'architecture-service-label',
        },
        getConfig()
      );
      textElem
        .attr('dy', '1em')
        .attr('alignment-baseline', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle');

      textElem.attr('transform', 'translate(' + iconSize / 2 + ', ' + iconSize + ')');
    }

    let bkgElem = serviceElem.append('g');
    if (service.icon) {
      // TODO: should a warning be given to end-users saying which icon names are available?
      // if (!isIconNameInUse(service.icon)) {
      //   throw new Error(`Invalid SVG Icon name: "${service.icon}"`);
      // }
      bkgElem = getIcon(service.icon)?.(bkgElem, iconSize);
    } else {
      bkgElem
        .append('path')
        .attr('class', 'node-bkg')
        .attr('id', 'node-' + service.id)
        .attr(
          'd',
          `M0 ${iconSize} v${-iconSize} q0,-5 5,-5 h${iconSize} q5,0 5,5 v${iconSize} H0 Z`
        );
    }

    serviceElem.attr('class', 'architecture-service');

    const { width, height } = serviceElem._groups[0][0].getBBox();
    service.width = width;
    service.height = height;
    db.setElementForId(service.id, serviceElem);
  });
  return 0;
};
