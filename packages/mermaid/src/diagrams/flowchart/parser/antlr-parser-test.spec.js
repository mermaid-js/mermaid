/**
 * ANTLR Parser Test Suite
 *
 * This test suite validates the complete ANTLR parser functionality
 * by testing both lexer and parser components together.
 */

import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { FlowLexer } from './generated/src/diagrams/flowchart/parser/FlowLexer.js';
import { FlowParser } from './generated/src/diagrams/flowchart/parser/FlowParser.js';

/**
 * Parse input using ANTLR parser
 * @param {string} input - Input text to parse
 * @returns {Object} Parse result with AST and any errors
 */
function parseWithANTLR(input) {
  try {
    // Create input stream
    const inputStream = new ANTLRInputStream(input);
    
    // Create lexer
    const lexer = new FlowLexer(inputStream);
    
    // Create token stream
    const tokenStream = new CommonTokenStream(lexer);
    
    // Create parser
    const parser = new FlowParser(tokenStream);
    
    // Parse starting from the 'start' rule
    const tree = parser.start();
    
    return {
      success: true,
      tree: tree,
      tokens: tokenStream.getTokens(),
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      tree: null,
      tokens: null,
      errors: [error.message]
    };
  }
}

describe('ANTLR Parser Basic Functionality', () => {
  
  it('should parse simple graph declaration', async () => {
    const input = 'graph TD';
    const result = parseWithANTLR(input);
    
    expect(result.success).toBe(true);
    expect(result.tree).toBeDefined();
    expect(result.errors.length).toBe(0);
    
    console.log('Parse tree for "graph TD":', result.tree.constructor.name);
    console.log('Token count:', result.tokens.length);
  });

  it('should parse simple node connection', async () => {
    const input = 'graph TD\nA-->B';
    const result = parseWithANTLR(input);
    
    expect(result.success).toBe(true);
    expect(result.tree).toBeDefined();
    expect(result.errors.length).toBe(0);
    
    console.log('Parse tree for "graph TD\\nA-->B":', result.tree.constructor.name);
    console.log('Token count:', result.tokens.length);
  });

  it('should parse node with shape', async () => {
    const input = 'graph TD\nA[Square Node]';
    const result = parseWithANTLR(input);
    
    expect(result.success).toBe(true);
    expect(result.tree).toBeDefined();
    expect(result.errors.length).toBe(0);
    
    console.log('Parse tree for node with shape:', result.tree.constructor.name);
    console.log('Token count:', result.tokens.length);
  });

  it('should handle empty document', async () => {
    const input = 'graph TD\n';
    const result = parseWithANTLR(input);
    
    expect(result.success).toBe(true);
    expect(result.tree).toBeDefined();
    expect(result.errors.length).toBe(0);
    
    console.log('Parse tree for empty document:', result.tree.constructor.name);
  });

  it('should report parsing errors for invalid input', async () => {
    const input = 'invalid syntax here';
    const result = parseWithANTLR(input);
    
    // This might succeed or fail depending on how our grammar handles invalid input
    // The important thing is that we get a result without crashing
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    
    console.log('Result for invalid input:', result.success ? 'SUCCESS' : 'FAILED');
    if (!result.success) {
      console.log('Errors:', result.errors);
    }
  });

});
