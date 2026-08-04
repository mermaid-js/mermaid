import { createToken, Lexer } from 'chevrotain';

/**
 * Shared Chevrotain lexer tokens reused across diagram parsers during the migration.
 *
 * The line-based accessibility/title patterns mirror the langium common grammar
 * (`packages/parser/src/language/common/common.langium`) so behaviour matches the legacy parser.
 */

export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[\t ]+/,
  group: Lexer.SKIPPED,
});

export const NewLine = createToken({
  name: 'NewLine',
  pattern: /\r?\n/,
  line_breaks: true,
});

export const Comment = createToken({
  name: 'Comment',
  pattern: /%%[^\n\r]*/,
  group: Lexer.SKIPPED,
});

export const Title = createToken({
  name: 'Title',
  pattern: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/,
});

export const AccTitle = createToken({
  name: 'AccTitle',
  pattern: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/,
});

export const AccDescr = createToken({
  name: 'AccDescr',
  pattern: /[\t ]*accDescr(?:[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)|\s*{[^}]*})/,
  line_breaks: true,
});
