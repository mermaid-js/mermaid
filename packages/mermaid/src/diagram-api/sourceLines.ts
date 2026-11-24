/**
 * The line of the source that each line of a derived text comes from: entry `i` is for line
 * `i + 1` of the derived text. Both sides count from 1.
 */
export type SourceLines = readonly number[];

/**
 * Where a line of a derived text goes on with text from another source line, as when a
 * directive across lines is removed from the middle of a line: from column `column` of line
 * `line` of the derived text on, its text comes from source line `sourceLine`. All three count
 * from 1.
 */
export interface LineJoin {
  readonly line: number;
  readonly column: number;
  readonly sourceLine: number;
}

/** A text derived from a source, with the source line of each of its lines. */
export interface TrackedText {
  readonly text: string;
  readonly sourceLines: SourceLines;
  /** The joins of `text`, in its order; none, or left out, when no line has one. */
  readonly joins?: readonly LineJoin[];
}

const countLines = (text: string): number => text.split('\n').length;

/** `text` as its own source: every line maps to itself. */
export const trackLines = (text: string): TrackedText => ({
  text,
  sourceLines: Array.from({ length: countLines(text) }, (_, index) => index + 1),
});

/** The line of the source that a line of a derived text starts on, without its joins. */
const startSourceLine = (sourceLines: SourceLines, line: number): number => {
  const last = sourceLines.length;
  if (line < 1 || last === 0) {
    return line;
  }
  return line <= last ? sourceLines[line - 1] : sourceLines[last - 1] + line - last;
};

/** Maps a line of a derived text, and the column in it when known, to its source line. */
export type ToSourceLine = (line: number, column?: number) => number;

/**
 * {@link toSourceLine} for many lookups: the joins are grouped by line once, and a lookup
 * finds its join by binary search, so it costs the logarithm of the joins of its line.
 */
export const sourceLineMap = (
  sourceLines: SourceLines,
  joins: readonly LineJoin[] = []
): ToSourceLine => {
  const joinsByLine = new Map<number, LineJoin[]>();
  for (const join of joins) {
    const lineJoins = joinsByLine.get(join.line);
    if (lineJoins) {
      lineJoins.push(join);
    } else {
      joinsByLine.set(join.line, [join]);
    }
  }
  const last = sourceLines.length;
  const lastJoins = joinsByLine.get(last);
  // The source line the last line ends on, which a line past the last one keeps its distance from.
  const lastSourceLine = lastJoins ? lastJoins[lastJoins.length - 1].sourceLine : undefined;
  return (line, column) => {
    if (lastSourceLine !== undefined && line > last) {
      return lastSourceLine + line - last;
    }
    const lineJoins = joinsByLine.get(line);
    if (column === undefined || lineJoins === undefined) {
      return startSourceLine(sourceLines, line);
    }
    // The number of joins of the line at or before `column`, which are in column order.
    let low = 0;
    let high = lineJoins.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (lineJoins[middle].column <= column) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    return low > 0 ? lineJoins[low - 1].sourceLine : startSourceLine(sourceLines, line);
  };
};

/**
 * Maps a line of a derived text to the source line it comes from. A line past the last one,
 * such as the end of input after a trailing newline, keeps its distance from the source line
 * the last line ends on, which is that of its last join when it has one.
 * With a `column`, counted from 1, a line with `joins` maps to the source line of the text at
 * that column; without one, to the source line of its first character.
 */
export const toSourceLine = (
  sourceLines: SourceLines,
  line: number,
  column?: number,
  joins: readonly LineJoin[] = []
): number => sourceLineMap(sourceLines, joins)(line, column);

/** A part of a text to remove: `removed`, which starts at `index`. */
interface Span {
  readonly index: number;
  readonly removed: string;
}

/**
 * Removes `spans`, given in the order of the text and apart. A line of the result maps to the
 * source line of its first character, and a join is kept where a later character comes from
 * another source line, unless that character ends the line.
 */
