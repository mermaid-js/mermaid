import { describe, expect, it } from 'vitest';
import { directiveRegex } from './regexes.js';
import {
  keepSuffix,
  remapParseErrorLines,
  removeMatches,
  toSourceLine,
  trackLines,
} from './sourceLines.js';

const commentLines = /^\s*%%(?!{)[^\n]+\n?/gm;

describe('trackLines', () => {
  it('maps every line to itself, including an empty last line', () => {
    expect(trackLines('a\nb\n').sourceLines).toEqual([1, 2, 3]);
  });
});

describe('removeMatches', () => {
  it.each([
    { case: 'comments', text: 'a\n%% x\n\n  %% y\nb\n%% z', pattern: commentLines },
    { case: 'a directive across lines', text: 'a %%{init:\n{}\n}%% b\nc', pattern: directiveRegex },
    { case: 'nothing to remove', text: 'a\nb', pattern: commentLines },
  ])('removes $case exactly like replace', ({ text, pattern }) => {
    expect(removeMatches(trackLines(text), pattern).text).toBe(text.replace(pattern, ''));
  });

  it('maps a line to the line its first kept character is on', () => {
    expect(removeMatches(trackLines('%% x\n%% y\nb\n%% z\nc'), commentLines).sourceLines).toEqual([
      3, 5,
    ]);
  });

  it('keeps the line a removal starts on when the removal ends mid-line', () => {
    const { text, sourceLines } = removeMatches(trackLines('a %%{x\n}%% b\nc'), directiveRegex);
    expect(text).toBe('a  b\nc');
    expect(sourceLines).toEqual([1, 3]);
  });

  it('maps an empty last line to the end of the text', () => {
    expect(removeMatches(trackLines('a\n%% x\n'), commentLines).sourceLines).toEqual([1, 3]);
    expect(removeMatches(trackLines('%% x\n'), commentLines).sourceLines).toEqual([2]);
  });

  it('maps through the source lines it is given', () => {
    const { sourceLines } = removeMatches(
      { text: 'a\n%% x\nb', sourceLines: [4, 5, 9] },
      commentLines
    );
    expect(sourceLines).toEqual([4, 9]);
  });

  it('starts at the beginning whatever lastIndex holds, like replace', () => {
    const pattern = /b/g;
    pattern.lastIndex = 2;
    expect(removeMatches(trackLines('bab'), pattern).text).toBe('a');
  });
});

describe('keepSuffix', () => {
  it('keeps the source lines of the lines left', () => {
    expect(keepSuffix(trackLines('\n\n  a\nb'), 'a\nb').sourceLines).toEqual([3, 4]);
  });
});

describe('toSourceLine', () => {
  it.each([
    { case: 'a mapped line', line: 2, expected: 5 },
    { case: 'a line past the last one', line: 4, expected: 7 },
    { case: 'a line before the first one', line: 0, expected: 0 },
  ])('maps $case', ({ line, expected }) => {
    expect(toSourceLine([3, 5], line)).toBe(expected);
  });

  it('leaves every line as it is without source lines', () => {
    expect(toSourceLine([], 3)).toBe(3);
  });
});

describe('remapParseErrorLines', () => {
  const sourceLines = [1, 4, 6];

  it('rewrites the message and the hash of a jison parse error', () => {
    const error = Object.assign(new Error('Parse error on line 2:\nx\n^\nExpecting a'), {
      hash: { line: 1, loc: { first_line: 2, last_line: 3, first_column: 7, last_column: 8 } },
    });
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe('Parse error on line 4:\nx\n^\nExpecting a');
    expect(error.hash).toEqual({
      line: 3,
      loc: { first_line: 4, last_line: 6, first_column: 7, last_column: 8 },
    });
  });

  it.each([
    { case: 'not read yet', readFirst: false },
    { case: 'read already', readFirst: true },
  ])('rewrites the stack once when it was $case', ({ readFirst }) => {
    const error = new Error('Parse error on line 2:');
    if (readFirst) {
      expect(error.stack).toContain('Parse error on line 2:');
    }
    remapParseErrorLines(error, sourceLines);
    expect(error.stack).toContain('Parse error on line 4:');
  });

  it('rewrites a jison lexical error, whose hash has no loc', () => {
    const error = Object.assign(new Error('Lexical error on line 2. Unrecognized text.'), {
      hash: { text: '', line: 1 },
    });
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe('Lexical error on line 4. Unrecognized text.');
    expect(error.hash).toEqual({ text: '', line: 3 });
  });

  it('rewrites every line of a Langium error', () => {
    const error = new Error(
      'Parsing failed: Lexer error on line 2, column 8: a Parse error on line 3, column 9: b'
    );
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe(
      'Parsing failed: Lexer error on line 4, column 8: a Parse error on line 6, column 9: b'
    );
  });

  it('leaves other line formats alone', () => {
    const message = 'Error lexing usecase diagram: x at line 2, column 3 [5,6) on line 2';
    const error = new Error(message);
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe(message);
  });

  it('leaves the hash alone when the message names no line of the parsed text', () => {
    const hash = { line: 2, loc: { first_line: 3, last_line: 3, first_column: 4, last_column: 5 } };
    const error = Object.assign(new Error('bad shape data (3:5)'), { hash: structuredClone(hash) });
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe('bad shape data (3:5)');
    expect(error.hash).toEqual(hash);
  });

  it('ignores a thrown value that is not an Error', () => {
    expect(() => remapParseErrorLines('Parse error on line 2', sourceLines)).not.toThrow();
  });
});
