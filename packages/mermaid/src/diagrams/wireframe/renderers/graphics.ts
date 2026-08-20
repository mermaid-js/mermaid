import {
  isIcon,
  isImageField,
  isPathField,
  isArrow,
  isVCurly,
  isVRule,
  isFormattingToolbar,
  isCanvas,
  type Icon,
  type ImageField,
  type PathField,
  type Arrow,
  type VCurly,
  type VRule,
  type FormattingToolbar,
  type Canvas,
} from '@mermaid-js/parser';
import type { ComponentRenderer, ComponentRenderContext } from './types.js';
import type { WireframeComponent } from '@mermaid-js/parser';
import { drawBox, drawText, drawIconPlaceholder } from './utils.js';

export const iconRenderer: ComponentRenderer<Icon> = {
  type: 'Icon',
  guard: isIcon,
  render: ({ parentElem, node }) => {
    const { x, y, astNode } = node;
    const glyph = astNode.glyph ?? astNode.label ?? 'star';
    drawIconPlaceholder(parentElem, glyph, x, y, 24);
  },
};

const renderImage = ({ parentElem, node }: ComponentRenderContext<WireframeComponent>) => {
  const { x, y, width, height, astNode } = node;
  const label = astNode.label ?? 'Image';
  const isPath = isPathField(astNode);
  const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-image');

  // Outer container box
  drawBox(g, x, y, width, height, 'wireframe-container');

  // Diagonal placeholder lines with subtle dashed stroke, inset 5px to fit within rounded corners
  const inset = 5;
  g.append('line')
    .attr('x1', x + inset)
    .attr('y1', y + inset)
    .attr('x2', x + width - inset)
    .attr('y2', y + height - inset)
    .attr('class', 'wireframe-rule')
    .style('stroke-dasharray', '4 4');

  g.append('line')
    .attr('x1', x + width - inset)
    .attr('y1', y + inset)
    .attr('x2', x + inset)
    .attr('y2', y + height - inset)
    .attr('class', 'wireframe-rule')
    .style('stroke-dasharray', '4 4');

  if (label) {
    const icon = isPath ? '📁 ' : '🖼️ ';
    const fullText = `${icon}${label}`;
    const approxCharWidth = 7;
    const textWidth = label.length * approxCharWidth + 24;
    const badgeWidth = Math.min(width - 16, Math.max(70, textWidth + 16));
    const badgeHeight = 24;
    const badgeX = x + (width - badgeWidth) / 2;
    const badgeY = y + (height - badgeHeight) / 2;

    // Draw background pill/badge to cleanly obscure line intersection
    drawBox(g, badgeX, badgeY, badgeWidth, badgeHeight, 'wireframe-fieldset-legend-bg', 12);

    // Centered label text inside pill
    drawText(
      g,
      fullText,
      x + width / 2,
      y + height / 2 + 4,
      'wireframe-text wireframe-text-small',
      'middle',
      badgeWidth - 8
    );
  }
};

export const imageRenderer: ComponentRenderer<ImageField> = {
  type: 'ImageField',
  guard: isImageField,
  render: renderImage,
};

export const pathFieldRenderer: ComponentRenderer<PathField> = {
  type: 'PathField',
  guard: isPathField,
  render: renderImage,
};

const renderVRule = ({ parentElem, node }: ComponentRenderContext<WireframeComponent>) => {
  const { x, y, width, height, astNode } = node;
  const vruleNode = isVRule(astNode) ? astNode : undefined;
  const label = vruleNode?.label;
  const h = height > 0 ? height : 60;
  const cx = Math.round(x + width / 2);
  const g = parentElem
    .append('g')
    .attr('class', 'wireframe-comp wireframe-divider wireframe-vrule');
  g.append('line')
    .attr('x1', cx)
    .attr('y1', y)
    .attr('x2', cx)
    .attr('y2', y + h)
    .attr('class', 'wireframe-rule');

  if (label) {
    drawText(g, label, cx + 8, y + h / 2 + 4, 'wireframe-text wireframe-text-small');
  }
};

const renderVCurly = ({ parentElem, node }: ComponentRenderContext<WireframeComponent>) => {
  const { x, y, width, height, astNode } = node;
  const curlyNode = isVCurly(astNode) ? astNode : undefined;
  const label = curlyNode?.label;
  const h = height > 0 ? height : 60;
  const half = h / 2;
  const braceWidth = 10;
  const cx = Math.round(x + Math.max(10, (width - braceWidth) / 2));
  const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-vcurly');

  const pathD =
    `M ${cx},${y} ` +
    `C ${cx},${y + half / 2} ${cx + braceWidth},${y + half / 2} ${cx + braceWidth},${y + half} ` +
    `C ${cx + braceWidth},${y + half + half / 2} ${cx},${y + half + half / 2} ${cx},${y + h}`;

  g.append('path').attr('d', pathD).attr('class', 'wireframe-rule').attr('fill', 'none');

  if (label) {
    drawText(g, label, cx + braceWidth + 6, y + half + 4, 'wireframe-text wireframe-text-small');
  }
};

