import { createToken, Lexer } from 'chevrotain';
import type { CustomPatternMatcherFunc, TokenType } from 'chevrotain';
import { BPMN_DIRECTIONS, EVENT_TRIGGERS, TASK_TYPES } from '../types.js';

const asMatch = (image: string, offset: number, text: string): RegExpExecArray => {
  const match = [image] as unknown as RegExpExecArray;
  match.index = offset;
  match.input = text;
  return match;
};

const INDENT_PATTERN = /[\t ]+/y;

const matchIndent: CustomPatternMatcherFunc = (text, offset) => {
  if (offset > 0 && text[offset - 1] !== '\n' && text[offset - 1] !== '\r') {
    return null;
  }
  INDENT_PATTERN.lastIndex = offset;
  const match = INDENT_PATTERN.exec(text);
  return match ? asMatch(match[0], offset, text) : null;
};

export const Indent = createToken({
  name: 'Indent',
  pattern: matchIndent,
  line_breaks: false,
  start_chars_hint: ['\t', ' '],
});

export const Newline = createToken({ name: 'Newline', pattern: /\r\n|\n|\r/, line_breaks: true });
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

export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[A-Z_a-z]\w*(?:-\w+)*/,
});

const keyword = (name: string, literal: string) =>
  createToken({
    name,
    pattern: new RegExp(literal.replaceAll('-', '\\-')),
    longer_alt: Identifier,
  });

const alternation = (words: readonly string[]) => new RegExp(words.join('|'));

export const Header = createToken({
  name: 'Header',
  pattern: /bpmn-beta/,
  longer_alt: Identifier,
});
export const Direction = createToken({
  name: 'Direction',
  pattern: alternation(BPMN_DIRECTIONS),
  longer_alt: Identifier,
});

export const Pool = keyword('Pool', 'pool');
export const Lane = keyword('Lane', 'lane');

export const Start = keyword('Start', 'start');
export const Intermediate = keyword('Intermediate', 'intermediate');
export const Boundary = keyword('Boundary', 'boundary');
export const End = keyword('End', 'end');

export const Throw = keyword('Throw', 'throw');

export const Task = keyword('Task', 'task');
export const Subprocess = keyword('Subprocess', 'subprocess');

export const Call = keyword('Call', 'call');

export const EventGateway = keyword('EventGateway', 'event-gateway');
export const Xor = keyword('Xor', 'xor');
export const And = keyword('And', 'and');
export const Or = keyword('Or', 'or');
export const Complex = keyword('Complex', 'complex');

export const DataStore = keyword('DataStore', 'data-store');

export const DataCollection = keyword('DataCollection', 'data-collection');

export const DataInput = keyword('DataInput', 'data-input');

export const DataOutput = keyword('DataOutput', 'data-output');
export const DataObject = keyword('DataObject', 'data');
export const Annotation = keyword('Annotation', 'note');

export const Group = keyword('Group', 'group');

export const Trigger = createToken({
  name: 'Trigger',
  pattern: alternation(EVENT_TRIGGERS),
  longer_alt: Identifier,
});
export const TaskType = createToken({
  name: 'TaskType',
  pattern: alternation(TASK_TYPES),
  longer_alt: Identifier,
});

export const Title = createToken({
  name: 'Title',
  pattern: /title[\t ]+[^\n\r]*/,
  longer_alt: Identifier,
});
export const AccTitle = createToken({ name: 'AccTitle', pattern: /accTitle[\t ]*:[^\n\r]*/ });
export const AccDescrMultiline = createToken({
  name: 'AccDescrMultiline',
  pattern: /accDescr[\t ]*{[^}]*}/,
  line_breaks: true,
});
export const AccDescr = createToken({ name: 'AccDescr', pattern: /accDescr[\t ]*:[^\n\r]*/ });

export const QuotedString = createToken({ name: 'QuotedString', pattern: /"[^\n\r"]*"/ });

export const LabelledArrow = createToken({
  name: 'LabelledArrow',
  pattern: /--(?![>-])[^\n\r]*?--+>/,
});
export const MessageArrow = createToken({ name: 'MessageArrow', pattern: /-\.->/ });
export const Arrow = createToken({ name: 'Arrow', pattern: /--+>/ });

export const AssociationArrow = createToken({ name: 'AssociationArrow', pattern: /\.\.+>/ });

export const AssociationLine = createToken({ name: 'AssociationLine', pattern: /\.\.\.+/ });

export const bpmnTokens: TokenType[] = [
  Indent,
  Newline,
  WhiteSpace,
  Comment,
  LabelledArrow,
  MessageArrow,
  Arrow,
  AssociationArrow,
  AssociationLine,
  Title,
  AccTitle,
  AccDescrMultiline,
  AccDescr,
  QuotedString,
  Header,
  Direction,
  Pool,
  Lane,
  Start,
  Intermediate,
  Boundary,
  End,
  Throw,
  Subprocess,
  Task,
  Call,
  EventGateway,
  Xor,
  And,
  Or,
  Complex,
  DataStore,
  DataCollection,
  DataInput,
  DataOutput,
  DataObject,
  Annotation,
  Group,
  Trigger,
  TaskType,
  Identifier,
];
