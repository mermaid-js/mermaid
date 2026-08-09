import {
  isWireframeSection,
  isFieldSet,
  isTitleWindow,
  isColumns,
  isColBlock,
  isContentTabs,
  isTabPane,
  isAccordion,
  isTabBar,
  type WireframeSection,
  type FieldSet,
  type TitleWindow,
  type Columns,
  type ColBlock,
  type ContentTabs,
  type TabPane,
  type Accordion,
  type TabBar,
} from '@mermaid-js/parser';
import type { ComponentRenderer } from './types.js';
import { drawBox, drawText, drawTabStrip, hasShowTabs, resolveActiveTabIdx } from './utils.js';

export const sectionRenderer: ComponentRenderer<WireframeSection> = {
  type: 'WireframeSection',
  guard: isWireframeSection,
  render: ({ parentElem, node, renderChildNodes }) => {
    const { x, y, width, height, astNode, children } = node;
    const title = astNode.label ?? '';
    const headerHeight = title ? 28 : 0;

    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-section');

    // Outer container frame
    drawBox(g, x, y, width, height, 'wireframe-container');

    if (title) {
      // Header strip with rounded top corners matching container rx: 6px
      g.append('path')
        .attr(
          'd',
          `M ${x + 1} ${y + headerHeight} L ${x + 1} ${y + 6} Q ${x + 1} ${y + 1} ${x + 6} ${y + 1} L ${x + width - 6} ${y + 1} Q ${x + width - 1} ${y + 1} ${x + width - 1} ${y + 6} L ${x + width - 1} ${y + headerHeight} Z`
        )
        .attr('class', 'wireframe-section-header');

      g.append('line')
        .attr('x1', x)
        .attr('y1', y + headerHeight)
        .attr('x2', x + width)
        .attr('y2', y + headerHeight)
        .attr('class', 'wireframe-section-divider');

      drawText(
        g,
        title,
        x + 12,
        y + headerHeight / 2 + 4,
        'wireframe-text wireframe-container-title',
        'start'
      );
    }

    if (children?.length) {
      renderChildNodes(g, children);
    }
  },
};

export const fieldSetRenderer: ComponentRenderer<FieldSet> = {
  type: 'FieldSet',
  guard: isFieldSet,
  render: ({ parentElem, node, renderChildNodes }) => {
    const { x, y, width, height, astNode, children } = node;
    const legend = astNode.label ?? '';
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-fieldset');

    drawBox(g, x, y, width, height, 'wireframe-container');

    if (legend) {
      const paddingX = 12;
      const legendWidth = Math.max(40, legend.length * 8.5 + paddingX * 2);
      const legendX = x + 12;
      const legendY = y - 10;

      // Legend badge sitting on top of the fieldset border
      g.append('rect')
        .attr('x', legendX)
        .attr('y', legendY)
        .attr('width', legendWidth)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('class', 'wireframe-fieldset-legend-bg');

      drawText(
        g,
        legend,
        legendX + legendWidth / 2,
        y + 5,
        'wireframe-text wireframe-container-title',
        'middle'
      );
    }

    if (children?.length) {
      renderChildNodes(g, children);
    }
  },
};

export const titleWindowRenderer: ComponentRenderer<TitleWindow> = {
  type: 'TitleWindow',
  guard: isTitleWindow,
  render: ({ parentElem, node, renderChildNodes }) => {
    const { x, y, width, height, astNode, children } = node;
    const title = astNode.label ?? 'Window';
    const titleBarHeight = 28;
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-titlewindow');

    // Outer container
    drawBox(g, x, y, width, height, 'wireframe-container');

    // Title bar background
    g.append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', titleBarHeight)
      .attr('class', 'wireframe-title-bar');

    // Window controls (close, minimize, maximize dots)
    const dotColors = ['#ff5f56', '#ffbd2e', '#27c93f'];
    dotColors.forEach((color, idx) => {
      g.append('circle')
        .attr('cx', x + 12 + idx * 14)
        .attr('cy', y + titleBarHeight / 2)
        .attr('r', 4.5)
        .style('fill', color);
    });

    // Window Title
    drawText(
      g,
      title,
      x + width / 2,
      y + titleBarHeight / 2 + 4,
      'wireframe-text wireframe-bold',
      'middle'
    );

    if (children?.length) {
      renderChildNodes(g, children);
    }
  },
};

export const columnsRenderer: ComponentRenderer<Columns> = {
  type: 'Columns',
  guard: isColumns,
  render: ({ parentElem, node, renderChildNodes }) => {
    const { children } = node;
    if (children?.length) {
      renderChildNodes(parentElem, children);
    }
  },
};

export const contentTabsRenderer: ComponentRenderer<ContentTabs> = {
  type: 'ContentTabs',
  guard: isContentTabs,
  render: ({ parentElem, node, renderChildNodes }) => {
    const { x, y, width, height, astNode, children } = node;

    if (hasShowTabs(astNode) && children?.length) {
      const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-show-tabs-group');
      renderChildNodes(g, children);
      return;
    }

    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-content-tabs');

    const tabHeight = 30;
    const tabs = astNode.tabs ?? [];
    const activeIdx = resolveActiveTabIdx(astNode, tabs.length);

    drawTabStrip(g, tabs, activeIdx, x, y, tabHeight);

    // Tab pane container box below
    drawBox(g, x, y + tabHeight, width, height - tabHeight, 'wireframe-container');

    if (children?.length) {
      renderChildNodes(g, children);
    }
  },
};

export const accordionRenderer: ComponentRenderer<Accordion> = {
  type: 'Accordion',
  guard: isAccordion,
  render: ({ parentElem, node, renderChildNodes }) => {
    const { x, y, width, height, astNode, children } = node;

    const title = astNode.label ?? 'Accordion';
    const isCollapsed = astNode.collapsed ?? false;
    const headerHeight = 32;

    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-accordion');

    // Header box
    drawBox(g, x, y, width, headerHeight, 'wireframe-container');
    const arrowChar = isCollapsed ? '▶' : '▼';
    drawText(g, `${arrowChar} ${title}`, x + 10, y + 20, 'wireframe-text wireframe-bold');

    if (!isCollapsed && children?.length) {
      drawBox(g, x, y + headerHeight, width, height - headerHeight, 'wireframe-container');
      renderChildNodes(g, children);
    }
  },
};

export const tabBarRenderer: ComponentRenderer<TabBar> = {
  type: 'TabBar',
  guard: isTabBar,
  render: ({ parentElem, node }) => {
    const { x, y, astNode } = node;
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-tabbar');
    const tabHeight = 32;
    const tabs = astNode.tabs ?? [];
    const activeIdx = resolveActiveTabIdx(astNode, tabs.length);

    drawTabStrip(g, tabs, activeIdx, x, y, tabHeight);
  },
};

export const colBlockRenderer: ComponentRenderer<ColBlock> = {
  type: 'ColBlock',
  guard: isColBlock,
  render: ({ parentElem, node, renderChildNodes }) => {
    const { children } = node;
    if (children?.length) {
      renderChildNodes(parentElem, children);
    }
  },
};

export const tabPaneRenderer: ComponentRenderer<TabPane> = {
  type: 'TabPane',
  guard: isTabPane,
  render: ({ parentElem, node, renderChildNodes }) => {
    const { children } = node;
    if (children?.length) {
      renderChildNodes(parentElem, children);
    }
  },
};
