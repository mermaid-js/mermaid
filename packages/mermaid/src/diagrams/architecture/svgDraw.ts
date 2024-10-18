import { getIconSVG } from '../../rendering-util/icons.js';
import type cytoscape from 'cytoscape';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { createText } from '../../rendering-util/createText.js';
import type { D3Element } from '../../types.js';
import { db, getConfigField } from './architectureDb.js';
import { architectureIcons } from './architectureIcons.js';
import {
  ArchitectureDirectionArrow,
  ArchitectureDirectionArrowShift,
  edgeData,
  getArchitectureDirectionPair,
  getArchitectureDirectionXYFactors,
  isArchitectureDirectionX,
  isArchitectureDirectionXY,
  isArchitectureDirectionY,
  isArchitecturePairXY,
  nodeData,
  type ArchitectureDB,
  type ArchitectureJunction,
  type ArchitectureService,
} from './architectureTypes.js';

export const drawEdges = async function (edgesEl: D3Element, cy: cytoscape.Core) {
  const padding = getConfigField('padding');
  const iconSize = getConfigField('iconSize');
  const halfIconSize = iconSize / 2;
  const arrowSize = iconSize / 6;
  const halfArrowSize = arrowSize / 2;

  await Promise.all(
    cy.edges().map(async (edge) => {
      const {
        source,
        sourceDir,
        sourceArrow,
        sourceGroup,
        target,
        targetDir,
        targetArrow,
        targetGroup,
        label,
      } = edgeData(edge);
      let { x: startX, y: startY } = edge[0].sourceEndpoint();
      const { x: midX, y: midY } = edge[0].midpoint();
      let { x: endX, y: endY } = edge[0].targetEndpoint();

      // Adjust the edge distance if it has the {group} modifier
      const groupEdgeShift = padding + 4;
      // +18 comes from the service label height that extends the padding on the bottom side of each group
      if (sourceGroup) {
        if (isArchitectureDirectionX(sourceDir)) {
          startX += sourceDir === 'L' ? -groupEdgeShift : groupEdgeShift;
        } else {
          startY += sourceDir === 'T' ? -groupEdgeShift : groupEdgeShift + 18;
        }
      }

      if (targetGroup) {
        if (isArchitectureDirectionX(targetDir)) {
          endX += targetDir === 'L' ? -groupEdgeShift : groupEdgeShift;
        } else {
          endY += targetDir === 'T' ? -groupEdgeShift : groupEdgeShift + 18;
        }
      }

      // Adjust the edge distance if it doesn't have the {group} modifier and the endpoint is a junction node
      if (!sourceGroup && db.getNode(source)?.type === 'junction') {
        if (isArchitectureDirectionX(sourceDir)) {
          startX += sourceDir === 'L' ? halfIconSize : -halfIconSize;
        } else {
          startY += sourceDir === 'T' ? halfIconSize : -halfIconSize;
        }
      }
      if (!targetGroup && db.getNode(target)?.type === 'junction') {
        if (isArchitectureDirectionX(targetDir)) {
          endX += targetDir === 'L' ? halfIconSize : -halfIconSize;
        } else {
          endY += targetDir === 'T' ? halfIconSize : -halfIconSize;
        }
      }

      if (edge[0]._private.rscratch) {
        // const bounds = edge[0]._private.rscratch;

        const g = edgesEl.insert('g');

        g.insert('path')
          .attr('d', `M ${startX},${startY} L ${midX},${midY} L${endX},${endY} `)
          .attr('class', 'edge');

        if (sourceArrow) {
          const xShift = isArchitectureDirectionX(sourceDir)
            ? ArchitectureDirectionArrowShift[sourceDir](startX, arrowSize)
            : startX - halfArrowSize;
          const yShift = isArchitectureDirectionY(sourceDir)
            ? ArchitectureDirectionArrowShift[sourceDir](startY, arrowSize)
            : startY - halfArrowSize;

          g.insert('polygon')
            .attr('points', ArchitectureDirectionArrow[sourceDir](arrowSize))
            .attr('transform', `translate(${xShift},${yShift})`)
            .attr('class', 'arrow');
        }
        if (targetArrow) {
          const xShift = isArchitectureDirectionX(targetDir)
            ? ArchitectureDirectionArrowShift[targetDir](endX, arrowSize)
            : endX - halfArrowSize;
          const yShift = isArchitectureDirectionY(targetDir)
            ? ArchitectureDirectionArrowShift[targetDir](endY, arrowSize)
            : endY - halfArrowSize;

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
          await createText(
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
            textElem.attr('transform', 'translate(' + midX + ', ' + midY + ') rotate(-90)');
          } else if (axis === 'XY') {
            const pair = getArchitectureDirectionPair(sourceDir, targetDir);
            if (pair && isArchitecturePairXY(pair)) {
              const bboxOrig = textElem.node().getBoundingClientRect();
              const [x, y] = getArchitectureDirectionXYFactors(pair);

              textElem
                .attr('dominant-baseline', 'auto')
                .attr('transform', `rotate(${-1 * x * y * 45})`);

              // Calculate the new width/height with the rotation applied, and transform to the proper position
              const bboxNew = textElem.node().getBoundingClientRect();
              textElem.attr(
                'transform',
                `
                translate(${midX}, ${midY - bboxOrig.height / 2})
                translate(${(x * bboxNew.width) / 2}, ${(y * bboxNew.height) / 2})
                rotate(${-1 * x * y * 45}, 0, ${bboxOrig.height / 2})
              `
              );
            }
          }
        }
      }
    })
  );
};

