import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { WireframeDB } from './db.js';
import { LAYOUT_METRICS, type WireframeDiagramConfig, type WireframeRenderNode } from './types.js';
import { computeWireframeLayout } from './layout.js';
import { registry } from './renderers/index.js';
import type { ActionBar } from '@mermaid-js/parser';

import type { SVGGroupSelection } from './renderers/types.js';

const renderActionBar = (
  parentElem: SVGGroupSelection,
  actionBar: ActionBar,
  width: number,
  yPos: number
): number => {
  const metrics = LAYOUT_METRICS.actionBar;
  const bar = parentElem.append('g').attr('class', 'wireframe-action-bar-group');

  bar
    .append('rect')
    .attr('x', 0)
    .attr('y', yPos)
    .attr('width', width)
    .attr('height', metrics.height)
    .attr('class', 'wireframe-action-bar');

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

const renderNodesRecursive = (
  parentElem: SVGGroupSelection,
  nodes: WireframeRenderNode[],
  config: Required<WireframeDiagramConfig>
) => {
  for (const node of nodes) {
    registry.render({
      parentElem,
      node,
      config,
      renderChildNodes: (childParent, children) => {
        renderNodesRecursive(childParent, children, config);
      },
    });
  }
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

  // Pass 1: Compute Layout ( resolving coordinates, alignTo relative layout, container dimensions )
  if (components.length > 0) {
    const layout = computeWireframeLayout(components, width - 40, 20, currentY);

    // Pass 2: Modular SVG Render
    renderNodesRecursive(wireframeGroup, layout.nodes, config);

    currentY += layout.totalHeight + 20;
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
