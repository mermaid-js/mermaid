import SimpleMarkdown from '@khanacademy/simple-markdown';

/**
 *
 * @param markdown
 */
function preprocessMarkdown(markdown) {
  // Replace multiple newlines with a single newline
  const withoutMultipleNewlines = markdown.replace(/\n{2,}/g, '\n');
  // Remove extra spaces at the beginning of each line
  const withoutExtraSpaces = withoutMultipleNewlines.replace(/^\s+/gm, '');
  return withoutExtraSpaces;
}

/**
 *
 * @param markdown
 */
export function markdownToLines(markdown) {
  const preprocessedMarkdown = preprocessMarkdown(markdown);
  const mdParse = SimpleMarkdown.defaultBlockParse;
  const syntaxTree = mdParse(preprocessedMarkdown);

  let lines = [[]];
  let currentLine = 0;

  /**
   *
   * @param node
   * @param parentType
   */
  function processNode(node, parentType) {
    if (node.type === 'text') {
      const textLines = node.content.split('\n');

      textLines.forEach((textLine, index) => {
        if (index !== 0) {
          currentLine++;
          lines.push([]);
        }

        // textLine.split(/ (?=[^!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]+)/).forEach((word) => {
        textLine.split(' ').forEach((word) => {
          if (word) {
            lines[currentLine].push({ content: word, type: parentType || 'normal' });
          }
        });
      });
    } else if (node.type === 'strong' || node.type === 'em') {
      node.content.forEach((contentNode) => {
        processNode(contentNode, node.type);
      });
    }
  }

  syntaxTree.forEach((treeNode) => {
    if (treeNode.type === 'paragraph') {
      treeNode.content.forEach((contentNode) => {
        processNode(contentNode);
      });
    }
  });

  return lines;
}

/**
 *
 * @param markdown
 */
export function markdownToHTML(markdown) {
  const mdParse = SimpleMarkdown.defaultBlockParse;
  const syntaxTree = mdParse(markdown);

  /**
   *
   * @param node
   */
  function output(node) {
    if (node.type === 'text') {
      return node.content.replace(/\n/g, '<br/>');
    } else if (node.type === 'strong') {
      return `<strong>${node.content.map(output).join('')}</strong>`;
    } else if (node.type === 'em') {
      return `<em>${node.content.map(output).join('')}</em>`;
    } else if (node.type === 'paragraph') {
      return `<p>${node.content.map(output).join('')}</p>`;
    } else {
      return '';
    }
  }

  return syntaxTree.map(output).join('');
}
