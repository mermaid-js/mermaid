import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * COMPLEX TEXT PATTERNS LEXER TESTS
 *
 * Tests for complex text patterns with quotes, markdown, unicode, backslashes
 * Based on flow-text.spec.js and flow-md-string.spec.js
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Complex Text Patterns Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  // Quoted text patterns
  it('CTX001: should tokenize "A-- \\"test string()\\" -->B" correctly', () => {
    expect(() =>
      runTest('CTX001', 'A-- "test string()" -->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: '"test string()"' },
        { type: 'EdgeTextEnd', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('CTX002: should tokenize "A[\\"quoted text\\"]-->B" correctly', () => {
    expect(() =>
      runTest('CTX002', 'A["quoted text"]-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'SQS', value: '[' },
        { type: 'textToken', value: '"quoted text"' },
        { type: 'SQE', value: ']' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Markdown text patterns
  it('CTX003: should tokenize markdown in vertex text correctly', () => {
    expect(() =>
      runTest('CTX003', 'A["`The cat in **the** hat`"]-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'SQS', value: '[' },
        { type: 'textToken', value: '"`The cat in **the** hat`"' },
        { type: 'SQE', value: ']' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('CTX004: should tokenize markdown in edge text correctly', () => {
    expect(() =>
      runTest('CTX004', 'A-- "`The *bat* in the chat`" -->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: '"`The *bat* in the chat`"' },
        { type: 'EdgeTextEnd', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Unicode characters
  it('CTX005: should tokenize "A(Начало)-->B" correctly', () => {
    expect(() =>
      runTest('CTX005', 'A(Начало)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'Начало' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('CTX006: should tokenize "A(åäö-ÅÄÖ)-->B" correctly', () => {
    expect(() =>
      runTest('CTX006', 'A(åäö-ÅÄÖ)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'åäö-ÅÄÖ' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Backslash patterns
  it('CTX007: should tokenize "A(c:\\\\windows)-->B" correctly', () => {
    expect(() =>
      runTest('CTX007', 'A(c:\\windows)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'c:\\windows' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('CTX008: should tokenize lean_left with backslashes correctly', () => {
    expect(() =>
      runTest('CTX008', 'A[\\This has \\ backslash\\]-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'SQS', value: '[\\' },
        { type: 'textToken', value: 'This has \\ backslash' },
        { type: 'SQE', value: '\\]' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // HTML break tags
  it('CTX009: should tokenize "A(text <br> more)-->B" correctly', () => {
    expect(() =>
      runTest('CTX009', 'A(text <br> more)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'text <br> more' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('CTX010: should tokenize complex HTML with spaces correctly', () => {
    expect(() =>
      runTest('CTX010', 'A(Chimpansen hoppar åäö  <br> -  ÅÄÖ)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'Chimpansen hoppar åäö  <br> -  ÅÄÖ' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Forward slash patterns
  it('CTX011: should tokenize lean_right with forward slashes correctly', () => {
    expect(() =>
      runTest('CTX011', 'A[/This has / slash/]-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'SQS', value: '[/' },
        { type: 'textToken', value: 'This has / slash' },
        { type: 'SQE', value: '/]' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('CTX012: should tokenize "A-- text with / should work -->B" correctly', () => {
    expect(() =>
      runTest('CTX012', 'A-- text with / should work -->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: 'text with / should work' },
        { type: 'EdgeTextEnd', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Mixed special characters
  it('CTX013: should tokenize "A(CAPS and URL and TD)-->B" correctly', () => {
    expect(() =>
      runTest('CTX013', 'A(CAPS and URL and TD)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'CAPS and URL and TD' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Underscore patterns
  it('CTX014: should tokenize "A(chimpansen_hoppar)-->B" correctly', () => {
    expect(() =>
      runTest('CTX014', 'A(chimpansen_hoppar)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'chimpansen_hoppar' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Complex edge text with multiple keywords
  it('CTX015: should tokenize edge text with multiple keywords correctly', () => {
    expect(() =>
      runTest('CTX015', 'A-- text including graph space and v -->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: 'text including graph space and v' },
        { type: 'EdgeTextEnd', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Pipe text patterns
  it('CTX016: should tokenize "A--x|text including space|B" correctly', () => {
    expect(() =>
      runTest('CTX016', 'A--x|text including space|B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '--x' },
        { type: 'PIPE', value: '|' },
        { type: 'textToken', value: 'text including space' },
        { type: 'PIPE', value: '|' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Multiple leading spaces
  it('CTX017: should tokenize "A--    textNoSpace --xB" correctly', () => {
    expect(() =>
      runTest('CTX017', 'A--    textNoSpace --xB', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: '    textNoSpace ' },
        { type: 'EdgeTextEnd', value: '--x' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Complex markdown patterns
  it('CTX018: should tokenize complex markdown with shapes correctly', () => {
    expect(() =>
      runTest('CTX018', 'A{"`Decision with **bold**`"}-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'DIAMOND_START', value: '{' },
        { type: 'textToken', value: '"`Decision with **bold**`"' },
        { type: 'DIAMOND_STOP', value: '}' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Text with equals signs (from flow-text.spec.js)
  it('CTX019: should tokenize "A-- test text with == -->B" correctly', () => {
    expect(() =>
      runTest('CTX019', 'A-- test text with == -->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: 'test text with ==' },
        { type: 'EdgeTextEnd', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Text with dashes in thick arrows
  it('CTX020: should tokenize "A== test text with - ==>B" correctly', () => {
    expect(() =>
      runTest('CTX020', 'A== test text with - ==>B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '==' },
        { type: 'EdgeTextContent', value: 'test text with -' },
        { type: 'EdgeTextEnd', value: '==>' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });
});
