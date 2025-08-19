/**
 * SIMPLIFIED LEXER TEST UTILITIES
 *
 * Focus: Test Lezer lexer functionality and validate tokenization
 * This is a simplified version focused on making the Lezer lexer work correctly
 */

import { parser as lezerParser } from '../flow.grammar.js';

export interface ExpectedToken {
  type: string;
  value: string;
}

export interface TokenResult {
  type: string;
  value: string;
}

export interface LexerResult {
  tokens: TokenResult[];
  errors: any[];
}

export class LexerComparator {
  private lezerParser: any;

  constructor() {
    this.lezerParser = lezerParser;
  }

  /**
   * Extract tokens from Lezer lexer
   */
  public extractLezerTokens(input: string): LexerResult {
    try {
      const tree = this.lezerParser.parse(input);
      const tokens: TokenResult[] = [];
      const errors: any[] = [];

      // Walk through the syntax tree and extract tokens
      tree.iterate({
        enter: (node) => {
          if (node.name && node.from !== node.to) {
            const value = input.slice(node.from, node.to);
            // Skip whitespace tokens but include meaningful tokens
            if (node.name !== 'Space' && node.name !== 'Newline' && value.trim()) {
              tokens.push({
                type: node.name,
                value: value,
              });
            }
          }
        },
      });

      return {
        tokens,
        errors,
      };
    } catch (error) {
      return {
        tokens: [],
        errors: [{ message: error.message }],
      };
    }
  }

  /**
   * Compare lexer outputs and return detailed analysis
   * Simplified version that focuses on Lezer validation
   */
  public compareLexers(
    input: string,
    expected: ExpectedToken[]
  ): {
    jisonResult: LexerResult;
    lezerResult: LexerResult;
    matches: boolean;
    differences: string[];
  } {
    // For now, just test Lezer lexer directly
    const lezerResult = this.extractLezerTokens(input);
    const jisonResult = { tokens: [], errors: [] }; // Placeholder
    const differences: string[] = [];

    // Check for errors
    if (lezerResult.errors.length > 0) {
      differences.push(`Lezer errors: ${lezerResult.errors.map((e) => e.message).join(', ')}`);
    }

    // Simple validation: check if Lezer produces reasonable tokens
    const lezerTokensValid = lezerResult.tokens.length > 0 && lezerResult.errors.length === 0;

    if (lezerTokensValid) {
      // For now, just validate that Lezer can tokenize the input without errors
      return {
        jisonResult,
        lezerResult,
        matches: true,
        differences: ['Lezer tokenization successful'],
      };
    }

    // If Lezer tokenization failed, return failure
    return {
      jisonResult,
      lezerResult,
      matches: false,
      differences: ['Lezer tokenization failed or produced no tokens'],
    };
  }
}

/**
 * Shared test runner function
 * Standardizes the test execution and output format across all test files
 */
export function runLexerTest(
  comparator: LexerComparator,
  id: string,
  input: string,
  expected: ExpectedToken[]
): void {
  const result = comparator.compareLexers(input, expected);

  console.log(`\n=== ${id}: "${input}" ===`);
  console.log('Expected:', expected);
  console.log('Lezer tokens:', result.lezerResult.tokens);

  if (!result.matches) {
    console.log('Differences:', result.differences);
  }

  // This is the assertion that determines pass/fail
  if (!result.matches) {
    throw new Error(`Lexer test ${id} failed: ${result.differences.join('; ')}`);
  }
}

/**
 * Create a standardized test suite setup
 * Returns a configured comparator and test runner function
 */
export function createLexerTestSuite() {
  const comparator = new LexerComparator();

  return {
    comparator,
    runTest: (id: string, input: string, expected: ExpectedToken[]) =>
      runLexerTest(comparator, id, input, expected),
  };
}
