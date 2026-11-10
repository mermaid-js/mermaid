import { describe, expect, it } from 'vitest';
import { directiveRegex } from './regexes.js';
import {
  keepSuffix,
  remapParseErrorLines,
  removeMatches,
  sourceLineMap,
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

  it('joins a line where it goes on with text from a later source line', () => {
    const { text, sourceLines, joins } = removeMatches(
      trackLines('a %%{x\ny\n}%%b c\nd'),
      directiveRegex
    );
    expect(text).toBe('a b c\nd');
    expect(sourceLines).toEqual([1, 4]);
    expect(joins).toEqual([{ line: 1, column: 3, sourceLine: 3 }]);
  });

  it.each([
    { case: 'a removal within one line', text: 'a %%{x}%%b\nc', pattern: directiveRegex },
    { case: 'a line break alone', text: 'a\n\nb', pattern: /\n(?=\n)/g },
    { case: 'a removal that starts a line', text: 'a\n%%{x\n}%%b', pattern: directiveRegex },
  ])('joins no line after $case', ({ text, pattern }) => {
    expect(removeMatches(trackLines(text), pattern).joins).toEqual([]);
  });

  it('stays quick through a text with many joins', () => {
    const RESPONSIVE_MS = 1000;
    const JOINED = 40_000;
    const joined = removeMatches(trackLines(`pie\n${'a%%{x\n}%%'.repeat(JOINED)}`), directiveRegex);
    const started = performance.now();
    const { joins } = removeMatches(joined, commentLines);
    expect(performance.now() - started).toBeLessThan(RESPONSIVE_MS);
    expect(joins).toHaveLength(JOINED - 1);
  });

  it('moves the joins it is given with the lines removed before them', () => {
    const { joins } = removeMatches(
      removeMatches(trackLines('%% x\na %%{x\n}%%b'), directiveRegex),
      commentLines
    );
    expect(joins).toEqual([{ line: 1, column: 3, sourceLine: 3 }]);
  });

  it.each([
    {
      case: 'within a line',
      text: 'a %%{x\n}%%b c',
      pattern: / (?=b)/g,
      expected: { text: 'ab c', joins: [{ line: 1, column: 2, sourceLine: 2 }] },
    },
    {
      case: 'across lines',
      text: 'q\naaa %%{x\n}%%bbb %%{x\n}%%c',
      pattern: /\naaa /g,
      expected: {
        text: 'qbbb c',
        joins: [
          { line: 1, column: 2, sourceLine: 3 },
          { line: 1, column: 6, sourceLine: 4 },
        ],
      },
    },
    {
      case: 'that ends past a join',
      text: 'a %%{x\n}%%b\nc %%{x\n}%%d',
      pattern: / b\n/g,
      expected: {
        text: 'ac d',
        joins: [
          { line: 1, column: 2, sourceLine: 3 },
          { line: 1, column: 4, sourceLine: 4 },
        ],
      },
    },
  ])('keeps the joins it is given after a removal $case', ({ text, pattern, expected }) => {
    const joined = removeMatches(trackLines(text), directiveRegex);
    expect(removeMatches(joined, pattern)).toMatchObject(expected);
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

describe('keepSuffix', () => {
  it('moves a join of the first line left by what it cuts', () => {
    const joined = removeMatches(trackLines('  a %%{x\n}%%b'), directiveRegex);
    expect(keepSuffix(joined, 'a b').joins).toEqual([{ line: 1, column: 3, sourceLine: 2 }]);
  });
});

describe('toSourceLine', () => {
  const joins = [{ line: 1, column: 3, sourceLine: 7 }];

  it.each([
    { case: 'a column left of the join', column: 2, expected: 3 },
    { case: 'the column of the join', column: 3, expected: 7 },
    { case: 'a column right of the join', column: 9, expected: 7 },
    { case: 'no column', column: undefined, expected: 3 },
  ])('maps a joined line by $case', ({ column, expected }) => {
    expect(toSourceLine([3, 5], 1, column, joins)).toBe(expected);
  });

  it.each([
    { column: 1, expected: 3 },
    { column: 2, expected: 6 },
    { column: 4, expected: 6 },
    { column: 5, expected: 7 },
    { column: 7, expected: 8 },
    { column: 99, expected: 8 },
  ])('maps column $column of a line with three joins to line $expected', ({ column, expected }) => {
    const threeJoins = [
      { line: 1, column: 2, sourceLine: 6 },
      { line: 1, column: 5, sourceLine: 7 },
      { line: 1, column: 7, sourceLine: 8 },
      { line: 2, column: 3, sourceLine: 9 },
    ];
    expect(sourceLineMap([3, 5], threeJoins)(1, column)).toBe(expected);
  });

  it('maps a line without a join by its start', () => {
    expect(toSourceLine([3, 5], 2, 9, joins)).toBe(5);
  });

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

  /** A Langium error as `MermaidParseError` builds it from its parse result. */
  const langiumError = (
    lexerErrors: { line: number; column: number; message: string }[],
    parserErrors: { line: number; column: number; message: string }[]
  ) => {
    const lexer = lexerErrors.map(
      ({ line, column, message }) => `Lexer error on line ${line}, column ${column}: ${message}`
    );
    const parser = parserErrors.map(
      ({ line, column, message }) => `Parse error on line ${line}, column ${column}: ${message}`
    );
    return Object.assign(new Error(`Parsing failed: ${lexer.join('\n')} ${parser.join('\n')}`), {
      result: {
        lexerErrors,
        parserErrors: parserErrors.map(({ line, column, message }) => ({
          token: { startLine: line, startColumn: column },
          message,
        })),
      },
    });
  };

  it('rewrites every line of a Langium error', () => {
    const error = langiumError(
      [{ line: 2, column: 8, message: 'a' }],
      [{ line: 3, column: 9, message: 'b' }]
    );
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe(
      'Parsing failed: Lexer error on line 4, column 8: a Parse error on line 6, column 9: b'
    );
  });

  it('leaves a Langium error message that quotes a header from the diagram', () => {
    const quoted = 'found `"Parse error on line 3, column 1: b"`';
    const error = langiumError(
      [],
      [
        { line: 2, column: 8, message: quoted },
        { line: 3, column: 1, message: 'b' },
      ]
    );
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe(
      `Parsing failed:  Parse error on line 4, column 8: ${quoted}\nParse error on line 6, column 1: b`
    );
  });

  it.each([
    {
      case: 'another line',
      message: 'Parsing failed: Lexer error on line 2, column 8: a ',
      result: { lexerErrors: [{ line: 3, column: 8, message: 'a' }], parserErrors: [] },
    },
    {
      case: 'a lexer error as a parse error',
      message: 'Parsing failed: Parse error on line 2, column 8: a ',
      result: { lexerErrors: [{ line: 2, column: 8, message: 'a' }], parserErrors: [] },
    },
    {
      case: 'a parse error as a lexer error',
      message: 'Parsing failed:  Lexer error on line 2, column 8: a',
      result: {
        lexerErrors: [],
        parserErrors: [{ token: { startLine: 2, startColumn: 8 }, message: 'a' }],
      },
    },
  ])('leaves a Langium error whose message lists $case', ({ message, result }) => {
    const error = Object.assign(new Error(message), { result });
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe(message);
  });

  it.each([
    { case: 'no line', line: undefined, written: '?' },
    { case: 'a negative line', line: -1, written: '?' },
    { case: 'line 0', line: 0, written: '0' },
  ])('finds a Langium error with $case, and the errors after it', ({ line, written }) => {
    const message = `Parsing failed: Lexer error on line ${written}, column 1: a Parse error on line 2, column 1: b`;
    const error = Object.assign(new Error(message), {
      result: {
        lexerErrors: [{ line, column: 1, message: 'a' }],
        parserErrors: [{ token: { startLine: 2, startColumn: 1 }, message: 'b' }],
      },
    });
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe(message.replace('line 2', 'line 4'));
  });

  it.each([
    { case: 'null', result: null },
    { case: 'an object without lists', result: {} },
    {
      case: 'holding parser errors that are no list',
      result: { lexerErrors: [], parserErrors: {} },
    },
    {
      case: 'holding a lexer error that is no record',
      result: { lexerErrors: [{}, 1], parserErrors: [] },
    },
    {
      case: 'holding a parser error that is no record',
      result: { lexerErrors: [], parserErrors: [{}, 1] },
    },
  ])('reads an error as a jison error when its result is $case', ({ result }) => {
    const error = Object.assign(new Error('Parse error on line 2:'), { result });
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe('Parse error on line 4:');
  });

  it('rewrites a line of more than one digit', () => {
    const error = new Error('Parse error on line 12:');
    remapParseErrorLines(
      error,
      Array.from({ length: 12 }, (_, index) => index + 3)
    );
    expect(error.message).toBe('Parse error on line 14:');
  });

  it.each([
    { case: 'no line', hash: { loc: { first_column: 0, last_column: 1 } } },
    { case: 'no last line', hash: { loc: { first_line: 2, first_column: 0 } } },
    { case: 'no first line', hash: { loc: { last_line: 2, last_column: 1 } } },
  ])('leaves a jison hash with $case as it is', ({ hash }) => {
    const error = Object.assign(new Error('Parse error on line 2:'), {
      hash: structuredClone(hash),
    });
    remapParseErrorLines(error, sourceLines);
    expect(error.hash).toEqual(hash);
  });

  it.each([
    {
      case: 'starts with the message',
      stack: 'Parse error on line 2:\n    at x',
      expected: 'Parse error on line 4:\n    at x',
    },
    { case: 'does not hold the message', stack: '@file.js:2:1', expected: '@file.js:2:1' },
    { case: 'is missing', stack: undefined, expected: undefined },
  ])('rewrites the message, and leaves a stack that $case', ({ stack, expected }) => {
    const error = new Error('Parse error on line 2:');
    error.stack = stack;
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe('Parse error on line 4:');
    expect(error.stack).toBe(expected);
  });

  it.each([
    {
      case: 'a header in the excerpt',
      message: 'Parse error on line 2:\nParse error on line 2\n^',
    },
    {
      case: 'a lexical header in the excerpt',
      message: 'Lexical error on line 2. Lexical error on line 2',
    },
  ])('rewrites only the header jison starts its message with, with $case', ({ message }) => {
    const error = new Error(message);
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe(message.replace('2', '4'));
  });

  it('leaves a message and its hash alone when a header appears only inside the message', () => {
    const hash = { line: 4, loc: { first_line: 5, last_line: 5, first_column: 4, last_column: 5 } };
    const message = 'bad shape data (5:5)\n 5 | type: "Parse error on line 2"';
    const error = Object.assign(new Error(message), { hash: structuredClone(hash) });
    remapParseErrorLines(error, sourceLines);
    expect(error.message).toBe(message);
    expect(error.hash).toEqual(hash);
  });

  it('rewrites the message in the stack, and leaves the rest of the stack', () => {
    const error = new Error('Parse error on line 2:');
    error.stack = 'at Parse error on line 2 (file.js)\nError: Parse error on line 2:\n    at x';
    remapParseErrorLines(error, sourceLines);
    expect(error.stack).toBe(
      'at Parse error on line 2 (file.js)\nError: Parse error on line 4:\n    at x'
    );
  });

  describe('on a joined line', () => {
    const joins = [{ line: 2, column: 5, sourceLine: 5 }];

    it.each([
      { case: 'left of the join', column: 4, expected: 4 },
      { case: 'at the join', column: 5, expected: 5 },
    ])(
      'picks the source line of each Langium error by its column, $case',
      ({ column, expected }) => {
        const error = langiumError([], [{ line: 2, column, message: 'b' }]);
        remapParseErrorLines(error, sourceLines, joins);
        expect(error.message).toBe(
          `Parsing failed:  Parse error on line ${expected}, column ${column}: b`
        );
      }
    );

    it('picks the source line of each of several errors on the line', () => {
      const error = langiumError(
        [{ line: 2, column: 1, message: 'a' }],
        [{ line: 2, column: 6, message: 'b' }]
      );
      remapParseErrorLines(error, sourceLines, joins);
      expect(error.message).toBe(
        'Parsing failed: Lexer error on line 4, column 1: a Parse error on line 5, column 6: b'
      );
    });

    it('picks the source lines of a jison error by the columns of its loc, which count from 0', () => {
      const error = Object.assign(new Error('Parse error on line 2:'), {
        hash: { line: 1, loc: { first_line: 2, last_line: 2, first_column: 4, last_column: 6 } },
      });
      remapParseErrorLines(error, sourceLines, joins);
      expect(error.message).toBe('Parse error on line 5:');
      expect(error.hash).toEqual({
        line: 4,
        loc: { first_line: 5, last_line: 5, first_column: 4, last_column: 6 },
      });
    });

    it('maps a jison loc that ends where the join starts by its last character', () => {
      const error = Object.assign(new Error('Parse error on line 2:'), {
        hash: { line: 1, loc: { first_line: 2, last_line: 2, first_column: 2, last_column: 4 } },
      });
      remapParseErrorLines(error, sourceLines, joins);
      expect(error.hash).toMatchObject({ line: 3, loc: { first_line: 4, last_line: 4 } });
    });

    it('maps a jison lexical error, which has no column, by the start of its line', () => {
      const error = Object.assign(new Error('Lexical error on line 2. Unrecognized text.'), {
        hash: { text: '', line: 1 },
      });
      remapParseErrorLines(error, sourceLines, joins);
      expect(error.message).toBe('Lexical error on line 4. Unrecognized text.');
      expect(error.hash).toEqual({ text: '', line: 3 });
    });
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
