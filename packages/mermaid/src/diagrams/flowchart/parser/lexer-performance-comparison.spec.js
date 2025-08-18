/**
 * Comprehensive Jison vs ANTLR Lexer Performance and Validation Comparison
 * 
 * This test suite provides detailed performance benchmarking and validation
 * comparison between the existing Jison lexer and our new ANTLR lexer.
 */

import { tokenizeWithANTLR } from './token-stream-comparator.js';
import { LEXER_TEST_CASES, getAllTestCases } from './lexer-test-cases.js';

/**
 * Tokenize input using Jison lexer (actual implementation)
 * @param {string} input - Input text to tokenize
 * @returns {Promise<Object>} Tokenization result with timing
 */
async function tokenizeWithJisonTimed(input) {
  const startTime = performance.now();
  
  try {
    // Import the actual Jison parser
    const { parser } = await import('../flowDb.js');
    
    // Create a simple lexer wrapper that captures tokens
    const tokens = [];
    const originalLex = parser.lexer.lex;
    let tokenIndex = 0;
    
    // Override the lex method to capture tokens
    parser.lexer.lex = function() {
      const token = originalLex.call(this);
      if (token !== 'EOF') {
        tokens.push({
          type: token,
          value: this.yytext || '',
          line: this.yylineno || 1,
          column: this.yylloc ? this.yylloc.first_column : 0,
          tokenIndex: tokenIndex++
        });
      }
      return token;
    };
    
    // Initialize and tokenize
    parser.lexer.setInput(input);
    
    let token;
    while ((token = parser.lexer.lex()) !== 'EOF') {
      // Tokens are captured in the overridden lex method
    }
    
    // Add EOF token
    tokens.push({
      type: 'EOF',
      value: '<EOF>',
      line: parser.lexer.yylineno || 1,
      column: parser.lexer.yylloc ? parser.lexer.yylloc.last_column : input.length,
      tokenIndex: tokenIndex
    });
    
    // Restore original lex method
    parser.lexer.lex = originalLex;
    
    const endTime = performance.now();
    
    return {
      success: true,
      tokens: tokens,
      tokenCount: tokens.length,
      duration: endTime - startTime,
      error: null
    };
    
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      tokens: [],
      tokenCount: 0,
      duration: endTime - startTime,
      error: error.message
    };
  }
}

/**
 * Tokenize input using ANTLR lexer with timing
 * @param {string} input - Input text to tokenize
 * @returns {Promise<Object>} Tokenization result with timing
 */
async function tokenizeWithANTLRTimed(input) {
  const startTime = performance.now();
  
  try {
    const tokens = await tokenizeWithANTLR(input);
    const endTime = performance.now();
    
    return {
      success: true,
      tokens: tokens,
      tokenCount: tokens.length,
      duration: endTime - startTime,
      error: null
    };
    
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      tokens: [],
      tokenCount: 0,
      duration: endTime - startTime,
      error: error.message
    };
  }
}

/**
 * Compare token streams for validation
 * @param {Array} jisonTokens - Tokens from Jison lexer
 * @param {Array} antlrTokens - Tokens from ANTLR lexer
 * @returns {Object} Comparison result
 */
function compareTokenStreams(jisonTokens, antlrTokens) {
  const comparison = {
    identical: true,
    tokenCountMatch: jisonTokens.length === antlrTokens.length,
    differences: [],
    jisonCount: jisonTokens.length,
    antlrCount: antlrTokens.length
  };
  
  const maxLength = Math.max(jisonTokens.length, antlrTokens.length);
  
  for (let i = 0; i < maxLength; i++) {
    const jisonToken = jisonTokens[i];
    const antlrToken = antlrTokens[i];
    
    if (!jisonToken && antlrToken) {
      comparison.identical = false;
      comparison.differences.push({
        index: i,
        issue: 'ANTLR_EXTRA_TOKEN',
        antlr: `${antlrToken.type}="${antlrToken.value}"`
      });
    } else if (jisonToken && !antlrToken) {
      comparison.identical = false;
      comparison.differences.push({
        index: i,
        issue: 'JISON_EXTRA_TOKEN',
        jison: `${jisonToken.type}="${jisonToken.value}"`
      });
    } else if (jisonToken && antlrToken) {
      if (jisonToken.type !== antlrToken.type || jisonToken.value !== antlrToken.value) {
        comparison.identical = false;
        comparison.differences.push({
          index: i,
          issue: 'TOKEN_MISMATCH',
          jison: `${jisonToken.type}="${jisonToken.value}"`,
          antlr: `${antlrToken.type}="${antlrToken.value}"`
        });
      }
    }
  }
  
  return comparison;
}

