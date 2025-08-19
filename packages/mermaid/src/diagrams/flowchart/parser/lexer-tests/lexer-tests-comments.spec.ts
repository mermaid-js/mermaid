import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * COMMENT SYNTAX LEXER TESTS
 * 
 * Extracted from flow-comments.spec.js covering comment handling
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Comment Syntax Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  // Single line comments
  it('COM001: should tokenize "%% comment" correctly', () => {
    expect(() => runTest('COM001', '%% comment', [
      { type: 'COMMENT', value: '%% comment' },
    ])).not.toThrow();
  });

  it('COM002: should tokenize "%%{init: {"theme":"base"}}%%" correctly', () => {
    expect(() => runTest('COM002', '%%{init: {"theme":"base"}}%%', [
      { type: 'DIRECTIVE', value: '%%{init: {"theme":"base"}}%%' },
    ])).not.toThrow();
  });

  // Comments with graph content
  it('COM003: should handle comment before graph', () => {
    expect(() => runTest('COM003', '%% This is a comment\ngraph TD', [
      { type: 'COMMENT', value: '%% This is a comment' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'GRAPH', value: 'graph' },
      { type: 'DIR', value: 'TD' },
    ])).not.toThrow();
  });

  it('COM004: should handle comment after graph', () => {
    expect(() => runTest('COM004', 'graph TD\n%% This is a comment', [
      { type: 'GRAPH', value: 'graph' },
      { type: 'DIR', value: 'TD' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'COMMENT', value: '%% This is a comment' },
    ])).not.toThrow();
  });

  it('COM005: should handle comment between nodes', () => {
    expect(() => runTest('COM005', 'A-->B\n%% comment\nB-->C', [
      { type: 'NODE_STRING', value: 'A' },
      { type: 'LINK', value: '-->' },
      { type: 'NODE_STRING', value: 'B' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'COMMENT', value: '%% comment' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'NODE_STRING', value: 'B' },
      { type: 'LINK', value: '-->' },
      { type: 'NODE_STRING', value: 'C' },
    ])).not.toThrow();
  });

  // Directive comments
  it('COM006: should tokenize theme directive', () => {
    expect(() => runTest('COM006', '%%{init: {"theme":"dark"}}%%', [
      { type: 'DIRECTIVE', value: '%%{init: {"theme":"dark"}}%%' },
    ])).not.toThrow();
  });

  it('COM007: should tokenize config directive', () => {
    expect(() => runTest('COM007', '%%{config: {"flowchart":{"htmlLabels":false}}}%%', [
      { type: 'DIRECTIVE', value: '%%{config: {"flowchart":{"htmlLabels":false}}}%%' },
    ])).not.toThrow();
  });

  it('COM008: should tokenize wrap directive', () => {
    expect(() => runTest('COM008', '%%{wrap}%%', [
      { type: 'DIRECTIVE', value: '%%{wrap}%%' },
    ])).not.toThrow();
  });

  // Comments with special characters
  it('COM009: should handle comment with special chars', () => {
    expect(() => runTest('COM009', '%% Comment with special chars: !@#$%^&*()', [
      { type: 'COMMENT', value: '%% Comment with special chars: !@#$%^&*()' },
    ])).not.toThrow();
  });

  it('COM010: should handle comment with unicode', () => {
    expect(() => runTest('COM010', '%% Comment with unicode: åäö ÅÄÖ', [
      { type: 'COMMENT', value: '%% Comment with unicode: åäö ÅÄÖ' },
    ])).not.toThrow();
  });

  // Multiple comments
  it('COM011: should handle multiple comments', () => {
    expect(() => runTest('COM011', '%% First comment\n%% Second comment', [
      { type: 'COMMENT', value: '%% First comment' },
      { type: 'NEWLINE', value: '\n' },
      { type: 'COMMENT', value: '%% Second comment' },
    ])).not.toThrow();
  });

  // Empty comments
  it('COM012: should handle empty comment', () => {
    expect(() => runTest('COM012', '%%', [
      { type: 'COMMENT', value: '%%' },
    ])).not.toThrow();
  });
});
