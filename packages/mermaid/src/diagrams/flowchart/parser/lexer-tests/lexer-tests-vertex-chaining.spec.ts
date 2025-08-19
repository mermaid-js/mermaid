import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * VERTEX CHAINING LEXER TESTS
 *
 * Tests for vertex chaining patterns based on flow-vertice-chaining.spec.js
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Vertex Chaining Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  // Basic chaining
  it('VCH001: should tokenize "A-->B-->C" correctly', () => {
    expect(() =>
      runTest('VCH001', 'A-->B-->C', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'C' },
      ])
    ).not.toThrow();
  });

  it('VCH002: should tokenize "A-->B-->C-->D" correctly', () => {
    expect(() =>
      runTest('VCH002', 'A-->B-->C-->D', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'C' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'D' },
      ])
    ).not.toThrow();
  });

  // Multiple sources with &
  it('VCH003: should tokenize "A & B --> C" correctly', () => {
    expect(() =>
      runTest('VCH003', 'A & B --> C', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'C' },
      ])
    ).not.toThrow();
  });

  it('VCH004: should tokenize "A & B & C --> D" correctly', () => {
    expect(() =>
      runTest('VCH004', 'A & B & C --> D', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'C' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'D' },
      ])
    ).not.toThrow();
  });

  // Multiple targets with &
  it('VCH005: should tokenize "A --> B & C" correctly', () => {
    expect(() =>
      runTest('VCH005', 'A --> B & C', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'C' },
      ])
    ).not.toThrow();
  });

  it('VCH006: should tokenize "A --> B & C & D" correctly', () => {
    expect(() =>
      runTest('VCH006', 'A --> B & C & D', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'C' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'D' },
      ])
    ).not.toThrow();
  });

  // Complex chaining with multiple sources and targets
  it('VCH007: should tokenize "A & B --> C & D" correctly', () => {
    expect(() =>
      runTest('VCH007', 'A & B --> C & D', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'C' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'D' },
      ])
    ).not.toThrow();
  });

  // Chaining with different arrow types
  it('VCH008: should tokenize "A==>B==>C" correctly', () => {
    expect(() =>
      runTest('VCH008', 'A==>B==>C', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '==>' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'LINK', value: '==>' },
        { type: 'NODE_STRING', value: 'C' },
      ])
    ).not.toThrow();
  });

  it('VCH009: should tokenize "A-.->B-.->C" correctly', () => {
    expect(() =>
      runTest('VCH009', 'A-.->B-.->C', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-.->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'LINK', value: '-.->' },
        { type: 'NODE_STRING', value: 'C' },
      ])
    ).not.toThrow();
  });

  // Chaining with text
  it('VCH010: should tokenize "A--text1-->B--text2-->C" correctly', () => {
    expect(() =>
      runTest('VCH010', 'A--text1-->B--text2-->C', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: 'text1' },
        { type: 'EdgeTextEnd', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: 'text2' },
        { type: 'EdgeTextEnd', value: '-->' },
        { type: 'NODE_STRING', value: 'C' },
      ])
    ).not.toThrow();
  });

  // Chaining with shapes
  it('VCH011: should tokenize "A[Start]-->B(Process)-->C{Decision}" correctly', () => {
    expect(() =>
      runTest('VCH011', 'A[Start]-->B(Process)-->C{Decision}', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'SQS', value: '[' },
        { type: 'textToken', value: 'Start' },
        { type: 'SQE', value: ']' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'Process' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'C' },
        { type: 'DIAMOND_START', value: '{' },
        { type: 'textToken', value: 'Decision' },
        { type: 'DIAMOND_STOP', value: '}' },
      ])
    ).not.toThrow();
  });

  // Mixed chaining and multiple connections
  it('VCH012: should tokenize "A-->B & C-->D" correctly', () => {
    expect(() =>
      runTest('VCH012', 'A-->B & C-->D', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'C' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'D' },
      ])
    ).not.toThrow();
  });

  // Long chains
  it('VCH013: should tokenize "A-->B-->C-->D-->E-->F" correctly', () => {
    expect(() =>
      runTest('VCH013', 'A-->B-->C-->D-->E-->F', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'C' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'D' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'E' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'F' },
      ])
    ).not.toThrow();
  });

  // Complex multi-source multi-target
  it('VCH014: should tokenize "A & B & C --> D & E & F" correctly', () => {
    expect(() =>
      runTest('VCH014', 'A & B & C --> D & E & F', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'C' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'D' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'E' },
        { type: 'AMP', value: '&' },
        { type: 'NODE_STRING', value: 'F' },
      ])
    ).not.toThrow();
  });

  // Chaining with bidirectional arrows
  it('VCH015: should tokenize "A<-->B<-->C" correctly', () => {
    expect(() =>
      runTest('VCH015', 'A<-->B<-->C', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'LINK', value: '<-->' },
        { type: 'NODE_STRING', value: 'B' },
        { type: 'LINK', value: '<-->' },
        { type: 'NODE_STRING', value: 'C' },
      ])
    ).not.toThrow();
  });
});
