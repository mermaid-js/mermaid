import { createToken, Lexer } from 'chevrotain';
import type { CustomPatternMatcherFunc, TokenType } from 'chevrotain';
import { BPMN_DIRECTIONS, EVENT_TRIGGERS, TASK_TYPES } from '../types.js';

/**
 * Tokens for the `bpmn-beta` grammar.
 *
 * Nesting is written as indentation, so leading whitespace is a token rather than
 * skipped and newlines terminate a statement. Nothing in this codebase emits
 * INDENT/DEDENT pairs, so `Indent` only reports a width and the tree is rebuilt from
 * those widths later, the way mindmap and treeView do it.
 */

const asMatch = (image: string, offset: number, text: string): RegExpExecArray => {
  const match = [image] as unknown as RegExpExecArray;
  match.index = offset;
  match.input = text;
  return match;
};

const INDENT_PATTERN = /[\t ]+/y;

/** Leading whitespace, and only leading - anywhere else it is ordinary spacing. */
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

// A trailing `-` is excluded so `a-.->b` still lexes its arrow; `a-b` stays one id.
export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[A-Z_a-z]\w*(?:-\w+)*/,
});

/** A keyword wins over an identifier, but only when it is the whole word. */
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

export const Task = keyword('Task', 'task');
export const Subprocess = keyword('Subprocess', 'subprocess');

export const EventGateway = keyword('EventGateway', 'event-gateway');
export const Xor = keyword('Xor', 'xor');
export const And = keyword('And', 'and');
export const Or = keyword('Or', 'or');
export const Complex = keyword('Complex', 'complex');

// `data-store` precedes `data` in the token list below, so the longer keyword wins.
export const DataStore = keyword('DataStore', 'data-store');
export const DataObject = keyword('DataObject', 'data');
export const Annotation = keyword('Annotation', 'note');

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

export const QuotedString = createToken({ name: 'QuotedString', pattern: /"[^\n\r"]*"/ });

// `--(?![->])` keeps a label from swallowing the next arrow: without it
// `a --> b --> c` lexes the middle as one labelled arrow whose label reads `> b`.
export const LabelledArrow = createToken({
  name: 'LabelledArrow',
  pattern: /--(?![>-])[^\n\r]*?--+>/,
});
export const MessageArrow = createToken({ name: 'MessageArrow', pattern: /-\.->/ });
export const Arrow = createToken({ name: 'Arrow', pattern: /--+>/ });

/**
 * Declaration order is priority.
 *
 * `Indent` leads so it beats `WhiteSpace` at a line start, the arrows are longest-first,
 * and every keyword precedes `Identifier` - each keyword's `longer_alt` still hands a
 * longer word such as `starter` or `pools` back to `Identifier`.
 */
export const bpmnTokens: TokenType[] = [
  Indent,
  Newline,
  WhiteSpace,
  Comment,
  LabelledArrow,
  MessageArrow,
  Arrow,
  QuotedString,
  Header,
  Direction,
  Pool,
  Lane,
  Start,
  Intermediate,
  Boundary,
  End,
  Subprocess,
  Task,
  EventGateway,
  Xor,
  And,
  Or,
  Complex,
  DataStore,
  DataObject,
  Annotation,
  Trigger,
  TaskType,
  Identifier,
];
