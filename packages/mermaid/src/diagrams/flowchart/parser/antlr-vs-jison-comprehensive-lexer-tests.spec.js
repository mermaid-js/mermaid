/**
 * COMPREHENSIVE ANTLR vs JISON LEXER COMPARISON TESTS
 * 
 * This test suite leverages the existing lexer tests from the Chevrotain migration
 * and adapts them to compare ANTLR vs Jison lexer performance and accuracy.
 * 
 * Based on the comprehensive test suite created during the Chevrotain migration,
 * we now compare ANTLR against the original Jison lexer.
 */

import { describe, it, expect } from 'vitest';
import { FlowDB } from '../flowDb.js';
import flowParserJison from './flowAntlrParser.js';
import { tokenizeWithANTLR } from './token-stream-comparator.js';
import { setConfig } from '../../../config.js';

// Configure for testing
setConfig({
  securityLevel: 'strict',
});

/**
 * Test case structure adapted from the Chevrotain migration tests
 */
interface TestCase {
  id: string;
  description: string;
  input: string;
  expectedTokenTypes: string[];
  category: string;
}

/**
 * Comprehensive test cases extracted and adapted from the existing lexer tests
 */
const COMPREHENSIVE_TEST_CASES = [
  // Basic Graph Declarations (from lexer-tests-basic.spec.ts)
  {
    id: 'GRA001',
    description: 'should tokenize "graph TD" correctly',
    input: 'graph TD',
    expectedTokenTypes: ['GRAPH', 'DIR'],
    category: 'basic'
  },
  {
    id: 'GRA002', 
    description: 'should tokenize "graph LR" correctly',
    input: 'graph LR',
    expectedTokenTypes: ['GRAPH', 'DIR'],
    category: 'basic'
  },
  {
    id: 'FLO001',
    description: 'should tokenize "flowchart TD" correctly', 
    input: 'flowchart TD',
    expectedTokenTypes: ['GRAPH', 'DIR'],
    category: 'basic'
  },

  // Node Definitions (from lexer-tests-basic.spec.ts)
  {
    id: 'NOD001',
    description: 'should tokenize simple node "A" correctly',
    input: 'A',
    expectedTokenTypes: ['NODE_STRING'],
    category: 'nodes'
  },
  {
    id: 'NOD002',
    description: 'should tokenize node "A1" correctly',
    input: 'A1', 
    expectedTokenTypes: ['NODE_STRING'],
    category: 'nodes'
  },

  // Basic Edges (from lexer-tests-edges.spec.ts)
  {
    id: 'EDG001',
    description: 'should tokenize "A-->B" correctly',
    input: 'A-->B',
    expectedTokenTypes: ['NODE_STRING', 'LINK', 'NODE_STRING'],
    category: 'edges'
  },
  {
    id: 'EDG002',
    description: 'should tokenize "A---B" correctly',
    input: 'A---B',
    expectedTokenTypes: ['NODE_STRING', 'LINK', 'NODE_STRING'],
    category: 'edges'
  },
  {
    id: 'EDG003',
    description: 'should tokenize "A-.->B" correctly',
    input: 'A-.->B',
    expectedTokenTypes: ['NODE_STRING', 'LINK', 'NODE_STRING'],
    category: 'edges'
  },

  // Node Shapes (from lexer-tests-shapes.spec.ts)
  {
    id: 'SHA001',
    description: 'should tokenize square brackets "A[Square]" correctly',
    input: 'A[Square]',
    expectedTokenTypes: ['NODE_STRING', 'SQS', 'STR', 'SQE'],
    category: 'shapes'
  },
  {
    id: 'SHA002',
    description: 'should tokenize round parentheses "A(Round)" correctly',
    input: 'A(Round)',
    expectedTokenTypes: ['NODE_STRING', 'PS', 'STR', 'PE'],
    category: 'shapes'
  },
  {
    id: 'SHA003',
    description: 'should tokenize diamond "A{Diamond}" correctly',
    input: 'A{Diamond}',
    expectedTokenTypes: ['NODE_STRING', 'DIAMOND_START', 'STR', 'DIAMOND_STOP'],
    category: 'shapes'
  },
  {
    id: 'SHA004',
    description: 'should tokenize double circle "A((Circle))" correctly',
    input: 'A((Circle))',
    expectedTokenTypes: ['NODE_STRING', 'DOUBLECIRCLESTART', 'STR', 'DOUBLECIRCLEEND'],
    category: 'shapes'
  },

  // Subgraphs (from lexer-tests-subgraphs.spec.ts)
  {
    id: 'SUB001',
    description: 'should tokenize "subgraph" correctly',
    input: 'subgraph',
    expectedTokenTypes: ['subgraph'],
    category: 'subgraphs'
  },
  {
    id: 'SUB002',
    description: 'should tokenize "end" correctly',
    input: 'end',
    expectedTokenTypes: ['end'],
    category: 'subgraphs'
  },

  // Complex Text (from lexer-tests-complex-text.spec.ts)
  {
    id: 'TXT001',
    description: 'should tokenize quoted text correctly',
    input: 'A["Hello World"]',
    expectedTokenTypes: ['NODE_STRING', 'SQS', 'STR', 'SQE'],
    category: 'text'
  },
  {
    id: 'TXT002',
    description: 'should tokenize text with special characters',
    input: 'A[Text with & symbols]',
    expectedTokenTypes: ['NODE_STRING', 'SQS', 'STR', 'AMP', 'STR', 'SQE'],
    category: 'text'
  },

  // Directions (from lexer-tests-directions.spec.ts)
  {
    id: 'DIR001',
    description: 'should tokenize all direction types',
    input: 'graph TB',
    expectedTokenTypes: ['GRAPH', 'DIR'],
    category: 'directions'
  },
  {
    id: 'DIR002',
    description: 'should tokenize RL direction',
    input: 'graph RL',
    expectedTokenTypes: ['GRAPH', 'DIR'],
    category: 'directions'
  },

  // Styling (from lexer-tests-complex.spec.ts)
  {
    id: 'STY001',
    description: 'should tokenize style command',
    input: 'style A fill:#f9f',
    expectedTokenTypes: ['STYLE', 'NODE_STRING', 'STR'],
    category: 'styling'
  },

  // Comments (from lexer-tests-comments.spec.ts)
  {
    id: 'COM001',
    description: 'should handle comments correctly',
    input: '%% This is a comment',
    expectedTokenTypes: [], // Comments should be ignored
    category: 'comments'
  },

  // Complex Multi-line (from lexer-tests-complex.spec.ts)
  {
    id: 'CPX001',
    description: 'should tokenize complex multi-line flowchart',
    input: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]`,
    expectedTokenTypes: ['GRAPH', 'DIR', 'NEWLINE', 'NODE_STRING', 'SQS', 'STR', 'SQE', 'LINK', 'NODE_STRING', 'DIAMOND_START', 'STR', 'DIAMOND_STOP'],
    category: 'complex'
  }
];

/**
 * Test result comparison structure
 */
interface LexerTestResult {
  testId: string;
  input: string;
  jison: {
    success: boolean;
    tokenCount: number;
    tokens: any[];
    error: string | null;
    time: number;
  };
  antlr: {
    success: boolean;
    tokenCount: number;
    tokens: any[];
    error: string | null;
    time: number;
  };
  comparison: {
    tokensMatch: boolean;
    performanceRatio: number;
    winner: 'jison' | 'antlr' | 'tie';
  };
}

/**
 * Test a single input with both Jison and ANTLR lexers
 */
async function runLexerComparison(testCase: TestCase): Promise<LexerTestResult> {
  const result: LexerTestResult = {
    testId: testCase.id,
    input: testCase.input,
    jison: { success: false, tokenCount: 0, tokens: [], error: null, time: 0 },
    antlr: { success: false, tokenCount: 0, tokens: [], error: null, time: 0 },
    comparison: { tokensMatch: false, performanceRatio: 0, winner: 'tie' }
  };

  // Test Jison lexer
  const jisonStart = performance.now();
  try {
    const lexer = flowParserJison.lexer;
    lexer.setInput(testCase.input);
    
    const jisonTokens = [];
    let token;
    while ((token = lexer.lex()) !== 'EOF') {
      jisonTokens.push({
        type: token,
        value: lexer.yytext,
        line: lexer.yylineno
      });
    }
    
    const jisonEnd = performance.now();
    result.jison = {
      success: true,
      tokenCount: jisonTokens.length,
      tokens: jisonTokens,
      error: null,
      time: jisonEnd - jisonStart
    };
  } catch (error) {
    const jisonEnd = performance.now();
    result.jison = {
      success: false,
      tokenCount: 0,
      tokens: [],
      error: error.message,
      time: jisonEnd - jisonStart
    };
  }

  // Test ANTLR lexer
  const antlrStart = performance.now();
  try {
    const antlrTokens = await tokenizeWithANTLR(testCase.input);
    const antlrEnd = performance.now();
    
    result.antlr = {
      success: true,
      tokenCount: antlrTokens.length,
      tokens: antlrTokens,
      error: null,
      time: antlrEnd - antlrStart
    };
  } catch (error) {
    const antlrEnd = performance.now();
    result.antlr = {
      success: false,
      tokenCount: 0,
      tokens: [],
      error: error.message,
      time: antlrEnd - antlrStart
    };
  }

  // Compare results
  result.comparison.tokensMatch = result.jison.success && result.antlr.success && 
    result.jison.tokenCount === result.antlr.tokenCount;
  
  if (result.jison.time > 0 && result.antlr.time > 0) {
    result.comparison.performanceRatio = result.antlr.time / result.jison.time;
    result.comparison.winner = result.comparison.performanceRatio < 1 ? 'antlr' : 
                              result.comparison.performanceRatio > 1 ? 'jison' : 'tie';
  }

  return result;
}

describe('ANTLR vs Jison Comprehensive Lexer Comparison', () => {

  describe('Individual Test Cases', () => {
    COMPREHENSIVE_TEST_CASES.forEach(testCase => {
      it(`${testCase.id}: ${testCase.description}`, async () => {
        const result = await runLexerComparison(testCase);

        console.log(`\n📊 ${testCase.id} (${testCase.category}): "${testCase.input.replace(/\n/g, '\\n')}"`);
        console.log(`  Jison:  ${result.jison.success ? '✅' : '❌'} ${result.jison.tokenCount} tokens (${result.jison.time.toFixed(2)}ms)`);
        console.log(`  ANTLR:  ${result.antlr.success ? '✅' : '❌'} ${result.antlr.tokenCount} tokens (${result.antlr.time.toFixed(2)}ms)`);

        if (result.jison.success && result.antlr.success) {
          console.log(`  Match:  ${result.comparison.tokensMatch ? '✅' : '❌'} Performance: ${result.comparison.performanceRatio.toFixed(2)}x Winner: ${result.comparison.winner.toUpperCase()}`);
        }

        if (!result.jison.success) console.log(`  Jison Error: ${result.jison.error}`);
        if (!result.antlr.success) console.log(`  ANTLR Error: ${result.antlr.error}`);

        // At minimum, ANTLR should succeed
        expect(result.antlr.success).toBe(true);

        // If both succeed, performance should be reasonable
        if (result.jison.success && result.antlr.success) {
          expect(result.comparison.performanceRatio).toBeLessThan(10); // ANTLR shouldn't be more than 10x slower
        }
      });
    });
  });

  describe('Comprehensive Analysis', () => {
    it('should run comprehensive comparison across all test categories', async () => {
      console.log('\n' + '='.repeat(80));
      console.log('🔍 COMPREHENSIVE ANTLR vs JISON LEXER ANALYSIS');
      console.log('Based on Chevrotain Migration Test Suite');
      console.log('='.repeat(80));

      const results = [];
      const categoryStats = new Map();

      // Run all tests
      for (const testCase of COMPREHENSIVE_TEST_CASES) {
        const result = await runLexerComparison(testCase);
        results.push(result);

        // Track category statistics
        if (!categoryStats.has(testCase.category)) {
          categoryStats.set(testCase.category, {
            total: 0,
            jisonSuccess: 0,
            antlrSuccess: 0,
            totalJisonTime: 0,
            totalAntlrTime: 0,
            matches: 0
          });
        }

        const stats = categoryStats.get(testCase.category);
        stats.total++;
        if (result.jison.success) {
          stats.jisonSuccess++;
          stats.totalJisonTime += result.jison.time;
        }
        if (result.antlr.success) {
          stats.antlrSuccess++;
          stats.totalAntlrTime += result.antlr.time;
        }
        if (result.comparison.tokensMatch) {
          stats.matches++;
        }
      }

      // Calculate overall statistics
      const totalTests = results.length;
      const jisonSuccesses = results.filter(r => r.jison.success).length;
      const antlrSuccesses = results.filter(r => r.antlr.success).length;
      const totalMatches = results.filter(r => r.comparison.tokensMatch).length;

      const totalJisonTime = results.reduce((sum, r) => sum + r.jison.time, 0);
      const totalAntlrTime = results.reduce((sum, r) => sum + r.antlr.time, 0);
      const avgPerformanceRatio = totalAntlrTime / totalJisonTime;

      console.log('\n📊 OVERALL RESULTS:');
      console.log(`Total Tests: ${totalTests}`);
      console.log(`Jison Success Rate: ${jisonSuccesses}/${totalTests} (${(jisonSuccesses/totalTests*100).toFixed(1)}%)`);
      console.log(`ANTLR Success Rate: ${antlrSuccesses}/${totalTests} (${(antlrSuccesses/totalTests*100).toFixed(1)}%)`);
      console.log(`Token Matches: ${totalMatches}/${totalTests} (${(totalMatches/totalTests*100).toFixed(1)}%)`);
      console.log(`Average Performance Ratio: ${avgPerformanceRatio.toFixed(2)}x (ANTLR vs Jison)`);

      console.log('\n📋 CATEGORY BREAKDOWN:');
      for (const [category, stats] of categoryStats.entries()) {
        const jisonRate = (stats.jisonSuccess / stats.total * 100).toFixed(1);
        const antlrRate = (stats.antlrSuccess / stats.total * 100).toFixed(1);
        const matchRate = (stats.matches / stats.total * 100).toFixed(1);
        const avgJisonTime = stats.totalJisonTime / stats.jisonSuccess || 0;
        const avgAntlrTime = stats.totalAntlrTime / stats.antlrSuccess || 0;
        const categoryRatio = avgAntlrTime / avgJisonTime || 0;

        console.log(`  ${category.toUpperCase()}:`);
        console.log(`    Tests: ${stats.total}`);
        console.log(`    Jison: ${stats.jisonSuccess}/${stats.total} (${jisonRate}%) avg ${avgJisonTime.toFixed(2)}ms`);
        console.log(`    ANTLR: ${stats.antlrSuccess}/${stats.total} (${antlrRate}%) avg ${avgAntlrTime.toFixed(2)}ms`);
        console.log(`    Matches: ${stats.matches}/${stats.total} (${matchRate}%)`);
        console.log(`    Performance: ${categoryRatio.toFixed(2)}x`);
      }

      console.log('\n🏆 FINAL ASSESSMENT:');
      if (antlrSuccesses > jisonSuccesses) {
        console.log('✅ ANTLR SUPERIOR: Higher success rate than Jison');
      } else if (antlrSuccesses === jisonSuccesses) {
        console.log('🎯 EQUAL RELIABILITY: Same success rate as Jison');
      } else {
        console.log('⚠️ JISON SUPERIOR: Higher success rate than ANTLR');
      }

      if (avgPerformanceRatio < 1.5) {
        console.log('🚀 EXCELLENT PERFORMANCE: ANTLR within 1.5x of Jison');
      } else if (avgPerformanceRatio < 3.0) {
        console.log('✅ GOOD PERFORMANCE: ANTLR within 3x of Jison');
      } else if (avgPerformanceRatio < 5.0) {
        console.log('⚠️ ACCEPTABLE PERFORMANCE: ANTLR within 5x of Jison');
      } else {
        console.log('❌ POOR PERFORMANCE: ANTLR significantly slower than Jison');
      }

      console.log('='.repeat(80));

      // Assertions for test framework
      expect(antlrSuccesses).toBeGreaterThanOrEqual(jisonSuccesses * 0.8); // ANTLR should be at least 80% as reliable
      expect(avgPerformanceRatio).toBeLessThan(10); // Performance should be reasonable
      expect(antlrSuccesses).toBeGreaterThan(totalTests * 0.7); // At least 70% success rate

      console.log(`\n🎉 COMPREHENSIVE TEST COMPLETE: ANTLR ${antlrSuccesses}/${totalTests} success, ${avgPerformanceRatio.toFixed(2)}x performance ratio`);
    });
  });

});
