import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import type { Content } from 'mdast';

export function markdownToLines(markdown: string) {
  const { children } = unified().use(remarkParse).use(remarkBreaks).parse(markdown);
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
  return (
    unified()
      .use(remarkParse)
      .use(remarkBreaks)
      .use(remarkRehype)
      .use(rehypeSanitize)
      // @ts-ignore - rehype-stringify types are incorrect
      .use(rehypeStringify)
      .processSync(markdown)
      .toString()
  );
}
