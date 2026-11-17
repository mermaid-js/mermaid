import { describe, expect, it } from 'vitest';
import { componentLexer } from './component.lexer.js';

function lex(input: string) {
  return componentLexer.tokenize(input);
}

function tokenImages(input: string): [string, string][] {
  const result = lex(input);
  expect(result.errors).toEqual([]);
  return result.tokens.map((token) => [token.tokenType.name, token.image]);
}

describe('component Chevrotain lexer', () => {
  it('prefers the longest relation operator at each position', () => {
    expect(tokenImages('a --() b --( c ..> d --> e -- f')).toEqual([
      ['IDENTIFIER', 'a'],
      ['PROVIDES_ARROW', '--()'],
      ['IDENTIFIER', 'b'],
      ['REQUIRES_ARROW', '--('],
      ['IDENTIFIER', 'c'],
      ['DEPENDENCY_ARROW', '..>'],
      ['IDENTIFIER', 'd'],
      ['ASSOCIATION_ARROW', '-->'],
      ['IDENTIFIER', 'e'],
      ['PLAIN_LINK', '--'],
      ['IDENTIFIER', 'f'],
    ]);
  });

  it('keeps keywords out of longer identifiers', () => {
    expect(tokenImages('component componentX interface port package')).toEqual([
      ['COMPONENT', 'component'],
      ['IDENTIFIER', 'componentX'],
      ['INTERFACE', 'interface'],
      ['PORT', 'port'],
      ['PACKAGE', 'package'],
    ]);
  });

  it('lexes a dotted port reference as one identifier', () => {
    expect(tokenImages('Payments.api')).toEqual([['IDENTIFIER', 'Payments.api']]);
  });

  it('lexes a bracketed quoted label', () => {
    expect(tokenImages('Web["Web shop"]')).toEqual([
      ['IDENTIFIER', 'Web'],
      ['LBRACKET', '['],
      ['QUOTED_STRING', '"Web shop"'],
      ['RBRACKET', ']'],
    ]);
  });

  it('lexes a stereotype', () => {
    expect(tokenImages('<<service>>')).toEqual([
      ['STEREOTYPE_START', '<<'],
      ['STEREOTYPE_TEXT', 'service'],
      ['STEREOTYPE_END', '>>'],
    ]);
  });

  it('lexes classDef/class/style/title/note/accTitle/accDescr as whole-line tokens', () => {
    expect(tokenImages('classDef hot fill:#f96,stroke:#333')).toEqual([
      ['CLASS_DEF_LINE', 'classDef hot fill:#f96,stroke:#333'],
    ]);
    expect(tokenImages('class Orders hot')).toEqual([['CLASS_LINE', 'class Orders hot']]);
    expect(tokenImages('style Web stroke:#333')).toEqual([['STYLE_LINE', 'style Web stroke:#333']]);
    expect(tokenImages('title My Diagram')).toEqual([['TITLE_LINE', 'title My Diagram']]);
    expect(tokenImages('note for Orders "handles checkout"')).toEqual([
      ['NOTE_LINE', 'note for Orders "handles checkout"'],
    ]);
    expect(tokenImages('accTitle: a title')).toEqual([['ACC_TITLE_LINE', 'accTitle: a title']]);
    expect(tokenImages('accDescr: a description')).toEqual([
      ['ACC_DESCR_LINE', 'accDescr: a description'],
    ]);
  });

  it('skips %% comments', () => {
    expect(tokenImages('component A %% trailing comment')).toEqual([
      ['COMPONENT', 'component'],
      ['IDENTIFIER', 'A'],
    ]);
  });

  it('lexes a relation label as a colon-prefixed rest-of-line token', () => {
    expect(tokenImages('A --> B : does a thing')).toEqual([
      ['IDENTIFIER', 'A'],
      ['ASSOCIATION_ARROW', '-->'],
      ['IDENTIFIER', 'B'],
      ['COLON_LABEL', ': does a thing'],
    ]);
  });
});
