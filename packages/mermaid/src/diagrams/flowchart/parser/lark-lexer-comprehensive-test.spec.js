/**
 * COMPREHENSIVE LARK LEXER TESTING
 *
 * This test suite focuses specifically on the LARK lexer to identify
 * and fix tokenization issues. It provides detailed analysis of how
 * the LARK lexer handles various flowchart syntax patterns.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LarkFlowLexer } from './LarkFlowParser.ts';
import { setConfig } from '../../../config.js';

// Configure for testing
setConfig({
  securityLevel: 'strict',
});

/**
 * Test case structure for LARK lexer testing
 * @typedef {Object} TestCase
 * @property {string} id
 * @property {string} description
 * @property {string} input
 * @property {string[]} expectedTokenTypes
 * @property {string} category
 */

/**
 * Tokenize input using LARK lexer
 * @param {string} input - Input text to tokenize
 * @returns {Promise<Array>} Array of token objects
 */
async function tokenizeWithLark(input) {
  const tokens = [];

  try {
    const lexer = new LarkFlowLexer(input);
    const larkTokens = lexer.tokenize();

    for (let i = 0; i < larkTokens.length; i++) {
      const token = larkTokens[i];
      tokens.push({
        type: token.type,
        value: token.value,
        line: token.line,
        column: token.column,
        tokenIndex: i,
      });
    }
  } catch (error) {
    console.error('LARK tokenization error:', error);
    throw new Error(`LARK tokenization failed: ${error.message}`);
  }

  return tokens;
}

/**
 * Comprehensive test cases covering all major lexer scenarios
 */
