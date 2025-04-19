// Test file to print the parsed structure of a mindmap
import { createMindMapServices } from '../src/language/index.js';

// Create services
const mindMapServices = createMindMapServices().MindMap;
const mindMapParser = mindMapServices.parser.LangiumParser;

// Function to parse mindmap
function parse(input) {
  return mindMapParser.parse(input);
}

// Test with a simple mindmap
const result = parse('mindmap\nroot\n  child1\n  child2');

// Print the result structure
console.log('Parse result:');
console.log(JSON.stringify(result.value, null, 2));

// Print the first statement
if (result.value?.statements?.[0]) {
  console.log('\nFirst statement:');
  console.log(JSON.stringify(result.value.statements[0], null, 2));
}
