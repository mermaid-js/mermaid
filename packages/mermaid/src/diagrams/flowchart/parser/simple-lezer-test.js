/**
 * Simple test to debug Lezer parser
 */

import { parser } from './flow.grammar.js';

const input = 'graph TD';
console.log(`Testing input: "${input}"`);

try {
  const tree = parser.parse(input);
  console.log('Parse tree:', tree.toString());
  console.log('Tree cursor info:');
  
  const cursor = tree.cursor();
  console.log(`Root node: ${cursor.node.name} (${cursor.from}-${cursor.to})`);
  
  // Try to move to first child
  if (cursor.firstChild()) {
    console.log(`First child: ${cursor.node.name} (${cursor.from}-${cursor.to})`);
    
    // Try to move to next sibling
    while (cursor.nextSibling()) {
      console.log(`Next sibling: ${cursor.node.name} (${cursor.from}-${cursor.to})`);
    }
  } else {
    console.log('No children found');
  }
  
  // Reset cursor and try different approach
  const cursor2 = tree.cursor();
  console.log('\nTrying iterate approach:');
  
  do {
    console.log(`Node: ${cursor2.node.name} (${cursor2.from}-${cursor2.to}): "${input.slice(cursor2.from, cursor2.to)}"`);
  } while (cursor2.next());
  
} catch (error) {
  console.error('Parse error:', error.message);
}

console.log('\nTest complete.');