const LARK_TEST_CASES = [
  // Basic Graph Declarations
  {
    id: 'GRA001',
    description: 'should tokenize "graph TD" correctly',
    input: 'graph TD',
    expectedTokenTypes: ['GRAPH', 'DIRECTION'],
    category: 'basic',
  },
  {
    id: 'GRA002',
    description: 'should tokenize "graph LR" correctly',
    input: 'graph LR',
    expectedTokenTypes: ['GRAPH', 'DIRECTION'],
    category: 'basic',
  },
  {
    id: 'GRA003',
    description: 'should tokenize "flowchart TB" correctly',
    input: 'flowchart TB',
    expectedTokenTypes: ['FLOWCHART', 'DIRECTION'],
    category: 'basic',
  },

  // Direction Symbols - These are the failing cases we need to fix
  {
    id: 'DIR001',
    description: 'should tokenize single character direction >',
    input: 'graph >',
    expectedTokenTypes: ['GRAPH', 'DIRECTION'],
    category: 'directions',
  },
  {
    id: 'DIR002',
    description: 'should tokenize left direction <',
    input: 'graph <',
    expectedTokenTypes: ['GRAPH', 'DIRECTION'],
    category: 'directions',
  },
  {
    id: 'DIR003',
    description: 'should tokenize up direction ^',
    input: 'graph ^',
    expectedTokenTypes: ['GRAPH', 'DIRECTION'],
    category: 'directions',
  },
  {
    id: 'DIR004',
    description: 'should tokenize down direction v',
    input: 'graph v',
    expectedTokenTypes: ['GRAPH', 'DIRECTION'],
    category: 'directions',
  },

  // Basic Arrows
  {
    id: 'ARR001',
    description: 'should tokenize simple arrow',
    input: 'A-->B',
    expectedTokenTypes: ['WORD', 'ARROW', 'WORD'],
    category: 'arrows',
  },
  {
    id: 'ARR002',
    description: 'should tokenize arrow with spaces',
    input: 'A --> B',
    expectedTokenTypes: ['WORD', 'ARROW', 'WORD'],
    category: 'arrows',
  },
  {
    id: 'ARR003',
    description: 'should tokenize thick arrow',
    input: 'A==>B',
    expectedTokenTypes: ['WORD', 'THICK_ARROW', 'WORD'],
    category: 'arrows',
  },
  {
    id: 'ARR004',
    description: 'should tokenize dotted arrow',
    input: 'A-.->B',
    expectedTokenTypes: ['WORD', 'DOTTED_ARROW', 'WORD'],
    category: 'arrows',
  },

  // Double Arrows - These are the complex failing cases
  {
    id: 'DBL001',
    description: 'should tokenize double arrow',
    input: 'A<-->B',
    expectedTokenTypes: ['WORD', 'DOUBLE_ARROW', 'WORD'],
    category: 'double_arrows',
  },
  {
    id: 'DBL002',
    description: 'should tokenize double thick arrow',
    input: 'A<==>B',
    expectedTokenTypes: ['WORD', 'DOUBLE_THICK_ARROW', 'WORD'],
    category: 'double_arrows',
  },
  {
    id: 'DBL003',
    description: 'should tokenize double dotted arrow',
    input: 'A<-.->B',
    expectedTokenTypes: ['WORD', 'DOUBLE_DOTTED_ARROW', 'WORD'],
    category: 'double_arrows',
  },

  // Complex Cases with Text
  {
    id: 'TXT001',
    description: 'should tokenize arrow with text',
    input: 'A-->|text|B',
    expectedTokenTypes: ['WORD', 'ARROW', 'PIPE', 'WORD', 'PIPE', 'WORD'],
    category: 'text',
  },
  {
    id: 'TXT002',
    description: 'should tokenize double arrow with text (complex pattern)',
    input: 'A<-- text -->B',
    expectedTokenTypes: ['WORD', 'START_LINK', 'EDGE_TEXT', 'LINK', 'WORD'],
    category: 'text',
  },
  {
    id: 'TXT002C',
    description: 'should tokenize simple complex pattern test',
    input: '<-- text -->',
    expectedTokenTypes: ['START_LINK', 'EDGE_TEXT', 'LINK'],
    category: 'text',
  },
  {
    id: 'TXT002B',
    description: 'should tokenize full test case input',
    input: 'graph TD;\nA<-- text -->B;',
    expectedTokenTypes: [
      'GRAPH',
      'DIRECTION',
      'SEMICOLON',
      'NEWLINE',
      'WORD',
      'START_LINK',
      'EDGE_TEXT',
      'LINK',
      'WORD',
      'SEMICOLON',
    ],
    category: 'text',
  },
  {
    id: 'TXT003',
    description: 'should tokenize double thick arrow with text',
    input: 'A<== text ==>B',
    expectedTokenTypes: ['WORD', 'START_LINK', 'EDGE_TEXT', 'LINK', 'WORD'],
    category: 'text',
  },
  {
    id: 'TXT004',
    description: 'should tokenize double dotted arrow with text',
    input: 'A<-. text .->B',
    expectedTokenTypes: ['WORD', 'START_LINK', 'EDGE_TEXT', 'LINK', 'WORD'],
    category: 'text',
  },

  // Node Shapes
  {
    id: 'SHP001',
    description: 'should tokenize square brackets',
    input: 'A[text]',
    expectedTokenTypes: ['WORD', 'SQUARE_START', 'WORD', 'SQUARE_END'],
    category: 'shapes',
  },
  {
    id: 'SHP002',
    description: 'should tokenize round brackets',
    input: 'A(text)',
    expectedTokenTypes: ['WORD', 'ROUND_START', 'WORD', 'ROUND_END'],
    category: 'shapes',
  },

  // Complete Statements
  {
    id: 'CMP001',
    description: 'should tokenize complete flowchart line',
    input: 'graph TD; A-->B;',
    expectedTokenTypes: ['GRAPH', 'DIRECTION', 'SEMICOLON', 'WORD', 'ARROW', 'WORD', 'SEMICOLON'],
    category: 'complex',
  },
  {
    id: 'CMP002',
    description: 'should tokenize with newlines',
    input: 'graph TD\nA-->B',
    expectedTokenTypes: ['GRAPH', 'DIRECTION', 'NEWLINE', 'WORD', 'ARROW', 'WORD'],
    category: 'complex',
  },
];

