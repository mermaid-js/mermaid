import type { LangiumParser } from 'langium';
import { describe, expect, it } from 'vitest';

import type { Railroad } from '../src/language/generated/ast.js';
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
rule = "a" ;`);

    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe('Railroad');
    expect(result.value.title).toBe('Example Grammar');
    expect(result.value.accTitle).toBe('Accessible Railroad');
    expect(result.value.accDescr).toBe('Railroad description');
    expect(result.value.rules).toHaveLength(1);
  });

  it('should parse grouped choices with postfix operators', () => {
    const result = parse(`railroad-diagram
rule = ( "a" | "b" )+ ;`);

    expectNoErrorsOrAlternatives(result);
    const term = result.value.rules[0].definition.alternatives[0].elements[0];
    expect(term.base.$type).toBe('RailroadGroup');
    expect(term.postfixes[0].$type).toBe('RailroadOneOrMorePostfix');
  });

  it('should parse special sequences with spaced question-mark delimiters', () => {
    const result = parse(`railroad-diagram
rule = ? special ? ;`);

    expectNoErrorsOrAlternatives(result);
    const term = result.value.rules[0].definition.alternatives[0].elements[0];
    expect(term.base.$type).toBe('RailroadSpecial');
    if (term.base.$type === 'RailroadSpecial') {
      expect(term.base.text).toBe('special');
    }
  });

  it('should parse exception postfixes and BNF rule definitions', () => {
    const result = parse(`railroad-diagram
letter ::= consonant - vowel ;`);

    expectNoErrorsOrAlternatives(result);
    const term = result.value.rules[0].definition.alternatives[0].elements[0];
    expect(term.base.$type).toBe('RailroadNonTerminal');
    expect(term.postfixes[0].$type).toBe('RailroadExceptionPostfix');
    if (term.postfixes[0].$type === 'RailroadExceptionPostfix') {
      expect(term.postfixes[0].except.$type).toBe('RailroadNonTerminal');
    }
  });

  it('should skip C-style and ISO comments', () => {
    const result = parse(`railroad-diagram
/* comment before the first rule */
rule = (* inline comment *) "a" ;
next = rule ;`);

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
rule = "a"`
      )
    ).rejects.toBeInstanceOf(MermaidParseError);
  });
});
