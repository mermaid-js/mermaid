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
  ])('should keep the rule terminator with %s', (_, rules) => {
    const result = parser.parse<RailroadAbnf>(`railroad-abnf-beta\n${rules}`);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.rules.map((rule) => rule.name)).toEqual(['a', 'b']);
  });
});
