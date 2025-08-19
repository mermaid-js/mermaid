import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * EDGE SYNTAX LEXER TESTS
 *
 * Extracted from flow-edges.spec.js and other edge-related tests
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Edge Syntax Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  it('EDG001: should tokenize "A-->B" correctly', () => {
    expect(() =>
      runTest('EDG001', 'A-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('EDG002: should tokenize "A --- B" correctly', () => {
    expect(() =>
      runTest('EDG002', 'A --- B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '---' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('EDG003: should tokenize "A-.-B" correctly', () => {
    expect(() =>
      runTest('EDG003', 'A-.-B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-.-' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('EDG004: should tokenize "A===B" correctly', () => {
    expect(() =>
      runTest('EDG004', 'A===B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '===' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('EDG005: should tokenize "A-.->B" correctly', () => {
    expect(() =>
      runTest('EDG005', 'A-.->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-.->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('EDG006: should tokenize "A==>B" correctly', () => {
    expect(() =>
      runTest('EDG006', 'A==>B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '==>' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('EDG007: should tokenize "A<-->B" correctly', () => {
    expect(() =>
      runTest('EDG007', 'A<-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '<-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('EDG008: should tokenize "A-->|text|B" correctly', () => {
    expect(() =>
      runTest('EDG008', 'A-->|text|B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'PIPE', value: '|' },
        { type: 'textToken', value: 'text' },
        { type: 'PIPE', value: '|' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('EDG009: should tokenize "A---|text|B" correctly', () => {
    expect(() =>
      runTest('EDG009', 'A---|text|B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '---' },
        { type: 'PIPE', value: '|' },
        { type: 'textToken', value: 'text' },
        { type: 'PIPE', value: '|' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('EDG010: should tokenize "A-.-|text|B" correctly', () => {
    expect(() =>
      runTest('EDG010', 'A-.-|text|B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-.-' },
        { type: 'PIPE', value: '|' },
        { type: 'textToken', value: 'text' },
        { type: 'PIPE', value: '|' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('EDG011: should tokenize "A==>|text|B" correctly', () => {
    expect(() =>
      runTest('EDG011', 'A==>|text|B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '==>' },
        { type: 'PIPE', value: '|' },
        { type: 'textToken', value: 'text' },
        { type: 'PIPE', value: '|' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  it('EDG012: should tokenize "A-.->|text|B" correctly', () => {
    expect(() =>
      runTest('EDG012', 'A-.->|text|B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-.->' },
        { type: 'PIPE', value: '|' },
        { type: 'textToken', value: 'text' },
        { type: 'PIPE', value: '|' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });
});
