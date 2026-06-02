import type { LangiumParser } from 'langium';
import { describe, expect, it } from 'vitest';

import type {
  Railroad,
  RailroadChoiceExpr,
  RailroadSequenceExpr,
  RailroadSpecialExpr,
} from '../src/language/generated/ast.js';
import { createRailroadServices } from '../src/language/railroad/module.js';
import { MermaidParseError, parse as parseAsync } from '../src/parse.js';
import { expectNoErrorsOrAlternatives } from './test-util.js';

describe('Railroad parser', () => {
  const services = createRailroadServices().Railroad;
  const parser: LangiumParser = services.parser.LangiumParser;

  const parse = (input: string) => {
    return parser.parse<Railroad>(input);
  };

  it('should parse title and accessibility metadata', () => {
    const result = parse(`railroad-diagram
title Example Grammar
accTitle: Accessible Railroad
accDescr: Railroad description
rule = terminal("a") ;`);

    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe('Railroad');
    expect(result.value.title).toBe('Example Grammar');
    expect(result.value.accTitle).toBe('Accessible Railroad');
    expect(result.value.accDescr).toBe('Railroad description');
    expect(result.value.rules).toHaveLength(1);
  });

  it('should parse IR function expressions', () => {
    const result = parse(`railroad-diagram
rule = sequence(terminal("a"), nonterminal("b")) ;`);

    expectNoErrorsOrAlternatives(result);
    const def = result.value.rules[0].definition;
    expect(def.$type).toBe('RailroadSequenceExpr');
    if (def.$type === 'RailroadSequenceExpr') {
      const seq = def as RailroadSequenceExpr;
      expect(seq.elements).toHaveLength(2);
      expect(seq.elements[0].$type).toBe('RailroadTerminalExpr');
      expect(seq.elements[1].$type).toBe('RailroadNonTerminalExpr');
    }
  });

  it('should parse choice expressions', () => {
    const result = parse(`railroad-diagram
rule = choice(terminal("a"), terminal("b"), terminal("c")) ;`);

    expectNoErrorsOrAlternatives(result);
    const def = result.value.rules[0].definition;
    expect(def.$type).toBe('RailroadChoiceExpr');
    if (def.$type === 'RailroadChoiceExpr') {
      expect((def as RailroadChoiceExpr).alternatives).toHaveLength(3);
    }
  });

  it('should parse optional, oneOrMore, and zeroOrMore', () => {
    const result = parse(`railroad-diagram
r1 = optional(terminal("a")) ;
r2 = oneOrMore(terminal("b")) ;
r3 = zeroOrMore(terminal("c")) ;`);

    expectNoErrorsOrAlternatives(result);
    expect(result.value.rules).toHaveLength(3);
    expect(result.value.rules[0].definition.$type).toBe('RailroadOptionalExpr');
    expect(result.value.rules[1].definition.$type).toBe('RailroadOneOrMoreExpr');
    expect(result.value.rules[2].definition.$type).toBe('RailroadZeroOrMoreExpr');
  });

  it('should parse special expressions', () => {
    const result = parse(`railroad-diagram
rule = special("any character") ;`);

    expectNoErrorsOrAlternatives(result);
    const def = result.value.rules[0].definition;
    expect(def.$type).toBe('RailroadSpecialExpr');
    if (def.$type === 'RailroadSpecialExpr') {
      expect((def as RailroadSpecialExpr).text).toBe('any character');
    }
  });

  it('should skip C-style block comments', () => {
    const result = parse(`railroad-diagram
/* comment before the first rule */
rule = terminal("a") ;
next = nonterminal("rule") ;`);

    expectNoErrorsOrAlternatives(result);
    expect(result.value.rules).toHaveLength(2);
    expect(result.value.rules[0].name).toBe('rule');
    expect(result.value.rules[1].name).toBe('next');
  });

  it('should throw MermaidParseError for malformed input via parse()', async () => {
    await expect(
      parseAsync(
        'railroad',
        `railroad-diagram
rule = terminal("a")`
      )
    ).rejects.toBeInstanceOf(MermaidParseError);
  });
});