const removeSpans = (
  { text, sourceLines, joins = [] }: TrackedText,
  spans: Iterable<Span>
): TrackedText => {
  let kept = '';
  const keptLines: number[] = [];
  const keptJoins: LineJoin[] = [];
  // The line and column of `text` at `cursor`, and whether the next kept character starts a line.
  let line = 1;
  let column = 1;
  let startsLine = true;
  let cursor = 0;
  // The column of the next kept character in its line, and the source line of the one before.
  let keptColumn = 1;
  let keptSourceLine = 0;
  // The joins up to `nextJoin` are at or before `line` and `column`, which only move forward.
  let nextJoin = 0;

  const sourceLine = () => {
    while (
      nextJoin < joins.length &&
      (joins[nextJoin].line < line ||
        (joins[nextJoin].line === line && joins[nextJoin].column <= column))
    ) {
      nextJoin++;
    }
    const passed = nextJoin > 0 ? joins[nextJoin - 1] : undefined;
    return passed?.line === line ? passed.sourceLine : startSourceLine(sourceLines, line);
  };
  const pass = (char: string) => {
    if (char === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  };

  const keepUntil = (end: number) => {
    kept += text.slice(cursor, end);
    for (; cursor < end; cursor++) {
      const char = text[cursor];
      const source = sourceLine();
      if (startsLine) {
        keptLines.push(source);
        keptColumn = 1;
      } else if (source !== keptSourceLine && char !== '\n') {
        keptJoins.push({ line: keptLines.length, column: keptColumn, sourceLine: source });
      }
      keptSourceLine = source;
      keptColumn++;
      startsLine = char === '\n';
      pass(char);
    }
  };

  for (const { index, removed } of spans) {
    keepUntil(index);
    // Columns count UTF-16 units, as the parsers and `keepUntil` count them.
    const lastBreak = removed.lastIndexOf('\n');
    line += countLines(removed) - 1;
    column = lastBreak < 0 ? column + removed.length : removed.length - lastBreak;
    cursor = index + removed.length;
  }
  keepUntil(text.length);
  if (startsLine) {
    keptLines.push(sourceLine());
  }
  return { text: kept, sourceLines: keptLines, joins: keptJoins };
};

/**
 * Removes every match of `pattern`, which must be global, exactly as
 * `text.replace(pattern, '')` does, whatever `pattern.lastIndex` holds.
 * A line of the result maps to the source line of its first character, and a line that goes on
 * with text from another source line has a join there.
 */
export const removeMatches = (tracked: TrackedText, pattern: RegExp): TrackedText =>
  removeSpans(
    tracked,
    Array.from(tracked.text.matchAll(new RegExp(pattern)), ({ index, 0: removed }) => ({
      index,
      removed,
    }))
  );

/** Cuts the start off `tracked`, leaving `suffix`, which must end its text. */
export const keepSuffix = (tracked: TrackedText, suffix: string): TrackedText =>
  removeSpans(tracked, [
    { index: 0, removed: tracked.text.slice(0, tracked.text.length - suffix.length) },
  ]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * A line number written in the message of a parse error: at `index`, `length` characters long,
 * and the column, counted from 1, of the error in that line when the parser reports one.
 */
interface ReportedLine {
  readonly index: number;
  readonly length: number;
  readonly line: number;
  readonly column?: number;
}

/** The header jison writes at the start of a parse or lexical error. */
const jisonHeader = /^(?:Parse|Lexical) error on line (\d+)/;

/** The location jison puts in the hash of a parse error; a lexical error has none. */
const jisonLocation = (hash: unknown): Record<string, unknown> | undefined =>
  isRecord(hash) && isRecord(hash.loc) ? hash.loc : undefined;

/** A column jison counts from 0, counted from 1. */
const fromZero = (column: unknown): number | undefined =>
  typeof column === 'number' ? column + 1 : undefined;

const jisonLines = (message: string, hash: unknown): ReportedLine[] => {
  const match = jisonHeader.exec(message);
  if (!match) {
    return [];
  }
  const [header, digits] = match;
  return [
    {
      index: header.length - digits.length,
      length: digits.length,
      line: Number(digits),
      column: fromZero(jisonLocation(hash)?.first_column),
    },
  ];
};

/** One error of a Langium parse result, with the kind of error `MermaidParseError` names it by. */
interface LangiumError {
  readonly kind: 'Lexer' | 'Parse';
  readonly line: unknown;
  readonly column: unknown;
  readonly message: unknown;
}

/** The errors of a Langium parse result, lexer errors first, as `MermaidParseError` lists them. */
const langiumErrors = (result: Record<string, unknown>): LangiumError[] | undefined => {
  const { lexerErrors, parserErrors } = result;
  if (
    !Array.isArray(lexerErrors) ||
    !Array.isArray(parserErrors) ||
    !lexerErrors.every(isRecord) ||
    !parserErrors.every(isRecord)
  ) {
    return undefined;
  }
  return [
    ...lexerErrors.map(
      ({ line, column, message }): LangiumError => ({
        kind: 'Lexer',
        line,
        column,
        message,
      })
    ),
    ...parserErrors.map(
      ({ token, message }): LangiumError => ({
        kind: 'Parse',
        line: isRecord(token) ? token.startLine : undefined,
        column: isRecord(token) ? token.startColumn : undefined,
        message,
      })
    ),
  ];
};

const isLocation = (value: unknown): value is number => typeof value === 'number' && value >= 0;

/** A line or column as `MermaidParseError` writes it. */
const formatLocation = (value: unknown): string => (isLocation(value) ? String(value) : '?');

/**
 * The line numbers in the headers `MermaidParseError` writes, one for each error, found in order
 * past the text of the error before; none when any error is not where it is expected.
 */
const langiumLines = (message: string, errors: LangiumError[]): ReportedLine[] => {
  const lines: ReportedLine[] = [];
  let cursor = 0;
  for (const { kind, line, column, message: text } of errors) {
    const header = `${kind} error on line `;
    const written = `${header}${formatLocation(line)}, column ${formatLocation(column)}: ${String(text)}`;
    const index = message.indexOf(written, cursor);
    if (index < 0) {
      return [];
    }
    if (isLocation(line)) {
      lines.push({
        index: index + header.length,
        length: String(line).length,
        line,
        column: isLocation(column) ? column : undefined,
      });
    }
    cursor = index + written.length;
  }
  return lines;
};

const rewriteLines = (message: string, lines: ReportedLine[], toSource: ToSourceLine): string => {
  let rewritten = '';
  let cursor = 0;
  for (const { index, length, line, column } of lines) {
    rewritten += `${message.slice(cursor, index)}${toSource(line, column)}`;
    cursor = index + length;
  }
  return rewritten + message.slice(cursor);
};

const remapHash = (hash: Record<string, unknown>, toSource: ToSourceLine) => {
  // Jison counts `hash.line` and the columns of `hash.loc` from 0, and its lines from 1 like
  // its message. `last_column` is past the last character, so it is that character from 1.
  const loc = jisonLocation(hash);
  const firstColumn = fromZero(loc?.first_column);
  if (typeof hash.line === 'number') {
    hash.line = toSource(hash.line + 1, firstColumn) - 1;
  }
  if (loc && typeof loc.first_line === 'number' && typeof loc.last_line === 'number') {
    const lastColumn = typeof loc.last_column === 'number' ? loc.last_column : undefined;
    hash.loc = {
      ...loc,
      first_line: toSource(loc.first_line, firstColumn),
      last_line: toSource(loc.last_line, lastColumn),
    };
  }
};

/**
 * Rewrites, in place, the lines a jison or Langium parse error reports in the text it parsed
 * into the source lines they come from: the message, the stack and jison's `hash.line` and
 * `hash.loc`. Only the line a parser writes in its own header is rewritten: the header jison
 * starts its message with, and the header `MermaidParseError` writes for each error of its
 * `result`. Text quoted from the diagram is left as it is, even where it reads like a header.
 * The hash is rewritten only when the message starts with a jison header: an error whose message
 * has none has had its hash written in source lines by the diagram. On a line with `joins`, the
 * column of the error picks the source line; a jison lexical error has no column, so it gets the
 * source line of the start of its line. Columns, and errors in any other format, are left as
 * they are.
 */
export const remapParseErrorLines = (
  error: unknown,
  sourceLines: SourceLines,
  joins: readonly LineJoin[] = []
): void => {
  if (!(error instanceof Error)) {
    return;
  }
  const toSource = sourceLineMap(sourceLines, joins);
  const errors =
    'result' in error && isRecord(error.result) ? langiumErrors(error.result) : undefined;
  const { message } = error;
  const hash = 'hash' in error ? error.hash : undefined;
  const lines = errors ? langiumLines(message, errors) : jisonLines(message, hash);
  if (lines.length === 0) {
    return;
  }
  // V8 formats `stack` from the message on its first read, so it is read before the message changes.
  const { stack } = error;
  error.message = rewriteLines(message, lines, toSource);
  const at = stack?.indexOf(message) ?? -1;
  if (stack && at >= 0) {
    error.stack = `${stack.slice(0, at)}${error.message}${stack.slice(at + message.length)}`;
  }
  if (!errors && isRecord(hash)) {
    remapHash(hash, toSource);
  }
};
