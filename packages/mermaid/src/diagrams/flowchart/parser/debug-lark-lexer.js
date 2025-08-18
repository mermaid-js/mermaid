// Debug script to test LARK lexer tokenization
import { LarkFlowParser } from './LarkFlowParser.ts';

// We need to access the lexer through the parser's parse method
function testTokenization(input) {
  try {
    const parser = new LarkFlowParser();
    // The lexer is created internally, so let's just try to parse and see what happens
    parser.parse(input);
    return 'Parse successful';
  } catch (error) {
    return `Parse error: ${error.message}`;
  }
}

// Test rect pattern
const rectInput = 'A[|test|] --> B';
console.log('🔍 Testing rect pattern:', rectInput);
console.log('Result:', testTokenization(rectInput));

// Test odd pattern
const oddInput = 'A>test] --> B';
console.log('\n🔍 Testing odd pattern:', oddInput);
console.log('Result:', testTokenization(oddInput));

// Test stadium pattern
const stadiumInput = 'A([test]) --> B';
console.log('\n🔍 Testing stadium pattern:', stadiumInput);
console.log('Result:', testTokenization(stadiumInput));
