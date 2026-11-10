/**
 * The line of the source that each line of a derived text comes from: entry `i` is for line
 * `i + 1` of the derived text. Both sides count from 1.
 */
export type SourceLines = readonly number[];

/** A text derived from a source, with the source line of each of its lines. */
export interface TrackedText {
  readonly text: string;
  readonly sourceLines: SourceLines;
}

const countLines = (text: string): number => text.split('\n').length;

/** `text` as its own source: every line maps to itself. */
export const trackLines = (text: string): TrackedText => ({
  text,
  sourceLines: Array.from({ length: countLines(text) }, (_, index) => index + 1),
});

/**
 * Maps a line of a derived text to the source line it comes from. A line past the last one,
 * such as the end of input after a trailing newline, keeps its distance from the last line.
 */
export const toSourceLine = (sourceLines: SourceLines, line: number): number => {
  const last = sourceLines.length;
  if (line < 1 || last === 0) {
    return line;
  }
  return line <= last ? sourceLines[line - 1] : sourceLines[last - 1] + line - last;
};

/**
 * Removes every match of `pattern`, which must be global, exactly as
 * `text.replace(pattern, '')` does, whatever `pattern.lastIndex` holds.
 * A line of the result maps to the source line of its first character.
 */
export const removeMatches = ({ text, sourceLines }: TrackedText, pattern: RegExp): TrackedText => {
  let kept = '';
  const keptLines: number[] = [];
  // The line of `text` at `cursor`, and whether the next kept character starts a line.
  let line = 1;
  let startsLine = true;
  let cursor = 0;

  const keepUntil = (end: number) => {
    kept += text.slice(cursor, end);
    for (; cursor < end; cursor++) {
      if (startsLine) {
        keptLines.push(toSourceLine(sourceLines, line));
      }
      startsLine = text[cursor] === '\n';
      if (startsLine) {
        line++;
      }
    }
  };

  for (const match of text.matchAll(new RegExp(pattern))) {
    keepUntil(match.index);
    line += countLines(match[0]) - 1;
    cursor = match.index + match[0].length;
  }
  keepUntil(text.length);
  if (startsLine) {
    keptLines.push(toSourceLine(sourceLines, line));
  }
  return { text: kept, sourceLines: keptLines };
};

/** Cuts the start off `tracked`, leaving `suffix`, which must end its text. */
export const keepSuffix = ({ sourceLines }: TrackedText, suffix: string): TrackedText => ({
  text: suffix,
  sourceLines: sourceLines.slice(sourceLines.length - countLines(suffix)),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** A line number written in the message of a parse error: at `index`, `length` characters long. */
interface ReportedLine {
  readonly index: number;
  readonly length: number;
  readonly line: number;
}

/** The header jison writes at the start of a parse or lexical error. */
const jisonHeader = /^(?:Parse|Lexical) error on line (\d+)/;

const jisonLines = (message: string): ReportedLine[] => {
  const match = jisonHeader.exec(message);
  if (!match) {
    return [];
  }
  const [header, digits] = match;
  return [{ index: header.length - digits.length, length: digits.length, line: Number(digits) }];
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
      lines.push({ index: index + header.length, length: String(line).length, line });
    }
    cursor = index + written.length;
  }
  return lines;
};

const rewriteLines = (
  message: string,
  lines: ReportedLine[],
  toSource: (line: number) => number
): string => {
  let rewritten = '';
  let cursor = 0;
  for (const { index, length, line } of lines) {
    rewritten += `${message.slice(cursor, index)}${toSource(line)}`;
    cursor = index + length;
  }
  return rewritten + message.slice(cursor);
};

const remapHash = (hash: Record<string, unknown>, toSource: (line: number) => number) => {
  // Jison counts `hash.line` from 0, and `hash.loc` from 1 like its message.
  if (typeof hash.line === 'number') {
    hash.line = toSource(hash.line + 1) - 1;
  }
  const { loc } = hash;
  if (isRecord(loc) && typeof loc.first_line === 'number' && typeof loc.last_line === 'number') {
    hash.loc = { ...loc, first_line: toSource(loc.first_line), last_line: toSource(loc.last_line) };
  }
};

/**
 * Rewrites, in place, the lines a jison or Langium parse error reports in the text it parsed
 * into the source lines they come from: the message, the stack and jison's `hash.line` and
 * `hash.loc`. Only the line a parser writes in its own header is rewritten: the header jison
 * starts its message with, and the header `MermaidParseError` writes for each error of its
 * `result`. Text quoted from the diagram is left as it is, even where it reads like a header.
 * The hash is rewritten only when the message starts with a jison header: an error whose message
 * has none has had its hash written in source lines by the diagram. Columns, and errors in any
 * other format, are left as they are.
 */
export const remapParseErrorLines = (error: unknown, sourceLines: SourceLines): void => {
  if (!(error instanceof Error)) {
    return;
  }
  const toSource = (line: number) => toSourceLine(sourceLines, line);
  const errors =
    'result' in error && isRecord(error.result) ? langiumErrors(error.result) : undefined;
  const { message } = error;
  const lines = errors ? langiumLines(message, errors) : jisonLines(message);
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
  if (!errors && 'hash' in error && isRecord(error.hash)) {
    remapHash(error.hash, toSource);
  }
};
