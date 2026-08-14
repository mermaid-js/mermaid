// cspell:ignore lparen markerless rparen

import { createToken, Lexer } from 'chevrotain';
import type { CustomPatternMatcherFunc, TokenType } from 'chevrotain';

function customMatch(text: string, offset: number, image: string): RegExpExecArray {
  const match = [image] as unknown as RegExpExecArray;
  match.index = offset;
  match.input = text;
  return match;
}

const matchMarkdownString: CustomPatternMatcherFunc = (text, offset) => {
  if (text[offset] !== '"' || text[offset + 1] !== '`') {
    return null;
  }
  for (let index = offset + 2; index < text.length - 1; index++) {
    if (text[index] === '`' && text[index + 1] === '"') {
      return customMatch(text, offset, text.slice(offset, index + 2));
    }
  }
  return null;
};

const matchComment: CustomPatternMatcherFunc = (text, offset) => {
  if (text[offset] !== '%' || text[offset + 1] !== '%') {
    return null;
  }
  for (let index = offset - 1; index >= 0; index--) {
    const character = text[index];
    if (character === '\n' || character === '\r') {
      break;
    }
    if (character !== ' ' && character !== '\t') {
      return null;
    }
  }
  let end = offset + 2;
  while (end < text.length && text[end] !== '\n' && text[end] !== '\r') {
    end++;
  }
  return customMatch(text, offset, text.slice(offset, end));
};

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

const matchAccessibilityLine = (
  text: string,
  offset: number,
  pattern: RegExp
): RegExpExecArray | null => {
  if (!isIndentedLineStart(text, offset)) {
    return null;
  }
  const match = pattern.exec(text.slice(offset));
  return match ? customMatch(text, offset, match[0]) : null;
};

const matchAccDescrBlock: CustomPatternMatcherFunc = (text, offset) => {
  if (!isIndentedLineStart(text, offset)) {
    return null;
  }
  const opening = /^accDescr[\t ]*{/.exec(text.slice(offset));
  if (!opening) {
    return null;
  }
  const end = text.indexOf('}', offset + opening[0].length);
  return end === -1 ? null : customMatch(text, offset, text.slice(offset, end + 1));
};

const matchJsonObject: CustomPatternMatcherFunc = (text, offset) => {
  if (text[offset] !== '{') {
    return null;
  }

  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = offset; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        quoted = false;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === '{') {
      depth++;
    } else if (character === '}' && --depth === 0) {
      return customMatch(text, offset, text.slice(offset, index + 1));
    }
  }

  // No match makes Chevrotain locate the lexer error at this unmatched opening brace.
  return null;
};

const matchStereotypeText: CustomPatternMatcherFunc = (text, offset) => {
  const end = text.indexOf('>>', offset);
  if (end === -1 || /[\n\r]/.test(text.slice(offset, end))) {
    return null;
  }
  const image = text.slice(offset, end);
  return image.trim() ? customMatch(text, offset, image) : null;
};

export const Word = createToken({ name: 'WORD', pattern: Lexer.NA });
// Declared before IDENTIFIER so it can serve as its longer_alt.
export const NumberLiteral = createToken({
  name: 'NUMBER',
  pattern: /(?:\d+\.\d+|\d+|\.\d+)(?:[A-Za-z]+)?/,
});
// Ids may start with a digit (`1`, `1mg`), so this is `\w+` rather than an
// identifier-shaped pattern. NUMBER is the longer_alt so decimals such as `1.5`
// and `1.5px` still lex as a single number instead of `1` + `.` + `5`.
export const Identifier = createToken({
  name: 'IDENTIFIER',
  pattern: /\w+/,
  longer_alt: NumberLiteral,
  categories: Word,
});
export const WhiteSpace = createToken({
  name: 'HWS',
  pattern: /[\t ]+/,
  group: Lexer.SKIPPED,
});
export const MarkdownString = createToken({
  name: 'MARKDOWN_STRING',
  pattern: matchMarkdownString,
  start_chars_hint: ['"'],
  line_breaks: true,
});
export const UnclosedMarkdownString = createToken({
  name: 'UNCLOSED_MARKDOWN_STRING',
  pattern: /"`[^]*/,
  line_breaks: true,
});
export const Comment = createToken({
  name: 'COMMENT',
  pattern: matchComment,
  start_chars_hint: ['%'],
  line_breaks: false,
});
export const NewLine = createToken({
  name: 'NEWLINE',
  pattern: /\r\n|\n|\r/,
  line_breaks: true,
});