export const drawGroups = async function (groupsEl: D3Element, cy: cytoscape.Core) {
  const padding = getConfigField('padding');
  const groupIconSize = padding * 0.75;

  const fontSize = getConfigField('fontSize');

  const iconSize = getConfigField('iconSize');
  const halfIconSize = iconSize / 2;

  await Promise.all(
    cy.nodes().map(async (node) => {
      const data = nodeData(node);
      if (data.type === 'group') {
        const { h, w, x1, y1 } = node.boundingBox();

        groupsEl
          .append('rect')
          .attr('x', x1 + halfIconSize)
          .attr('y', y1 + halfIconSize)
          .attr('width', w)
          .attr('height', h)
          .attr('class', 'node-bkg');

        const groupLabelContainer = groupsEl.append('g');
        let shiftedX1 = x1;
        let shiftedY1 = y1;
        if (data.icon) {
          const bkgElem = groupLabelContainer.append('g');
          bkgElem.html(
            `<g>${await getIconSVG(data.icon, { height: groupIconSize, width: groupIconSize, fallbackPrefix: architectureIcons.prefix })}</g>`
          );
          bkgElem.attr(
            'transform',
            'translate(' +
              (shiftedX1 + halfIconSize + 1) +
              ', ' +
              (shiftedY1 + halfIconSize + 1) +
              ')'
          );
          shiftedX1 += groupIconSize;
          // TODO: test with more values
          // - 1 - 2 comes from the Y axis transform of the icon and label
          shiftedY1 += fontSize / 2 - 1 - 2;
        }
        if (data.label) {
          const textElem = groupLabelContainer.append('g');
          await createText(
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
            'translate(' +
              (shiftedX1 + halfIconSize + 4) +
              ', ' +
              (shiftedY1 + halfIconSize + 2) +
              ')'
          );
        }
      }
    })
  );
};

export const drawServices = async function (
  db: ArchitectureDB,
  elem: D3Element,
  services: ArchitectureService[]
): Promise<number> {
  for (const service of services) {
    const serviceElem = elem.append('g');
    const iconSize = getConfigField('iconSize');

    if (service.title) {
      const textElem = serviceElem.append('g');
      await createText(
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

    const bkgElem = serviceElem.append('g');
    if (service.icon) {
      // TODO: should a warning be given to end-users saying which icon names are available?
      // if (!isIconNameInUse(service.icon)) {
      //   throw new Error(`Invalid SVG Icon name: "${service.icon}"`);
      // }
      bkgElem.html(
        `<g>${await getIconSVG(service.icon, { height: iconSize, width: iconSize, fallbackPrefix: architectureIcons.prefix })}</g>`
      );
    } else if (service.iconText) {
      bkgElem.html(
        `<g>${await getIconSVG('blank', { height: iconSize, width: iconSize, fallbackPrefix: architectureIcons.prefix })}</g>`
      );
      const textElemContainer = bkgElem.append('g');
      const fo = textElemContainer
        .append('foreignObject')
        .attr('width', iconSize)
        .attr('height', iconSize);
      const divElem = fo
        .append('div')
        .attr('class', 'node-icon-text')
        .attr('style', `height: ${iconSize}px;`)
        .append('div')
        .html(service.iconText);
      const fontSize =
        parseInt(
          window
            .getComputedStyle(divElem.node(), null)
            .getPropertyValue('font-size')
            .replace(/\D/g, '')
        ) ?? 16;
      divElem.attr('style', `-webkit-line-clamp: ${Math.floor((iconSize - 2) / fontSize)};`);
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
  }
  return 0;
};

export const drawJunctions = function (
  db: ArchitectureDB,
  elem: D3Element,
  junctions: ArchitectureJunction[]
) {
  junctions.forEach((junction) => {
    const junctionElem = elem.append('g');
    const iconSize = getConfigField('iconSize');

    const bkgElem = junctionElem.append('g');
    bkgElem
      .append('rect')
      .attr('id', 'node-' + junction.id)
      .attr('fill-opacity', '0')
      .attr('width', iconSize)
      .attr('height', iconSize);

    junctionElem.attr('class', 'architecture-junction');

    const { width, height } = junctionElem._groups[0][0].getBBox();
    junctionElem.width = width;
    junctionElem.height = height;
    db.setElementForId(junction.id, junctionElem);
  });
};
