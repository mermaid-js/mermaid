import { describe, it, expect } from 'vitest';
import { createLexerTestSuite } from './lexer-test-utils.js';

/**
 * NODE SHAPE SYNTAX LEXER TESTS
 *
 * Extracted from various parser tests covering different node shapes
 * Each test has a unique ID (3 letters + 3 digits) for easy identification
 */

describe('Node Shape Syntax Lexer Tests', () => {
  const { runTest } = createLexerTestSuite();

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

  it('SHP004: should tokenize "A((Circle))" correctly', () => {
    expect(() =>
      runTest('SHP004', 'A((Circle))', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'DOUBLECIRCLESTART', value: '((' },
        { type: 'textToken', value: 'Circle' },
        { type: 'DOUBLECIRCLEEND', value: '))' },
      ])
    ).not.toThrow();
  });

  it('SHP005: should tokenize "A>Asymmetric]" correctly', () => {
    expect(() =>
      runTest('SHP005', 'A>Asymmetric]', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'TAGEND', value: '>' },
        { type: 'textToken', value: 'Asymmetric' },
        { type: 'SQE', value: ']' },
      ])
    ).not.toThrow();
  });

  it('SHP006: should tokenize "A[[Subroutine]]" correctly', () => {
    expect(() =>
      runTest('SHP006', 'A[[Subroutine]]', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'SUBROUTINESTART', value: '[[' },
        { type: 'textToken', value: 'Subroutine' },
        { type: 'SUBROUTINEEND', value: ']]' },
      ])
    ).not.toThrow();
  });

  it('SHP007: should tokenize "A[(Database)]" correctly', () => {
    expect(() =>
      runTest('SHP007', 'A[(Database)]', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'CYLINDERSTART', value: '[(' },
        { type: 'textToken', value: 'Database' },
        { type: 'CYLINDEREND', value: ')]' },
      ])
    ).not.toThrow();
  });

  it('SHP008: should tokenize "A([Stadium])" correctly', () => {
    expect(() =>
      runTest('SHP008', 'A([Stadium])', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'STADIUMSTART', value: '([' },
        { type: 'textToken', value: 'Stadium' },
        { type: 'STADIUMEND', value: '])' },
      ])
    ).not.toThrow();
  });

  it('SHP009: should tokenize "A[/Parallelogram/]" correctly', () => {
    expect(() =>
      runTest('SHP009', 'A[/Parallelogram/]', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'TRAPSTART', value: '[/' },
        { type: 'textToken', value: 'Parallelogram' },
        { type: 'TRAPEND', value: '/]' },
      ])
    ).not.toThrow();
  });

  it('SHP010: should tokenize "A[\\Parallelogram\\]" correctly', () => {
    expect(() =>
      runTest('SHP010', 'A[\\Parallelogram\\]', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'INVTRAPSTART', value: '[\\' },
        { type: 'textToken', value: 'Parallelogram' },
        { type: 'INVTRAPEND', value: '\\]' },
      ])
    ).not.toThrow();
  });

  it('SHP011: should tokenize "A[/Trapezoid\\]" correctly', () => {
    expect(() =>
      runTest('SHP011', 'A[/Trapezoid\\]', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'TRAPSTART', value: '[/' },
        { type: 'textToken', value: 'Trapezoid' },
        { type: 'INVTRAPEND', value: '\\]' },
      ])
    ).not.toThrow();
  });

  it('SHP012: should tokenize "A[\\Trapezoid/]" correctly', () => {
    expect(() =>
      runTest('SHP012', 'A[\\Trapezoid/]', [
        { type: 'NODE_STRING', value: 'A' },
        { type: 'INVTRAPSTART', value: '[\\' },
        { type: 'textToken', value: 'Trapezoid' },
        { type: 'TRAPEND', value: '/]' },
      ])
    ).not.toThrow();
  });
});
