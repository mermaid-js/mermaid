import { describe, expect, it } from 'vitest';

import type { RailroadEbnf } from '../src/language/generated/ast.js';
import {
  parseRailroadEbnf,
  RailroadEbnfNotationError,
} from '../src/language/railroad-ebnf/index.js';
import { MermaidParseError, parse } from '../src/parse.js';

const W3C_EXAMPLE = 'railroad-ebnf-beta\nstandard w3c\nfoo = bar " "? baz " "? qux ;';

/** The base type of each term of the first rule, with its postfix operators. */
const terms = (ast: RailroadEbnf): string[] =>
  ast.rules[0].definition.alternatives[0].elements.map((term) =>
    [term.base.$type, ...term.postfixes.map((postfix) => postfix.$type)].join(' ')
  );

describe('parse("railroadEbnf") reads the notation the standard line names', () => {
  it('reads `?` as a postfix operator under standard w3c', async () => {
    const ast = await parse('railroadEbnf', W3C_EXAMPLE);
    expect(terms(ast)).toEqual([
      'EbnfNonTerminal',
      'EbnfTerminal EbnfOptionalPostfix',
      'EbnfNonTerminal',
      'EbnfTerminal EbnfOptionalPostfix',
      'EbnfNonTerminal',
    ]);
  });

  it('keeps reading `? ... ?` as a special sequence without a standard line', async () => {
    const ast = await parse('railroadEbnf', 'railroad-ebnf-beta\nfoo = bar " "? baz " "? qux ;');
    expect(terms(ast)).toEqual([
      'EbnfNonTerminal',
      'EbnfTerminal',
      'EbnfSpecial',
      'EbnfNonTerminal',
    ]);
  });

  it('refuses [ ... ] under standard w3c with its line and column', async () => {
    await expect(
      parse('railroadEbnf', 'railroad-ebnf-beta\nstandard w3c\nfoo = [ a ] ;')
    ).rejects.toThrow(
      /^Parsing failed: Parse error on line 3, column 7: the \[ \.{3} ] optional is not W3C notation/
    );
  });

  it('keeps accepting [ ... ] without a standard line', async () => {
    const ast = await parse('railroadEbnf', 'railroad-ebnf-beta\nfoo = [ a ] ;');
    expect(terms(ast)).toEqual(['EbnfOptional']);
  });

  it('refuses an unknown standard', async () => {
    await expect(
      parse('railroadEbnf', 'railroad-ebnf-beta\nstandard w4c\nfoo = a ;')
    ).rejects.toThrow(/line 2, column 1: unknown standard "w4c", expected one of: w3c, iso/);
  });

  it('refuses the postfix operators under standard iso', async () => {
    await expect(
      parse('railroadEbnf', 'railroad-ebnf-beta\nstandard iso\nfoo = a? ;')
    ).rejects.toThrow(/line 3, column 8: the postfix operator \?: use \[ \.{3} ]/);
  });

  it('reports a notation refusal as a RailroadEbnfNotationError with its line and column', () => {
    const refuse = () => parseRailroadEbnf('railroad-ebnf-beta\nstandard w3c\nfoo = [ a ], b ;');
    expect(refuse).toThrow(RailroadEbnfNotationError);
    try {
      refuse();
    } catch (error) {
      expect(error instanceof RailroadEbnfNotationError && error.diagnostics).toEqual([
        {
          line: 3,
          column: 12,
          message: 'the "," separator is not W3C notation, separate elements with whitespace',
        },
        {
          line: 3,
          column: 7,
          message: 'the [ ... ] optional is not W3C notation, use the postfix ?',
        },
      ]);
    }
  });

  it('keeps reporting a syntax error as a MermaidParseError', () => {
    expect(() => parseRailroadEbnf('railroad-ebnf-beta\nstandard w3c\nfoo = a')).toThrow(
      MermaidParseError
    );
  });

  it('joins several refusals into one message, one per line', () => {
    expect(() => parseRailroadEbnf('railroad-ebnf-beta\nstandard w3c\nfoo = [ a ], b ;')).toThrow(
      'Parsing failed: Parse error on line 3, column 12: the "," separator is not W3C notation, separate elements with whitespace\nParse error on line 3, column 7: the [ ... ] optional is not W3C notation, use the postfix ?'
    );
  });

  it('checks the operand of an exception too', () => {
    expect(() => parseRailroadEbnf('railroad-ebnf-beta\nstandard w3c\nfoo = a - [ b ] ;')).toThrow(
      /line 3, column 11: the \[ \.{3} ] optional is not W3C notation/
    );
  });

  it('reports a lexer error alone as a MermaidParseError', () => {
    expect(() => parseRailroadEbnf('railroad-ebnf-beta\nfoo = a # ;')).toThrow(MermaidParseError);
  });
});
