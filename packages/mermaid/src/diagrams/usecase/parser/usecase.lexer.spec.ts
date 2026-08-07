import { describe, expect, it } from 'vitest';
import { usecaseLexer } from './usecase.lexer.js';

interface ComparableToken {
  name: string;
  image: string;
}

function tokenize(input: string): ComparableToken[] {
  const result = usecaseLexer.tokenize(input);
  expect(result.errors).toEqual([]);
  return result.tokens.map((token) => ({
    name: token.tokenType.name,
    image: token.image,
  }));
}

describe('usecase Chevrotain lexer', () => {
  it('tokenizes every relationship operator before its shorter alternatives', () => {
    expect(tokenize('--> <-- --o o-- --x x-- -- -')).toEqual([
      { name: 'SOLID_ARROW', image: '-->' },
      { name: 'BACK_ARROW', image: '<--' },
      { name: 'CIRCLE_ARROW', image: '--o' },
      { name: 'CIRCLE_ARROW_REVERSED', image: 'o--' },
      { name: 'CROSS_ARROW', image: '--x' },
      { name: 'CROSS_ARROW_REVERSED', image: 'x--' },
      { name: 'LINE_SOLID', image: '--' },
      { name: 'DASH', image: '-' },
    ]);
  });

  it('keeps keywords inside longer identifiers as identifiers', () => {
    expect(
      tokenize('actor actorName systemBoundary systemBoundaryName classDef classDefName')
    ).toEqual([
      { name: 'ACTOR', image: 'actor' },
      { name: 'IDENTIFIER', image: 'actorName' },
      { name: 'SYSTEM_BOUNDARY', image: 'systemBoundary' },
      { name: 'IDENTIFIER', image: 'systemBoundaryName' },
      { name: 'CLASS_DEF', image: 'classDef' },
      { name: 'IDENTIFIER', image: 'classDefName' },
    ]);
  });

  it('tokenizes metadata, class, and style values', () => {
    expect(tokenize('User@{ "type": "primary" } Login:::important fill:#f96 4px 2.5 50%')).toEqual([
      { name: 'IDENTIFIER', image: 'User' },
      { name: 'AT', image: '@' },
      { name: 'LBRACE', image: '{' },
      { name: 'STRING', image: '"type"' },
      { name: 'COLON', image: ':' },
      { name: 'STRING', image: '"primary"' },
      { name: 'RBRACE', image: '}' },
      { name: 'IDENTIFIER', image: 'Login' },
      { name: 'CLASS_SEPARATOR', image: ':::' },
      { name: 'IDENTIFIER', image: 'important' },
      { name: 'IDENTIFIER', image: 'fill' },
      { name: 'COLON', image: ':' },
      { name: 'HASH_COLOR', image: '#f96' },
      { name: 'NUMBER', image: '4px' },
      { name: 'NUMBER', image: '2.5' },
      { name: 'NUMBER', image: '50' },
      { name: 'PERCENT', image: '%' },
    ]);
  });
});
