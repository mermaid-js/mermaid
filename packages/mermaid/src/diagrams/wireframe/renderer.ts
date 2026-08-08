/* cspell:words actionbar */
import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { WireframeDB } from './db.js';
import { LAYOUT_METRICS } from './types.js';
import {
  type WireframeComponent,
  type ActionBar,
  isWireframeSection,
  isFieldSet,
  isButton,
  isTextField,
  isHeading,
  isParagraph,
} from '@mermaid-js/parser';

const renderActionBar = (
  parentElem: any,
  actionBar: ActionBar,
  width: number,
  yPos: number
): number => {
  const metrics = LAYOUT_METRICS.actionBar;
  const bar = parentElem.append('g').attr('class', 'wireframe-actionbar-group');

  bar
    .append('rect')
    .attr('x', 0)
    .attr('y', yPos)
    .attr('width', width)
    .attr('height', metrics.height)
    .attr('class', 'wireframe-actionbar');

  let xOffset = 10;
  if (actionBar.buttons) {
    for (const btn of actionBar.buttons) {
      const label = btn.label ?? '';
      const btnWidth = Math.max(metrics.minButtonWidth, label.length * 8 + 16);
      const isPrimary = label.startsWith('*');
      const displayLabel = isPrimary ? label.slice(1).trim() : label;
      const btnClass = isPrimary
        ? 'wireframe-action-button wireframe-action-button-primary'
        : 'wireframe-action-button';

      bar
        .append('rect')
        .attr('x', xOffset)
        .attr('y', yPos + 6)
        .attr('width', btnWidth)
        .attr('height', metrics.buttonHeight)
        .attr('class', btnClass);

      bar
        .append('text')
        .attr('x', xOffset + btnWidth / 2)
        .attr('y', yPos + 23)
        .attr('text-anchor', 'middle')
        .attr('class', 'wireframe-text')
        .style('fill', isPrimary ? '#ffffff' : '#333333')
        .text(displayLabel);

      xOffset += btnWidth + metrics.gap;
    }
  }
  return metrics.height;
};

