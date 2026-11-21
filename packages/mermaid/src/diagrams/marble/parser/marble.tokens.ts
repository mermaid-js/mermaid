import { createToken, Lexer } from 'chevrotain';
import type { CustomPatternMatcherFunc, TokenType } from 'chevrotain';

function customMatch(text: string, offset: number, image: string): RegExpExecArray {
  const match = [image] as unknown as RegExpExecArray;
  match.index = offset;
  match.input = text;
  return match;
}

/** True when only blanks stand between `offset` and the start of its line. */
const isIndentedLineStart = (text: string, offset: number): boolean => {
  for (let index = offset - 1; index >= 0; index--) {
    const character = text[index];
    if (character === '\n' || character === '\r') {
      return true;
    }
    if (character !== ' ' && character !== '\t') {
      return false;
    }
  }
  return true;
};

/** Matches `pattern` only as the first thing on a line, so keywords stay usable inside text. */
const lineStatement =
  (pattern: RegExp): CustomPatternMatcherFunc =>
  (text, offset) => {
    if (!isIndentedLineStart(text, offset)) {
      return null;
    }
    const match = pattern.exec(text.slice(offset));
    return match ? customMatch(text, offset, match[0]) : null;
  };

export const NewLine = createToken({
  name: 'NEWLINE',
  pattern: /\r\n|\n|\r/,
  line_breaks: true,
});
export const WhiteSpace = createToken({
  name: 'HWS',
  pattern: /[\t ]+/,
  group: Lexer.SKIPPED,
});
export const Comment = createToken({
  name: 'COMMENT',
  pattern: lineStatement(/^%%[^\n\r]*/),
  start_chars_hint: ['%'],
  line_breaks: false,
});
export const AccDescrBlock = createToken({
  name: 'ACC_DESCR_BLOCK',
  pattern: lineStatement(/^accDescr[\t ]*{[^}]*}/),
  start_chars_hint: ['a'],
  line_breaks: true,
});
export const AccDescrLine = createToken({
  name: 'ACC_DESCR_LINE',
  pattern: lineStatement(/^accDescr[\t ]*:[^\n\r]*/),
  start_chars_hint: ['a'],
  line_breaks: false,
});
export const AccTitleLine = createToken({
  name: 'ACC_TITLE_LINE',
  pattern: lineStatement(/^accTitle[\t ]*:[^\n\r]*/),
  start_chars_hint: ['a'],
  line_breaks: false,
});
/** `title` and the rest of its line. `title : ...` is left alone so it can still be a lane. */
export const TitleLine = createToken({
  name: 'TITLE_LINE',
  pattern: lineStatement(/^title(?![\t ]*:)(?:[\t ]+[^\n\r]*)?(?=[\n\r]|$)/),
  start_chars_hint: ['t'],
  line_breaks: false,
});

/** Lane names are identifiers or quoted strings; keywords take an identifier as longer_alt. */
export const Identifier = createToken({
  name: 'IDENTIFIER',
  pattern: /[A-Z_a-z][\w.-]*/,
});
/** The header. The detector only routes `marble-beta` here while the syntax is in beta. */
export const Marble = createToken({
  name: 'MARBLE',
  pattern: /marble(?:-beta)?/,
  longer_alt: Identifier,
});
export const Axis = createToken({ name: 'AXIS', pattern: /axis/, longer_alt: Identifier });
export const Label = createToken({ name: 'LABEL', pattern: /label/, longer_alt: Identifier });

/**
 * The `:` that starts a lane or axis body and everything after it on the line. The body is
 * kept whole, blanks included, because a marble's column is its position in time.
 */
export const MarbleBody = createToken({
  name: 'MARBLE_BODY',
  pattern: /:[^\n\r]*/,
  start_chars_hint: [':'],
  line_breaks: false,
});
export const QuotedString = createToken({
  name: 'QUOTED_STRING',
  pattern: /"[^\n\r"]*"/,
  start_chars_hint: ['"'],
  line_breaks: false,
});
/** Any other single character: the symbol a `label` statement names, such as `=` or `#`. */
export const SymbolChar = createToken({
  name: 'SYMBOL',
  pattern: /[^\s"]/,
});

export const marbleTokens: TokenType[] = [
  NewLine,
  WhiteSpace,
  Comment,
  AccDescrBlock,
  AccDescrLine,
  AccTitleLine,
  TitleLine,
  Marble,
  Axis,
  Label,
  Identifier,
  MarbleBody,
  QuotedString,
  SymbolChar,
];
