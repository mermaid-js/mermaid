// Test backslash character parsing
const flow = require('./packages/mermaid/src/diagrams/flowchart/flowDb.ts');

// Set up ANTLR parser
process.env.USE_ANTLR_PARSER = 'true';
const antlrParser = require('./packages/mermaid/src/diagrams/flowchart/parser/antlr/antlr-parser.ts');

try {
  console.log('Testing backslash character: \\');
  
  // Test the problematic input
  const input = 'graph TD; \\ --> A';
  console.log('Input:', input);
  
  // Parse with ANTLR
  const result = antlrParser.parse(input);
  console.log('Parse result:', result);
  
  // Check vertices
  const vertices = flow.getVertices();
  console.log('Vertices:', vertices);
  console.log('Backslash vertex:', vertices.get('\\'));
  
} catch (error) {
  console.error('Error:', error);
}
