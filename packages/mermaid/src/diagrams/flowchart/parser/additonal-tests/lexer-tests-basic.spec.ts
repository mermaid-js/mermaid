import { describe, it, expect } from 'vitest';
import type { ExpectedToken } from './lexer-test-utils.js';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * BASIC SYNTAX LEXER TESTS
 *
 * Extracted from flow.spec.js and other basic parser tests
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Basic Syntax Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  it('GRA001: should tokenize "graph TD" correctly', () => {
    expect(() =>
      runTest('GRA001', 'graph TD', [
        { type: 'GRAPH', value: 'graph' },
        { type: 'DIR', value: 'TD' },
      ])
    ).not.toThrow();
  });

  it('GRA002: should tokenize "graph LR" correctly', () => {
    expect(() =>
      runTest('GRA002', 'graph LR', [
        { type: 'GRAPH', value: 'graph' },
        { type: 'DIR', value: 'LR' },
      ])
    ).not.toThrow();
  });

  it('GRA003: should tokenize "graph TB" correctly', () => {
    expect(() =>
      runTest('GRA003', 'graph TB', [
        { type: 'GRAPH', value: 'graph' },
        { type: 'DIR', value: 'TB' },
      ])
    ).not.toThrow();
  });

  it('GRA004: should tokenize "graph RL" correctly', () => {
    expect(() =>
      runTest('GRA004', 'graph RL', [
        { type: 'GRAPH', value: 'graph' },
        { type: 'DIR', value: 'RL' },
      ])
    ).not.toThrow();
  });

  it('GRA005: should tokenize "graph BT" correctly', () => {
    expect(() =>
      runTest('GRA005', 'graph BT', [
        { type: 'GRAPH', value: 'graph' },
        { type: 'DIR', value: 'BT' },
      ])
    ).not.toThrow();
  });

  it('FLO001: should tokenize "flowchart TD" correctly', () => {
    expect(() =>
      runTest('FLO001', 'flowchart TD', [
        { type: 'GRAPH', value: 'flowchart' },
        { type: 'DIR', value: 'TD' },
      ])
    ).not.toThrow();
  });

  it('FLO002: should tokenize "flowchart LR" correctly', () => {
    expect(() =>
      runTest('FLO002', 'flowchart LR', [
        { type: 'GRAPH', value: 'flowchart' },
        { type: 'DIR', value: 'LR' },
      ])
    ).not.toThrow();
  });

  it('NOD001: should tokenize simple node "A" correctly', () => {
    expect(() => runTest('NOD001', 'A', [{ type: 'NODE_STRING', value: 'A' }])).not.toThrow();
  });

  it('NOD002: should tokenize node "A1" correctly', () => {
    expect(() => runTest('NOD002', 'A1', [{ type: 'NODE_STRING', value: 'A1' }])).not.toThrow();
  });

  it('NOD003: should tokenize node "node1" correctly', () => {
    expect(() =>
      runTest('NOD003', 'node1', [{ type: 'NODE_STRING', value: 'node1' }])
    ).not.toThrow();
  });

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

  it('SHP001: should tokenize "A[Square]" correctly', () => {
    expect(() =>
      runTest('SHP001', 'A[Square]', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'SQS', value: '[' },
        { type: 'textToken', value: 'Square' },
        { type: 'SQE', value: ']' },
      ])
    ).not.toThrow();
  });

  it('SHP002: should tokenize "A(Round)" correctly', () => {
    expect(() =>
      runTest('SHP002', 'A(Round)', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'Round' },
        { type: 'PE', value: ')' },
      ])
    ).not.toThrow();
  });

  it('SHP003: should tokenize "A{Diamond}" correctly', () => {
    expect(() =>
      runTest('SHP003', 'A{Diamond}', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'DIAMOND_START', value: '{' },
        { type: 'textToken', value: 'Diamond' },
        { type: 'DIAMOND_STOP', value: '}' },
      ])
    ).not.toThrow();
  });
});
