/**
 * LEXER SYNCHRONIZATION TEST
 * 
 * This test compares JISON and Lezer lexer outputs to ensure 100% compatibility.
 * Focus: Make the Lezer lexer work exactly like the JISON lexer.
 */

import { describe, it, expect } from 'vitest';
import { parser as lezerParser } from './flow.grammar.js';
// @ts-ignore: JISON doesn't support types
import jisonParser from './flow.jison';

interface Token {
  type: string;
  value: string;
}

/**
 * Extract tokens from JISON lexer
 */
function extractJisonTokens(input: string): Token[] {
  try {
    // Reset the lexer
    jisonParser.lexer.setInput(input);
    const tokens: Token[] = [];
    
    let token;
    while ((token = jisonParser.lexer.lex()) !== 'EOF') {
      if (token && token !== 'SPACE' && token !== 'EOL') {
        tokens.push({
          type: token,
          value: jisonParser.lexer.yytext,
        });
      }
    }
    
    return tokens;
  } catch (error) {
    console.error('JISON lexer error:', error);
    return [];
  }
}

/**
 * Extract tokens from Lezer lexer
 */
function extractLezerTokens(input: string): Token[] {
  try {
    const tree = lezerParser.parse(input);
    const tokens: Token[] = [];

    // Walk through the syntax tree and extract tokens
    tree.iterate({
      enter: (node) => {
        if (node.name && node.from !== node.to) {
          const value = input.slice(node.from, node.to);
          // Skip whitespace and newline tokens
          if (node.name !== 'Space' && node.name !== 'Newline' && value.trim()) {
            tokens.push({
              type: node.name,
              value: value,
            });
          }
        }
      }
    });

    return tokens;
  } catch (error) {
    console.error('Lezer lexer error:', error);
    return [];
  }
}

/**
 * Compare two token arrays
 */
function compareTokens(jisonTokens: Token[], lezerTokens: Token[]): {
  matches: boolean;
  differences: string[];
} {
  const differences: string[] = [];
  
  if (jisonTokens.length !== lezerTokens.length) {
    differences.push(`Token count mismatch: JISON=${jisonTokens.length}, Lezer=${lezerTokens.length}`);
  }
  
  const maxLength = Math.max(jisonTokens.length, lezerTokens.length);
  
  for (let i = 0; i < maxLength; i++) {
    const jisonToken = jisonTokens[i];
    const lezerToken = lezerTokens[i];
    
    if (!jisonToken) {
      differences.push(`Token ${i}: JISON=undefined, Lezer=${lezerToken.type}:${lezerToken.value}`);
    } else if (!lezerToken) {
      differences.push(`Token ${i}: JISON=${jisonToken.type}:${jisonToken.value}, Lezer=undefined`);
    } else if (jisonToken.type !== lezerToken.type || jisonToken.value !== lezerToken.value) {
      differences.push(`Token ${i}: JISON=${jisonToken.type}:${jisonToken.value}, Lezer=${lezerToken.type}:${lezerToken.value}`);
    }
  }
  
  return {
    matches: differences.length === 0,
    differences
  };
}

/**
 * Test helper function
 */
function testLexerSync(testId: string, input: string, description?: string) {
  const jisonTokens = extractJisonTokens(input);
  const lezerTokens = extractLezerTokens(input);
  const comparison = compareTokens(jisonTokens, lezerTokens);
  
  if (!comparison.matches) {
    console.log(`\n${testId}: ${description || input}`);
    console.log('JISON tokens:', jisonTokens);
    console.log('Lezer tokens:', lezerTokens);
    console.log('Differences:', comparison.differences);
  }
  
  expect(comparison.matches).toBe(true);
}

describe('Lexer Synchronization Tests', () => {
  
  describe('Arrow Tokenization', () => {
    
    it('LEX001: should tokenize simple arrow -->', () => {
      testLexerSync('LEX001', 'A --> B', 'simple arrow');
    });
    
    it('LEX002: should tokenize dotted arrow -.-', () => {
      testLexerSync('LEX002', 'A -.- B', 'single dot arrow');
    });
    
    it('LEX003: should tokenize dotted arrow -..-', () => {
      testLexerSync('LEX003', 'A -..- B', 'double dot arrow');
    });
    
    it('LEX004: should tokenize dotted arrow -...-', () => {
      testLexerSync('LEX004', 'A -...- B', 'triple dot arrow');
    });
    
    it('LEX005: should tokenize thick arrow ===', () => {
      testLexerSync('LEX005', 'A === B', 'thick arrow');
    });
    
    it('LEX006: should tokenize double-ended arrow <-->', () => {
      testLexerSync('LEX006', 'A <--> B', 'double-ended arrow');
    });
    
    it('LEX007: should tokenize arrow with text A -->|text| B', () => {
      testLexerSync('LEX007', 'A -->|text| B', 'arrow with text');
    });
    
  });
  
  describe('Basic Tokens', () => {
    
    it('LEX008: should tokenize identifiers', () => {
      testLexerSync('LEX008', 'A B C', 'identifiers');
    });
    
    it('LEX009: should tokenize graph keyword', () => {
      testLexerSync('LEX009', 'graph TD', 'graph keyword');
    });
    
    it('LEX010: should tokenize semicolon', () => {
      testLexerSync('LEX010', 'A --> B;', 'semicolon');
    });
    
  });
  
});
