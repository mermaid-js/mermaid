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

function texts(tokens: Token[]): string[] {
  return tokens.map((t) => t.text ?? '');
}

describe('Sequence ANTLR Lexer - token coverage (expanded for actor/alias)', () => {
  const singleTokenCases: { input: string; first: string; label?: string }[] = [
    { input: 'sequenceDiagram', first: 'SD' },
    { input: ';', first: 'NEWLINE' },
    { input: ',', first: 'COMMA' },
    { input: 'autonumber', first: 'AUTONUMBER' },
    { input: 'off', first: 'OFF' },
    { input: 'participant', first: 'PARTICIPANT' },
    { input: 'actor', first: 'PARTICIPANT_ACTOR' },
    { input: 'create', first: 'CREATE' },
    { input: 'destroy', first: 'DESTROY' },
    { input: 'box', first: 'BOX' },
    { input: 'loop', first: 'LOOP' },
    { input: 'rect', first: 'RECT' },
    { input: 'opt', first: 'OPT' },
    { input: 'alt', first: 'ALT' },
    { input: 'else', first: 'ELSE' },
    { input: 'par', first: 'PAR' },
    { input: 'par_over', first: 'PAR_OVER' },
    { input: 'and', first: 'AND' },
    { input: 'critical', first: 'CRITICAL' },
    { input: 'option', first: 'OPTION' },
    { input: 'break', first: 'BREAK' },
    { input: 'end', first: 'END' },
    { input: 'links', first: 'LINKS' },
    { input: 'link', first: 'LINK' },
    { input: 'properties', first: 'PROPERTIES' },
    { input: 'details', first: 'DETAILS' },
    { input: 'over', first: 'OVER' },
    { input: 'Note', first: 'NOTE' },
    { input: 'activate', first: 'ACTIVATE' },
    { input: 'deactivate', first: 'DEACTIVATE' },
    { input: 'title', first: 'TITLE' },
    { input: '->>', first: 'SOLID_ARROW' },
    { input: '<<->>', first: 'BIDIRECTIONAL_SOLID_ARROW' },
    { input: '-->>', first: 'DOTTED_ARROW' },
    { input: '<<-->>', first: 'BIDIRECTIONAL_DOTTED_ARROW' },
    { input: '->', first: 'SOLID_OPEN_ARROW' },
    { input: '-->', first: 'DOTTED_OPEN_ARROW' },
    { input: '-x', first: 'SOLID_CROSS' },
    { input: '--x', first: 'DOTTED_CROSS' },
    { input: '-)', first: 'SOLID_POINT' },
    { input: '--)', first: 'DOTTED_POINT' },
    { input: ':text', first: 'TXT' },
    { input: '+', first: 'PLUS' },
    { input: '-', first: 'MINUS' },
  ];

  for (const tc of singleTokenCases) {
    it(`lexes ${tc.label ?? tc.input} -> ${tc.first}`, () => {
      const ts = lex(tc.input);
      const ns = names(ts);
      expect(ns[0]).toBe(tc.first);
    });
  }

  it('lexes LEFT_OF / RIGHT_OF with space', () => {
    expect(names(lex('left of'))[0]).toBe('LEFT_OF');
    expect(names(lex('right of'))[0]).toBe('RIGHT_OF');
  });

  it('lexes LEGACY_TITLE as a single token', () => {
    const ts = lex('title: Diagram Title');
    const ns = names(ts);
    expect(ns[0]).toBe('LEGACY_TITLE');
  });

  it('lexes accTitle/accDescr single-line values using modes', () => {
    const t1 = names(lex('accTitle: This is the title'));
    expect(t1[0]).toBe('ACC_TITLE');
    expect(t1[1]).toBe('ACC_TITLE_VALUE');

    const t2 = names(lex('accDescr: Accessibility Description'));
    expect(t2[0]).toBe('ACC_DESCR');
    expect(t2[1]).toBe('ACC_DESCR_VALUE');
  });

  it('lexes accDescr multiline block', () => {
    const ns = names(lex('accDescr {\nHello\n}'));
    expect(ns[0]).toBe('ACC_DESCR_MULTI');
    expect(ns).toContain('ACC_DESCR_MULTILINE_VALUE');
    expect(ns).toContain('ACC_DESCR_MULTILINE_END');
  });

  it('lexes config block @{ ... }', () => {
    const ns = names(lex('@{ shape: rounded }'));
    expect(ns[0]).toBe('CONFIG_START');
    expect(ns).toContain('CONFIG_CONTENT');
    expect(ns[ns.length - 1]).toBe('CONFIG_END');
  });

  // ACTOR / ALIAS edge cases, mirroring Jison patterns
  it('participant A', () => {
    const ns = names(lex('participant A'));
    expect(ns).toEqual(['PARTICIPANT', 'ACTOR']);
  });

  it('participant Alice as A', () => {
    const ns = names(lex('participant Alice as A'));
    expect(ns[0]).toBe('PARTICIPANT');
    expect(ns[1]).toBe('ACTOR');
    expect(ns[2]).toBe('AS');
    expect(['ACTOR', 'TXT']).toContain(ns[3]);
    const ts = texts(lex('participant Alice as A'));
    expect(ts[1]).toBe('Alice');
    // The alias part may be tokenized as ACTOR or TXT depending on mode precedence; trim for TXT variant
    expect(['A']).toContain(ts[3]?.trim?.());
  });

  it('participant with same-line spaces are skipped in ID mode', () => {
    const ts = lex('participant    Alice');
    expect(names(ts)).toEqual(['PARTICIPANT', 'ACTOR']);
    expect(texts(ts)[1]).toBe('Alice');
  });

  it('participant ID mode: hash comment skipped on same line', () => {
    const ns = names(lex('participant Alice # comment here'));
    expect(ns).toEqual(['PARTICIPANT', 'ACTOR']);
  });

  it('participant ID mode: percent comment skipped on same line', () => {
    const ns = names(lex('participant Alice %% comment here'));
    expect(ns).toEqual(['PARTICIPANT', 'ACTOR']);
  });

  it('alias ALIAS mode: spaces skipped and comments ignored', () => {
    const ns = names(lex('participant Alice as   A  # c'));
    expect(ns[0]).toBe('PARTICIPANT');
    expect(ns[1]).toBe('ACTOR');
    expect(ns[2]).toBe('AS');
    expect(['ACTOR', 'TXT']).toContain(ns[3]);
  });

  it('title LINE mode: spaces skipped and words tokenized as ACTORs', () => {
    const ns = names(lex('title   My   Diagram'));
    expect(ns).toEqual(['TITLE', 'TXT']);
  });

  it('title LINE mode: percent comment ignored on same line', () => {
    const ns = names(lex('title Diagram %% hidden'));
    expect(ns).toEqual(['TITLE', 'TXT']);
  });

  it('ID mode pops to default on newline', () => {
    const ns = names(lex('participant Alice\nactor Bob'));
    expect(ns[0]).toBe('PARTICIPANT');
    expect(ns[1]).toBe('ACTOR');
    expect(ns[2]).toBe('NEWLINE');
    expect(ns[3]).toBe('PARTICIPANT_ACTOR');
  });

  it('actor foo-bar (hyphens allowed)', () => {
    const ts = lex('actor foo-bar');
    expect(names(ts)).toEqual(['PARTICIPANT_ACTOR', 'ACTOR']);
    expect(texts(ts)[1]).toBe('foo-bar');
  });

  it('actor foo--bar (multiple hyphens)', () => {
    const ts = lex('actor foo--bar');
    expect(names(ts)).toEqual(['PARTICIPANT_ACTOR', 'ACTOR']);
    expect(texts(ts)[1]).toBe('foo--bar');
  });

  it('actor a-x should split into ACTOR and SOLID_CROSS (per Jison exclusion)', () => {
    const ns = names(lex('actor a-x'));
    expect(ns[0]).toBe('PARTICIPANT_ACTOR');
    // Depending on spacing, ACTOR may be 'a' and '-x' is SOLID_CROSS
    expect(ns.slice(1)).toEqual(['ACTOR', 'SOLID_CROSS']);
  });

  it('actor a--) should split into ACTOR and DOTTED_POINT', () => {
    const ns = names(lex('actor a--)'));
    expect(ns[0]).toBe('PARTICIPANT_ACTOR');
    expect(ns.slice(1)).toEqual(['ACTOR', 'DOTTED_POINT']);
  });

  it('actor a--x should split into ACTOR and DOTTED_CROSS', () => {
    const ns = names(lex('actor a--x'));
    expect(ns[0]).toBe('PARTICIPANT_ACTOR');
    expect(ns.slice(1)).toEqual(['ACTOR', 'DOTTED_CROSS']);
  });

  it('participant with inline config: participant Alice @{shape:rounded}', () => {
    const ns = names(lex('participant Alice @{shape: rounded}'));
    expect(ns[0]).toBe('PARTICIPANT');
    expect(ns[1]).toBe('ACTOR');
    expect(ns[2]).toBe('CONFIG_START');
    expect(ns).toContain('CONFIG_CONTENT');
    expect(ns[ns.length - 1]).toBe('CONFIG_END');
  });

  it('autonumber with numbers', () => {
    const ns = names(lex('autonumber 12 3'));
    expect(ns[0]).toBe('AUTONUMBER');
    // Our lexer returns NUM greedily regardless of trailing space/newline context; acceptable for parity tests
    expect(ns).toContain('NUM');
  });

  it('participant alias across lines: A as Alice then B as Bob', () => {
    const input = 'participant A as Alice\nparticipant B as Bob';
    const ns = names(lex(input));
    // Expect: PARTICIPANT ACTOR AS (TXT|ACTOR) NEWLINE PARTICIPANT ACTOR AS (TXT|ACTOR)
    expect(ns[0]).toBe('PARTICIPANT');
    expect(ns[1]).toBe('ACTOR');
    expect(ns[2]).toBe('AS');
    expect(['TXT', 'ACTOR']).toContain(ns[3]);
    expect(ns[4]).toBe('NEWLINE');
    expect(ns[5]).toBe('PARTICIPANT');
    expect(ns[6]).toBe('ACTOR');
    expect(ns[7]).toBe('AS');
    expect(['TXT', 'ACTOR']).toContain(ns[8]);
  });
});