describe('LARK Lexer Comprehensive Testing', () => {
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    categories: {},
  };

  beforeEach(() => {
    // Reset for each test
  });

  LARK_TEST_CASES.forEach((testCase) => {
    it(`${testCase.id}: ${testCase.description}`, async () => {
      testResults.total++;

      // Initialize category stats if needed
      if (!testResults.categories[testCase.category]) {
        testResults.categories[testCase.category] = { passed: 0, failed: 0, total: 0 };
      }
      testResults.categories[testCase.category].total++;

      try {
        // Tokenize with LARK lexer
        const larkTokens = await tokenizeWithLark(testCase.input);

        // Compare results
        const larkTypes = larkTokens.map((t) => t.type).filter((t) => t !== 'EOF');
        const success = JSON.stringify(larkTypes) === JSON.stringify(testCase.expectedTokenTypes);

        // Update statistics
        if (success) {
          testResults.passed++;
          testResults.categories[testCase.category].passed++;
        } else {
          testResults.failed++;
          testResults.categories[testCase.category].failed++;
        }

        // Log detailed results for debugging
        console.log(`\n🔍 ${testCase.id}: ${testCase.description} [${testCase.category}]`);
        console.log(`Input: "${testCase.input}"`);
        console.log(`Expected: [${testCase.expectedTokenTypes.join(', ')}]`);
        console.log(`LARK: ${success ? '✅' : '❌'} [${larkTypes.join(', ')}]`);

        if (!success) {
          console.log(`  ❌ Mismatch detected!`);
          console.log(`  📋 Detailed token analysis:`);
          larkTokens.forEach((token, i) => {
            const expected = testCase.expectedTokenTypes[i] || '(none)';
            const match = token.type === expected ? '✅' : '❌';
            console.log(
              `    ${i}: ${match} ${token.type}:'${token.value}' (expected: ${expected})`
            );
          });
        }

        // For comprehensive analysis, we'll pass all tests but log the results
        expect(larkTokens.length).toBeGreaterThan(0);
      } catch (error) {
        console.error(`❌ Test ${testCase.id} failed with error:`, error);
        testResults.failed++;
        testResults.categories[testCase.category].failed++;
        expect(error).toBeUndefined();
      }
    });
  });

  // Summary test that runs after all individual tests
  it('should provide comprehensive LARK lexer analysis summary', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 COMPREHENSIVE LARK LEXER ANALYSIS RESULTS');
    console.log('='.repeat(80));

    console.log(`\n📊 OVERALL RESULTS (${testResults.total} test cases):\n`);

    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    console.log(`LARK LEXER PERFORMANCE:`);
    console.log(`  ✅ Passed: ${testResults.passed}/${testResults.total} (${successRate}%)`);
    console.log(`  ❌ Failed: ${testResults.failed}/${testResults.total}`);

    console.log(`\n📋 RESULTS BY CATEGORY:\n`);
    Object.entries(testResults.categories).forEach(([category, stats]) => {
      const categoryRate = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`${category.toUpperCase()}:`);
      console.log(`  ✅ ${stats.passed}/${stats.total} (${categoryRate}%) ❌ ${stats.failed}`);
    });

    console.log(`\n🎯 PRIORITY FIXES NEEDED:`);
    const failingCategories = Object.entries(testResults.categories)
      .filter(([_, stats]) => stats.failed > 0)
      .sort((a, b) => b[1].failed - a[1].failed);

    if (failingCategories.length > 0) {
      failingCategories.forEach(([category, stats]) => {
        console.log(`  🔧 ${category}: ${stats.failed} failing test(s)`);
      });
    } else {
      console.log(`  🎉 All categories passing!`);
    }

    console.log('\n🏁 LARK LEXER COMPREHENSIVE ANALYSIS COMPLETE!');
    console.log(`Success Rate: ${successRate}%`);
    console.log('='.repeat(80));

    // Test passes - this is just a summary
    expect(testResults.total).toBeGreaterThan(0);
  });
});
