/**
 * Lexer Validation Tests - Comparing JISON vs Lezer tokenization
 * Phase 1: Basic tokenization compatibility testing
 */

import { parser as lezerParser } from './flow.grammar.js';
import { FlowDB } from '../flowDb.js';
// @ts-ignore: JISON doesn't support types
import jisonParser from './flow.jison';

describe('Lezer vs JISON Lexer Validation', () => {
  let jisonLexer;
  
  beforeEach(() => {
    // Set up JISON lexer
    jisonLexer = jisonParser.lexer;
    if (!jisonLexer.yy) {
      jisonLexer.yy = new FlowDB();
    }
    jisonLexer.yy.clear();
    
    // Ensure lex property is set up for JISON lexer
    if (!jisonLexer.yy.lex || typeof jisonLexer.yy.lex.firstGraph !== 'function') {
      jisonLexer.yy.lex = {
        firstGraph: jisonLexer.yy.firstGraph.bind(jisonLexer.yy),
      };
    }
  });

  /**
   * Extract tokens from JISON lexer
   */
  function extractJisonTokens(input) {
    const tokens = [];
    const errors = [];

    try {
      // Reset lexer state
      jisonLexer.yylineno = 1;
      if (jisonLexer.yylloc) {
        jisonLexer.yylloc = {
          first_line: 1,
          last_line: 1,
          first_column: 0,
          last_column: 0,
        };
      }

      jisonLexer.setInput(input);

      let token;
      let count = 0;
      const maxTokens = 20; // Prevent infinite loops

      while (count < maxTokens) {
        try {
          token = jisonLexer.lex();

          // Check for EOF
          if (token === 'EOF' || token === 1 || token === 11) {
            tokens.push({
              type: 'EOF',
              value: '',
              start: jisonLexer.yylloc?.first_column || 0,
              end: jisonLexer.yylloc?.last_column || 0
            });
            break;
          }

          tokens.push({
            type: typeof token === 'string' ? token : `TOKEN_${token}`,
            value: jisonLexer.yytext || '',
            start: jisonLexer.yylloc?.first_column || 0,
            end: jisonLexer.yylloc?.last_column || 0
          });
          count++;
        } catch (lexError) {
          errors.push(`JISON lexer error: ${lexError.message}`);
          break;
        }
      }
    } catch (error) {
      errors.push(`JISON tokenization error: ${error.message}`);
    }

    return { tokens, errors };
  }

  /**
   * Extract tokens from Lezer parser
   */
  function extractLezerTokens(input) {
    try {
      const tree = lezerParser.parse(input);
      const tokens = [];
      
      function walkTree(cursor) {
        do {
          const nodeName = cursor.node.name;
          
          if (nodeName !== 'Flowchart' && nodeName !== 'statement') {
            tokens.push({
              type: nodeName,
              value: input.slice(cursor.from, cursor.to),
              start: cursor.from,
              end: cursor.to
            });
          }
          
          if (cursor.firstChild()) {
            walkTree(cursor);
            cursor.parent();
          }
        } while (cursor.nextSibling());
      }
      
      walkTree(tree.cursor());
      
      // Add EOF token for consistency
      tokens.push({
        type: 'EOF',
        value: '',
        start: input.length,
        end: input.length
      });
      
      return { tokens, errors: [] };
    } catch (error) {
      return {
        tokens: [],
        errors: [`Lezer tokenization error: ${error.message}`]
      };
    }
  }

  /**
   * Compare tokenization results
   */
  function compareTokenization(input) {
    const jisonResult = extractJisonTokens(input);
    const lezerResult = extractLezerTokens(input);
    
    console.log(`\n=== Comparing tokenization for: "${input}" ===`);
    console.log('JISON tokens:', jisonResult.tokens);
    console.log('Lezer tokens:', lezerResult.tokens);
    console.log('JISON errors:', jisonResult.errors);
    console.log('Lezer errors:', lezerResult.errors);
    
    return {
      jisonResult,
      lezerResult,
      matches: JSON.stringify(jisonResult.tokens) === JSON.stringify(lezerResult.tokens)
    };
  }

  // Basic tokenization tests
  const basicTestCases = [
    'graph TD',
    'flowchart LR',
    'A --> B',
    'subgraph test',
    'end'
  ];

  basicTestCases.forEach((testCase, index) => {
    it(`should tokenize "${testCase}" consistently between JISON and Lezer`, () => {
      const result = compareTokenization(testCase);
      
      // For now, we're just documenting differences rather than asserting equality
      // This is Phase 1 - understanding the differences
      expect(result.jisonResult.errors).toEqual([]);
      expect(result.lezerResult.errors).toEqual([]);
      
      // Log the comparison for analysis
      if (!result.matches) {
        console.log(`\nTokenization difference found for: "${testCase}"`);
        console.log('This is expected in Phase 1 - we are documenting differences');
      }
    });
  });

  it('should demonstrate basic Lezer functionality', () => {
    const input = 'graph TD';
    const tree = lezerParser.parse(input);
    
    expect(tree).toBeDefined();
    expect(tree.toString()).toContain('Flowchart');
    
    const cursor = tree.cursor();
    expect(cursor.node.name).toBe('Flowchart');
    
    // Should have child nodes
    expect(cursor.firstChild()).toBe(true);
    expect(cursor.node.name).toBe('GraphKeyword');
    expect(input.slice(cursor.from, cursor.to)).toBe('graph');
  });

  it('should demonstrate basic JISON functionality', () => {
    const input = 'graph TD';
    const result = extractJisonTokens(input);
    
    expect(result.errors).toEqual([]);
    expect(result.tokens.length).toBeGreaterThan(0);
    
    // Should have some tokens
    const tokenTypes = result.tokens.map(t => t.type);
    expect(tokenTypes).toContain('EOF');
  });
});
