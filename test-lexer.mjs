// Test the actual lexer to see what tokens are generated
import { FlowchartLexer } from './packages/mermaid/src/diagrams/flowchart/parser/flowLexer.ts';

const testInputs = ['A', 'A-->B', 'graph TD;A-->B;', '-->', 'A-', '>B'];

console.log('Testing actual lexer:');
testInputs.forEach((input) => {
  console.log(`\nInput: "${input}"`);
  try {
    const result = FlowchartLexer.tokenize(input);
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
    console.log(
      'Tokens:',
      result.tokens.map((t) => [t.image, t.tokenType.name])
    );
  } catch (error) {
    console.log('Error:', error.message);
  }
});
