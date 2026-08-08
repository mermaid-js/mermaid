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
import type { ComponentRenderer } from './types.js';
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

export const imageRenderer: ComponentRenderer<ImageField | PathField> = {
  type: 'ImageField',
  guard: (comp): comp is ImageField => isImageField(comp) || isPathField(comp),
  render: ({ parentElem, node }) => {
    const { x, y, width, height, astNode } = node;
    const label = astNode.label ?? 'Image';
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-image');

    // Container box with diagonal cross (placeholder graphic)
    drawBox(g, x, y, width, height, 'wireframe-container');
    g.append('line')
      .attr('x1', x)
      .attr('y1', y)
      .attr('x2', x + width)
      .attr('y2', y + height)
      .attr('class', 'wireframe-rule');
    g.append('line')
      .attr('x1', x + width)
      .attr('y1', y)
      .attr('x2', x)
      .attr('y2', y + height)
      .attr('class', 'wireframe-rule');

    if (label) {
      drawText(g, label, x + width / 2, y + height / 2 + 4, 'wireframe-text', 'middle');
    }
  },
};

export const vRuleRenderer: ComponentRenderer<VRule | Arrow | VCurly> = {
  type: 'VRule',
  guard: (comp): comp is VRule => isVRule(comp) || isArrow(comp) || isVCurly(comp),
  render: ({ parentElem, node }) => {
    const { x, y, width } = node;
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-divider');
    g.append('line')
      .attr('x1', x)
      .attr('y1', y + 6)
      .attr('x2', x + width)
      .attr('y2', y + 6)
      .attr('class', 'wireframe-rule');
  },
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
