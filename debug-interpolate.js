// Debug script for interpolate functionality
import { FlowDB } from './packages/mermaid/src/diagrams/flowchart/flowDb.js';
import flow from './packages/mermaid/src/diagrams/flowchart/parser/flowParserAdapter.js';

// Set up test
flow.yy = new FlowDB();
flow.yy.clear();

console.log('Testing interpolate functionality...');

try {
  const input = 'graph TD\nA-->B\nlinkStyle default interpolate basis';
  console.log('Input:', input);
  
  const result = flow.parse(input);
  console.log('Parse result:', result);
  
  const edges = flow.yy.getEdges();
  console.log('Edges:', edges);
  console.log('edges.defaultInterpolate:', edges.defaultInterpolate);
  
  // Check if updateLinkInterpolate method exists
  console.log('updateLinkInterpolate method exists:', typeof flow.yy.updateLinkInterpolate);
  
} catch (error) {
  console.error('Error:', error);
}
