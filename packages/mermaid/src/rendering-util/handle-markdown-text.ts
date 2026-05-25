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
    // TODO: Disabling `markdownAutoWrap` is currently broken for `htmlLabels: false`,
    // since the code calls `splitWordToFitWidth` to split words even we can't
    // break on spaces.
    // return withoutExtraSpaces.replace(/ /g, '\u00A0');
  }
  return withoutExtraSpaces;
}

/**
 * @param nonMarkdownText - Non-markdown text to split into plain-text formatted lines.
 * This treats new lines, `\n`, and `<br/>` as line breaks, and splits on spaces for words.
 * SVG tags are preserved as separate words to maintain proper formatting.
 */
export function nonMarkdownToLines(nonMarkdownText: string): MarkdownLine[] {
  return nonMarkdownText.split(/\\n|\n|<br\s*\/?>/gi).map(
    (line) =>
      line
        .trim()
        .match(/<[^>]+>|[^\s<>]+/g) // keeps SVG tags intact and preserves space between tags and text
        ?.map((word) => ({ content: word, type: 'normal' })) ?? []
  );
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
 * Counterpart to {@link markdownToHTML} for non-markdown text.
 *
 * Non-markdown text is not wrapped normally, and users can use an explicit `\n`
 * sequence to add a line break.
 *
 * @param text - Non-markdown text to convert to HTML.
 */
export function nonMarkdownToHTML(text: string) {
  if (!text) {
    return '';
  }
  /*
   * Edge labels may have double backgrounds if `addBackground` is `true`.
   * This `<p>` wrapper aligns with how {@link markdownToHTML} wraps its output, and
   * ensures both backgrounds are the same size.
   *
   * We can't set it for empty labels, otherwise it causes rendering changes.
   */
  return `<p>${
    /**
     * Replace new lines with <br /> tags.
     *
     * Unlike in markdown text, `\n` sequences are treated as line breaks here.
     */
    text.replace(/\\n|\n/g, '<br />')
  }</p>`;
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