const renderArrow = ({ parentElem, node }: ComponentRenderContext<WireframeComponent>) => {
  const { x, y, width, height, astNode } = node;
  const arrowNode = isArrow(astNode) ? astNode : undefined;
  const label = arrowNode?.label;
  const dir = arrowNode?.direction ?? 'right';
  const g = parentElem
    .append('g')
    .attr('class', `wireframe-comp wireframe-arrow wireframe-arrow-${dir}`);

  const midX = Math.round(x + width / 2);
  const midY = Math.round(y + height / 2);
  const headSize = 6;

  let x1 = x;
  let y1 = midY;
  let x2 = x + width;
  let y2 = midY;

  if (dir === 'up' || dir === 'down') {
    x1 = midX;
    y1 = y;
    x2 = midX;
    y2 = y + height;
  }

  g.append('line')
    .attr('x1', x1)
    .attr('y1', y1)
    .attr('x2', x2)
    .attr('y2', y2)
    .attr('class', 'wireframe-rule');

  const drawHead = (px: number, py: number, direction: 'left' | 'right' | 'up' | 'down') => {
    let points = '';
    if (direction === 'right') {
      points = `${px},${py} ${px - headSize * 1.5},${py - headSize} ${px - headSize * 1.5},${py + headSize}`;
    } else if (direction === 'left') {
      points = `${px},${py} ${px + headSize * 1.5},${py - headSize} ${px + headSize * 1.5},${py + headSize}`;
    } else if (direction === 'up') {
      points = `${px},${py} ${px - headSize},${py + headSize * 1.5} ${px + headSize},${py + headSize * 1.5}`;
    } else if (direction === 'down') {
      points = `${px},${py} ${px - headSize},${py - headSize * 1.5} ${px + headSize},${py - headSize * 1.5}`;
    }
    g.append('polygon').attr('points', points).attr('class', 'wireframe-arrow-head');
  };

  if (dir === 'right' || dir === 'both') {
    drawHead(x2, y2, 'right');
  }
  if (dir === 'left' || dir === 'both') {
    drawHead(x1, y1, 'left');
  }
  if (dir === 'up') {
    drawHead(x1, y1, 'up');
  }
  if (dir === 'down') {
    drawHead(x2, y2, 'down');
  }

  if (label) {
    if (dir === 'up' || dir === 'down') {
      drawText(g, label, midX + 10, midY + 4, 'wireframe-text wireframe-text-small');
    } else {
      drawText(g, label, midX, midY - 6, 'wireframe-text wireframe-text-small', 'middle');
    }
  }
};

export const vRuleRenderer: ComponentRenderer<VRule> = {
  type: 'VRule',
  guard: isVRule,
  render: renderVRule,
};

export const arrowRenderer: ComponentRenderer<Arrow> = {
  type: 'Arrow',
  guard: isArrow,
  render: renderArrow,
};

export const vCurlyRenderer: ComponentRenderer<VCurly> = {
  type: 'VCurly',
  guard: isVCurly,
  render: renderVCurly,
};

export const formattingToolbarRenderer: ComponentRenderer<FormattingToolbar> = {
  type: 'FormattingToolbar',
  guard: isFormattingToolbar,
  render: ({ parentElem, node }) => {
    const { x, y, width, height } = node;
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-toolbar');

    drawBox(g, x, y, width, height, 'wireframe-container');
    const tools = ['B', 'I', 'U', 'S', '≡', '🔗'];
    let btnX = x + 6;
    for (const tool of tools) {
      drawText(g, tool, btnX + 6, y + height / 2 + 4, 'wireframe-text wireframe-bold');
      btnX += 22;
    }
  },
};

export const canvasRenderer: ComponentRenderer<Canvas> = {
  type: 'Canvas',
  guard: isCanvas,
  render: ({ parentElem, node }) => {
    const { x, y, width, height, astNode } = node;
    const label = astNode.label ?? 'Canvas';
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-canvas');

    drawBox(g, x, y, width, height, 'wireframe-container');
    if (label) {
      drawText(g, label, x + 10, y + 20, 'wireframe-text wireframe-bold');
    }
  },
};
