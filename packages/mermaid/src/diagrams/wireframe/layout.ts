import {
  type WireframeComponent,
  type ContentTabs,
  isWireframeSection,
  isFieldSet,
  isTitleWindow,
  isColumns,
  isColBlock,
  isContentTabs,
  isTabPane,
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
import { LAYOUT_METRICS, type WireframeRenderNode, type WireframeDiagramConfig } from './types.js';
import { hasShowTabs, resolveActiveTabIdx } from './renderers/utils.js';

export function measureComponentHeight(
  comp: WireframeComponent,
  containerWidth: number
): { width: number; height: number } {
  if (isButton(comp)) {
    const metrics = LAYOUT_METRICS.button;
    const label = comp.label ?? 'Button';
    const btnWidth = Math.min(
      containerWidth,
      Math.max(metrics.minWidth, label.length * 8.5 + metrics.paddingX * 2)
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

  if (isHeading(comp) || isSubTitle(comp) || (comp as { $type?: string }).$type === 'SubTitle' || (comp as { $type?: string }).$type === 'Heading') {
    const metrics = LAYOUT_METRICS.heading;
    return { width: containerWidth, height: metrics.height };
  }

  if (
    isParagraph(comp) ||
    (comp as { $type?: string }).$type === 'Paragraph' ||
    (comp as { $type?: string }).$type === 'Label' ||
    (comp as { $type?: string }).$type === 'RichText' ||
    (comp as { $type?: string }).$type === 'TextElement'
  ) {
    const metrics = LAYOUT_METRICS.paragraph;
    return { width: containerWidth, height: metrics.height };
  }

  if (isList(comp)) {
    const itemsCount = comp.items?.length ?? 1;
    return { width: containerWidth, height: itemsCount * 22 };
  }

  if (isTree(comp)) {
    let lineCount = 0;
    if (comp.nodes) {
      for (const node of comp.nodes) {
        lineCount++;
        const hasChildren = Boolean(node.children && node.children.length > 0);
        const isExpanded = hasChildren && node.expanded !== false;
        if (hasChildren && isExpanded && node.children) {
          lineCount += node.children.length;
        }
      }
    }
    return { width: containerWidth, height: Math.max(1, lineCount) * 22 };
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\da-z]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseShowTabs(comp: ContentTabs, totalTabs: number): number[] {
  if (comp.showTabsValue) {
    const items = Array.isArray(comp.showTabsValue) ? comp.showTabsValue : [comp.showTabsValue];
    const rawTargets = items
      .flatMap((item) => String(item).replace(/["']/g, '').split(','))
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (rawTargets.length > 0) {
      const selectedIndices: number[] = [];
      const tabs = comp.tabs ?? [];
      const tabBlocks = comp.tabBlocks ?? [];

      rawTargets.forEach((targetKey) => {
        const targetSlug = slugify(targetKey);
        const numericVal = parseInt(targetKey, 10);

        for (let idx = 0; idx < totalTabs; idx++) {
          const tabLabel = tabs[idx]?.value ?? tabBlocks[idx]?.label ?? `Tab ${idx + 1}`;
          const tabSlug = slugify(tabLabel);
          const explicitId = tabBlocks[idx]?.id?.toLowerCase();

          if (
            (explicitId && explicitId === targetKey) ||
            tabSlug === targetKey ||
            tabSlug === targetSlug ||
            (!isNaN(numericVal) && numericVal === idx + 1)
          ) {
            if (!selectedIndices.includes(idx)) {
              selectedIndices.push(idx);
            }
            break;
          }
        }
      });

      if (selectedIndices.length > 0) {
        return selectedIndices;
      }
    }
  }
  return Array.from({ length: totalTabs }, (_, i) => i);
}

export function computeWireframeLayout(
  components: WireframeComponent[],
  containerWidth: number,
  startX: number,
  startY: number,
  idMap = new Map<string, WireframeRenderNode>(),
  config?: Partial<WireframeDiagramConfig>
): { nodes: WireframeRenderNode[]; totalHeight: number } {
  const gapX = config?.gapX ?? 16;
  const gapY = config?.gapY ?? 16;
  const cPadding = config?.containerPadding ?? 20;
  const outerPadding = config?.padding ?? 15;

  const nodes: WireframeRenderNode[] = [];
  let currentY = startY;
  let rowMaxBottom = startY;

  for (const comp of components) {
    const initialSize = measureComponentHeight(comp, containerWidth);
    let x = startX;
    let y = currentY;

    // Resolve alignTo relative positioning
    if (comp.alignTo && idMap.has(comp.alignTo)) {
      const targetNode = idMap.get(comp.alignTo)!;
      x = targetNode.x + targetNode.width + gapX;
      y = targetNode.y;
    } else if (nodes.length > 0) {
      currentY = rowMaxBottom > startY ? rowMaxBottom + gapY : startY;
      y = currentY;
    }

    let childNodes: WireframeRenderNode[] | undefined;
    let nodeWidth = initialSize.width;
    let nodeHeight = initialSize.height;

    // Handle container components recursively
    if (isWireframeSection(comp)) {
      const metrics = LAYOUT_METRICS.section;
      const headerHeight = comp.label ? metrics.headerHeight : 0;
      const topPadding = comp.label ? 16 : cPadding;
      let childrenHeight = 0;

      if (comp.components?.length) {
        const childRes = computeWireframeLayout(
          comp.components as unknown as WireframeComponent[],
          containerWidth - cPadding * 2,
          x + cPadding,
          y + headerHeight + topPadding,
          idMap,
          config
        );
        childNodes = childRes.nodes;
        childrenHeight = childRes.totalHeight;
      }
      nodeWidth = containerWidth;
      nodeHeight = headerHeight + childrenHeight + topPadding + cPadding;
    } else if (isFieldSet(comp)) {
      const metrics = LAYOUT_METRICS.fieldset;
      const contentStartY = y + metrics.headerPaddingY;
      let childrenHeight: number = metrics.baseHeight;

      if (comp.components?.length) {
        const childRes = computeWireframeLayout(
          comp.components as unknown as WireframeComponent[],
          containerWidth - cPadding * 2,
          x + cPadding,
          contentStartY,
          idMap,
          config
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

      if (comp.components?.length) {
        const childRes = computeWireframeLayout(
          comp.components as unknown as WireframeComponent[],
          containerWidth - cPadding * 2,
          x + cPadding,
          contentStartY,
          idMap,
          config
        );
        childNodes = childRes.nodes;
        childrenHeight = childRes.totalHeight;
      }
      nodeWidth = containerWidth;
      nodeHeight = metrics.titleBarHeight + childrenHeight + 16;
    } else if (isContentTabs(comp)) {
      const tabHeaderHeight = LAYOUT_METRICS.tabBar.height;
      const tabs = comp.tabs ?? [];

      if (hasShowTabs(comp) && tabs.length > 0) {
        const selectedIndices = parseShowTabs(comp, tabs.length);
        const numStates = selectedIndices.length;
        const variantWidth = containerWidth;
        const fullCanvasWidth = containerWidth + outerPadding * 2;
        let maxVariantHeight = 0;
        const variantNodes: WireframeRenderNode[] = [];

        selectedIndices.forEach((tabIdx, colIdx) => {
          const variantX = x + colIdx * (fullCanvasWidth + gapX);
          const variantComp = {
            ...comp,
            activeTab: tabIdx + 1,
            showTabs: false,
            showTabsValue: undefined,
          };
          let childrenHeight = 40;
          let variantChildNodes: WireframeRenderNode[] = [];

          if (comp.tabBlocks?.length) {
            const activeBlock = comp.tabBlocks[tabIdx];
            if (activeBlock?.components?.length) {
              const childRes = computeWireframeLayout(
                activeBlock.components as unknown as WireframeComponent[],
                Math.max(0, variantWidth - cPadding),
                variantX + cPadding / 2,
                y + tabHeaderHeight + 10,
                idMap,
                config
              );
              variantChildNodes = childRes.nodes;
              childrenHeight = childRes.totalHeight + 20;
            }
          }

          const vHeight = tabHeaderHeight + childrenHeight;
          maxVariantHeight = Math.max(maxVariantHeight, vHeight);
          variantNodes.push({
            astNode: variantComp,
            x: variantX,
            y,
            width: variantWidth,
            height: vHeight,
            children: variantChildNodes,
          });
        });

        childNodes = variantNodes;
        nodeWidth = numStates * fullCanvasWidth + (numStates - 1) * gapX - outerPadding * 2;
        nodeHeight = maxVariantHeight;
      } else {
        const activeIdx = resolveActiveTabIdx(comp, comp.tabBlocks?.length ?? tabs.length);
        let childrenHeight = 40;
        if (comp.tabBlocks?.length) {
          const activeBlock = comp.tabBlocks[activeIdx] ?? comp.tabBlocks[0];
          if (activeBlock?.components?.length) {
            const childRes = computeWireframeLayout(
              activeBlock.components as unknown as WireframeComponent[],
              containerWidth - cPadding,
              x + cPadding / 2,
              y + tabHeaderHeight + 10,
              idMap,
              config
            );
            childNodes = childRes.nodes;
            childrenHeight = childRes.totalHeight + 20;
          }
        }
        nodeWidth = containerWidth;
        nodeHeight = tabHeaderHeight + childrenHeight;
      }
    } else if (isTabPane(comp)) {
      let childrenHeight = 0;
      if (comp.components?.length) {
        const childRes = computeWireframeLayout(
          comp.components as unknown as WireframeComponent[],
          containerWidth,
          x,
          y,
          idMap,
          config
        );
        childNodes = childRes.nodes;
        childrenHeight = childRes.totalHeight;
      }
      nodeWidth = containerWidth;
      nodeHeight = childrenHeight;
    } else if (isAccordion(comp)) {
      const headerHeight = 36;
      const isCollapsed = comp.collapsed ?? false;
      let childrenHeight = 0;

      if (!isCollapsed && comp.components?.length) {
        const childRes = computeWireframeLayout(
          comp.components as unknown as WireframeComponent[],
          containerWidth - cPadding,
          x + cPadding / 2,
          y + headerHeight + 10,
          idMap,
          config
        );
        childNodes = childRes.nodes;
        childrenHeight = childRes.totalHeight + 20;
      }
      nodeWidth = containerWidth;
      nodeHeight = headerHeight + childrenHeight;
    } else if (isColumns(comp)) {
      const cols = comp.cols ?? [];
      const numCols = Math.max(1, cols.length);
      const totalGap = (numCols - 1) * gapX;
      const availableWidth = Math.max(0, containerWidth - totalGap);

      // Parse column width specifications (% or px)
      const widths: number[] = new Array(numCols).fill(0);
      let allocatedWidth = 0;
      let unassignedCols = 0;

      cols.forEach((col, idx) => {
        if (col.width) {
          const wStr = col.width.trim();
          if (wStr.endsWith('%')) {
            const pct = parseFloat(wStr) / 100;
            widths[idx] = availableWidth * pct;
            allocatedWidth += widths[idx];
          } else if (wStr.endsWith('px')) {
            const px = parseFloat(wStr);
            widths[idx] = px;
            allocatedWidth += widths[idx];
          } else {
            const val = parseFloat(wStr);
            if (!isNaN(val)) {
              widths[idx] = val;
              allocatedWidth += widths[idx];
            } else {
              unassignedCols++;
            }
          }
        } else {
          unassignedCols++;
        }
      });

      if (unassignedCols > 0) {
        const remainingWidth = Math.max(0, availableWidth - allocatedWidth);
        const defaultColWidth = remainingWidth / unassignedCols;
        cols.forEach((_, idx) => {
          if (widths[idx] === 0) {
            widths[idx] = defaultColWidth;
          }
        });
      }

      let maxColHeight = 0;
      const allColNodes: WireframeRenderNode[] = [];
      let currentColX = x;

      cols.forEach((col, colIdx) => {
        const colWidth = widths[colIdx] || availableWidth / numCols;
        if (col.components?.length) {
          const childRes = computeWireframeLayout(
            col.components as unknown as WireframeComponent[],
            colWidth,
            currentColX,
            y,
            idMap,
            config
          );
          allColNodes.push(...childRes.nodes);
          maxColHeight = Math.max(maxColHeight, childRes.totalHeight);
        }
        currentColX += colWidth + gapX;
      });

      childNodes = allColNodes;
      nodeWidth = containerWidth;
      nodeHeight = maxColHeight;
    } else if (isColBlock(comp)) {
      let childrenHeight = 0;
      let colWidth = containerWidth;
      if (comp.width) {
        const wStr = comp.width.trim();
        if (wStr.endsWith('%')) {
          colWidth = containerWidth * (parseFloat(wStr) / 100);
        } else if (wStr.endsWith('px')) {
          colWidth = parseFloat(wStr);
        }
      }
      if (comp.components?.length) {
        const childRes = computeWireframeLayout(
          comp.components as unknown as WireframeComponent[],
          colWidth,
          x,
          y,
          idMap,
          config
        );
        childNodes = childRes.nodes;
        childrenHeight = childRes.totalHeight;
      }
      nodeWidth = colWidth;
      nodeHeight = childrenHeight;
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

    // Track the bottom boundary of current layout row/block
    rowMaxBottom = Math.max(rowMaxBottom, y + nodeHeight);
  }

  return { nodes, totalHeight: Math.max(0, rowMaxBottom - startY) };
}