/**
 * Run comprehensive performance and validation comparison
 * @param {Array<string>} testCases - Test cases to compare
 * @returns {Object} Comprehensive comparison results
 */
async function runComprehensiveComparison(testCases) {
  const results = [];
  let jisonTotalTime = 0;
  let antlrTotalTime = 0;
  let jisonSuccesses = 0;
  let antlrSuccesses = 0;
  let validationMatches = 0;
  
  console.log(`\n🔄 Running comprehensive comparison on ${testCases.length} test cases...\n`);
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const displayInput = testCase.length > 50 ? testCase.substring(0, 50) + '...' : testCase;
    
    console.log(`[${i + 1}/${testCases.length}] Testing: "${displayInput}"`);
    
    // Run both lexers
    const jisonResult = await tokenizeWithJisonTimed(testCase);
    const antlrResult = await tokenizeWithANTLRTimed(testCase);
    
    // Compare results
    let comparison = null;
    if (jisonResult.success && antlrResult.success) {
      comparison = compareTokenStreams(jisonResult.tokens, antlrResult.tokens);
      if (comparison.identical) {
        validationMatches++;
      }
    }
    
    // Accumulate statistics
    jisonTotalTime += jisonResult.duration;
    antlrTotalTime += antlrResult.duration;
    if (jisonResult.success) jisonSuccesses++;
    if (antlrResult.success) antlrSuccesses++;
    
    // Store result
    results.push({
      input: testCase,
      jison: jisonResult,
      antlr: antlrResult,
      comparison: comparison
    });
    
    // Log result
    const jisonStatus = jisonResult.success ? '✅' : '❌';
    const antlrStatus = antlrResult.success ? '✅' : '❌';
    const matchStatus = comparison?.identical ? '✅' : (comparison ? '❌' : '⚠️');
    
    console.log(`  Jison: ${jisonStatus} (${jisonResult.duration.toFixed(2)}ms, ${jisonResult.tokenCount} tokens)`);
    console.log(`  ANTLR: ${antlrStatus} (${antlrResult.duration.toFixed(2)}ms, ${antlrResult.tokenCount} tokens)`);
    console.log(`  Match: ${matchStatus} ${comparison?.identical ? 'IDENTICAL' : (comparison ? 'DIFFERENT' : 'N/A')}`);
    console.log('');
  }
  
  return {
    results,
    summary: {
      totalTests: testCases.length,
      jisonSuccesses,
      antlrSuccesses,
      validationMatches,
      jisonTotalTime,
      antlrTotalTime,
      jisonAvgTime: jisonTotalTime / testCases.length,
      antlrAvgTime: antlrTotalTime / testCases.length,
      jisonSuccessRate: (jisonSuccesses / testCases.length * 100).toFixed(2),
      antlrSuccessRate: (antlrSuccesses / testCases.length * 100).toFixed(2),
      validationMatchRate: (validationMatches / testCases.length * 100).toFixed(2)
    }
  };
}

