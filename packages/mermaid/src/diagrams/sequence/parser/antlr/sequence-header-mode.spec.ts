import { describe, it, expect } from 'vitest';
import type { Token } from 'antlr4ng';
import { CharStream } from 'antlr4ng';
import { SequenceLexer } from './generated/SequenceLexer.js';

function lex(input: string): Token[] {
  const inputStream = CharStream.fromString(input);
  const lexer = new SequenceLexer(inputStream);
  return lexer.getAllTokens();
}

function names(tokens: Token[]): string[] {
  const vocab =
    (SequenceLexer as any).VOCABULARY ?? new SequenceLexer(CharStream.fromString('')).vocabulary;
  return tokens.map((t) => vocab.getSymbolicName(t.type) ?? String(t.type));
}

describe('Sequence ANTLR Lexer - headerMode (before sequenceDiagram)', () => {
  it('skips YAML front matter before header', () => {
    const input =
      `---\n` +
      `title: Front matter title\n` +
      `config:\n` +
      `  theme: base\n` +
      `---\n` +
      `sequenceDiagram\n` +
      `Alice->Bob: Hello`;
    const ns = names(lex(input));
    expect(ns[0]).toBe('FRONTMATTER');
    const i = ns.indexOf('SD');
    expect(i).toBe(1);
    expect(ns.slice(i, i + 6)).toEqual([
      'SD',
      'NEWLINE',
      'ACTOR',
      'SOLID_OPEN_ARROW',
      'ACTOR',
      'TXT',
    ]);
  });

  it('accepts header comments and blank lines before header', () => {
    const input =
      `# hash comment\n` +
      `\n` +
      `%% percent comment\n` +
      `\n` +
      `sequenceDiagram\n` +
      `Alice-->>Bob: Yo`;
    const ns = names(lex(input));
    const i = ns.indexOf('SD');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(ns).toContain('DOTTED_ARROW');
  });

  it('skips single-line init directive before header', () => {
    const input =
      `%%{init: { "sequence": { "mirrorActors": false }}}%%\n` +
      `sequenceDiagram\n` +
      `Alice->Bob: Hello`;
    const ns = names(lex(input));
    const i = ns.indexOf('SD');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(ns.slice(i, i + 6)).toEqual([
      'SD',
      'NEWLINE',
      'ACTOR',
      'SOLID_OPEN_ARROW',
      'ACTOR',
      'TXT',
    ]);
  });

  it('skips multi-line init directive before header', () => {
    const input =
      `%%{\n` +
      `  init: {\n` +
      `    "theme": "dark",\n` +
      `    "sequence": { "mirrorActors": true }\n` +
      `  }\n` +
      `}%%\n` +
      `sequenceDiagram\n` +
      `A-->>B: Ping`;
    const ns = names(lex(input));
    const i = ns.indexOf('SD');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(ns).toContain('DOTTED_ARROW');
  });

  it('supports initialize alias in header directive', () => {
    const input =
      `%%{initialize: { "sequence": { "mirrorActors": true }}}%%\n` +
      `sequenceDiagram\n` +
      `A->B: Ping`;
    const ns = names(lex(input));
    const i = ns.indexOf('SD');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(ns.slice(i + 1, i + 6)).toEqual([
      'NEWLINE',
      'ACTOR',
      'SOLID_OPEN_ARROW',
      'ACTOR',
      'TXT',
    ]);
  });
});
