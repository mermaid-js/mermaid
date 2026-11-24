import { describe, expect, it } from 'vitest';

import type { RailroadAbnf } from '../src/language/generated/ast.js';
import { createRailroadAbnfServices } from '../src/language/railroad-abnf/module.js';
import { expectNoErrorsOrAlternatives } from './test-util.js';

describe('Railroad ABNF parser', () => {
  const parser = createRailroadAbnfServices().RailroadAbnf.parser.LangiumParser;

  it.each([
    ['trailing whitespace', 'a = "x" ; \nb = "y" ;'],
    ['a comment after the terminator', 'a = "x" ; ; comment\nb = "y" ;'],
    ['two rules on one line', 'a = "x" ; b = "y" ;'],
    ['comment lines', '; a = "z" ;\na = "x" ;\n;; b = "z" ;\nb = "y" ;'],
    ['a comment inside a rule', 'a = "x" ; first\n  / "z" ;\nb = "y" ;'],
    ['the terminator on its own line', 'a = "x"\n  ; \nb = "y" ;'],
    ['a comment after a terminator on its own line', 'a = "x"\n  ; ; comment\nb = "y" ;'],
  ])('should keep the rule terminator with %s', (_, rules) => {
    const result = parser.parse<RailroadAbnf>(`railroad-abnf-beta\n${rules}`);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.rules.map((rule) => rule.name)).toEqual(['a', 'b']);
  });

  it.each([';', ';;'])('should keep a %s commented-out definition inside a rule', (prefix) => {
    const result = parser.parse<RailroadAbnf>(
      `railroad-abnf-beta\na = "x"\n  ${prefix} disabled = "z"\n  / "y" ;\nb = "b" ;`
    );
    expectNoErrorsOrAlternatives(result);
    expect(result.value.rules.map((rule) => rule.name)).toEqual(['a', 'b']);
    expect(result.value.rules[0].definition.alternatives).toHaveLength(2);
  });
});
