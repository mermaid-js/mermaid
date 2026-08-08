import {
  type WireframeComponent,
  isWireframeSection,
  isFieldSet,
  isTitleWindow,
  isColumns,
  isContentTabs,
  isAccordion,
  isButton,
  isTextField,
  isTextArea,
  isSelectField,
  isComboBox,
  isCheckboxField,
  isCheckboxGroup,
  isRadioGroup,
  isHeading,
  isSubTitle,
  isParagraph,
  isList,
  isTree,
  isMenu,
  isIcon,
  isImageField,
  isVRule,
  isTabBar,
  isCanvas,
} from '@mermaid-js/parser';
import { LAYOUT_METRICS, type WireframeRenderNode } from './types.js';

const GAP_X = 12;

export function measureComponentHeight(
  comp: WireframeComponent,
  containerWidth: number
): { width: number; height: number } {
  if (isButton(comp)) {
    const metrics = LAYOUT_METRICS.button;
    const label = comp.label ?? 'Button';
    const btnWidth = Math.min(
      containerWidth,
      Math.max(metrics.minWidth, label.length * 8 + metrics.paddingX)
    );
    return { width: btnWidth, height: metrics.height };
  }

  if (isTextField(comp)) {
    const metrics = LAYOUT_METRICS.input;
    const hasLabel = Boolean(comp.label ?? comp.type);
    const fieldWidth = Math.min(metrics.maxWidth, containerWidth);
    return { width: fieldWidth, height: metrics.height + (hasLabel ? 20 : 0) };
  }

  if (isTextArea(comp)) {
    const metrics = LAYOUT_METRICS.textarea;
    const hasLabel = Boolean(comp.label);
    const fieldWidth = Math.min(metrics.maxWidth, containerWidth);
    const rowsHeight = (comp.rows ?? 3) * 20;
    return { width: fieldWidth, height: rowsHeight + (hasLabel ? 20 : 0) };
  }

  if (isSelectField(comp) || isComboBox(comp)) {
    const metrics = LAYOUT_METRICS.select;
    const fieldWidth = Math.min(metrics.maxWidth, containerWidth);
    return { width: fieldWidth, height: metrics.height };
  }

  if (isCheckboxField(comp)) {
    const metrics = LAYOUT_METRICS.checkbox;
    const label = comp.label ?? '';
    const width = Math.min(containerWidth, metrics.size + label.length * 8 + metrics.labelGap);
    return { width, height: metrics.size };
  }

  if (isCheckboxGroup(comp)) {
    const optionsCount = comp.options?.length ?? 0;
    const hasLabel = Boolean(comp.label);
    const height = (hasLabel ? 22 : 0) + optionsCount * 24;
    return { width: containerWidth, height: Math.max(28, height) };
  }

  if (isRadioGroup(comp)) {
    const optionsCount = comp.options?.length ?? 0;
    const hasLabel = Boolean(comp.label);
    const height = (hasLabel ? 22 : 0) + optionsCount * 24;
    return { width: containerWidth, height: Math.max(28, height) };
  }

  if (isHeading(comp) || isSubTitle(comp)) {
    const metrics = LAYOUT_METRICS.heading;
    return { width: containerWidth, height: metrics.height };
  }

  if (isParagraph(comp)) {
    const metrics = LAYOUT_METRICS.paragraph;
    return { width: containerWidth, height: metrics.height };
  }

  if (isList(comp)) {
    const itemsCount = comp.items?.length ?? 1;
    return { width: containerWidth, height: itemsCount * 22 };
  }

  if (isTree(comp)) {
    const nodesCount = comp.nodes?.length ?? 1;
    return { width: containerWidth, height: nodesCount * 22 };
  }

  if (isMenu(comp)) {
    const itemsCount = comp.items?.length ?? 1;
    return { width: Math.min(180, containerWidth), height: itemsCount * 26 + 8 };
  }

  if (isIcon(comp)) {
    const metrics = LAYOUT_METRICS.icon;
    return { width: metrics.size, height: metrics.size };
  }

  if (isImageField(comp)) {
    return { width: Math.min(300, containerWidth), height: 120 };
  }

  if (isVRule(comp)) {
    return { width: containerWidth, height: LAYOUT_METRICS.divider.height };
  }

  if (isTabBar(comp)) {
    return { width: containerWidth, height: LAYOUT_METRICS.tabBar.height };
  }

  if (isCanvas(comp)) {
    return { width: containerWidth, height: comp.height ?? 120 };
  }

  const defaultMetrics = LAYOUT_METRICS.defaultComponent;
  return {
    width: Math.min(defaultMetrics.maxWidth, containerWidth),
    height: defaultMetrics.height,
  };
}

