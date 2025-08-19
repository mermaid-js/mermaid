/**
 * Simple lexer test to verify JISON-Lezer synchronization
 */

import { describe, it, expect } from 'vitest';
import { parser as lezerParser } from './flow.grammar.js';

describe('Simple Lexer Sync Test', () => {
  it('should tokenize simple arrow -->', () => {
    const input = 'A --> B';
    const tree = lezerParser.parse(input);

    // Extract tokens from the tree
    const tokens: string[] = [];
    tree.iterate({
      enter: (node) => {
        if (node.name && node.from !== node.to) {
          const value = input.slice(node.from, node.to);
          if (value.trim() && node.name !== 'Space') {
            tokens.push(`${node.name}:${value}`);
          }
        }
      },
    });

    console.log('Tokens for "A --> B":', tokens);

    // We expect to see an arrow token for "-->"
    const hasArrowToken = tokens.some((token) => token.includes('Arrow') && token.includes('-->'));

    expect(hasArrowToken).toBe(true);
  });

  it('should tokenize dotted arrow -.-', () => {
    const input = 'A -.- B';
    const tree = lezerParser.parse(input);

    // Extract tokens from the tree
    const tokens: string[] = [];
    tree.iterate({
      enter: (node) => {
        if (node.name && node.from !== node.to) {
          const value = input.slice(node.from, node.to);
          if (value.trim() && node.name !== 'Space') {
            tokens.push(`${node.name}:${value}`);
          }
        }
      },
    });

    console.log('Tokens for "A -.- B":', tokens);

    // We expect to see an arrow token for "-.-"
    const hasArrowToken = tokens.some((token) => token.includes('Arrow') && token.includes('-.-'));

    expect(hasArrowToken).toBe(true);
  });

  it('should tokenize thick arrow ==>', () => {
    const input = 'A ==> B';
    const tree = lezerParser.parse(input);

    const tokens: string[] = [];
    tree.iterate({
      enter: (node) => {
        if (node.name && node.from !== node.to) {
          const value = input.slice(node.from, node.to);
          if (value.trim() && node.name !== 'Space') {
            tokens.push(`${node.name}:${value}`);
          }
        }
      },
    });

    console.log('Tokens for "A ==> B":', tokens);

    const hasArrowToken = tokens.some((token) => token.includes('Arrow') && token.includes('==>'));
    expect(hasArrowToken).toBe(true);
  });

  it('should tokenize double-ended arrow <-->', () => {
    const input = 'A <--> B';
    const tree = lezerParser.parse(input);

    const tokens: string[] = [];
    tree.iterate({
      enter: (node) => {
        if (node.name && node.from !== node.to) {
          const value = input.slice(node.from, node.to);
          if (value.trim() && node.name !== 'Space') {
            tokens.push(`${node.name}:${value}`);
          }
        }
      },
    });

    console.log('Tokens for "A <--> B":', tokens);

    const hasArrowToken = tokens.some((token) => token.includes('Arrow') && token.includes('<-->'));
    expect(hasArrowToken).toBe(true);
  });

  it('should tokenize longer arrows --->', () => {
    const input = 'A ---> B';
    const tree = lezerParser.parse(input);

    const tokens: string[] = [];
    tree.iterate({
      enter: (node) => {
        if (node.name && node.from !== node.to) {
          const value = input.slice(node.from, node.to);
          if (value.trim() && node.name !== 'Space') {
            tokens.push(`${node.name}:${value}`);
          }
        }
      },
    });

    console.log('Tokens for "A ---> B":', tokens);

    const hasArrowToken = tokens.some((token) => token.includes('Arrow') && token.includes('--->'));
    expect(hasArrowToken).toBe(true);
  });

  it('should tokenize double dot arrow -..-', () => {
    const input = 'A -..- B';
    const tree = lezerParser.parse(input);

    const tokens: string[] = [];
    tree.iterate({
      enter: (node) => {
        if (node.name && node.from !== node.to) {
          const value = input.slice(node.from, node.to);
          if (value.trim() && node.name !== 'Space') {
            tokens.push(`${node.name}:${value}`);
          }
        }
      },
    });

    console.log('Tokens for "A -..- B":', tokens);

    const hasArrowToken = tokens.some((token) => token.includes('Arrow') && token.includes('-..'));
    expect(hasArrowToken).toBe(true);
  });
});
