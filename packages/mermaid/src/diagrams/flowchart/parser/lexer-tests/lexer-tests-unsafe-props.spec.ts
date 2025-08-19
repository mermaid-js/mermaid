import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * UNSAFE PROPERTIES LEXER TESTS
 *
 * Tests for unsafe properties like __proto__, constructor in node IDs based on flow.spec.js
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Unsafe Properties Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  // __proto__ as node ID
  it('UNS001: should tokenize "__proto__ --> A" correctly', () => {
    expect(() =>
      runTest('UNS001', '__proto__ --> A', [
        { type: 'NODE_STRING', value: '__proto__' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'A' },
      ])
    ).not.toThrow();
  });

  // constructor as node ID
  it('UNS002: should tokenize "constructor --> A" correctly', () => {
    expect(() =>
      runTest('UNS002', 'constructor --> A', [
        { type: 'NODE_STRING', value: 'constructor' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'A' },
      ])
    ).not.toThrow();
  });

  // __proto__ in click callback
  it('UNS003: should tokenize "click __proto__ callback" correctly', () => {
    expect(() =>
      runTest('UNS003', 'click __proto__ callback', [
        { type: 'CLICK', value: 'click' },
        { type: 'NODE_STRING', value: '__proto__' },
        { type: 'CALLBACKNAME', value: 'callback' },
      ])
    ).not.toThrow();
  });

  // constructor in click callback
  it('UNS004: should tokenize "click constructor callback" correctly', () => {
    expect(() =>
      runTest('UNS004', 'click constructor callback', [
        { type: 'CLICK', value: 'click' },
        { type: 'NODE_STRING', value: 'constructor' },
        { type: 'CALLBACKNAME', value: 'callback' },
      ])
    ).not.toThrow();
  });

  // __proto__ in tooltip
  it('UNS005: should tokenize "click __proto__ callback \\"__proto__\\"" correctly', () => {
    expect(() =>
      runTest('UNS005', 'click __proto__ callback "__proto__"', [
        { type: 'CLICK', value: 'click' },
        { type: 'NODE_STRING', value: '__proto__' },
        { type: 'CALLBACKNAME', value: 'callback' },
        { type: 'STR', value: '"__proto__"' },
      ])
    ).not.toThrow();
  });

  // constructor in tooltip
  it('UNS006: should tokenize "click constructor callback \\"constructor\\"" correctly', () => {
    expect(() =>
      runTest('UNS006', 'click constructor callback "constructor"', [
        { type: 'CLICK', value: 'click' },
        { type: 'NODE_STRING', value: 'constructor' },
        { type: 'CALLBACKNAME', value: 'callback' },
        { type: 'STR', value: '"constructor"' },
      ])
    ).not.toThrow();
  });

  // __proto__ in class definition
  it('UNS007: should tokenize "classDef __proto__ color:#ffffff" correctly', () => {
    expect(() =>
      runTest('UNS007', 'classDef __proto__ color:#ffffff', [
        { type: 'CLASSDEF', value: 'classDef' },
        { type: 'NODE_STRING', value: '__proto__' },
        { type: 'STYLE_SEPARATOR', value: 'color' },
        { type: 'COLON', value: ':' },
        { type: 'STYLE_SEPARATOR', value: '#ffffff' },
      ])
    ).not.toThrow();
  });

  // constructor in class definition
  it('UNS008: should tokenize "classDef constructor color:#ffffff" correctly', () => {
    expect(() =>
      runTest('UNS008', 'classDef constructor color:#ffffff', [
        { type: 'CLASSDEF', value: 'classDef' },
        { type: 'NODE_STRING', value: 'constructor' },
        { type: 'STYLE_SEPARATOR', value: 'color' },
        { type: 'COLON', value: ':' },
        { type: 'STYLE_SEPARATOR', value: '#ffffff' },
      ])
    ).not.toThrow();
  });

  // __proto__ in class assignment
  it('UNS009: should tokenize "class __proto__ __proto__" correctly', () => {
    expect(() =>
      runTest('UNS009', 'class __proto__ __proto__', [
        { type: 'CLASS', value: 'class' },
        { type: 'NODE_STRING', value: '__proto__' },
        { type: 'NODE_STRING', value: '__proto__' },
      ])
    ).not.toThrow();
  });

  // constructor in class assignment
  it('UNS010: should tokenize "class constructor constructor" correctly', () => {
    expect(() =>
      runTest('UNS010', 'class constructor constructor', [
        { type: 'CLASS', value: 'class' },
        { type: 'NODE_STRING', value: 'constructor' },
        { type: 'NODE_STRING', value: 'constructor' },
      ])
    ).not.toThrow();
  });

  // __proto__ in subgraph
  it('UNS011: should tokenize "subgraph __proto__" correctly', () => {
    expect(() =>
      runTest('UNS011', 'subgraph __proto__', [
        { type: 'subgraph', value: 'subgraph' },
        { type: 'NODE_STRING', value: '__proto__' },
      ])
    ).not.toThrow();
  });

  // constructor in subgraph
  it('UNS012: should tokenize "subgraph constructor" correctly', () => {
    expect(() =>
      runTest('UNS012', 'subgraph constructor', [
        { type: 'subgraph', value: 'subgraph' },
        { type: 'NODE_STRING', value: 'constructor' },
      ])
    ).not.toThrow();
  });

  // __proto__ in vertex text
  it('UNS013: should tokenize "A(__proto__)-->B" correctly', () => {
    expect(() =>
      runTest('UNS013', 'A(__proto__)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: '__proto__' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // constructor in vertex text
  it('UNS014: should tokenize "A(constructor)-->B" correctly', () => {
    expect(() =>
      runTest('UNS014', 'A(constructor)-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'PS', value: '(' },
        { type: 'textToken', value: 'constructor' },
        { type: 'PE', value: ')' },
        { type: 'LINK', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // __proto__ in edge text
  it('UNS015: should tokenize "A--__proto__-->B" correctly', () => {
    expect(() =>
      runTest('UNS015', 'A--__proto__-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: '__proto__' },
        { type: 'EdgeTextEnd', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });

  // constructor in edge text
  it('UNS016: should tokenize "A--constructor-->B" correctly', () => {
    expect(() =>
      runTest('UNS016', 'A--constructor-->B', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'START_LINK', value: '--' },
        { type: 'EdgeTextContent', value: 'constructor' },
        { type: 'EdgeTextEnd', value: '-->' },
        { type: 'NODE_STRING', value: 'B' },
      ])
    ).not.toThrow();
  });
});
