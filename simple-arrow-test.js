import { FlowDB } from './packages/mermaid/src/diagrams/flowchart/flowDb.ts';
import flow from './packages/mermaid/src/diagrams/flowchart/parser/flowParserAdapter.ts';

// Set up the test environment
flow.yy = new FlowDB();
flow.yy.clear();

console.log('=== Testing simple arrow ===');
console.log('Input: "-->"');

try {
  const result = flow.parse('-->');
  console.log('Parse result:', result);
} catch (error) {
  console.error('Parse error:', error.message);
}
