import { describe, it, expect } from 'vitest';
import type { Token } from 'antlr4ng';
import { CharStream } from 'antlr4ng';
import { SequenceLexer } from './generated/SequenceLexer.js';

function lex(input: string): Token[] {
  const inputStream = CharStream.fromString(input);
  const lexer = new SequenceLexer(inputStream);
  const tokens: Token[] = lexer.getAllTokens();
  return tokens;
}

function tokenNames(tokens: Token[], vocabSource?: SequenceLexer): string[] {
  // Map type numbers to symbolic names using the lexer's vocabulary
  const vocab =
    (SequenceLexer as any).VOCABULARY ??
    (vocabSource ?? new SequenceLexer(CharStream.fromString(''))).vocabulary;
  return tokens.map((t) => vocab.getSymbolicName(t.type) ?? String(t.type));
}

describe('Sequence ANTLR Lexer', () => {
  it('lexes title without colon into TITLE followed by ACTOR tokens', () => {
    const input = `sequenceDiagram\n` + `title Diagram Title\n` + `Alice->Bob:Hello`;

    const tokens = lex(input);
    const names = tokenNames(tokens);

    // Expect the start: SD NEWLINE TITLE TXT NEWLINE
    expect(names.slice(0, 5)).toEqual(['SD', 'NEWLINE', 'TITLE', 'TXT', 'NEWLINE']);
  });

  it('lexes activate statement', () => {
    const input = `sequenceDiagram\nactivate Alice\n`;
    const tokens = lex(input);
    const names = tokenNames(tokens);

    // Expect: SD NEWLINE ACTIVATE ACTOR NEWLINE
    expect(names).toEqual(['SD', 'NEWLINE', 'ACTIVATE', 'ACTOR', 'NEWLINE']);
  });
});
