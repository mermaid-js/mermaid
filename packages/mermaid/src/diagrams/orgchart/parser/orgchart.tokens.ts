import { createToken, Lexer } from 'chevrotain';
import type { CustomPatternMatcherFunc } from 'chevrotain';

const atLineStart =
  (pattern: RegExp): CustomPatternMatcherFunc =>
  (text, offset) => {
    for (let index = offset - 1; index >= 0; index--) {
      const character = text[index];
      if (character === '\n' || character === '\r') {
        break;
      }
      if (character !== ' ' && character !== '\t') {
        return null;
      }
    }
    pattern.lastIndex = offset;
    return pattern.exec(text);
  };

/** Line breaks (including blank and comment-only lines) plus the indentation of the next line. */
export const Newline = createToken({
  name: 'Newline',
  pattern: /(?:[\t ]*(?:%%[^\n\r]*)?\r?\n)+[\t ]*/,
  line_breaks: true,
});

export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[\t ]+/,
  group: Lexer.SKIPPED,
});

export const Comment = createToken({
  name: 'Comment',
  pattern: /%%[^\n\r]*/,
  group: Lexer.SKIPPED,
});

export const Header = createToken({ name: 'Header', pattern: /orgchart-beta(?!\S)/ });

export const QuotedString = createToken({ name: 'QuotedString', pattern: /"[^\n\r"]*"/ });

export const TitleLine = createToken({
  name: 'TitleLine',
  pattern: atLineStart(/title[\t ]+[^\n\r]*/y),
  start_chars_hint: ['t'],
  line_breaks: false,
});

export const AccTitleLine = createToken({
  name: 'AccTitleLine',
  pattern: atLineStart(/accTitle[\t ]*:[^\n\r]*/y),
  start_chars_hint: ['a'],
  line_breaks: false,
});

export const AccDescrLine = createToken({
  name: 'AccDescrLine',
  pattern: atLineStart(/accDescr[\t ]*:[^\n\r]*/y),
  start_chars_hint: ['a'],
  line_breaks: false,
});

export const AccDescrBlock = createToken({
  name: 'AccDescrBlock',
  pattern: atLineStart(/accDescr[\t ]*{[^}]*}?/y),
  start_chars_hint: ['a'],
  line_breaks: true,
});

/** `id[Label]`: an explicit, stable id attached to the primary label. */
export const IdWithLabel = createToken({
  name: 'IdWithLabel',
  pattern: /[^\s"[\]]+\[[^\n\r\]]*]/,
});

export const Word = createToken({ name: 'Word', pattern: /[^\s"]+/ });

export const Staff = createToken({
  name: 'Staff',
  pattern: /staff(?!\S)/,
  longer_alt: Word,
  categories: Word,
});

export const orgchartTokens = [
  Newline,
  WhiteSpace,
  Comment,
  Header,
  QuotedString,
  TitleLine,
  AccTitleLine,
  AccDescrLine,
  AccDescrBlock,
  IdWithLabel,
  Staff,
  Word,
];
