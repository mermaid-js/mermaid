import { micromark } from 'micromark';
import { fromMarkdown } from 'mdast-util-from-markdown';
import type { Content } from 'mdast';
import { dedent } from 'ts-dedent';

function preprocessMarkdown(markdown: string): string {
  // Replace multiple newlines with a single newline
  const withoutMultipleNewlines = markdown.replace(/\n{2,}/g, '\n');
  // Remove extra spaces at the beginning of each line
  const withoutExtraSpaces = dedent(withoutMultipleNewlines);
  return withoutExtraSpaces;
}

export function markdownToLines(markdown: string) {
  const preprocessedMarkdown = preprocessMarkdown(markdown);
  const { children } = fromMarkdown(preprocessedMarkdown);
  const lines: { content: string; type: string }[][] = [[]];
  let currentLine = 0;

  function processNode(node: Content, parentType?: string) {
    if (node.type === 'text') {
      const textLines = node.value.split('\n');
      textLines.forEach((textLine, index) => {
        if (index !== 0) {
          currentLine++;
          lines.push([]);
        }
        textLine.split(' ').forEach((word) => {
          if (word) {
            lines[currentLine].push({ content: word, type: parentType || 'normal' });
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

export function markdownToHTML(markdown: string): string {
  return micromark(preprocessMarkdown(markdown)).replaceAll('\n', '<br/>');
}