const renderComponents = (
  parentElem: any,
  components: WireframeComponent[],
  startX: number,
  startY: number,
  containerWidth: number
): number => {
  let currentY = startY;

  for (const comp of components) {
    const compGroup = parentElem
      .append('g')
      .attr('class', `wireframe-comp wireframe-${comp.$type.toLowerCase()}`);

    if (isWireframeSection(comp)) {
      const metrics = LAYOUT_METRICS.section;
      const title = comp.label ?? '';
      compGroup
        .append('text')
        .attr('x', startX)
        .attr('y', currentY + metrics.titleOffsetY)
        .attr('class', 'wireframe-text wireframe-container-title')
        .text(title);
      currentY += metrics.headerHeight;

      if (comp.components && comp.components.length > 0) {
        const childHeight = renderComponents(
          parentElem,
          comp.components as unknown as WireframeComponent[],
          startX + metrics.paddingX,
          currentY,
          containerWidth - metrics.paddingX * 2
        );
        currentY += childHeight;
      }
    } else if (isFieldSet(comp)) {
      const metrics = LAYOUT_METRICS.fieldset;
      const legend = comp.label ?? '';
      const fieldsetGroup = parentElem.append('g');
      const contentStartY = currentY + metrics.headerPaddingY;
      let childHeight: number = metrics.baseHeight;

      if (comp.components && comp.components.length > 0) {
        childHeight = renderComponents(
          fieldsetGroup,
          comp.components as unknown as WireframeComponent[],
          startX + metrics.paddingX,
          contentStartY,
          containerWidth - metrics.paddingX * 2
        );
      }
      const totalHeight = childHeight + metrics.baseHeight;
      fieldsetGroup
        .append('rect')
        .attr('x', startX)
        .attr('y', currentY)
        .attr('width', containerWidth)
        .attr('height', totalHeight)
        .attr('class', 'wireframe-container');

      if (legend) {
        fieldsetGroup
          .append('text')
          .attr('x', startX + 12)
          .attr('y', currentY + metrics.legendOffsetY)
          .attr('class', 'wireframe-text wireframe-container-title')
          .text(legend);
      }
      currentY += totalHeight + metrics.gapY;
    } else if (isButton(comp)) {
      const metrics = LAYOUT_METRICS.button;
      const label = comp.label ?? 'Button';
      const isPrimary = comp.primary ?? false;
      const btnWidth = Math.max(metrics.minWidth, label.length * 8 + metrics.paddingX);

      compGroup
        .append('rect')
        .attr('x', startX)
        .attr('y', currentY)
        .attr('width', btnWidth)
        .attr('height', metrics.height)
        .attr(
          'class',
          isPrimary ? 'wireframe-button wireframe-button-primary' : 'wireframe-button'
        );

      compGroup
        .append('text')
        .attr('x', startX + btnWidth / 2)
        .attr('y', currentY + 20)
        .attr('text-anchor', 'middle')
        .attr('class', 'wireframe-text')
        .style('fill', isPrimary ? '#ffffff' : '#333333')
        .text(label);

      currentY += metrics.height + metrics.gapY;
    } else if (isTextField(comp)) {
      const metrics = LAYOUT_METRICS.input;
      const label = comp.label ?? comp.type ?? comp.$type;
      const fieldWidth = Math.min(metrics.maxWidth, containerWidth);

      if (label) {
        compGroup
          .append('text')
          .attr('x', startX)
          .attr('y', currentY + metrics.labelOffsetY)
          .attr('class', 'wireframe-text')
          .text(label);
        currentY += 20;
      }

      compGroup
        .append('rect')
        .attr('x', startX)
        .attr('y', currentY)
        .attr('width', fieldWidth)
        .attr('height', metrics.height)
        .attr('class', 'wireframe-input');

      currentY += metrics.height + metrics.gapY;
    } else if (isHeading(comp)) {
      const metrics = LAYOUT_METRICS.heading;
      const text = comp.label ?? '';
      compGroup
        .append('text')
        .attr('x', startX)
        .attr('y', currentY + metrics.offsetY)
        .attr('class', 'wireframe-text')
        .style('font-size', `${metrics.fontSize}px`)
        .style('font-weight', 'bold')
        .text(text);
      currentY += metrics.height;
    } else if (isParagraph(comp)) {
      const metrics = LAYOUT_METRICS.paragraph;
      const text = comp.label ?? '';
      compGroup
        .append('text')
        .attr('x', startX)
        .attr('y', currentY + metrics.offsetY)
        .attr('class', 'wireframe-text')
        .text(text);
      currentY += metrics.height;
    } else {
      const metrics = LAYOUT_METRICS.defaultComponent;
      const label = comp.label ?? comp.$type;
      compGroup
        .append('rect')
        .attr('x', startX)
        .attr('y', currentY)
        .attr('width', Math.min(metrics.maxWidth, containerWidth))
        .attr('height', metrics.height)
        .attr('class', 'wireframe-container');

      compGroup
        .append('text')
        .attr('x', startX + metrics.textPaddingX)
        .attr('y', currentY + metrics.textOffsetY)
        .attr('class', 'wireframe-text')
        .text(label);

      currentY += metrics.gapY;
    }
  }

  return currentY - startY;
};

const draw: DrawDefinition = (text, id, _ver, diagObj) => {
  log.debug('Rendering wireframe diagram:\n' + text);

  const db = diagObj.db as WireframeDB;
  const config = db.getConfig();
  const dimensions = db.getCanvasDimensions();
  const actionBar = db.getActionBar();
  const components = db.getComponents();

  const svg = selectSvgElement(id);

  const width = dimensions.width;
  const height = dimensions.height;

  const wireframeGroup = svg.append('g').attr('class', 'wireframe-main wireframe-sketch');

  // Draw sketchy canvas background container
  wireframeGroup
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'wireframe-container');

  let currentY = 10;

  // Render Action Bar
  if (actionBar) {
    const barHeight = renderActionBar(wireframeGroup, actionBar, width, currentY);
    currentY += barHeight + LAYOUT_METRICS.actionBar.paddingY;
  }

  // Render Component Hierarchy
  if (components.length > 0) {
    const renderedHeight = renderComponents(wireframeGroup, components, 20, currentY, width - 40);
    currentY += renderedHeight + 20;
  }

  const totalHeight = Math.max(height, currentY);
  const totalWidth = width;

  svg.attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
  configureSvgSize(svg, totalHeight, totalWidth, config.useMaxWidth);
};

export const renderer: DiagramRenderer = {
  draw,
};

export default renderer;
