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
  const { x, y, width } = node;
  const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-divider');
  g.append('line')
    .attr('x1', x)
    .attr('y1', y + 6)
    .attr('x2', x + width)
    .attr('y2', y + 6)
    .attr('class', 'wireframe-rule');
};

export const vRuleRenderer: ComponentRenderer<VRule> = {
  type: 'VRule',
  guard: isVRule,
  render: renderVRule,
};

export const arrowRenderer: ComponentRenderer<Arrow> = {
  type: 'Arrow',
  guard: isArrow,
  render: renderVRule,
};

export const vCurlyRenderer: ComponentRenderer<VCurly> = {
  type: 'VCurly',
  guard: isVCurly,
  render: renderVRule,
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
