import type { DiagramRenderer, DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { WireframeDB } from './db.js';
import { LAYOUT_METRICS, type WireframeDiagramConfig, type WireframeRenderNode } from './types.js';
import { registry } from './renderers/index.js';
import type { ActionBar, WireframeComponent } from '@mermaid-js/parser';
import { isContentTabs } from '@mermaid-js/parser';
import { hasShowTabs } from './renderers/utils.js';
import { computeWireframeLayout, parseShowTabs } from './layout.js';
import type { SVGGroupSelection } from './renderers/types.js';

const renderActionBar = (
  parentElem: SVGGroupSelection,
  actionBar: ActionBar,
  width: number,
  yPos: number,
  xPos = 0
): number => {
  const metrics = LAYOUT_METRICS.actionBar;
  const bar = parentElem.append('g').attr('class', 'wireframe-action-bar-group');

  bar
    .append('rect')
    .attr('x', xPos)
    .attr('y', yPos)
    .attr('width', width)
    .attr('height', metrics.height)
    .attr('class', 'wireframe-action-bar');

  let xOffset = xPos + 10;
  if (actionBar.buttons) {
    const btnY = yPos + Math.round((metrics.height - metrics.buttonHeight) / 2);
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
        .attr('y', btnY)
        .attr('width', btnWidth)
        .attr('height', metrics.buttonHeight)
        .attr('class', btnClass);

      const textClass = isPrimary ? 'wireframe-text wireframe-text-primary' : 'wireframe-text';

      bar
        .append('text')
        .attr('x', xOffset + btnWidth / 2)
        .attr('y', btnY + metrics.buttonHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('class', textClass)
        .text(displayLabel);

      xOffset += btnWidth + metrics.gap;
    }
  }
  return metrics.height;
};

const renderNodesRecursive = (
  parentElem: SVGGroupSelection,
  nodes: WireframeRenderNode[],
  config: WireframeDiagramConfig
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

const getShowTabsCount = (components: WireframeComponent[]): number => {
  for (const comp of components) {
    if (isContentTabs(comp) && hasShowTabs(comp) && comp.tabs?.length) {
      return parseShowTabs(comp, comp.tabs.length).length;
    }
  }
  return 1;
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
  const gapX = config.gapX ?? 16;
  const numCanvases = Math.max(1, getShowTabsCount(components));

  const wireframeGroup = svg.append('g').attr('class', 'wireframe-main wireframe-sketch');

  const canvasPadding = config.padding ?? 15;
  let currentY = canvasPadding;

  let barHeight = 0;
  if (actionBar) {
    barHeight = LAYOUT_METRICS.actionBar.height;
    currentY += barHeight + LAYOUT_METRICS.actionBar.paddingY;
  }

  let totalLayoutHeight = 0;
  let layoutNodes: WireframeRenderNode[] = [];

  // Pass 1: Compute Layout ( resolving coordinates, alignTo relative layout, container dimensions )
  if (components.length > 0) {
    const layout = computeWireframeLayout(
      components,
      width - canvasPadding * 2,
      canvasPadding,
      currentY,
      new Map(),
      config
    );

    layoutNodes = layout.nodes;
    totalLayoutHeight = layout.totalHeight;
    currentY += layout.totalHeight + canvasPadding;
  }

  const totalHeight = Math.max(height, currentY);
  const totalWidth = numCanvases * width + (numCanvases - 1) * gapX;

  // Draw sketchy canvas background container rects for each multiplied canvas
  for (let c = 0; c < numCanvases; c++) {
    const canvasX = c * (width + gapX);

    wireframeGroup
      .append('rect')
      .attr('x', canvasX)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', totalHeight)
      .attr('class', 'wireframe-container');

    if (actionBar) {
      renderActionBar(wireframeGroup, actionBar, width, canvasPadding, canvasX);
    }
  }

  // Pass 2: Modular SVG Render
  if (layoutNodes.length > 0) {
    renderNodesRecursive(wireframeGroup, layoutNodes, config);
  }

  svg.attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
  configureSvgSize(svg, totalHeight, totalWidth, config.useMaxWidth);
};

export const renderer: DiagramRenderer = {
  draw,
};

export default renderer;
