import { describe, it, expect } from 'vitest';
import type { ExpectedToken } from './lexer-test-utils.js';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * LEXER COMPARISON TESTS
 *
 * Format:
 * 1. Input: graph text
 * 2. Run both JISON and Chevrotain lexers
 * 3. Expected: array of lexical tokens
 * 4. Compare actual output with expected
 */

describe('Lexer Comparison Tests', () => {
  const { runTest } = createLexerTestSuite();

  it('should tokenize "graph TD" correctly', () => {
    const input = 'graph TD';
    const expected: ExpectedToken[] = [
      { type: 'GRAPH', value: 'graph' },
      { type: 'DirectionValue', value: 'TD' },
    ];

    expect(() => runTest('GRA001', input, expected)).not.toThrow();
  });
});
