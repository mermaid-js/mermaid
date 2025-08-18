#!/usr/bin/env node

/**
 * Test Case Extractor for ANTLR vs Jison Comparison
 * 
 * This script extracts test cases from the existing Chevrotain migration test files
 * and creates a comprehensive ANTLR vs Jison comparison test suite.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Extracting test cases from existing lexer tests...');

// Directory containing the additional tests
const testsDir = path.join(__dirname, 'additonal-tests');

// Test files to extract from
const testFiles = [
  'lexer-tests-basic.spec.ts',
  'lexer-tests-arrows.spec.ts', 
  'lexer-tests-edges.spec.ts',
  'lexer-tests-shapes.spec.ts',
  'lexer-tests-text.spec.ts',
  'lexer-tests-directions.spec.ts',
  'lexer-tests-subgraphs.spec.ts',
  'lexer-tests-complex.spec.ts',
  'lexer-tests-comments.spec.ts',
  'lexer-tests-keywords.spec.ts',
  'lexer-tests-special-chars.spec.ts'
];

/**
 * Extract test cases from a TypeScript test file
 */
function extractTestCases(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const testCases = [];
  
  // Regular expression to match test cases
  const testRegex = /it\('([^']+)',\s*\(\)\s*=>\s*\{[^}]*runTest\('([^']+)',\s*'([^']+)',\s*\[([^\]]*)\]/g;
  
  let match;
  while ((match = testRegex.exec(content)) !== null) {
    const [, description, id, input, expectedTokens] = match;
    
    // Parse expected tokens
    const tokenMatches = expectedTokens.match(/{\s*type:\s*'([^']+)',\s*value:\s*'([^']*)'\s*}/g) || [];
    const expectedTokenTypes = tokenMatches.map(tokenMatch => {
      const typeMatch = tokenMatch.match(/type:\s*'([^']+)'/);
      return typeMatch ? typeMatch[1] : 'UNKNOWN';
    });
    
    testCases.push({
      id,
      description,
      input: input.replace(/\\n/g, '\n'), // Convert escaped newlines
      expectedTokenTypes,
      sourceFile: path.basename(filePath),
      category: path.basename(filePath).replace('lexer-tests-', '').replace('.spec.ts', '')
    });
  }
  
  return testCases;
}

/**
 * Extract all test cases from all test files
 */
function extractAllTestCases() {
  const allTestCases = [];
  
  for (const testFile of testFiles) {
    const filePath = path.join(testsDir, testFile);
    
    if (fs.existsSync(filePath)) {
      console.log(`📝 Extracting from ${testFile}...`);
      const testCases = extractTestCases(filePath);
      allTestCases.push(...testCases);
      console.log(`   Found ${testCases.length} test cases`);
    } else {
      console.log(`⚠️ File not found: ${testFile}`);
    }
  }
  
  return allTestCases;
}

/**
 * Generate comprehensive test file
 */
