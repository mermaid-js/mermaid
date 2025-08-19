/**
 * Simple test to verify Lezer parser is working
 */

import { parser } from './flow.grammar.js';

// Test basic tokenization
const testCases = ['graph TD', 'flowchart LR', 'A --> B', 'subgraph test', 'end'];

console.log('Testing Lezer parser...\n');

testCases.forEach((input, index) => {
  console.log(`Test ${index + 1}: "${input}"`);
  try {
    const tree = parser.parse(input);
    console.log('Parse tree:', tree.toString());

    // Walk the tree and show tokens
    const cursor = tree.cursor();
    const tokens = [];

    function walkTree(cursor) {
      do {
        const nodeName = cursor.node.name;
        console.log(
          `Node: ${nodeName} (${cursor.from}-${cursor.to}): "${input.slice(cursor.from, cursor.to)}"`
        );

        if (nodeName !== 'Flowchart') {
          tokens.push({
            type: nodeName,
            value: input.slice(cursor.from, cursor.to),
            start: cursor.from,
            end: cursor.to,
          });
        }

        if (cursor.firstChild()) {
          walkTree(cursor);
          cursor.parent();
        }
      } while (cursor.nextSibling());
    }

    walkTree(cursor);

    console.log('Tokens:', tokens);
    console.log('---\n');
  } catch (error) {
    console.error('Parse error:', error.message);
    console.log('---\n');
  }
});

console.log('Lezer parser test complete.');
