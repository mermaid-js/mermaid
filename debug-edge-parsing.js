import { FlowDB } from './packages/mermaid/src/diagrams/flowchart/flowDb.ts';
import flow from './packages/mermaid/src/diagrams/flowchart/parser/flowParserAdapter.ts';

// Set up the test environment
flow.yy = new FlowDB();
flow.yy.clear();

console.log('=== Testing basic edge parsing ===');
console.log('Input: "graph TD;A-->B;"');

try {
  const result = flow.parse('graph TD;A-->B;');
  console.log('Parse result:', result);

  const vertices = flow.yy.getVertices();
  const edges = flow.yy.getEdges();

  console.log('Vertices:', vertices);
  console.log('Vertices size:', vertices.size);
  console.log('Vertices keys:', Array.from(vertices.keys()));

  console.log('Edges:', edges);
  console.log('Edges length:', edges.length);

  // Check specific vertices
  console.log('Vertex A:', vertices.get('A'));
  console.log('Vertex B:', vertices.get('B'));
} catch (error) {
  console.error('Parse error:', error);
  console.error('Error stack:', error.stack);
}
