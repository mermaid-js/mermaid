/**
 * ANTLR Lexer Validation Test Suite
 *
 * This test suite validates the ANTLR lexer functionality
 * and compares it with Jison lexer output for compatibility.
 *
 * Strategy:
 * 1. Test ANTLR lexer basic functionality
 * 2. Compare ANTLR vs Jison token streams
 * 3. Validate against comprehensive test cases
 * 4. Report detailed mismatches for debugging
 */

import { tokenizeWithANTLR } from './token-stream-comparator.js';
import { LEXER_TEST_CASES, getTestCasesByCategory } from './lexer-test-cases.js';

// Basic functionality tests
describe('ANTLR Lexer Basic Validation', () => {
  it('should be able to import and use ANTLR lexer', async () => {
    // Test that we can import and use the ANTLR lexer
    const tokens = await tokenizeWithANTLR('graph TD');
    expect(tokens).toBeDefined();
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('should handle empty input', async () => {
    const tokens = await tokenizeWithANTLR('');
    expect(tokens).toBeDefined();
    expect(Array.isArray(tokens)).toBe(true);
    // Should at least have EOF token
    expect(tokens.length).toBeGreaterThanOrEqual(1);
  });

  it('should tokenize basic graph declaration', async () => {
    const tokens = await tokenizeWithANTLR('graph TD');
    expect(tokens.length).toBeGreaterThan(0);

    // Should recognize 'graph' keyword
    const graphToken = tokens.find((t) => t.type === 'GRAPH_GRAPH');
    expect(graphToken).toBeDefined();
    expect(graphToken.value).toBe('graph');
  });
});

// ANTLR lexer pattern recognition tests
describe('ANTLR Lexer Pattern Recognition', () => {
  describe('Basic Declarations', () => {
    const testCases = getTestCasesByCategory('basicDeclarations');

    testCases.slice(0, 5).forEach((testCase, index) => {
      it(`should tokenize: "${testCase}"`, async () => {
        const tokens = await tokenizeWithANTLR(testCase);
        expect(tokens).toBeDefined();
        expect(Array.isArray(tokens)).toBe(true);
        expect(tokens.length).toBeGreaterThan(0);

        // Log tokens for debugging
        console.log(
          `Tokens for "${testCase}":`,
          tokens.map((t) => `${t.type}="${t.value}"`).join(', ')
        );
      });
    });
  });

  describe('Simple Connections', () => {
    const testCases = getTestCasesByCategory('simpleConnections');

    testCases.slice(0, 8).forEach((testCase, index) => {
      it(`should tokenize: "${testCase}"`, async () => {
        const tokens = await tokenizeWithANTLR(testCase);
        expect(tokens).toBeDefined();
        expect(Array.isArray(tokens)).toBe(true);
        expect(tokens.length).toBeGreaterThan(0);

        // Log tokens for debugging
        console.log(
          `Tokens for "${testCase}":`,
          tokens.map((t) => `${t.type}="${t.value}"`).join(', ')
        );
      });
    });
  });

  describe('Node Shapes', () => {
    const testCases = getTestCasesByCategory('nodeShapes');

    testCases.slice(0, 5).forEach((testCase, index) => {
      it(`should tokenize: "${testCase}"`, async () => {
        const tokens = await tokenizeWithANTLR(testCase);
        expect(tokens).toBeDefined();
        expect(Array.isArray(tokens)).toBe(true);
        expect(tokens.length).toBeGreaterThan(0);

        // Log tokens for debugging
        console.log(
          `Tokens for "${testCase}":`,
          tokens.map((t) => `${t.type}="${t.value}"`).join(', ')
        );
      });
    });
  });
});
