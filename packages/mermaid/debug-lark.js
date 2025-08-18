// Debug script to test Lark parser
import { createParserFactory } from './src/diagrams/flowchart/parser/parserFactory.js';

const factory = createParserFactory();
const larkParser = factory.getParser('lark');

console.log('Testing Lark parser with simple input...');

try {
  const input = 'graph TD;\nA-->B;';
  console.log('Input:', input);
  
  larkParser.parse(input);
  
  const vertices = larkParser.yy.getVertices();
  const edges = larkParser.yy.getEdges();
  const direction = larkParser.yy.getDirection ? larkParser.yy.getDirection() : null;
  
  console.log('Vertices:', vertices);
  console.log('Edges:', edges);
  console.log('Direction:', direction);
  
  if (vertices && typeof vertices.get === 'function') {
    console.log('Vertices is a Map with size:', vertices.size);
    for (const [key, value] of vertices) {
      console.log(`  ${key}:`, value);
    }
  } else if (vertices && typeof vertices === 'object') {
    console.log('Vertices is an object:', Object.keys(vertices));
  } else {
    console.log('Vertices type:', typeof vertices);
  }
  
  if (edges && Array.isArray(edges)) {
    console.log('Edges array length:', edges.length);
    edges.forEach((edge, i) => {
      console.log(`  Edge ${i}:`, edge);
    });
  }
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
