import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * COMPLEX SYNTAX LEXER TESTS
 *
 * Extracted from various parser tests covering complex combinations
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Complex Syntax Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  it('COM001: should tokenize "graph TD; A-->B" correctly', () => {
    expect(() =>
      runTest('COM001', 'graph TD; A-->B', [
        { type: 'GRAPH', value: 'graph' },
        { type: 'DIR', value: 'TD' },
        { type: 'SEMI', value: ';' },
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('COM002: should tokenize "A & B --> C" correctly', () => {
    expect(() =>
      runTest('COM002', 'A & B --> C', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'C' },
      ])
    ).not.toThrow();
  });

  it('COM003: should tokenize "A[Text] --> B(Round)" correctly', () => {
    expect(() =>
      runTest('COM003', 'A[Text] --> B(Round)', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'SQS', value: '[' },
        { type: 'textToken', value: 'Text' },
        { type: 'SQE', value: ']' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'Round' },
        { type: 'PE', value: ')' },
      ])
    ).not.toThrow();
  });

  it('COM004: should tokenize "A --> B --> C" correctly', () => {
    expect(() =>
      runTest('COM004', 'A --> B --> C', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'C' },
      ])
    ).not.toThrow();
  });

  it('COM005: should tokenize "A-->|label|B" correctly', () => {
    expect(() =>
      runTest('COM005', 'A-->|label|B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'PIPE', value: '|' },
        { type: 'textToken', value: 'label' },
        { type: 'PIPE', value: '|' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });
});
