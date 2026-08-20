import type { SVGGroupSelection } from './types.js';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\da-z]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Shared SVG drawing helper functions for wireframe components
 */

export const drawBox = (
  parent: SVGGroupSelection,
  x: number,
  y: number,
  width: number,
  height: number,
  className = 'wireframe-container',
  rx = 5
) => {
  return parent
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', width)
    .attr('height', height)
    .attr('rx', rx)
    .attr('ry', rx)
    .attr('class', className);
};

export const truncateText = (text: string, maxWidth: number, charWidth = 8): string => {
  if (maxWidth <= 0) {
    return text;
  }
  const maxChars = Math.floor((maxWidth - 12) / charWidth);
  if (maxChars > 3 && text.length > maxChars) {
    return text.slice(0, maxChars - 1) + '…';
  }
  return text;
};

export const drawText = (
  parent: SVGGroupSelection,
  text: string,
  x: number,
  y: number,
  className = 'wireframe-text',
  textAnchor: 'start' | 'middle' | 'end' = 'start',
  maxWidth?: number
) => {
  const displayText = maxWidth ? truncateText(text, maxWidth) : text;
  return parent
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('text-anchor', textAnchor)
    .attr('class', className)
    .text(displayText);
};

export const drawCheckmark = (parent: SVGGroupSelection, x: number, y: number) => {
  return parent
    .append('path')
    .attr('d', `M ${x + 3} ${y + 8} L ${x + 7} ${y + 13} L ${x + 14} ${y + 4}`)
    .attr('class', 'wireframe-checkmark')
    .attr('stroke-width', 2)
    .attr('fill', 'none');
};

export const drawRadioDot = (parent: SVGGroupSelection, cx: number, cy: number, r = 4) => {
  return parent
    .append('circle')
    .attr('cx', cx)
    .attr('cy', cy)
    .attr('r', r)
    .attr('class', 'wireframe-radio-dot');
};

export const drawDropdownArrow = (parent: SVGGroupSelection, x: number, y: number) => {
  return parent
    .append('path')
    .attr('d', `M ${x} ${y} L ${x + 8} ${y} L ${x + 4} ${y + 6} Z`)
    .attr('class', 'wireframe-dropdown-arrow');
};

export const drawIconPlaceholder = (
  parent: SVGGroupSelection,
  glyph: string,
  x: number,
  y: number,
  size = 24
) => {
  const g = parent.append('g').attr('class', 'wireframe-icon');
  g.append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', size)
    .attr('height', size)
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('class', 'wireframe-icon-box');

  const char = glyph ? glyph.charAt(0).toUpperCase() : '*';
  g.append('text')
    .attr('x', x + size / 2)
    .attr('y', y + size / 2 + 5)
    .attr('text-anchor', 'middle')
    .attr('class', 'wireframe-text wireframe-icon-text')
    .text(char);

  return g;
};

export const stripQuotes = (text: string): string => {
  if (!text) {
    return '';
  }
  return text.trim().replace(/^["']|["']$/g, '');
};

export const drawTabStrip = (
  g: SVGGroupSelection,
  tabs: { value?: string }[],
  activeIdx: number,
  x: number,
  y: number,
  tabHeight = 30
): number => {
  let tabX = x;
  tabs.forEach((tab, idx) => {
    const tabLabel = tab.value ?? `Tab ${idx + 1}`;
    const tabWidth = Math.max(70, tabLabel.length * 8 + 20);
    const isActive = idx === activeIdx;

    g.append('rect')
      .attr('x', tabX)
      .attr('y', y)
      .attr('width', tabWidth)
      .attr('height', tabHeight)
      .attr('class', isActive ? 'wireframe-tab wireframe-tab-active' : 'wireframe-tab');

    drawText(g, tabLabel, tabX + tabWidth / 2, y + tabHeight / 2 + 4, 'wireframe-text', 'middle');
    tabX += tabWidth + 4;
  });
  return tabX;
};

export const hasShowTabs = (comp?: { showTabs?: boolean; showTabsValue?: unknown[] }): boolean => {
  if (!comp) {
    return false;
  }
  return (
    Boolean(comp.showTabs) || (Array.isArray(comp.showTabsValue) && comp.showTabsValue.length > 0)
  );
};

export const resolveActiveTabIdx = (
  comp: {
    activeTab?: number | string;
    tabs?: { value?: string }[];
    tabBlocks?: { label?: string; id?: string }[];
  },
  totalTabs: number
): number => {
  if (comp.activeTab === undefined || totalTabs <= 0) {
    return 0;
  }
  const rawActive = comp.activeTab;
  if (typeof rawActive === 'number') {
    if (rawActive >= 1 && rawActive <= totalTabs) {
      return rawActive - 1;
    }
    if (rawActive >= 0 && rawActive < totalTabs) {
      return rawActive;
    }
  }
  const targetKey = stripQuotes(String(rawActive));
  const targetSlug = slugify(targetKey);
  const numericVal = parseInt(targetKey, 10);
  const tabs = comp.tabs ?? [];
  const tabBlocks = comp.tabBlocks ?? [];

  for (let idx = 0; idx < totalTabs; idx++) {
    const tabLabel = tabs[idx]?.value ?? tabBlocks[idx]?.label ?? `Tab ${idx + 1}`;
    const tabSlug = slugify(tabLabel);
    const explicitId = tabBlocks[idx]?.id?.toLowerCase();

    if (
      (explicitId && explicitId === targetKey.toLowerCase()) ||
      tabSlug === targetKey.toLowerCase() ||
      tabSlug === targetSlug ||
      (!isNaN(numericVal) && numericVal === idx + 1)
    ) {
      return idx;
    }
  }
  return 0;
};
