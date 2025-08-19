import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * SPECIAL CHARACTERS LEXER TESTS
 *
 * Tests for special characters in node text based on charTest function from flow.spec.js
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Special Characters Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  // Period character
  it('SPC001: should tokenize "A(.)-->B" correctly', () => {
    expect(() =>
      runTest('SPC001', 'A(.)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: '.' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('SPC002: should tokenize "A(Start 103a.a1)-->B" correctly', () => {
    expect(() =>
      runTest('SPC002', 'A(Start 103a.a1)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'Start 103a.a1' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Colon character
  it('SPC003: should tokenize "A(:)-->B" correctly', () => {
    expect(() =>
      runTest('SPC003', 'A(:)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: ':' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Comma character
  it('SPC004: should tokenize "A(,)-->B" correctly', () => {
    expect(() =>
      runTest('SPC004', 'A(,)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: ',' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Dash character
  it('SPC005: should tokenize "A(a-b)-->B" correctly', () => {
    expect(() =>
      runTest('SPC005', 'A(a-b)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'a-b' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Plus character
  it('SPC006: should tokenize "A(+)-->B" correctly', () => {
    expect(() =>
      runTest('SPC006', 'A(+)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: '+' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Asterisk character
  it('SPC007: should tokenize "A(*)-->B" correctly', () => {
    expect(() =>
      runTest('SPC007', 'A(*)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: '*' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Less than character (should be escaped to &lt;)
  it('SPC008: should tokenize "A(<)-->B" correctly', () => {
    expect(() =>
      runTest('SPC008', 'A(<)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: '<' }, // Note: JISON may escape this to &lt;
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Ampersand character
  it('SPC009: should tokenize "A(&)-->B" correctly', () => {
    expect(() =>
      runTest('SPC009', 'A(&)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: '&' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Backtick character
  it('SPC010: should tokenize "A(`)-->B" correctly', () => {
    expect(() =>
      runTest('SPC010', 'A(`)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: '`' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Unicode characters
  it('SPC011: should tokenize "A(Начало)-->B" correctly', () => {
    expect(() =>
      runTest('SPC011', 'A(Начало)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'Начало' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Backslash character
  it('SPC012: should tokenize "A(c:\\windows)-->B" correctly', () => {
    expect(() =>
      runTest('SPC012', 'A(c:\\windows)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'c:\\windows' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Mixed special characters
  it('SPC013: should tokenize "A(åäö-ÅÄÖ)-->B" correctly', () => {
    expect(() =>
      runTest('SPC013', 'A(åäö-ÅÄÖ)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'åäö-ÅÄÖ' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // HTML break tags
  it('SPC014: should tokenize "A(text <br> more)-->B" correctly', () => {
    expect(() =>
      runTest('SPC014', 'A(text <br> more)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'text <br> more' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Forward slash in lean_right vertices
  it('SPC015: should tokenize "A[/text with / slash/]-->B" correctly', () => {
    expect(() =>
      runTest('SPC015', 'A[/text with / slash/]-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'SQS', value: '[/' },
        { type: 'textToken', value: 'text with / slash' },
        { type: 'SQE', value: '/]' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });
});