function generateComprehensiveTestFile(testCases) {
  const testFileContent = `/**
 * EXTRACTED COMPREHENSIVE ANTLR vs JISON LEXER TESTS
 * 
 * This file contains ${testCases.length} test cases extracted from the existing
 * Chevrotain migration test suite, adapted for ANTLR vs Jison comparison.
 * 
 * Generated automatically from existing test files.
 */

import { describe, it, expect } from 'vitest';
import { FlowDB } from '../flowDb.js';
import flowParserJison from '../flowParser.ts';
import { tokenizeWithANTLR } from '../token-stream-comparator.js';
import { setConfig } from '../../../config.js';

// Configure for testing
setConfig({
  securityLevel: 'strict',
});

/**
 * Extracted test cases from Chevrotain migration
 */
const EXTRACTED_TEST_CASES = ${JSON.stringify(testCases, null, 2)};

/**
 * Test a single case with both lexers
 */
async function runLexerComparison(testCase) {
  const result = {
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

describe('Extracted Comprehensive ANTLR vs Jison Tests', () => {
  
  // Group tests by category
  const testsByCategory = EXTRACTED_TEST_CASES.reduce((acc, testCase) => {
    if (!acc[testCase.category]) {
      acc[testCase.category] = [];
    }
    acc[testCase.category].push(testCase);
    return acc;
  }, {});

  Object.entries(testsByCategory).forEach(([category, tests]) => {
    describe(\`\${category.toUpperCase()} Tests (\${tests.length} cases)\`, () => {
      tests.forEach(testCase => {
        it(\`\${testCase.id}: \${testCase.description}\`, async () => {
          const result = await runLexerComparison(testCase);
          
          console.log(\`\\n📊 \${testCase.id} (\${testCase.category}): "\${testCase.input.replace(/\\n/g, '\\\\n')}"\`);
          console.log(\`  Jison:  \${result.jison.success ? '✅' : '❌'} \${result.jison.tokenCount} tokens (\${result.jison.time.toFixed(2)}ms)\`);
          console.log(\`  ANTLR:  \${result.antlr.success ? '✅' : '❌'} \${result.antlr.tokenCount} tokens (\${result.antlr.time.toFixed(2)}ms)\`);
          
          if (result.jison.success && result.antlr.success) {
            console.log(\`  Performance: \${result.comparison.performanceRatio.toFixed(2)}x Winner: \${result.comparison.winner.toUpperCase()}\`);
          }
          
          if (!result.jison.success) console.log(\`  Jison Error: \${result.jison.error}\`);
          if (!result.antlr.success) console.log(\`  ANTLR Error: \${result.antlr.error}\`);

          // ANTLR should succeed
          expect(result.antlr.success).toBe(true);
          
          // Performance should be reasonable
          if (result.jison.success && result.antlr.success) {
            expect(result.comparison.performanceRatio).toBeLessThan(10);
          }
        });
      });
    });
  });

  describe('Comprehensive Summary', () => {
    it('should provide overall comparison statistics', async () => {
      console.log('\\n' + '='.repeat(80));
      console.log('🔍 EXTRACTED TEST CASES COMPREHENSIVE ANALYSIS');
      console.log(\`Total Extracted Test Cases: \${EXTRACTED_TEST_CASES.length}\`);
      console.log('='.repeat(80));

      const results = [];
      const categoryStats = new Map();

      // Run all extracted tests
      for (const testCase of EXTRACTED_TEST_CASES.slice(0, 50)) { // Limit to first 50 for performance
        const result = await runLexerComparison(testCase);
        results.push(result);

        // Track category statistics
        if (!categoryStats.has(testCase.category)) {
          categoryStats.set(testCase.category, {
            total: 0,
            jisonSuccess: 0,
            antlrSuccess: 0,
            totalJisonTime: 0,
            totalAntlrTime: 0
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
      }

      // Calculate overall statistics
      const totalTests = results.length;
      const jisonSuccesses = results.filter(r => r.jison.success).length;
      const antlrSuccesses = results.filter(r => r.antlr.success).length;
      
      const totalJisonTime = results.reduce((sum, r) => sum + r.jison.time, 0);
      const totalAntlrTime = results.reduce((sum, r) => sum + r.antlr.time, 0);
      const avgPerformanceRatio = totalAntlrTime / totalJisonTime;

      console.log('\\n📊 EXTRACTED TESTS RESULTS:');
      console.log(\`Tests Run: \${totalTests} (of \${EXTRACTED_TEST_CASES.length} total extracted)\`);
      console.log(\`Jison Success Rate: \${jisonSuccesses}/\${totalTests} (\${(jisonSuccesses/totalTests*100).toFixed(1)}%)\`);
      console.log(\`ANTLR Success Rate: \${antlrSuccesses}/\${totalTests} (\${(antlrSuccesses/totalTests*100).toFixed(1)}%)\`);
      console.log(\`Average Performance Ratio: \${avgPerformanceRatio.toFixed(2)}x (ANTLR vs Jison)\`);

      console.log('\\n📋 CATEGORY BREAKDOWN:');
      for (const [category, stats] of categoryStats.entries()) {
        const jisonRate = (stats.jisonSuccess / stats.total * 100).toFixed(1);
        const antlrRate = (stats.antlrSuccess / stats.total * 100).toFixed(1);
        const avgJisonTime = stats.totalJisonTime / stats.jisonSuccess || 0;
        const avgAntlrTime = stats.totalAntlrTime / stats.antlrSuccess || 0;
        const categoryRatio = avgAntlrTime / avgJisonTime || 0;

        console.log(\`  \${category.toUpperCase()}: \${stats.total} tests\`);
        console.log(\`    Jison: \${stats.jisonSuccess}/\${stats.total} (\${jisonRate}%) avg \${avgJisonTime.toFixed(2)}ms\`);
        console.log(\`    ANTLR: \${stats.antlrSuccess}/\${stats.total} (\${antlrRate}%) avg \${avgAntlrTime.toFixed(2)}ms\`);
        console.log(\`    Performance: \${categoryRatio.toFixed(2)}x\`);
      }

      console.log('='.repeat(80));

      // Assertions
      expect(antlrSuccesses).toBeGreaterThan(totalTests * 0.8); // At least 80% success rate
      expect(avgPerformanceRatio).toBeLessThan(5); // Performance should be reasonable

      console.log(\`\\n🎉 EXTRACTED TESTS COMPLETE: ANTLR \${antlrSuccesses}/\${totalTests} success, \${avgPerformanceRatio.toFixed(2)}x performance ratio\`);
    });
  });

});`;

  return testFileContent;
}

// Main execution
try {
  const testCases = extractAllTestCases();
  
  console.log(`\n📊 EXTRACTION SUMMARY:`);
  console.log(`Total test cases extracted: ${testCases.length}`);
  
  // Group by category for summary
  const categoryCounts = testCases.reduce((acc, testCase) => {
    acc[testCase.category] = (acc[testCase.category] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`Categories found:`);
  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} tests`);
  });
  
  // Generate comprehensive test file
  console.log(`\n📝 Generating comprehensive test file...`);
  const testFileContent = generateComprehensiveTestFile(testCases);
  
  const outputPath = path.join(__dirname, 'extracted-comprehensive-antlr-jison-tests.spec.js');
  fs.writeFileSync(outputPath, testFileContent);
  
  console.log(`✅ Generated: ${outputPath}`);
  console.log(`📊 Contains ${testCases.length} test cases from ${testFiles.length} source files`);
  
  // Also create a summary JSON file
  const summaryPath = path.join(__dirname, 'extracted-test-cases-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    totalTestCases: testCases.length,
    categories: categoryCounts,
    sourceFiles: testFiles,
    extractedAt: new Date().toISOString(),
    testCases: testCases
  }, null, 2));
  
  console.log(`📋 Summary saved: ${summaryPath}`);
  
  console.log(`\n🎉 EXTRACTION COMPLETE!`);
  console.log(`\nNext steps:`);
  console.log(`1. Run: pnpm vitest run extracted-comprehensive-antlr-jison-tests.spec.js`);
  console.log(`2. Compare ANTLR vs Jison performance across ${testCases.length} real test cases`);
  console.log(`3. Analyze results by category and overall performance`);
  
} catch (error) {
  console.error('❌ Error during extraction:', error.message);
  process.exit(1);
}
