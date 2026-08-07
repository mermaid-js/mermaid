import { describe, expect, it } from 'vitest';
import { usecaseLexer } from './usecase.lexer.js';

function lex(input: string) {
  return usecaseLexer.tokenize(input);
}

function tokenImages(input: string): [string, string][] {
  const result = lex(input);
  expect(result.errors).toEqual([]);
  return result.tokens.map((token) => [token.tokenType.name, token.image]);
}

describe('usecase Chevrotain lexer', () => {
  it('uses longest operator and delimiter precedence', () => {
    expect(tokenImages('--|> ..> <<Human>> ::: ---> <--- --o o-- --x x-- --')).toEqual([
      ['GENERALIZATION', '--|>'],
      ['DEPENDENCY_ARROW', '..>'],
      ['STEREOTYPE_START', '<<'],
      ['STEREOTYPE_TEXT', 'Human'],
      ['STEREOTYPE_END', '>>'],
      ['CLASS_SEPARATOR', ':::'],
      ['FORWARD_SOLID', '--->'],
      ['BACKWARD_SOLID', '<---'],
      ['FORWARD_CIRCLE', '--o'],
      ['BACKWARD_CIRCLE', 'o--'],
      ['FORWARD_CROSS', '--x'],
      ['BACKWARD_CROSS', 'x--'],
      ['MARKERLESS_SOLID', '--'],
    ]);
  });

  it('keeps exact keywords out of longer identifiers and matches semantic words case-insensitively', () => {
    expect(
      tokenImages('actor actorName include INCLUDE Include included extend EXTEND extended')
    ).toEqual([
      ['ACTOR', 'actor'],
      ['IDENTIFIER', 'actorName'],
      ['INCLUDE', 'include'],
      ['INCLUDE', 'INCLUDE'],
      ['INCLUDE', 'Include'],
      ['IDENTIFIER', 'included'],
      ['EXTEND', 'extend'],
      ['EXTEND', 'EXTEND'],
      ['IDENTIFIER', 'extended'],
    ]);
  });

  it.each([
    ['line feed', '\n'],
    ['carriage return and line feed', '\r\n'],
    ['carriage return', '\r'],
  ])('emits one token per physical newline for %s', (_name, newline) => {
    const tokens = lex(`${newline}${newline}`).tokens;
    expect(tokens).toHaveLength(2);
    expect(tokens.every((token) => token.tokenType.name === 'NEWLINE')).toBe(true);
  });

  it('preserves multiline Markdown and treats comment lookalikes inside it as data', () => {
    expect(tokenImages('"`first\n%% still markdown\nlast`"')).toEqual([
      ['MARKDOWN_STRING', '"`first\n%% still markdown\nlast`"'],
    ]);
  });

  it('emits indented whole-line comments but not percent pairs after another token', () => {
    expect(tokenImages('  %% comment\n')).toEqual([
      ['COMMENT', '%% comment'],
      ['NEWLINE', '\n'],
    ]);
    const inline = lex('A %% data');
    expect(inline.tokens.map((token) => token.tokenType.name)).toEqual([
      'IDENTIFIER',
      'PERCENT',
      'PERCENT',
      'IDENTIFIER',
    ]);
  });

  it('balances nested JSON while ignoring escaped quotes and braces in strings', () => {
    const source = 'json Payload@{\n  "text": "} \\" {",\n  "nested": {"items": [1, 2]}\n}:::data';
    const result = lex(source);
    expect(result.errors).toEqual([]);
    expect(result.tokens.map((token) => token.tokenType.name)).toEqual([
      'JSON_DECLARATION_START',
      'JSON_OBJECT_LITERAL',
      'CLASS_SEPARATOR',
      'IDENTIFIER',
    ]);
    expect(result.tokens[1]).toMatchObject({ startLine: 1, startColumn: 14, endLine: 4 });
  });

  it('reports an unclosed JSON object at its opening brace', () => {
    const result = lex('json Payload@{\n  "nested": {}');
    expect(result.errors[0]).toMatchObject({ line: 1, column: 14, offset: 13 });
  });

  it('preserves strict strings, colors, CSS units, and escaped commas', () => {
    expect(tokenImages('"%%" \'plain\' #f96 4px 50% red\\,blue')).toEqual([
      ['PLAIN_STRING', '"%%"'],
      ['PLAIN_STRING', "'plain'"],
      ['HASH_COLOR', '#f96'],
      ['NUMBER', '4px'],
      ['NUMBER', '50'],
      ['PERCENT', '%'],
      ['IDENTIFIER', 'red'],
      ['CSS_ESCAPED_COMMA', '\\,'],
      ['IDENTIFIER', 'blue'],
    ]);
  });
});
