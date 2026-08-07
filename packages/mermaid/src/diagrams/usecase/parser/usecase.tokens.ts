import { createToken, Lexer } from 'chevrotain';

export const WhiteSpace = createToken({
  name: 'WS',
  pattern: /[\t ]+/,
  group: Lexer.SKIPPED,
});

export const NewLine = createToken({
  name: 'NEWLINE',
  pattern: /[\n\r]+/,
  line_breaks: true,
});

export const Identifier = createToken({
  name: 'IDENTIFIER',
  pattern: /[A-Z_a-z]\w*/,
});

export const Actor = createToken({ name: 'ACTOR', pattern: /actor/, longer_alt: Identifier });
export const SystemBoundary = createToken({
  name: 'SYSTEM_BOUNDARY',
  pattern: /systemBoundary/,
  longer_alt: Identifier,
});
export const End = createToken({ name: 'END', pattern: /end/, longer_alt: Identifier });
export const Direction = createToken({
  name: 'DIRECTION',
  pattern: /direction/,
  longer_alt: Identifier,
});
export const ClassDef = createToken({
  name: 'CLASS_DEF',
  pattern: /classDef/,
  longer_alt: Identifier,
});
export const Class = createToken({ name: 'CLASS', pattern: /class/, longer_alt: Identifier });
export const Style = createToken({ name: 'STYLE', pattern: /style/, longer_alt: Identifier });
export const Usecase = createToken({ name: 'USECASE', pattern: /usecase/, longer_alt: Identifier });

export const Tb = createToken({ name: 'TB', pattern: /TB/, longer_alt: Identifier });
export const Td = createToken({ name: 'TD', pattern: /TD/, longer_alt: Identifier });
export const Bt = createToken({ name: 'BT', pattern: /BT/, longer_alt: Identifier });
export const Rl = createToken({ name: 'RL', pattern: /RL/, longer_alt: Identifier });
export const Lr = createToken({ name: 'LR', pattern: /LR/, longer_alt: Identifier });

export const Package = createToken({ name: 'PACKAGE', pattern: /package/, longer_alt: Identifier });
export const Rect = createToken({ name: 'RECT', pattern: /rect/, longer_alt: Identifier });
export const Type = createToken({ name: 'TYPE', pattern: /type/, longer_alt: Identifier });

export const SolidArrow = createToken({ name: 'SOLID_ARROW', pattern: /-->/ });
export const BackArrow = createToken({ name: 'BACK_ARROW', pattern: /<--/ });
export const CircleArrow = createToken({ name: 'CIRCLE_ARROW', pattern: /--o/ });
export const CircleArrowReversed = createToken({
  name: 'CIRCLE_ARROW_REVERSED',
  pattern: /o--/,
});
export const CrossArrow = createToken({ name: 'CROSS_ARROW', pattern: /--x/ });
export const CrossArrowReversed = createToken({
  name: 'CROSS_ARROW_REVERSED',
  pattern: /x--/,
});
export const LineSolid = createToken({ name: 'LINE_SOLID', pattern: /--/ });

export const Comma = createToken({ name: 'COMMA', pattern: /,/ });
export const At = createToken({ name: 'AT', pattern: /@/ });
export const LeftBrace = createToken({ name: 'LBRACE', pattern: /{/ });
export const RightBrace = createToken({ name: 'RBRACE', pattern: /}/ });
export const ClassSeparator = createToken({ name: 'CLASS_SEPARATOR', pattern: /:::/ });
export const Colon = createToken({ name: 'COLON', pattern: /:/ });
export const LeftParen = createToken({ name: 'LEFT_PAREN', pattern: /\(/ });
export const RightParen = createToken({ name: 'RIGHT_PAREN', pattern: /\)/ });

export const HashColor = createToken({ name: 'HASH_COLOR', pattern: /#[\dA-Fa-f]+/ });
export const NumberLiteral = createToken({
  name: 'NUMBER',
  pattern: /\d+(?:\.\d+)?(?:[A-Za-z]+)?/,
});
export const StringLiteral = createToken({
  name: 'STRING',
  pattern: /"[^\n\r"]*"|'[^\n\r']*'/,
});
export const Dash = createToken({ name: 'DASH', pattern: /-/ });
export const Dot = createToken({ name: 'DOT', pattern: /\./ });
export const Percent = createToken({ name: 'PERCENT', pattern: /%/ });

/** Token order keeps longer punctuation ahead of its shorter alternatives. */
export const usecaseTokens = [
  WhiteSpace,
  NewLine,
  Actor,
  SystemBoundary,
  End,
  Direction,
  ClassDef,
  Class,
  Style,
  Usecase,
  Tb,
  Td,
  Bt,
  Rl,
  Lr,
  Package,
  Rect,
  Type,
  SolidArrow,
  BackArrow,
  CircleArrow,
  CircleArrowReversed,
  CrossArrow,
  CrossArrowReversed,
  LineSolid,
  Comma,
  At,
  LeftBrace,
  RightBrace,
  ClassSeparator,
  Colon,
  LeftParen,
  RightParen,
  HashColor,
  NumberLiteral,
  Identifier,
  StringLiteral,
  Dash,
  Dot,
  Percent,
];
