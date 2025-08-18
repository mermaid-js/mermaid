import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * INTERACTION SYNTAX LEXER TESTS
 * 
 * Extracted from flow-interactions.spec.js covering click, href, call, etc.
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Interaction Syntax Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

  // Click interactions
  it('INT001: should tokenize "click A callback" correctly', () => {
    expect(() => runTest('INT001', 'click A callback', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'CALLBACKNAME', value: 'callback' },
    ])).not.toThrow();
  });

  it('INT002: should tokenize "click A call callback()" correctly', () => {
    expect(() => runTest('INT002', 'click A call callback()', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'CALLBACKNAME', value: 'call' },
      { type: 'CALLBACKNAME', value: 'callback' },
      { type: 'PS', value: '(' },
      { type: 'PE', value: ')' },
    ])).not.toThrow();
  });

  it('INT003: should tokenize click with tooltip', () => {
    expect(() => runTest('INT003', 'click A callback "tooltip"', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'CALLBACKNAME', value: 'callback' },
      { type: 'STR', value: '"tooltip"' },
    ])).not.toThrow();
  });

  it('INT004: should tokenize click call with tooltip', () => {
    expect(() => runTest('INT004', 'click A call callback() "tooltip"', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'CALLBACKNAME', value: 'call' },
      { type: 'CALLBACKNAME', value: 'callback' },
      { type: 'PS', value: '(' },
      { type: 'PE', value: ')' },
      { type: 'STR', value: '"tooltip"' },
    ])).not.toThrow();
  });

  it('INT005: should tokenize click with args', () => {
    expect(() => runTest('INT005', 'click A call callback("test0", test1, test2)', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'CALLBACKNAME', value: 'call' },
      { type: 'CALLBACKNAME', value: 'callback' },
      { type: 'PS', value: '(' },
      { type: 'CALLBACKARGS', value: '"test0", test1, test2' },
      { type: 'PE', value: ')' },
    ])).not.toThrow();
  });

  // Href interactions
  it('INT006: should tokenize click to link', () => {
    expect(() => runTest('INT006', 'click A "click.html"', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'STR', value: '"click.html"' },
    ])).not.toThrow();
  });

  it('INT007: should tokenize click href link', () => {
    expect(() => runTest('INT007', 'click A href "click.html"', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'HREF', value: 'href' },
      { type: 'STR', value: '"click.html"' },
    ])).not.toThrow();
  });

  it('INT008: should tokenize click link with tooltip', () => {
    expect(() => runTest('INT008', 'click A "click.html" "tooltip"', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'STR', value: '"click.html"' },
      { type: 'STR', value: '"tooltip"' },
    ])).not.toThrow();
  });

  it('INT009: should tokenize click href link with tooltip', () => {
    expect(() => runTest('INT009', 'click A href "click.html" "tooltip"', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'HREF', value: 'href' },
      { type: 'STR', value: '"click.html"' },
      { type: 'STR', value: '"tooltip"' },
    ])).not.toThrow();
  });

  // Link targets
  it('INT010: should tokenize click link with target', () => {
    expect(() => runTest('INT010', 'click A "click.html" _blank', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'STR', value: '"click.html"' },
      { type: 'LINK_TARGET', value: '_blank' },
    ])).not.toThrow();
  });

  it('INT011: should tokenize click href link with target', () => {
    expect(() => runTest('INT011', 'click A href "click.html" _blank', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'HREF', value: 'href' },
      { type: 'STR', value: '"click.html"' },
      { type: 'LINK_TARGET', value: '_blank' },
    ])).not.toThrow();
  });

  it('INT012: should tokenize click link with tooltip and target', () => {
    expect(() => runTest('INT012', 'click A "click.html" "tooltip" _blank', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'STR', value: '"click.html"' },
      { type: 'STR', value: '"tooltip"' },
      { type: 'LINK_TARGET', value: '_blank' },
    ])).not.toThrow();
  });

  it('INT013: should tokenize click href link with tooltip and target', () => {
    expect(() => runTest('INT013', 'click A href "click.html" "tooltip" _blank', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'HREF', value: 'href' },
      { type: 'STR', value: '"click.html"' },
      { type: 'STR', value: '"tooltip"' },
      { type: 'LINK_TARGET', value: '_blank' },
    ])).not.toThrow();
  });

  // Other link targets
  it('INT014: should tokenize _self target', () => {
    expect(() => runTest('INT014', 'click A "click.html" _self', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'STR', value: '"click.html"' },
      { type: 'LINK_TARGET', value: '_self' },
    ])).not.toThrow();
  });

  it('INT015: should tokenize _parent target', () => {
    expect(() => runTest('INT015', 'click A "click.html" _parent', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'STR', value: '"click.html"' },
      { type: 'LINK_TARGET', value: '_parent' },
    ])).not.toThrow();
  });

  it('INT016: should tokenize _top target', () => {
    expect(() => runTest('INT016', 'click A "click.html" _top', [
      { type: 'CLICK', value: 'click' },
      { type: 'NODE_STRING', value: 'A' },
      { type: 'STR', value: '"click.html"' },
      { type: 'LINK_TARGET', value: '_top' },
    ])).not.toThrow();
  });
});
