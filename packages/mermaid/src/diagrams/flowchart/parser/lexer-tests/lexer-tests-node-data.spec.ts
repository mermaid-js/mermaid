import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * NODE DATA SYNTAX LEXER TESTS
 *
 * Tests for @ syntax node data and edge data based on flow-node-data.spec.js
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Node Data Syntax Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  // Basic node data syntax
  it('NOD001: should tokenize "D@{ shape: rounded }" correctly', () => {
    expect(() =>
      runTest('NOD001', 'D@{ shape: rounded }', [
        { type: 'NODE_STRING', value: 'D' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: rounded' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  it('NOD002: should tokenize "D@{shape: rounded}" correctly', () => {
    expect(() =>
      runTest('NOD002', 'D@{shape: rounded}', [
        { type: 'NODE_STRING', value: 'D' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: rounded' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  // Node data with ampersand
  it('NOD003: should tokenize "D@{ shape: rounded } & E" correctly', () => {
    expect(() =>
      runTest('NOD003', 'D@{ shape: rounded } & E', [
        { type: 'NODE_STRING', value: 'D' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: rounded' },
        { type: 'NODE_DEND', value: '}' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'E' },
      ])
    ).not.toThrow();
  });

  // Node data with edges
  it('NOD004: should tokenize "D@{ shape: rounded } --> E" correctly', () => {
    expect(() =>
      runTest('NOD004', 'D@{ shape: rounded } --> E', [
        { type: 'NODE_STRING', value: 'D' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: rounded' },
        { type: 'NODE_DEND', value: '}' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'E' },
      ])
    ).not.toThrow();
  });

  // Multiple node data
  it('NOD005: should tokenize "D@{ shape: rounded } & E@{ shape: rounded }" correctly', () => {
    expect(() =>
      runTest('NOD005', 'D@{ shape: rounded } & E@{ shape: rounded }', [
        { type: 'NODE_STRING', value: 'D' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: rounded' },
        { type: 'NODE_DEND', value: '}' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'E' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: rounded' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  // Node data with multiple properties
  it('NOD006: should tokenize "D@{ shape: rounded , label: \\"DD\\" }" correctly', () => {
    expect(() =>
      runTest('NOD006', 'D@{ shape: rounded , label: "DD" }', [
        { type: 'NODE_STRING', value: 'D' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: rounded , label: "DD"' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  // Node data with extra spaces
  it('NOD007: should tokenize "D@{       shape: rounded}" correctly', () => {
    expect(() =>
      runTest('NOD007', 'D@{       shape: rounded}', [
        { type: 'NODE_STRING', value: 'D' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: '       shape: rounded' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  it('NOD008: should tokenize "D@{ shape: rounded         }" correctly', () => {
    expect(() =>
      runTest('NOD008', 'D@{ shape: rounded         }', [
        { type: 'NODE_STRING', value: 'D' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: rounded         ' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  // Node data with special characters in strings
  it('NOD009: should tokenize "A@{ label: \\"This is }\\" }" correctly', () => {
    expect(() =>
      runTest('NOD009', 'A@{ label: "This is }" }', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'label: "This is }"' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  it('NOD010: should tokenize "A@{ label: \\"This is a string with @\\" }" correctly', () => {
    expect(() =>
      runTest('NOD010', 'A@{ label: "This is a string with @" }', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'label: "This is a string with @"' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  // Edge data syntax
  it('NOD011: should tokenize "A e1@--> B" correctly', () => {
    expect(() =>
      runTest('NOD011', 'A e1@--> B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'NODE_STRING', value: 'e1' },
        { type: 'EDGE_STATE', value: '@' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('NOD012: should tokenize "A & B e1@--> C & D" correctly', () => {
    expect(() =>
      runTest('NOD012', 'A & B e1@--> C & D', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'NODE_STRING', value: 'e1' },
        { type: 'EDGE_STATE', value: '@' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'C' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'D' },
      ])
    ).not.toThrow();
  });

  // Edge data configuration
  it('NOD013: should tokenize "e1@{ animate: true }" correctly', () => {
    expect(() =>
      runTest('NOD013', 'e1@{ animate: true }', [
        { type: 'NODE_STRING', value: 'e1' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'animate: true' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  // Mixed node and edge data
  it('NOD014: should tokenize "A[hello] B@{ shape: circle }" correctly', () => {
    expect(() =>
      runTest('NOD014', 'A[hello] B@{ shape: circle }', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'SQS', value: '[' },
        { type: 'textToken', value: 'hello' },
        { type: 'SQE', value: ']' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: circle' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  // Node data with shape and label
  it('NOD015: should tokenize "C[Hello]@{ shape: circle }" correctly', () => {
    expect(() =>
      runTest('NOD015', 'C[Hello]@{ shape: circle }', [
        { type: 'NODE_STRING', value: 'C' },
        { type: 'SQS', value: '[' },
        { type: 'textToken', value: 'Hello' },
        { type: 'SQE', value: ']' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: circle' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  // Complex multi-line node data (simplified for lexer)
  it('NOD016: should tokenize basic multi-line structure correctly', () => {
    expect(() =>
      runTest('NOD016', 'A@{ shape: circle other: "clock" }', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: circle other: "clock"' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  // @ symbol in labels
  it('NOD017: should tokenize "A[\\"@A@\\"]-->B" correctly', () => {
    expect(() =>
      runTest('NOD017', 'A["@A@"]-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'SQS', value: '[' },
        { type: 'textToken', value: '"@A@"' },
        { type: 'SQE', value: ']' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('NOD018: should tokenize "C@{ label: \\"@for@ c@\\" }" correctly', () => {
    expect(() =>
      runTest('NOD018', 'C@{ label: "@for@ c@" }', [
        { type: 'NODE_STRING', value: 'C' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'label: "@for@ c@"' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  // Trailing spaces
  it('NOD019: should tokenize with trailing spaces correctly', () => {
    expect(() =>
      runTest('NOD019', 'D@{ shape: rounded } & E@{ shape: rounded }    ', [
        { type: 'NODE_STRING', value: 'D' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: rounded' },
        { type: 'NODE_DEND', value: '}' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'E' },
        { type: 'NODE_DSTART', value: '@{' },
        { type: 'NODE_DESCR', value: 'shape: rounded' },
        { type: 'NODE_DEND', value: '}' },
      ])
    ).not.toThrow();
  });

  // Mixed syntax with traditional shapes
  it('NOD020: should tokenize "A{This is a label}" correctly', () => {
    expect(() =>
      runTest('NOD020', 'A{This is a label}', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'DIAMOND_START', value: '{' },
        { type: 'textToken', value: 'This is a label' },
        { type: 'DIAMOND_STOP', value: '}' },
      ])
    ).not.toThrow();
  });
});