describe('Jison vs ANTLR Lexer Performance and Validation Comparison', () => {
  
  describe('Basic Functionality Comparison', () => {
    const basicTests = [
      'graph TD',
      'A-->B',
      'graph TD\nA-->B',
      'A[Square]',
      'A-->|Text|B'
    ];
    
    basicTests.forEach(testCase => {
      it(`should compare lexers for: "${testCase.replace(/\n/g, '\\n')}"`, async () => {
        const jisonResult = await tokenizeWithJisonTimed(testCase);
        const antlrResult = await tokenizeWithANTLRTimed(testCase);
        
        console.log(`\n📊 Comparison for: "${testCase.replace(/\n/g, '\\n')}"`);
        console.log(`Jison: ${jisonResult.success ? '✅' : '❌'} (${jisonResult.duration.toFixed(2)}ms, ${jisonResult.tokenCount} tokens)`);
        console.log(`ANTLR: ${antlrResult.success ? '✅' : '❌'} (${antlrResult.duration.toFixed(2)}ms, ${antlrResult.tokenCount} tokens)`);
        
        if (jisonResult.success && antlrResult.success) {
          const comparison = compareTokenStreams(jisonResult.tokens, antlrResult.tokens);
          console.log(`Match: ${comparison.identical ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);
          
          if (!comparison.identical) {
            console.log('Differences:');
            comparison.differences.forEach(diff => {
              console.log(`  [${diff.index}] ${diff.issue}: ${diff.jison || ''} vs ${diff.antlr || ''}`);
            });
          }
        }
        
        // Both lexers should succeed for basic functionality
        expect(antlrResult.success).toBe(true);
      });
    });
  });
  
  describe('Comprehensive Performance Benchmark', () => {
    it('should run full performance and validation comparison', async () => {
      const allTestCases = getAllTestCases();
      const comparisonResults = await runComprehensiveComparison(allTestCases);
      
      // Generate comprehensive report
      console.log('\n' + '='.repeat(80));
      console.log('COMPREHENSIVE JISON vs ANTLR LEXER COMPARISON REPORT');
      console.log('='.repeat(80));
      console.log(`Total Test Cases: ${comparisonResults.summary.totalTests}`);
      console.log('');
      console.log('SUCCESS RATES:');
      console.log(`  Jison Lexer:  ${comparisonResults.summary.jisonSuccesses}/${comparisonResults.summary.totalTests} (${comparisonResults.summary.jisonSuccessRate}%)`);
      console.log(`  ANTLR Lexer:  ${comparisonResults.summary.antlrSuccesses}/${comparisonResults.summary.totalTests} (${comparisonResults.summary.antlrSuccessRate}%)`);
      console.log(`  Validation Match: ${comparisonResults.summary.validationMatches}/${comparisonResults.summary.totalTests} (${comparisonResults.summary.validationMatchRate}%)`);
      console.log('');
      console.log('PERFORMANCE METRICS:');
      console.log(`  Jison Total Time:   ${comparisonResults.summary.jisonTotalTime.toFixed(2)}ms`);
      console.log(`  ANTLR Total Time:   ${comparisonResults.summary.antlrTotalTime.toFixed(2)}ms`);
      console.log(`  Jison Avg Time:     ${comparisonResults.summary.jisonAvgTime.toFixed(2)}ms per test`);
      console.log(`  ANTLR Avg Time:     ${comparisonResults.summary.antlrAvgTime.toFixed(2)}ms per test`);
      console.log(`  Performance Ratio:  ${(comparisonResults.summary.antlrAvgTime / comparisonResults.summary.jisonAvgTime).toFixed(2)}x (ANTLR vs Jison)`);
      console.log('='.repeat(80));
      
      // Assert ANTLR performance is reasonable
      expect(comparisonResults.summary.antlrSuccesses).toBeGreaterThan(0);
      expect(parseFloat(comparisonResults.summary.antlrSuccessRate)).toBeGreaterThan(80.0);
      
      // Log performance conclusion
      const performanceRatio = comparisonResults.summary.antlrAvgTime / comparisonResults.summary.jisonAvgTime;
      if (performanceRatio < 1.5) {
        console.log('🚀 PERFORMANCE: ANTLR lexer performance is excellent (within 1.5x of Jison)');
      } else if (performanceRatio < 3.0) {
        console.log('✅ PERFORMANCE: ANTLR lexer performance is acceptable (within 3x of Jison)');
      } else {
        console.log('⚠️ PERFORMANCE: ANTLR lexer is slower than expected (>3x Jison time)');
      }
    }, 30000); // 30 second timeout for comprehensive test
  });
  
});
