import type { Content } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { dedent } from 'ts-dedent';
import type { MarkdownLine, MarkdownWordType } from './types.js';
import type { MermaidConfig } from '../config.type.js';

/**
 * @param markdown - markdown to process
 * @returns processed markdown
 */
function preprocessMarkdown(markdown: string, { markdownAutoWrap }: MermaidConfig): string {
  // Replace multiple newlines with a single newline
  const withoutMultipleNewlines = markdown.replace(/\n{2,}/g, '\n');
  // Remove extra spaces at the beginning of each line
  const withoutExtraSpaces = dedent(withoutMultipleNewlines);
  if (markdownAutoWrap === false) {
    return withoutExtraSpaces.replace(/ /g, '&nbsp;');
  }
  return withoutExtraSpaces;
}

/**
 * @param markdown - markdown to split into lines
 */
export function markdownToLines(markdown: string, config: MermaidConfig = {}): MarkdownLine[] {
  const preprocessedMarkdown = preprocessMarkdown(markdown, config);
  const { children } = fromMarkdown(preprocessedMarkdown);
  const lines: MarkdownLine[] = [[]];
  let currentLine = 0;

  function processNode(node: Content, parentType: MarkdownWordType = 'normal') {
    if (node.type === 'text') {
      const textLines = node.value.split('\n');
      textLines.forEach((textLine, index) => {
        if (index !== 0) {
          currentLine++;
          lines.push([]);
        }
        textLine.split(' ').forEach((word) => {
          if (word) {
            lines[currentLine].push({ content: word, type: parentType });
          }
        });
      });
    } else if (node.type === 'strong' || node.type === 'emphasis') {
      node.children.forEach((contentNode) => {
        processNode(contentNode, node.type);
      });
    }
  }

  children.forEach((treeNode) => {
    if (treeNode.type === 'paragraph') {
      treeNode.children.forEach((contentNode) => {
        processNode(contentNode);
      });
    }
  });

  return lines;
}

export function markdownToHTML(markdown: string, { markdownAutoWrap }: MermaidConfig = {}) {
  const { children } = fromMarkdown(markdown);

  function output(node: Content): string {
    if (node.type === 'text') {
      if (markdownAutoWrap === false) {
        return node.value.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;');
      }
      return node.value.replace(/\n/g, '<br/>');
    } else if (node.type === 'strong') {
      return `<strong>${node.children.map(output).join('')}</strong>`;
    } else if (node.type === 'emphasis') {
      return `<em>${node.children.map(output).join('')}</em>`;
    } else if (node.type === 'paragraph') {
      return `<p>${node.children.map(output).join('')}</p>`;
    }
    return `Unsupported markdown: ${node.type}`;
  }

  return children.map(output).join('');
}
