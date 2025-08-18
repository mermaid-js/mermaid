import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * SUBGRAPH AND ADVANCED SYNTAX LEXER TESTS
 *
 * Extracted from various parser tests covering subgraphs, styling, and advanced features
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Subgraph and Advanced Syntax Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  it('SUB001: should tokenize "subgraph" correctly', () => {
    expect(() =>
      runTest('SUB001', 'subgraph', [{ type: 'subgraph', value: 'subgraph' }])
    ).not.toThrow();
  });

  it('SUB002: should tokenize "end" correctly', () => {
    expect(() => runTest('SUB002', 'end', [{ type: 'end', value: 'end' }])).not.toThrow();
  });

  it('STY001: should tokenize "style" correctly', () => {
    expect(() => runTest('STY001', 'style', [{ type: 'STYLE', value: 'style' }])).not.toThrow();
  });

  it('CLI001: should tokenize "click" correctly', () => {
    expect(() => runTest('CLI001', 'click', [{ type: 'CLICK', value: 'click' }])).not.toThrow();
  });

  it('PUN001: should tokenize ";" correctly', () => {
    expect(() => runTest('PUN001', ';', [{ type: 'SEMI', value: ';' }])).not.toThrow();
  });

  it('PUN002: should tokenize "&" correctly', () => {
    expect(() => runTest('PUN002', '&', [{ type: 'AMP', value: '&' }])).not.toThrow();
  });
});
