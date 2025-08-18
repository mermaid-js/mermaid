/**
 * Debug Tokenization Test
 * 
 * This test helps us understand exactly how our lexer is tokenizing inputs
 * to identify and fix tokenization issues.
 */

import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { FlowLexer } from './generated/src/diagrams/flowchart/parser/FlowLexer.js';

/**
 * Debug tokenization by showing all tokens
 * @param {string} input - Input to tokenize
 * @returns {Array} Array of token details
 */
function debugTokenization(input) {
  try {
    const inputStream = new ANTLRInputStream(input);
    const lexer = new FlowLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    
    // Fill the token stream
    tokenStream.fill();
    
    // Get all tokens
    const tokens = tokenStream.getTokens();
    
    return tokens.map(token => ({
      type: lexer.vocabulary.getSymbolicName(token.type) || token.type.toString(),
      text: token.text,
      line: token.line,
      column: token.charPositionInLine,
      channel: token.channel,
      tokenIndex: token.tokenIndex
    }));
  } catch (error) {
    return [{ error: error.message }];
  }
}

describe('Debug Tokenization', () => {
  
  it('should show tokens for "graph TD"', () => {
    const input = 'graph TD';
    const tokens = debugTokenization(input);
    
    console.log('\n=== TOKENIZATION DEBUG ===');
    console.log(`Input: "${input}"`);
    console.log('Tokens:');
    tokens.forEach((token, index) => {
      console.log(`  ${index}: ${token.type} = "${token.text}" (line:${token.line}, col:${token.column})`);
    });
    console.log('=========================\n');
    
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('should show tokens for "graph"', () => {
    const input = 'graph';
    const tokens = debugTokenization(input);
    
    console.log('\n=== TOKENIZATION DEBUG ===');
    console.log(`Input: "${input}"`);
    console.log('Tokens:');
    tokens.forEach((token, index) => {
      console.log(`  ${index}: ${token.type} = "${token.text}" (line:${token.line}, col:${token.column})`);
    });
    console.log('=========================\n');
    
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('should show tokens for "TD"', () => {
    const input = 'TD';
    const tokens = debugTokenization(input);
    
    console.log('\n=== TOKENIZATION DEBUG ===');
    console.log(`Input: "${input}"`);
    console.log('Tokens:');
    tokens.forEach((token, index) => {
      console.log(`  ${index}: ${token.type} = "${token.text}" (line:${token.line}, col:${token.column})`);
    });
    console.log('=========================\n');
    
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('should show tokens for "graph TD" with explicit space', () => {
    const input = 'graph TD';
    const tokens = debugTokenization(input);
    
    console.log('\n=== TOKENIZATION DEBUG ===');
    console.log(`Input: "${input}" (length: ${input.length})`);
    console.log('Character analysis:');
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const code = char.charCodeAt(0);
      console.log(`  [${i}]: '${char}' (code: ${code})`);
    }
    console.log('Tokens:');
    tokens.forEach((token, index) => {
      console.log(`  ${index}: ${token.type} = "${token.text}" (line:${token.line}, col:${token.column})`);
    });
    console.log('=========================\n');
    
    expect(tokens.length).toBeGreaterThan(0);
  });

});
