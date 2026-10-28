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

/** `line N` as jison (`Parse error`, `Lexical error`) and Langium (`Lexer error`) write it. */
const lineInMessage = /((?:Parse|Lexical|Lexer) error on line )(\d+)/g;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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
 * `hash.loc`. Columns, and errors in any other format, are left as they are.
 */
export const remapParseErrorLines = (error: unknown, sourceLines: SourceLines): void => {
  if (!(error instanceof Error)) {
    return;
  }
  const toSource = (line: number) => toSourceLine(sourceLines, line);
  const remapMessage = (text: string) =>
    text.replace(
      lineInMessage,
      (_match, prefix: string, line: string) => `${prefix}${toSource(Number(line))}`
    );
  // V8 formats `stack` from the message on its first read, so it is read before the message changes.
  if (error.stack) {
    error.stack = remapMessage(error.stack);
  }
  error.message = remapMessage(error.message);
  if ('hash' in error && isRecord(error.hash)) {
    remapHash(error.hash, toSource);
  }
};
