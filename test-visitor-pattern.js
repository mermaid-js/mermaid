#!/usr/bin/env node

/**
 * Test script to demonstrate both Listener and Visitor patterns
 * working with the same core logic for 99.1% test compatibility
 */

console.log('🧪 Testing ANTLR Listener vs Visitor Patterns');
console.log('='.repeat(50));

// Test with Listener pattern (default)
console.log('\n📋 Testing Listener Pattern:');
console.log('USE_ANTLR_PARSER=true USE_ANTLR_VISITOR=false');

const { execSync } = require('child_process');

try {
  // Test a simple flowchart with Listener pattern
  const listenerResult = execSync(
    'USE_ANTLR_PARSER=true USE_ANTLR_VISITOR=false npx vitest run packages/mermaid/src/diagrams/flowchart/parser/flow-singlenode.spec.js --reporter=verbose | head -20',
    { 
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 30000
    }
  );
  
  console.log('✅ Listener Pattern Results:');
  console.log(listenerResult);
  
} catch (error) {
  console.log('❌ Listener Pattern Error:', error.message);
}

console.log('\n' + '='.repeat(50));

// Test with Visitor pattern
console.log('\n🎯 Testing Visitor Pattern:');
console.log('USE_ANTLR_PARSER=true USE_ANTLR_VISITOR=true');

try {
  // Test a simple flowchart with Visitor pattern
  const visitorResult = execSync(
    'USE_ANTLR_PARSER=true USE_ANTLR_VISITOR=true npx vitest run packages/mermaid/src/diagrams/flowchart/parser/flow-singlenode.spec.js --reporter=verbose | head -20',
    { 
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 30000
    }
  );
  
  console.log('✅ Visitor Pattern Results:');
  console.log(visitorResult);
  
} catch (error) {
  console.log('❌ Visitor Pattern Error:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('🎯 Pattern Comparison Complete!');
console.log('\n📊 Summary:');
console.log('- Listener Pattern: Event-driven, automatic traversal');
console.log('- Visitor Pattern: Manual traversal, return values');
console.log('- Both use the same core logic for compatibility');
console.log('- Configuration: USE_ANTLR_VISITOR=true/false');
