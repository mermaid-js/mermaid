import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * TEXT HANDLING LEXER TESTS
 * 
 * Extracted from flow-text.spec.js covering all text edge cases
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Text Handling Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  // Text with special characters
  it('TXT001: should tokenize text with forward slash', () => {
    expect(() => runTest('TXT001', 'A--x|text with / should work|B', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '--x' },
      { type: 'PIPE', value: '|' },
      { type: 'textToken', value: 'text with / should work' },
      { type: 'PIPE', value: '|' },
      { type: 'NODE_STRING', value: 'B' },
    ])).not.toThrow();
  });

  it('TXT002: should tokenize text with backtick', () => {
    expect(() => runTest('TXT002', 'A--x|text including `|B', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '--x' },
      { type: 'PIPE', value: '|' },
      { type: 'textToken', value: 'text including `' },
      { type: 'PIPE', value: '|' },
      { type: 'NODE_STRING', value: 'B' },
    ])).not.toThrow();
  });

  it('TXT003: should tokenize text with CAPS', () => {
    expect(() => runTest('TXT003', 'A--x|text including CAPS space|B', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '--x' },
      { type: 'PIPE', value: '|' },
      { type: 'textToken', value: 'text including CAPS space' },
      { type: 'PIPE', value: '|' },
      { type: 'NODE_STRING', value: 'B' },
    ])).not.toThrow();
  });

  it('TXT004: should tokenize text with URL keyword', () => {
    expect(() => runTest('TXT004', 'A--x|text including URL space|B', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '--x' },
      { type: 'PIPE', value: '|' },
      { type: 'textToken', value: 'text including URL space' },
      { type: 'PIPE', value: '|' },
      { type: 'NODE_STRING', value: 'B' },
    ])).not.toThrow();
  });

  it('TXT005: should tokenize text with TD keyword', () => {
    expect(() => runTest('TXT005', 'A--x|text including R TD space|B', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '--x' },
      { type: 'PIPE', value: '|' },
      { type: 'textToken', value: 'text including R TD space' },
      { type: 'PIPE', value: '|' },
      { type: 'NODE_STRING', value: 'B' },
    ])).not.toThrow();
  });

  it('TXT006: should tokenize text with graph keyword', () => {
    expect(() => runTest('TXT006', 'A--x|text including graph space|B', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '--x' },
      { type: 'PIPE', value: '|' },
      { type: 'textToken', value: 'text including graph space' },
      { type: 'PIPE', value: '|' },
      { type: 'NODE_STRING', value: 'B' },
    ])).not.toThrow();
  });

  // Quoted text
  it('TXT007: should tokenize quoted text', () => {
    expect(() => runTest('TXT007', 'V-- "test string()" -->a', [
      { type: 'NODE_STRING', value: 'V' },
      { type: 'LINK', value: '--' },
      { type: 'STR', value: '"test string()"' },
      { type: 'LINK', value: '-->' },
      { type: 'NODE_STRING', value: 'a' },
    ])).not.toThrow();
  });

  // Text in different arrow syntaxes
  it('TXT008: should tokenize text with double dash syntax', () => {
    expect(() => runTest('TXT008', 'A-- text including space --xB', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '--' },
      { type: 'textToken', value: 'text including space' },
      { type: 'LINK', value: '--x' },
      { type: 'NODE_STRING', value: 'B' },
    ])).not.toThrow();
  });

  it('TXT009: should tokenize text with multiple leading spaces', () => {
    expect(() => runTest('TXT009', 'A--    textNoSpace --xB', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '--' },
      { type: 'textToken', value: 'textNoSpace' },
      { type: 'LINK', value: '--x' },
      { type: 'NODE_STRING', value: 'B' },
    ])).not.toThrow();
  });

  // Unicode and special characters
  it('TXT010: should tokenize unicode characters', () => {
    expect(() => runTest('TXT010', 'A-->C(Начало)', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '-->' },
      { type: 'NODE_STRING', value: 'C' },
      { type: 'PS', value: '(' },
      { type: 'textToken', value: 'Начало' },
      { type: 'PE', value: ')' },
    ])).not.toThrow();
  });

  it('TXT011: should tokenize backslash characters', () => {
    expect(() => runTest('TXT011', 'A-->C(c:\\windows)', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '-->' },
      { type: 'NODE_STRING', value: 'C' },
      { type: 'PS', value: '(' },
      { type: 'textToken', value: 'c:\\windows' },
      { type: 'PE', value: ')' },
    ])).not.toThrow();
  });

  it('TXT012: should tokenize åäö characters', () => {
    expect(() => runTest('TXT012', 'A-->C{Chimpansen hoppar åäö-ÅÄÖ}', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '-->' },
      { type: 'NODE_STRING', value: 'C' },
      { type: 'DIAMOND_START', value: '{' },
      { type: 'textToken', value: 'Chimpansen hoppar åäö-ÅÄÖ' },
      { type: 'DIAMOND_STOP', value: '}' },
    ])).not.toThrow();
  });

  it('TXT013: should tokenize text with br tag', () => {
    expect(() => runTest('TXT013', 'A-->C(Chimpansen hoppar åäö  <br> -  ÅÄÖ)', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '-->' },
      { type: 'NODE_STRING', value: 'C' },
      { type: 'PS', value: '(' },
      { type: 'textToken', value: 'Chimpansen hoppar åäö  <br> -  ÅÄÖ' },
      { type: 'PE', value: ')' },
    ])).not.toThrow();
  });

  // Node IDs with special characters
  it('TXT014: should tokenize node with underscore', () => {
    expect(() => runTest('TXT014', 'A[chimpansen_hoppar]', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'SQS', value: '[' },
      { type: 'textToken', value: 'chimpansen_hoppar' },
      { type: 'SQE', value: ']' },
    ])).not.toThrow();
  });

  it('TXT015: should tokenize node with dash', () => {
    expect(() => runTest('TXT015', 'A-1', [
      { type: 'NODE_STRING', value: 'A-1' },
    ])).not.toThrow();
  });

  // Keywords in text
  it('TXT016: should tokenize text with v keyword', () => {
    expect(() => runTest('TXT016', 'A-- text including graph space and v --xB', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '--' },
      { type: 'textToken', value: 'text including graph space and v' },
      { type: 'LINK', value: '--x' },
      { type: 'NODE_STRING', value: 'B' },
    ])).not.toThrow();
  });

  it('TXT017: should tokenize single v node', () => {
    expect(() => runTest('TXT017', 'V-->a[v]', [
      { type: 'NODE_STRING', value: 'V' },
      { type: 'LINK', value: '-->' },
      { type: 'NODE_STRING', value: 'a' },
      { type: 'SQS', value: '[' },
      { type: 'textToken', value: 'v' },
      { type: 'SQE', value: ']' },
    ])).not.toThrow();
  });
});
