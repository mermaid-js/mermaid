import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * DIRECTION SYNTAX LEXER TESTS
 * 
 * Extracted from flow-arrows.spec.js and flow-direction.spec.js
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Direction Syntax Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  it('DIR001: should tokenize "graph >" correctly', () => {
    expect(() => runTest('DIR001', 'graph >', [
      { type: 'GRAPH', value: 'graph' },
      { type: 'DIR', value: '>' },
    ])).not.toThrow();
  });

  it('DIR002: should tokenize "graph <" correctly', () => {
    expect(() => runTest('DIR002', 'graph <', [
      { type: 'GRAPH', value: 'graph' },
      { type: 'DIR', value: '<' },
    ])).not.toThrow();
  });

  it('DIR003: should tokenize "graph ^" correctly', () => {
    expect(() => runTest('DIR003', 'graph ^', [
      { type: 'GRAPH', value: 'graph' },
      { type: 'DIR', value: '^' },
    ])).not.toThrow();
  });

  it('DIR004: should tokenize "graph v" correctly', () => {
    expect(() => runTest('DIR004', 'graph v', [
      { type: 'GRAPH', value: 'graph' },
      { type: 'DIR', value: 'v' },
    ])).not.toThrow();
  });

  it('DIR005: should tokenize "flowchart >" correctly', () => {
    expect(() => runTest('DIR005', 'flowchart >', [
      { type: 'GRAPH', value: 'flowchart' },
      { type: 'DIR', value: '>' },
    ])).not.toThrow();
  });

  it('DIR006: should tokenize "flowchart <" correctly', () => {
    expect(() => runTest('DIR006', 'flowchart <', [
      { type: 'GRAPH', value: 'flowchart' },
      { type: 'DIR', value: '<' },
    ])).not.toThrow();
  });

  it('DIR007: should tokenize "flowchart ^" correctly', () => {
    expect(() => runTest('DIR007', 'flowchart ^', [
      { type: 'GRAPH', value: 'flowchart' },
      { type: 'DIR', value: '^' },
    ])).not.toThrow();
  });

  it('DIR008: should tokenize "flowchart v" correctly', () => {
    expect(() => runTest('DIR008', 'flowchart v', [
      { type: 'GRAPH', value: 'flowchart' },
      { type: 'DIR', value: 'v' },
    ])).not.toThrow();
  });

  it('DIR009: should tokenize "flowchart-elk TD" correctly', () => {
    expect(() => runTest('DIR009', 'flowchart-elk TD', [
      { type: 'GRAPH', value: 'flowchart-elk' },
      { type: 'DIR', value: 'TD' },
    ])).not.toThrow();
  });

  it('DIR010: should tokenize "flowchart-elk LR" correctly', () => {
    expect(() => runTest('DIR010', 'flowchart-elk LR', [
      { type: 'GRAPH', value: 'flowchart-elk' },
      { type: 'DIR', value: 'LR' },
    ])).not.toThrow();
  });
});
