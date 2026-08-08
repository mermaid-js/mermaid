import {
  isHeading,
  isSubTitle,
  isParagraph,
  isRichText,
  isTextElement,
  isList,
  isTree,
  isMenu,
  type Heading,
  type SubTitle,
  type Paragraph,
  type RichText,
  type TextElement,
  type List,
  type Tree,
  type Menu,
} from '@mermaid-js/parser';
import type { ComponentRenderer } from './types.js';
import { drawBox, drawText } from './utils.js';

export const headingRenderer: ComponentRenderer<Heading | SubTitle> = {
  type: 'Heading',
  guard: (comp): comp is Heading => isHeading(comp) || isSubTitle(comp),
  render: ({ parentElem, node }) => {
    const { x, y, astNode } = node;
    const text = astNode.label ?? '';
    const isSub = isSubTitle(astNode);
    const fontSize = isSub ? 16 : 20;

    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-heading');
    g.append('text')
      .attr('x', x)
      .attr('y', y + (isSub ? 18 : 22))
      .attr('class', 'wireframe-text')
      .style('font-size', `${fontSize}px`)
      .style('font-weight', 'bold')
      .text(text);
  },
};

export const paragraphRenderer: ComponentRenderer<Paragraph | RichText | TextElement> = {
  type: 'Paragraph',
  guard: (comp): comp is Paragraph => isParagraph(comp) || isRichText(comp) || isTextElement(comp),
  render: ({ parentElem, node }) => {
    const { x, y, astNode } = node;
    const text = astNode.label ?? '';
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-paragraph');
    drawText(g, text, x, y + 16);
  },
};

export const listRenderer: ComponentRenderer<List> = {
  type: 'List',
  guard: isList,
  render: ({ parentElem, node }) => {
    const { x, y, astNode } = node;
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-list');

    let currentY = y;
    if (astNode.items) {
      astNode.items.forEach((item, idx) => {
        const prefix = astNode.ordered ? `${idx + 1}.` : '•';
        drawText(g, `${prefix} ${item.value ?? ''}`, x, currentY + 16);
        currentY += 22;
      });
    }
  },
};

export const treeRenderer: ComponentRenderer<Tree> = {
  type: 'Tree',
  guard: isTree,
  render: ({ parentElem, node }) => {
    const { x, y, astNode } = node;
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-tree');

    let currentY = y;
    if (astNode.nodes) {
      for (const treeNode of astNode.nodes) {
        const hasChildren = Boolean(treeNode.children && treeNode.children.length > 0);
        const isExpanded = hasChildren && treeNode.expanded !== false;
        const prefix = hasChildren ? (isExpanded ? '📂' : '📁') : '📄';

        drawText(g, `${prefix} ${treeNode.label ?? ''}`, x, currentY + 16);
        currentY += 22;

        if (hasChildren && isExpanded && treeNode.children) {
          for (const childLabel of treeNode.children) {
            drawText(g, `📄 ${childLabel}`, x + 20, currentY + 16);
            currentY += 22;
          }
        }
      }
    }
  },
};

export const menuRenderer: ComponentRenderer<Menu> = {
  type: 'Menu',
  guard: isMenu,
  render: ({ parentElem, node }) => {
    const { x, y, width, height, astNode } = node;
    const g = parentElem.append('g').attr('class', 'wireframe-comp wireframe-menu');

    drawBox(g, x, y, width, height, 'wireframe-menu-box');

    let currentY = y;
    if (astNode.items) {
      for (const item of astNode.items) {
        drawText(g, item.value ?? '', x + 12, currentY + 18);
        currentY += 26;
      }
    }
  },
};
