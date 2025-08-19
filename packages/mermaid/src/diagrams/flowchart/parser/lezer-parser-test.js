/**
 * Test the new Lezer-based flowchart parser
 */

import flowParser from './flowParser.ts';
import { FlowDB } from '../flowDb.ts';

console.log('🚀 Testing Lezer-based flowchart parser...');

// Create FlowDB instance
const flowDb = new FlowDB();
flowParser.yy = flowDb;

// Test basic graph parsing
const testCases = ['graph TD', 'flowchart LR', 'graph TD\nA', 'graph TD\nA --> B'];

for (const testCase of testCases) {
  console.log(`\n=== Testing: "${testCase}" ===`);

  try {
    // Clear the database
    flowDb.clear();

    // Parse the input
    const result = flowParser.parse(testCase);

    console.log('✅ Parse successful');
    console.log('Result:', result);

    // Check what was added to the database
    const vertices = flowDb.getVertices();
    const edges = flowDb.getEdges();
    const direction = flowDb.getDirection();

    console.log('Direction:', direction);
    console.log('Vertices:', Object.keys(vertices));
    console.log('Edges:', edges.length);
  } catch (error) {
    console.error('❌ Parse failed:', error.message);
  }
}

console.log('\n🎉 Lezer parser test complete!');
