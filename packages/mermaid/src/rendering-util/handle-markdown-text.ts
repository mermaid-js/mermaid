import type { MarkedToken, Token } from 'marked';
import { marked } from 'marked';
import { dedent } from 'ts-dedent';
import type { MarkdownLine, MarkdownWordType } from './types.js';
import type { MermaidConfig } from '../config.type.js';
import { log } from '../logger.js';

/**
 * @param markdown - markdown to process
 * @returns processed markdown
 */
function preprocessMarkdown(markdown: string, { markdownAutoWrap }: MermaidConfig): string {
  //Replace <br/>with \n
  const withoutBR = markdown.replace(/<br\/>/g, '\n');
  // Replace multiple newlines with a single newline
  const withoutMultipleNewlines = withoutBR.replace(/\n{2,}/g, '\n');
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
  const nodes = marked.lexer(preprocessedMarkdown);
  const lines: MarkdownLine[] = [[]];
  let currentLine = 0;

  function processNode(node: MarkedToken, parentType: MarkdownWordType = 'normal') {
    if (node.type === 'text') {
      const textLines = node.text.split('\n');
      textLines.forEach((textLine, index) => {
        if (index !== 0) {
          currentLine++;
          lines.push([]);
        }
        textLine.split(' ').forEach((word) => {
          word = word.replace(/&#39;/g, `'`);
          if (word) {
            lines[currentLine].push({ content: word, type: parentType });
          }
        });
      });
    } else if (node.type === 'strong' || node.type === 'em') {
      node.tokens.forEach((contentNode) => {
        processNode(contentNode as MarkedToken, node.type);
      });
    } else if (node.type === 'html') {
      lines[currentLine].push({ content: node.text, type: 'normal' });
    }
  }

  nodes.forEach((treeNode) => {
    if (treeNode.type === 'paragraph') {
      treeNode.tokens?.forEach((contentNode) => {
        processNode(contentNode as MarkedToken);
      });
    } else if (treeNode.type === 'html') {
      lines[currentLine].push({ content: treeNode.text, type: 'normal' });
    } else {
      lines[currentLine].push({ content: treeNode.raw, type: 'normal' });
    }
  });

  return lines;
}

/**
 * Checks if text contains actual markdown syntax (bold, italic, etc.)
 * This helps validate that labels marked as 'markdown' actually contain markdown
 * @param text - text to check
 * @returns true if text contains markdown syntax, false otherwise
 */
export function hasMarkdownSyntax(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  try {
    const nodes = marked.lexer(text);

    // Check if any node contains markdown formatting
    function hasMarkdownInNode(node: Token): boolean {
      if (node.type === 'strong' || node.type === 'em') {
        return true;
      }
      if (node.type === 'paragraph' && node.tokens) {
        return node.tokens.some(hasMarkdownInNode);
      }
      if ('tokens' in node && node.tokens) {
        return node.tokens.some(hasMarkdownInNode);
      }
      return false;
    }

    return nodes.some(hasMarkdownInNode);
  } catch (error) {
    // If parsing fails, assume it's not markdown
    log.debug('Failed to parse text as markdown:', error);
    return false;
  }
}

export function markdownToHTML(markdown: string, { markdownAutoWrap }: MermaidConfig = {}) {
  const nodes = marked.lexer(markdown);

  function output(node: Token): string {
    if (node.type === 'text') {
      if (markdownAutoWrap === false) {
        return node.text.replace(/\n */g, '<br/>').replace(/ /g, '&nbsp;');
      }
      return node.text.replace(/\n */g, '<br/>');
    } else if (node.type === 'strong') {
      return `<strong>${node.tokens?.map(output).join('')}</strong>`;
    } else if (node.type === 'em') {
      return `<em>${node.tokens?.map(output).join('')}</em>`;
    } else if (node.type === 'paragraph') {
      return `<p>${node.tokens?.map(output).join('')}</p>`;
    } else if (node.type === 'space') {
      return '';
    } else if (node.type === 'html') {
      return `${node.text}`;
    } else if (node.type === 'escape') {
      return node.text;
    }
    log.warn(`Unsupported markdown: ${node.type}`);
    return node.raw;
  }

  return nodes.map(output).join('');
}
