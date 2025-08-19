import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * ARROW SYNTAX LEXER TESTS
 *
 * Extracted from flow-arrows.spec.js covering all arrow types and variations
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Arrow Syntax Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  // Basic arrows
  it('ARR001: should tokenize "A-->B" correctly', () => {
    expect(() =>
      runTest('ARR001', 'A-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR002: should tokenize "A --- B" correctly', () => {
    expect(() =>
      runTest('ARR002', 'A --- B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '---' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Double-edged arrows
  it('ARR003: should tokenize "A<-->B" correctly', () => {
    expect(() =>
      runTest('ARR003', 'A<-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '<-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR004: should tokenize "A<-- text -->B" correctly', () => {
    // Note: Edge text parsing differs significantly between lexers
    // JISON breaks text into individual characters, Chevrotain uses structured tokens
    // This test documents the current behavior rather than enforcing compatibility
    expect(() =>
      runTest('ARR004', 'A<-- text -->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '<--' }, // JISON uses START_LINK for edge text context
        { type: 'EdgeTextContent', value: 'text' }, // Chevrotain structured approach
        { type: 'EdgeTextEnd', value: '-->' }, // Chevrotain end token
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Thick arrows
  it('ARR005: should tokenize "A<==>B" correctly', () => {
    expect(() =>
      runTest('ARR005', 'A<==>B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '<==>' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR006: should tokenize "A<== text ==>B" correctly', () => {
    expect(() =>
      runTest('ARR006', 'A<== text ==>B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '<==' },
        { type: 'EdgeTextContent', value: 'text' },
        { type: 'EdgeTextEnd', value: '==>' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR007: should tokenize "A==>B" correctly', () => {
    expect(() =>
      runTest('ARR007', 'A==>B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '==>' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR008: should tokenize "A===B" correctly', () => {
    expect(() =>
      runTest('ARR008', 'A===B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '===' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Dotted arrows
  it('ARR009: should tokenize "A<-.->B" correctly', () => {
    expect(() =>
      runTest('ARR009', 'A<-.->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '<-.->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR010: should tokenize "A<-. text .->B" correctly', () => {
    expect(() =>
      runTest('ARR010', 'A<-. text .->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_DOTTED_LINK', value: '<-.' },
        { type: 'EdgeTextContent', value: 'text .' },
        { type: 'EdgeTextEnd', value: '->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR011: should tokenize "A-.->B" correctly', () => {
    expect(() =>
      runTest('ARR011', 'A-.->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-.->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR012: should tokenize "A-.-B" correctly', () => {
    expect(() =>
      runTest('ARR012', 'A-.-B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-.-' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Cross arrows
  it('ARR013: should tokenize "A--xB" correctly', () => {
    expect(() =>
      runTest('ARR013', 'A--xB', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '--x' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR014: should tokenize "A--x|text|B" correctly', () => {
    expect(() =>
      runTest('ARR014', 'A--x|text|B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '--x' },
        { type: 'PIPE', value: '|' },
        { type: 'textToken', value: 'text' },
        { type: 'PIPE', value: '|' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Circle arrows
  it('ARR015: should tokenize "A--oB" correctly', () => {
    expect(() =>
      runTest('ARR015', 'A--oB', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '--o' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR016: should tokenize "A--o|text|B" correctly', () => {
    expect(() =>
      runTest('ARR016', 'A--o|text|B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '--o' },
        { type: 'PIPE', value: '|' },
        { type: 'textToken', value: 'text' },
        { type: 'PIPE', value: '|' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Long arrows
  it('ARR017: should tokenize "A---->B" correctly', () => {
    expect(() =>
      runTest('ARR017', 'A---->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '---->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR018: should tokenize "A-----B" correctly', () => {
    expect(() =>
      runTest('ARR018', 'A-----B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-----' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Text on arrows with different syntaxes
  it('ARR019: should tokenize "A-- text -->B" correctly', () => {
    expect(() =>
      runTest('ARR019', 'A-- text -->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: 'text ' },
        { type: 'EdgeTextEnd', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('ARR020: should tokenize "A--text-->B" correctly', () => {
    expect(() =>
      runTest('ARR020', 'A--text-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: 'text' },
        { type: 'EdgeTextEnd', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });
});