export const AccDescrBlock = createToken({
  name: 'ACC_DESCR_BLOCK',
  pattern: matchAccDescrBlock,
  start_chars_hint: ['a'],
  line_breaks: true,
});
const accTitleLinePattern = /^accTitle[\t ]*:[^\n\r]*/;
const accDescrLinePattern = /^accDescr[\t ]*:[^\n\r]*/;

export const AccTitleLine = createToken({
  name: 'ACC_TITLE_LINE',
  pattern: (text, offset) => matchAccessibilityLine(text, offset, accTitleLinePattern),
  start_chars_hint: ['a'],
  line_breaks: false,
});
export const AccDescrLine = createToken({
  name: 'ACC_DESCR_LINE',
  pattern: (text, offset) => matchAccessibilityLine(text, offset, accDescrLinePattern),
  start_chars_hint: ['a'],
  line_breaks: false,
});

export const JsonDeclarationStart = createToken({
  name: 'JSON_DECLARATION_START',
  pattern: /json[\t ]+\w+[\t ]*@[\t ]*(?={)/,
  push_mode: 'jsonBody',
});
export const JsonObjectLiteral = createToken({
  name: 'JSON_OBJECT_LITERAL',
  pattern: matchJsonObject,
  start_chars_hint: ['{'],
  line_breaks: true,
  pop_mode: true,
});
export const UnclosedJsonObjectLiteral = createToken({
  name: 'UNCLOSED_JSON_OBJECT_LITERAL',
  pattern: /{[^]*/,
  line_breaks: true,
  pop_mode: true,
});

const keyword = (name: string, pattern: RegExp) =>
  createToken({ name, pattern, longer_alt: Identifier, categories: Word });

export const Usecase = keyword('USECASE', /usecase-beta/);
export const Actor = keyword('ACTOR', /actor/);
export const SystemBoundary = keyword('SYSTEM_BOUNDARY', /systemBoundary/);
export const End = keyword('END', /end/);
export const Direction = keyword('DIRECTION', /direction/);
export const Td = keyword('TD', /TD/);
export const Tb = keyword('TB', /TB/);
export const Bt = keyword('BT', /BT/);
export const Lr = keyword('LR', /LR/);
export const Rl = keyword('RL', /RL/);
export const Note = keyword('NOTE', /note/);
export const For = keyword('FOR', /for/);
const Json = keyword('JSON', /json/);
export const ClassDef = keyword('CLASS_DEF', /classDef/);
export const Class = keyword('CLASS', /class/);
export const Style = keyword('STYLE', /style/);
export const Include = keyword('INCLUDE', /include/i);
export const Extend = keyword('EXTEND', /extend/i);
export const True = keyword('TRUE', /true/);
export const False = keyword('FALSE', /false/);

export const Generalization = createToken({ name: 'GENERALIZATION', pattern: /--\|>/ });
export const DependencyArrow = createToken({ name: 'DEPENDENCY_ARROW', pattern: /\.\.>/ });
export const StereotypeStart = createToken({
  name: 'STEREOTYPE_START',
  pattern: /<</,
  push_mode: 'stereotype',
});
export const StereotypeEnd = createToken({
  name: 'STEREOTYPE_END',
  pattern: />>/,
  pop_mode: true,
});
export const StereotypeText = createToken({
  name: 'STEREOTYPE_TEXT',
  pattern: matchStereotypeText,
  line_breaks: false,
});
export const UnclosedStereotypeText = createToken({
  name: 'UNCLOSED_STEREOTYPE_TEXT',
  pattern: /[^\n\r]+/,
  line_breaks: false,
  pop_mode: true,
});
export const ClassSeparator = createToken({ name: 'CLASS_SEPARATOR', pattern: /:::/ });
export const ForwardSolid = createToken({ name: 'FORWARD_SOLID', pattern: /--+>/ });
export const BackwardSolid = createToken({ name: 'BACKWARD_SOLID', pattern: /<--+/ });
export const ForwardCircle = createToken({ name: 'FORWARD_CIRCLE', pattern: /--o/ });
export const BackwardCircle = createToken({ name: 'BACKWARD_CIRCLE', pattern: /o--/ });
export const ForwardCross = createToken({ name: 'FORWARD_CROSS', pattern: /--x/ });
export const BackwardCross = createToken({ name: 'BACKWARD_CROSS', pattern: /x--/ });
export const MarkerlessSolid = createToken({ name: 'MARKERLESS_SOLID', pattern: /--+/ });
export const MetadataStart = createToken({ name: 'METADATA_START', pattern: /@{/ });
export const At = createToken({ name: 'AT', pattern: /@/ });
export const LeftBrace = createToken({ name: 'LBRACE', pattern: /{/ });
export const RightBrace = createToken({ name: 'RBRACE', pattern: /}/ });
export const LeftBracket = createToken({ name: 'LBRACKET', pattern: /\[/ });
export const RightBracket = createToken({ name: 'RBRACKET', pattern: /]/ });
export const LeftParen = createToken({ name: 'LPAREN', pattern: /\(/ });
export const RightParen = createToken({ name: 'RPAREN', pattern: /\)/ });
export const Comma = createToken({ name: 'COMMA', pattern: /,/ });
export const Colon = createToken({ name: 'COLON', pattern: /:/ });

export const HashColor = createToken({ name: 'HASH_COLOR', pattern: /#[\dA-Fa-f]+/ });
export const PlainString = createToken({
  name: 'PLAIN_STRING',
  pattern: /"[^\n\r"]*"|'[^\n\r']*'/,
});
export const CssIdentifier = createToken({
  name: 'CSS_IDENTIFIER',
  pattern: /--[A-Z_a-z][\w-]*|[A-Z_a-z]\w*(?:-\w+)+/,
});
export const CssEscapedComma = createToken({ name: 'CSS_ESCAPED_COMMA', pattern: /\\,/ });
export const Dash = createToken({ name: 'DASH', pattern: /-/ });
export const Dot = createToken({ name: 'DOT', pattern: /\./ });
export const Percent = createToken({ name: 'PERCENT', pattern: /%/ });
export const CssPunctuation = createToken({ name: 'CSS_PUNCTUATION', pattern: /[!#$&*+/=?^_|~]/ });

const defaultModeTokens = [
  Word,
  WhiteSpace,
  MarkdownString,
  UnclosedMarkdownString,
  Comment,
  NewLine,
  AccDescrBlock,
  AccTitleLine,
  AccDescrLine,
  JsonDeclarationStart,
  Usecase,
  Actor,
  SystemBoundary,
  End,
  Direction,
  Td,
  Tb,
  Bt,
  Lr,
  Rl,
  Note,
  For,
  Json,
  ClassDef,
  Class,
  Style,
  Include,
  Extend,
  True,
  False,
  Generalization,
  DependencyArrow,
  StereotypeStart,
  ClassSeparator,
  ForwardSolid,
  BackwardSolid,
  ForwardCircle,
  BackwardCircle,
  ForwardCross,
  BackwardCross,
  MarkerlessSolid,
  MetadataStart,
  At,
  LeftBrace,
  RightBrace,
  LeftBracket,
  RightBracket,
  LeftParen,
  RightParen,
  Comma,
  Colon,
  HashColor,
  PlainString,
  CssIdentifier,
  // IDENTIFIER precedes NUMBER so `1mg` lexes as one id; its longer_alt still hands
  // decimals like `1.5px` to NUMBER.
  Identifier,
  NumberLiteral,
  CssEscapedComma,
  Dash,
  Dot,
  Percent,
  CssPunctuation,
] as const;

export const usecaseLexerModes = {
  defaultMode: 'defaultMode',
  modes: {
    defaultMode: [...defaultModeTokens],
    jsonBody: [JsonObjectLiteral, UnclosedJsonObjectLiteral],
    stereotype: [StereotypeEnd, StereotypeText, UnclosedStereotypeText],
  },
};

/** Flat vocabulary used by the parser; the lexer itself uses the mode table above. */
export const usecaseTokens: TokenType[] = [
  ...defaultModeTokens,
  JsonObjectLiteral,
  UnclosedJsonObjectLiteral,
  StereotypeEnd,
  StereotypeText,
  UnclosedStereotypeText,
];
