import { CstParser, createToken, Lexer } from 'chevrotain';
import type { CstNode } from 'chevrotain';
import { describe, expect, it, vi } from 'vitest';
import { isKnownLocation, runChevrotainParse } from './runChevrotainParse.js';

const Text = createToken({ name: 'Text', pattern: /[a-z]+/ });
const lexer = new Lexer([Text]);

class TestParser extends CstParser {
  public start = this.RULE('start', () => this.CONSUME(Text));

  constructor() {
    super([Text], { recoveryEnabled: false });
    this.performSelfAnalysis();
  }
}

const parser = new TestParser();

const parse = (input: string, lineOffset?: number) => {
  const visit = vi.fn<(cst: CstNode) => void>();
  runChevrotainParse(
    {
      diagramType: 'test',
      lineOffset,
      lexer,
      parser,
      entry: () => parser.start(),
      visit,
    },
    input
  );
  return visit;
};

describe('runChevrotainParse', () => {
  it('tokenizes, parses and visits the CST', () => {
    const visit = parse('chart');

    expect(visit).toHaveBeenCalledOnce();
    expect(visit.mock.calls[0][0].name).toBe('start');
  });

  it('reports lexer positions with the original source line offset', () => {
    expect(() => parse('chart@', 3)).toThrow(/at line 4, column 6 \[5,6\)/);
  });

  it('defaults the lexer position offset to zero', () => {
    expect(() => parse('@')).toThrow(/at line 1, column 1 \[0,1\)/);
  });

  it('reports parser errors before visiting the CST', () => {
    expect(() => parse('')).toThrow(/Error parsing test diagram:/);
  });
});

describe('isKnownLocation', () => {
  it.each([
    [undefined, false],
    [-1, false],
    [Number.NaN, false],
    [0, true],
    [1, true],
  ])('returns %s for location %s', (value, expected) => {
    expect(isKnownLocation(value)).toBe(expected);
  });
});
