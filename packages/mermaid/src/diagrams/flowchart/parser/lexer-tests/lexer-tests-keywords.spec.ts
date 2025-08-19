import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * KEYWORD HANDLING LEXER TESTS
 *
 * Extracted from flow-text.spec.js covering all flowchart keywords
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Keyword Handling Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  // Core keywords
  it('KEY001: should tokenize "graph" keyword', () => {
    expect(() => runTest('KEY001', 'graph', [{ type: 'GRAPH', value: 'graph' }])).not.toThrow();
  });

  it('KEY002: should tokenize "flowchart" keyword', () => {
    expect(() =>
      runTest('KEY002', 'flowchart', [{ type: 'GRAPH', value: 'flowchart' }])
    ).not.toThrow();
  });

  it('KEY003: should tokenize "flowchart-elk" keyword', () => {
    expect(() =>
      runTest('KEY003', 'flowchart-elk', [{ type: 'GRAPH', value: 'flowchart-elk' }])
    ).not.toThrow();
  });

  it('KEY004: should tokenize "subgraph" keyword', () => {
    expect(() =>
      runTest('KEY004', 'subgraph', [{ type: 'subgraph', value: 'subgraph' }])
    ).not.toThrow();
  });

  it('KEY005: should tokenize "end" keyword', () => {
    expect(() => runTest('KEY005', 'end', [{ type: 'end', value: 'end' }])).not.toThrow();
  });

  // Styling keywords
  it('KEY006: should tokenize "style" keyword', () => {
    expect(() => runTest('KEY006', 'style', [{ type: 'STYLE', value: 'style' }])).not.toThrow();
  });

  it('KEY007: should tokenize "linkStyle" keyword', () => {
    expect(() =>
      runTest('KEY007', 'linkStyle', [{ type: 'LINKSTYLE', value: 'linkStyle' }])
    ).not.toThrow();
  });

  it('KEY008: should tokenize "classDef" keyword', () => {
    expect(() =>
      runTest('KEY008', 'classDef', [{ type: 'CLASSDEF', value: 'classDef' }])
    ).not.toThrow();
  });

  it('KEY009: should tokenize "class" keyword', () => {
    expect(() => runTest('KEY009', 'class', [{ type: 'CLASS', value: 'class' }])).not.toThrow();
  });

  it('KEY010: should tokenize "default" keyword', () => {
    expect(() =>
      runTest('KEY010', 'default', [{ type: 'DEFAULT', value: 'default' }])
    ).not.toThrow();
  });

  it('KEY011: should tokenize "interpolate" keyword', () => {
    expect(() =>
      runTest('KEY011', 'interpolate', [{ type: 'INTERPOLATE', value: 'interpolate' }])
    ).not.toThrow();
  });

  // Interaction keywords
  it('KEY012: should tokenize "click" keyword', () => {
    expect(() => runTest('KEY012', 'click', [{ type: 'CLICK', value: 'click' }])).not.toThrow();
  });

  it('KEY013: should tokenize "href" keyword', () => {
    expect(() => runTest('KEY013', 'href', [{ type: 'HREF', value: 'href' }])).not.toThrow();
  });

  it('KEY014: should tokenize "call" keyword', () => {
    expect(() =>
      runTest('KEY014', 'call', [{ type: 'CALLBACKNAME', value: 'call' }])
    ).not.toThrow();
  });

  // Link target keywords
  it('KEY015: should tokenize "_self" keyword', () => {
    expect(() =>
      runTest('KEY015', '_self', [{ type: 'LINK_TARGET', value: '_self' }])
    ).not.toThrow();
  });

  it('KEY016: should tokenize "_blank" keyword', () => {
    expect(() =>
      runTest('KEY016', '_blank', [{ type: 'LINK_TARGET', value: '_blank' }])
    ).not.toThrow();
  });

  it('KEY017: should tokenize "_parent" keyword', () => {
    expect(() =>
      runTest('KEY017', '_parent', [{ type: 'LINK_TARGET', value: '_parent' }])
    ).not.toThrow();
  });

  it('KEY018: should tokenize "_top" keyword', () => {
    expect(() => runTest('KEY018', '_top', [{ type: 'LINK_TARGET', value: '_top' }])).not.toThrow();
  });

  // Special keyword "kitty" (from tests)
  it('KEY019: should tokenize "kitty" keyword', () => {
    expect(() =>
      runTest('KEY019', 'kitty', [{ type: 'NODE_STRING', value: 'kitty' }])
    ).not.toThrow();
  });

  // Keywords as node IDs
  it('KEY020: should handle "graph" as node ID', () => {
    expect(() =>
      runTest('KEY020', 'A_graph_node', [{ type: 'NODE_STRING', value: 'A_graph_node' }])
    ).not.toThrow();
  });

  it('KEY021: should handle "style" as node ID', () => {
    expect(() =>
      runTest('KEY021', 'A_style_node', [{ type: 'NODE_STRING', value: 'A_style_node' }])
    ).not.toThrow();
  });

  it('KEY022: should handle "end" as node ID', () => {
    expect(() =>
      runTest('KEY022', 'A_end_node', [{ type: 'NODE_STRING', value: 'A_end_node' }])
    ).not.toThrow();
  });

  // Direction keywords
  it('KEY023: should tokenize "TD" direction', () => {
    expect(() => runTest('KEY023', 'TD', [{ type: 'DIR', value: 'TD' }])).not.toThrow();
  });

  it('KEY024: should tokenize "TB" direction', () => {
    expect(() => runTest('KEY024', 'TB', [{ type: 'DIR', value: 'TB' }])).not.toThrow();
  });

  it('KEY025: should tokenize "LR" direction', () => {
    expect(() => runTest('KEY025', 'LR', [{ type: 'DIR', value: 'LR' }])).not.toThrow();
  });

  it('KEY026: should tokenize "RL" direction', () => {
    expect(() => runTest('KEY026', 'RL', [{ type: 'DIR', value: 'RL' }])).not.toThrow();
  });

  it('KEY027: should tokenize "BT" direction', () => {
    expect(() => runTest('KEY027', 'BT', [{ type: 'DIR', value: 'BT' }])).not.toThrow();
  });

  // Keywords as complete node IDs (from flow.spec.js edge cases)
  it('KEY028: should tokenize "endpoint --> sender" correctly', () => {
    expect(() =>
      runTest('KEY028', 'endpoint --> sender', [
        { type: 'NODE_STRING', value: 'endpoint' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'sender' },
      ])
    ).not.toThrow();
  });

  it('KEY029: should tokenize "default --> monograph" correctly', () => {
    expect(() =>
      runTest('KEY029', 'default --> monograph', [
        { type: 'NODE_STRING', value: 'default' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'monograph' },
      ])
    ).not.toThrow();
  });

  // Direction keywords in node IDs
  it('KEY030: should tokenize "node1TB" correctly', () => {
    expect(() =>
      runTest('KEY030', 'node1TB', [{ type: 'NODE_STRING', value: 'node1TB' }])
    ).not.toThrow();
  });

  // Keywords in vertex text
  it('KEY031: should tokenize "A(graph text)-->B" correctly', () => {
    expect(() =>
      runTest('KEY031', 'A(graph text)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'graph text' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // Direction keywords as single characters (v handling from flow-text.spec.js)
  it('KEY032: should tokenize "v" correctly', () => {
    expect(() => runTest('KEY032', 'v', [{ type: 'NODE_STRING', value: 'v' }])).not.toThrow();
  });

  it('KEY033: should tokenize "csv" correctly', () => {
    expect(() => runTest('KEY033', 'csv', [{ type: 'NODE_STRING', value: 'csv' }])).not.toThrow();
  });

  // Numbers as labels (from flow.spec.js)
  it('KEY034: should tokenize "1" correctly', () => {
    expect(() => runTest('KEY034', '1', [{ type: 'NODE_STRING', value: '1' }])).not.toThrow();
  });
});