export function computeWireframeLayout(
  components: WireframeComponent[],
  containerWidth: number,
  startX: number,
  startY: number,
  idMap = new Map<string, WireframeRenderNode>()
): { nodes: WireframeRenderNode[]; totalHeight: number } {
  const nodes: WireframeRenderNode[] = [];
  let currentY = startY;
  let currentRowMaxHeight = 0;

  for (const comp of components) {
    const initialSize = measureComponentHeight(comp, containerWidth);
    let x = startX;
    let y = currentY;

    // Resolve alignTo relative positioning
    if (comp.alignTo && idMap.has(comp.alignTo)) {
      const targetNode = idMap.get(comp.alignTo)!;
      x = targetNode.x + targetNode.width + GAP_X;
      y = targetNode.y;
    }

    let childNodes: WireframeRenderNode[] | undefined;
    let nodeWidth = initialSize.width;
    let nodeHeight = initialSize.height;

    // Handle container components recursively
    if (isWireframeSection(comp)) {
      const metrics = LAYOUT_METRICS.section;
      const headerHeight = comp.label ? metrics.headerHeight : 0;
      let childrenHeight = 0;

      if (comp.components && comp.components.length > 0) {
        const childRes = computeWireframeLayout(
          comp.components as unknown as WireframeComponent[],
          containerWidth - metrics.paddingX * 2,
          x + metrics.paddingX,
          y + headerHeight,
          idMap
        );
        childNodes = childRes.nodes;
        childrenHeight = childRes.totalHeight;
      }
      nodeWidth = containerWidth;
      nodeHeight = headerHeight + childrenHeight;
    } else if (isFieldSet(comp)) {
      const metrics = LAYOUT_METRICS.fieldset;
      const contentStartY = y + metrics.headerPaddingY;
      let childrenHeight: number = metrics.baseHeight;

      if (comp.components && comp.components.length > 0) {
        const childRes = computeWireframeLayout(
          comp.components as unknown as WireframeComponent[],
          containerWidth - metrics.paddingX * 2,
          x + metrics.paddingX,
          contentStartY,
          idMap
        );
        childNodes = childRes.nodes;
        childrenHeight = childRes.totalHeight;
      }
      nodeWidth = containerWidth;
      nodeHeight = childrenHeight + metrics.baseHeight;
    } else if (isTitleWindow(comp)) {
      const metrics = LAYOUT_METRICS.titleWindow;
      const contentStartY = y + metrics.titleBarHeight + 10;
      let childrenHeight: number = metrics.baseHeight;

      if (comp.components && comp.components.length > 0) {
        const childRes = computeWireframeLayout(
          comp.components as unknown as WireframeComponent[],
          containerWidth - metrics.paddingX * 2,
          x + metrics.paddingX,
          contentStartY,
          idMap
        );
        childNodes = childRes.nodes;
        childrenHeight = childRes.totalHeight;
      }
      nodeWidth = containerWidth;
      nodeHeight = metrics.titleBarHeight + childrenHeight + 16;
    } else if (isContentTabs(comp)) {
      const tabHeaderHeight = LAYOUT_METRICS.tabBar.height;
      let childrenHeight = 40;

      if (comp.tabBlocks && comp.tabBlocks.length > 0) {
        const activeBlock = comp.tabBlocks[comp.activeTab ?? 0] ?? comp.tabBlocks[0];
        if (activeBlock.components) {
          const childRes = computeWireframeLayout(
            activeBlock.components as unknown as WireframeComponent[],
            containerWidth - 20,
            x + 10,
            y + tabHeaderHeight + 10,
            idMap
          );
          childNodes = childRes.nodes;
          childrenHeight = childRes.totalHeight + 20;
        }
      }
      nodeWidth = containerWidth;
      nodeHeight = tabHeaderHeight + childrenHeight;
    } else if (isAccordion(comp)) {
      const headerHeight = 32;
      const isCollapsed = comp.collapsed ?? false;
      let childrenHeight = 0;

      if (!isCollapsed && comp.components && comp.components.length > 0) {
        const childRes = computeWireframeLayout(
          comp.components as unknown as WireframeComponent[],
          containerWidth - 20,
          x + 10,
          y + headerHeight + 10,
          idMap
        );
        childNodes = childRes.nodes;
        childrenHeight = childRes.totalHeight + 20;
      }
      nodeWidth = containerWidth;
      nodeHeight = headerHeight + childrenHeight;
    } else if (isColumns(comp)) {
      const cols = comp.cols ?? [];
      const numCols = Math.max(1, cols.length);
      const colWidth = (containerWidth - (numCols - 1) * GAP_X) / numCols;
      let maxColHeight = 0;
      const allColNodes: WireframeRenderNode[] = [];

      cols.forEach((col, colIdx) => {
        const colX = x + colIdx * (colWidth + GAP_X);
        if (col.components) {
          const childRes = computeWireframeLayout(
            col.components as unknown as WireframeComponent[],
            colWidth,
            colX,
            y,
            idMap
          );
          allColNodes.push(...childRes.nodes);
          maxColHeight = Math.max(maxColHeight, childRes.totalHeight);
        }
      });
      childNodes = allColNodes;
      nodeWidth = containerWidth;
      nodeHeight = maxColHeight;
    }

    const node: WireframeRenderNode = {
      astNode: comp,
      x,
      y,
      width: nodeWidth,
      height: nodeHeight,
      children: childNodes,
    };

    if (comp.id) {
      idMap.set(comp.id, node);
    }

    nodes.push(node);

    // If aligned, don't advance main Y, update row max height
    if (comp.alignTo && idMap.has(comp.alignTo)) {
      currentRowMaxHeight = Math.max(currentRowMaxHeight, y + nodeHeight - currentY);
    } else {
      currentY += Math.max(currentRowMaxHeight, nodeHeight) + 12; // Gap between components
      currentRowMaxHeight = 0;
    }
  }

  return { nodes, totalHeight: currentY - startY };
}
