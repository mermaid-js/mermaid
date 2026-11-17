import { createToken, Lexer } from 'chevrotain';
import type { CustomPatternMatcherFunc, TokenType } from 'chevrotain';

function customMatch(text: string, offset: number, image: string): RegExpExecArray {
  const match = [image] as unknown as RegExpExecArray;
  match.index = offset;
  match.input = text;
  return match;
}

const isLineStart = (text: string, offset: number): boolean => {
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

const matchLineStatement = (
  text: string,
  offset: number,
  pattern: RegExp
): RegExpExecArray | null => {
  if (!isLineStart(text, offset)) {
    return null;
  }
  const match = pattern.exec(text.slice(offset));
  return match ? customMatch(text, offset, match[0]) : null;
};

const matchStereotypeText: CustomPatternMatcherFunc = (text, offset) => {
  const end = text.indexOf('>>', offset);
  if (end === -1 || /[\n\r]/.test(text.slice(offset, end))) {
    return null;
  }
  const image = text.slice(offset, end);
  return image.trim() ? customMatch(text, offset, image) : null;
};

export const WhiteSpace = createToken({
  name: 'HWS',
  pattern: /[\t ]+/,
  group: Lexer.SKIPPED,
});
export const Comment = createToken({
  name: 'COMMENT',
  pattern: /%%[^\n\r]*/,
  group: Lexer.SKIPPED,
});
export const NewLine = createToken({
  name: 'NEWLINE',
  pattern: /\r\n|\n|\r/,
  line_breaks: true,
});

const titleLinePattern = /^title[\t ]+[^\n\r]*/;
const accTitleLinePattern = /^accTitle[\t ]*:[^\n\r]*/;
const accDescrLinePattern = /^accDescr[\t ]*:[^\n\r]*/;
const classDefLinePattern = /^classDef[\t ]+[^\n\r]*/;
const classLinePattern = /^class[\t ]+[^\n\r]*/;
const styleLinePattern = /^style[\t ]+[^\n\r]*/;
const noteLinePattern = /^note[\t ]+for[\t ]+[^\n\r]*/;

export const TitleLine = createToken({
  name: 'TITLE_LINE',
  pattern: (text, offset) => matchLineStatement(text, offset, titleLinePattern),
  start_chars_hint: ['t'],
  line_breaks: false,
});
export const AccTitleLine = createToken({
  name: 'ACC_TITLE_LINE',
  pattern: (text, offset) => matchLineStatement(text, offset, accTitleLinePattern),
  start_chars_hint: ['a'],
  line_breaks: false,
});
export const AccDescrLine = createToken({
  name: 'ACC_DESCR_LINE',
  pattern: (text, offset) => matchLineStatement(text, offset, accDescrLinePattern),
  start_chars_hint: ['a'],
  line_breaks: false,
});
export const NoteLine = createToken({
  name: 'NOTE_LINE',
  pattern: (text, offset) => matchLineStatement(text, offset, noteLinePattern),
  start_chars_hint: ['n'],
  line_breaks: false,
});
export const ClassDefLine = createToken({
  name: 'CLASS_DEF_LINE',
  pattern: (text, offset) => matchLineStatement(text, offset, classDefLinePattern),
  start_chars_hint: ['c'],
  line_breaks: false,
});
export const ClassLine = createToken({
  name: 'CLASS_LINE',
  pattern: (text, offset) => matchLineStatement(text, offset, classLinePattern),
  start_chars_hint: ['c'],
  line_breaks: false,
});
export const StyleLine = createToken({
  name: 'STYLE_LINE',
  pattern: (text, offset) => matchLineStatement(text, offset, styleLinePattern),
  start_chars_hint: ['s'],
  line_breaks: false,
});

export const Identifier = createToken({
  name: 'IDENTIFIER',
  // A bare id, or a dotted `Component.port` reference -- one dot segment is
  // enough for the port-qualification syntax this grammar supports.
  pattern: /[A-Z_a-z][\w-]*(?:\.[A-Z_a-z][\w-]*)?/,
});

const keyword = (name: string, pattern: RegExp) =>
  createToken({ name, pattern, longer_alt: Identifier });

export const ComponentBeta = keyword('COMPONENT_BETA', /component-beta/);
export const Direction = keyword('DIRECTION', /direction/);
export const Td = keyword('TD', /TD/);
export const Tb = keyword('TB', /TB/);
export const Bt = keyword('BT', /BT/);
export const Lr = keyword('LR', /LR/);
export const Rl = keyword('RL', /RL/);
export const ComponentKw = keyword('COMPONENT', /component/);
export const InterfaceKw = keyword('INTERFACE', /interface/);
export const PortKw = keyword('PORT', /port/);
export const PackageKw = keyword('PACKAGE', /package/);
export const ActorKw = keyword('ACTOR', /actor/);

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

// Order matters: each of these shares a `--` or `.` prefix with the next, so the
// longer operator has to be tried first or it is swallowed as a prefix match.
export const ProvidesArrow = createToken({ name: 'PROVIDES_ARROW', pattern: /--\(\)/ });
export const RequiresArrow = createToken({ name: 'REQUIRES_ARROW', pattern: /--\(/ });
export const DependencyArrow = createToken({ name: 'DEPENDENCY_ARROW', pattern: /\.\.>/ });
export const AssociationArrow = createToken({ name: 'ASSOCIATION_ARROW', pattern: /-->/ });
export const PlainLink = createToken({ name: 'PLAIN_LINK', pattern: /--/ });

export const ColonLabel = createToken({
  name: 'COLON_LABEL',
  pattern: /:[\t ]*[^\n\r]*/,
});

export const LeftBrace = createToken({ name: 'LBRACE', pattern: /{/ });
export const RightBrace = createToken({ name: 'RBRACE', pattern: /}/ });
export const LeftBracket = createToken({ name: 'LBRACKET', pattern: /\[/ });
export const RightBracket = createToken({ name: 'RBRACKET', pattern: /]/ });

export const QuotedString = createToken({
  name: 'QUOTED_STRING',
  pattern: /"[^\n\r"]*"/,
});

const defaultModeTokens = [
  WhiteSpace,
  Comment,
  NewLine,
  TitleLine,
  AccTitleLine,
  AccDescrLine,
  NoteLine,
  ClassDefLine,
  ClassLine,
  StyleLine,
  ComponentBeta,
  Direction,
  Td,
  Tb,
  Bt,
  Lr,
  Rl,
  ComponentKw,
  InterfaceKw,
  PortKw,
  PackageKw,
  ActorKw,
  StereotypeStart,
  ProvidesArrow,
  RequiresArrow,
  DependencyArrow,
  AssociationArrow,
  PlainLink,
  ColonLabel,
  LeftBrace,
  RightBrace,
  LeftBracket,
  RightBracket,
  QuotedString,
  Identifier,
] as const;

export const componentLexerModes = {
  defaultMode: 'defaultMode',
  modes: {
    defaultMode: [...defaultModeTokens],
    stereotype: [StereotypeEnd, StereotypeText],
  },
};

/** Flat vocabulary used by the parser; the lexer itself uses the mode table above. */
export const componentTokens: TokenType[] = [...defaultModeTokens, StereotypeEnd, StereotypeText];
