import { createToken } from 'chevrotain';
import {
  AccDescr,
  AccTitle,
  Comment,
  NewLine,
  Title,
  WhiteSpace,
} from '../../common/parser/commonTokens.js';

/** The `pie` keyword. The guard forbids a trailing non-whitespace character (keyword stands alone). */
export const Pie = createToken({ name: 'Pie', pattern: /pie(?:(?=%%)|(?!\S))/ });

/** The optional `showData` keyword. */
export const ShowData = createToken({ name: 'ShowData', pattern: /showData(?:(?=%%)|(?!\S))/ });

/** A quoted section label (single or double quoted). */
export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,
});

export const Colon = createToken({ name: 'Colon', pattern: /:/ });

/** A pie value: float or int, optionally negative (matching langium FLOAT_PIE / INT_PIE). */
export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /-?(?:\d+\.\d+|0|[1-9]\d*)(?!\.)/,
});

/**
 * Lexer vocabulary, ordered: skipped tokens, then keywords, then line tokens, then literals.
 * Order matters — Chevrotain tries patterns in array order at each offset.
 */
export const pieTokens = [
  WhiteSpace,
  NewLine,
  Comment,
  Pie,
  ShowData,
  Title,
  AccTitle,
  AccDescr,
  StringLiteral,
  Colon,
  NumberLiteral,
];
