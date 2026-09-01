import { createToken, Lexer } from 'chevrotain';
import type { CustomPatternMatcherFunc, TokenType } from 'chevrotain';

function customMatch(text: string, offset: number, image: string): RegExpExecArray {
  const match = [image] as unknown as RegExpExecArray;
  match.index = offset;
  match.input = text;
  return match;
}

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

const matchLine =
  (pattern: RegExp): CustomPatternMatcherFunc =>
  (text, offset) => {
    if (!isIndentedLineStart(text, offset)) {
      return null;
    }
    const match = pattern.exec(text.slice(offset));
    return match ? customMatch(text, offset, match[0]) : null;
  };

const matchComment: CustomPatternMatcherFunc = (text, offset) => {
  if (!isIndentedLineStart(text, offset) || text[offset] !== '%' || text[offset + 1] !== '%') {
    return null;
  }
  let end = offset + 2;
  while (end < text.length && text[end] !== '\n' && text[end] !== '\r') {
    end++;
  }
  return customMatch(text, offset, text.slice(offset, end));
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

export const Word = createToken({ name: 'WORD', pattern: Lexer.NA });

export const WhiteSpace = createToken({
  name: 'HWS',
  pattern: /[\t ]+/,
  group: Lexer.SKIPPED,
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
export const AccTitleLine = createToken({
  name: 'ACC_TITLE_LINE',
  pattern: matchLine(/^accTitle[\t ]*:[^\n\r]*/),
  start_chars_hint: ['a'],
  line_breaks: false,
});
export const AccDescrLine = createToken({
  name: 'ACC_DESCR_LINE',
  pattern: matchLine(/^accDescr[\t ]*:[^\n\r]*/),
  start_chars_hint: ['a'],
  line_breaks: false,
});
export const TitleLine = createToken({
  name: 'TITLE_LINE',
  pattern: matchLine(/^title[\t ]+[^\n\r]*/),
  start_chars_hint: ['t'],
  line_breaks: false,
});

export const Identifier = createToken({
  name: 'IDENTIFIER',
  pattern: /[A-Z_a-z]\w*/,
  categories: Word,
});

const keyword = (name: string, pattern: RegExp) =>
  createToken({ name, pattern, longer_alt: Identifier, categories: Word });

export const TimingDiagram = keyword('TIMING_DIAGRAM', /timingDiagram-beta/);
export const Clock = keyword('CLOCK', /clock/);
export const Binary = keyword('BINARY', /binary/);
export const State = keyword('STATE', /state/);
export const Bus = keyword('BUS', /bus/);
export const Analog = keyword('ANALOG', /analog/);
export const As = keyword('AS', /as/);
export const Period = keyword('PERIOD', /period/);
export const Duty = keyword('DUTY', /duty/);
export const Offset = keyword('OFFSET', /offset/);
export const Min = keyword('MIN', /min/);
export const Max = keyword('MAX', /max/);
export const Interpolation = keyword('INTERPOLATION', /interpolation/);
export const Linear = keyword('LINEAR', /linear/);
export const Step = keyword('STEP', /step/);
export const TimeUnit = keyword('TIME_UNIT', /timeUnit/);
export const At = keyword('AT', /at/);
export const Is = keyword('IS', /is/);

export const StringLiteral = createToken({
  name: 'STRING',
  pattern: /"(?:\\["\\nrt]|[^\n\r"\\])*"|'(?:\\['\\nrt]|[^\n\r'\\])*'/,
});
export const Repeat = createToken({ name: 'REPEAT', pattern: /x(?=\d)/i });
export const NumberLiteral = createToken({
  name: 'NUMBER',
  pattern: /[+-]?(?:\d+(?:\.\d*)?|\.\d+)/,
});
export const Colon = createToken({ name: 'COLON', pattern: /:/ });
export const Comma = createToken({ name: 'COMMA', pattern: /,/ });
export const Percent = createToken({ name: 'PERCENT', pattern: /%/ });

export const timingTokens: TokenType[] = [
  Word,
  WhiteSpace,
  Comment,
  NewLine,
  AccDescrBlock,
  AccTitleLine,
  AccDescrLine,
  TitleLine,
  TimingDiagram,
  Clock,
  Binary,
  State,
  Bus,
  Analog,
  As,
  Period,
  Duty,
  Offset,
  Min,
  Max,
  Interpolation,
  Linear,
  Step,
  TimeUnit,
  At,
  Is,
  StringLiteral,
  Repeat,
  NumberLiteral,
  Colon,
  Comma,
  Percent,
  Identifier,
];
