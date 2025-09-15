import { execSync } from 'child_process';

console.log('=== DEBUGGING CALLBACK ARGUMENTS ===');

// Test the specific failing case
const testInput = 'graph TD\nA-->B\nclick A call callback("test0", test1, test2)';
console.log('Test input:', testInput);

// Create a temporary test file to debug the ANTLR parser
import fs from 'fs';
const testFile = `
// Debug callback arguments parsing
process.env.USE_ANTLR_PARSER = 'true';

const flow = require('./packages/mermaid/src/diagrams/flowchart/flowDb.ts');
const parser = require('./packages/mermaid/src/diagrams/flowchart/parser/antlr/antlr-parser.ts');

console.log('Testing callback arguments parsing...');

// Mock the setClickEvent to see what parameters it receives
const originalSetClickEvent = flow.default.setClickEvent;
flow.default.setClickEvent = function(...args) {
  console.log('DEBUG setClickEvent called with args:', args);
  console.log('  - nodeId:', args[0]);
  console.log('  - functionName:', args[1]); 
  console.log('  - functionArgs:', args[2]);
  console.log('  - args.length:', args.length);
  return originalSetClickEvent.apply(this, args);
};

try {
  const result = parser.parse('${testInput}');
  console.log('Parse completed successfully');
} catch (error) {
  console.log('Parse error:', error.message);
}
`;

fs.writeFileSync('debug-callback-test.js', testFile);

try {
  const result = execSync('node debug-callback-test.js', {
    cwd: '/Users/ashishjain/projects/mermaid',
    encoding: 'utf8',
    timeout: 10000,
  });
  console.log('Result:', result);
} catch (error) {
  console.log('Error:', error.message);
  if (error.stdout) console.log('Stdout:', error.stdout);
  if (error.stderr) console.log('Stderr:', error.stderr);
}

// Clean up
try {
  fs.unlinkSync('debug-callback-test.js');
} catch (e) {
  // Ignore cleanup errors
}
