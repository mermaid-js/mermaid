import { FlowchartLexer } from './flowLexer.js';
import { FlowchartParser } from './flowParser.js';
import { FlowchartAstVisitor } from './flowAst.js';

// Simple test function
function testChevrotainParser() {
  // Test simple flowchart
  const input = `
    graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D
  `;

  // Tokenize
  const lexResult = FlowchartLexer.tokenize(input);

  if (lexResult.errors.length > 0) {
    throw new Error(`Lexing errors: ${lexResult.errors.map((e) => e.message).join(', ')}`);
  }

  // Parse
  const parser = new FlowchartParser();
  parser.input = lexResult.tokens;
  const cst = parser.flowchart();

  if (parser.errors.length > 0) {
    throw new Error(`Parse errors: ${parser.errors.map((e) => e.message).join(', ')}`);
  }

  // Visit CST and build AST
  const visitor = new FlowchartAstVisitor();
  const ast = visitor.visit(cst);

  return ast;
}

// Export for testing
export { testChevrotainParser };
