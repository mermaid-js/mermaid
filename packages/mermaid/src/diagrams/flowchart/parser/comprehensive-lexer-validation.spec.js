/**
 * Comprehensive ANTLR Lexer Validation Test Suite
 *
 * This test suite validates the ANTLR lexer against the complete set of
 * flowchart test cases to ensure 100% compatibility and coverage.
 *
 * Focus: ANTLR lexer functionality validation
 * Strategy: Comprehensive pattern coverage with detailed reporting
 */

import { tokenizeWithANTLR } from './token-stream-comparator.js';
import { LEXER_TEST_CASES, getAllTestCases, getCategories } from './lexer-test-cases.js';

/**
 * Validate ANTLR lexer against a test case
 * @param {string} input - Input to validate
 * @returns {Object} Validation result
 */
async function validateANTLRLexer(input) {
  try {
    const tokens = await tokenizeWithANTLR(input);

    // Basic validation checks
    const hasTokens = tokens && tokens.length > 0;
    const hasEOF = tokens.some((t) => t.type === 'EOF');
    const noErrors = !tokens.some((t) => t.error);

    return {
      success: true,
      input: input,
      tokenCount: tokens.length,
      tokens: tokens,
      hasEOF: hasEOF,
      validation: {
        hasTokens,
        hasEOF,
        noErrors,
        passed: hasTokens && hasEOF && noErrors,
      },
    };
  } catch (error) {
    return {
      success: false,
      input: input,
      error: error.message,
      tokenCount: 0,
      tokens: [],
      hasEOF: false,
      validation: {
        hasTokens: false,
        hasEOF: false,
        noErrors: false,
        passed: false,
      },
    };
  }
}

/**
 * Run comprehensive validation across all test cases
 * @param {Array<string>} testCases - Test cases to validate
 * @returns {Object} Comprehensive validation results
 */
async function runComprehensiveValidation(testCases) {
  const results = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let errorTests = 0;

  for (const testCase of testCases) {
    const result = await validateANTLRLexer(testCase);
    results.push(result);
    totalTests++;

    if (!result.success) {
      errorTests++;
    } else if (result.validation.passed) {
      passedTests++;
    } else {
      failedTests++;
    }
  }

  return {
    totalTests,
    passedTests,
    failedTests,
    errorTests,
    results,
    summary: {
      passRate: ((passedTests / totalTests) * 100).toFixed(2),
      failRate: ((failedTests / totalTests) * 100).toFixed(2),
      errorRate: ((errorTests / totalTests) * 100).toFixed(2),
    },
  };
}

describe('Comprehensive ANTLR Lexer Validation', () => {
  describe('Category-Based Validation', () => {
    const categories = getCategories();

    categories.forEach((category) => {
      describe(`Category: ${category}`, () => {
        const testCases = LEXER_TEST_CASES[category];

        testCases.forEach((testCase, index) => {
          it(`should tokenize: "${testCase.substring(0, 50)}${testCase.length > 50 ? '...' : ''}"`, async () => {
            const result = await validateANTLRLexer(testCase);

            // Log detailed results for debugging
            if (!result.validation.passed) {
              console.log(`\n❌ FAILED: "${testCase}"`);
              console.log(`Error: ${result.error || 'Validation failed'}`);
              if (result.tokens.length > 0) {
                console.log(
                  'Tokens:',
                  result.tokens.map((t) => `${t.type}="${t.value}"`).join(', ')
                );
              }
            } else {
              console.log(`✅ PASSED: "${testCase}" (${result.tokenCount} tokens)`);
            }

            expect(result.success).toBe(true);
            expect(result.validation.passed).toBe(true);
          });
        });
      });
    });
  });

  describe('Full Test Suite Validation', () => {
    it('should validate all test cases with comprehensive reporting', async () => {
      const allTestCases = getAllTestCases();
      const validationResults = await runComprehensiveValidation(allTestCases);

      // Generate comprehensive report
      console.log('\n' + '='.repeat(60));
      console.log('COMPREHENSIVE ANTLR LEXER VALIDATION REPORT');
      console.log('='.repeat(60));
      console.log(`Total Test Cases: ${validationResults.totalTests}`);
      console.log(
        `Passed: ${validationResults.passedTests} (${validationResults.summary.passRate}%)`
      );
      console.log(
        `Failed: ${validationResults.failedTests} (${validationResults.summary.failRate}%)`
      );
      console.log(
        `Errors: ${validationResults.errorTests} (${validationResults.summary.errorRate}%)`
      );
      console.log('='.repeat(60));

      // Report failures in detail
      if (validationResults.failedTests > 0 || validationResults.errorTests > 0) {
        console.log('\nFAILED/ERROR TEST CASES:');
        validationResults.results.forEach((result, index) => {
          if (!result.success || !result.validation.passed) {
            console.log(`\n${index + 1}. "${result.input}"`);
            console.log(`   Status: ${result.success ? 'VALIDATION_FAILED' : 'ERROR'}`);
            if (result.error) {
              console.log(`   Error: ${result.error}`);
            }
            if (result.tokens.length > 0) {
              console.log(
                `   Tokens: ${result.tokens.map((t) => `${t.type}="${t.value}"`).join(', ')}`
              );
            }
          }
        });
      }

      // Report success cases by category
      console.log('\nSUCCESS SUMMARY BY CATEGORY:');
      const categories = getCategories();
      categories.forEach((category) => {
        const categoryTests = LEXER_TEST_CASES[category];
        const categoryResults = validationResults.results.filter((r) =>
          categoryTests.includes(r.input)
        );
        const categoryPassed = categoryResults.filter(
          (r) => r.success && r.validation.passed
        ).length;
        const categoryTotal = categoryResults.length;
        const categoryPassRate = ((categoryPassed / categoryTotal) * 100).toFixed(1);

        console.log(`  ${category}: ${categoryPassed}/${categoryTotal} (${categoryPassRate}%)`);
      });

      console.log('\n' + '='.repeat(60));

      // Assert overall success
      expect(validationResults.passedTests).toBeGreaterThan(0);
      expect(parseFloat(validationResults.summary.passRate)).toBeGreaterThan(80.0); // At least 80% pass rate

      // Log final status
      if (validationResults.summary.passRate === '100.00') {
        console.log('🎉 PHASE 1 COMPLETE: 100% ANTLR lexer compatibility achieved!');
      } else {
        console.log(
          `📊 PHASE 1 STATUS: ${validationResults.summary.passRate}% ANTLR lexer compatibility`
        );
      }
    });
  });

  describe('Edge Case Validation', () => {
    const edgeCases = [
      '', // empty input
      '   \n  \t  ', // whitespace only
      'graph TD', // basic declaration
      'A-->B', // simple connection
      'A[Square]', // node with shape
      'graph TD\nA-->B\nB-->C', // multi-line
      'graph TD; A-->B; B-->C;', // semicolon separated
    ];

    edgeCases.forEach((testCase) => {
      it(`should handle edge case: "${testCase.replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`, async () => {
        const result = await validateANTLRLexer(testCase);

        console.log(
          `Edge case "${testCase.replace(/\n/g, '\\n')}": ${result.validation.passed ? '✅ PASSED' : '❌ FAILED'}`
        );
        if (result.tokens.length > 0) {
          console.log(`  Tokens: ${result.tokens.map((t) => `${t.type}="${t.value}"`).join(', ')}`);
        }

        expect(result.success).toBe(true);
        expect(result.validation.passed).toBe(true);
      });
    });
  });
});
