// cspell:ignore lparen rparen datastore endevent startevent usertask servicetask scripttask

import { createToken, Lexer } from 'chevrotain';
import type { CustomPatternMatcherFunc, TokenType } from 'chevrotain';

function customMatch(text: string, offset: number, image: string): RegExpExecArray {
  const match = [image] as unknown as RegExpExecArray;
  match.index = offset;
  match.input = text;
  return match;
}

/** `%% ...` line comment, only when the `%%` starts a line (after optional indent). */
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

// ---- fundamental tokens -----------------------------------------------------

/** Anything that may appear as a piece of an unquoted flow label. */
export const LabelText = createToken({ name: 'LABEL_TEXT', pattern: Lexer.NA });
export const Word = createToken({ name: 'WORD', pattern: Lexer.NA, categories: LabelText });

export const NumberLiteral = createToken({
  name: 'NUMBER',
  pattern: /(?:\d+\.\d+|\d+|\.\d+)(?:[%A-Za-z]+)?/,
  categories: LabelText,
});
export const Identifier = createToken({
  name: 'IDENTIFIER',
  pattern: /[A-Z_a-z]\w*/,
  categories: Word,
});

export const WhiteSpace = createToken({
  name: 'HWS',
  pattern: /[\t ]+/,
  group: Lexer.SKIPPED,
});
export const Comment = createToken({
  name: 'COMMENT',
  pattern: matchComment,
  start_chars_hint: ['%'],
  group: Lexer.SKIPPED,
  line_breaks: false,
});
export const NewLine = createToken({
  name: 'NEWLINE',
  pattern: /\r\n|\n|\r/,
  line_breaks: true,
});

export const PlainString = createToken({
  name: 'STRING',
  pattern: /"[^\n\r"]*"|'[^\n\r']*'/,
});

// ---- keywords (case-insensitive, synonym-tolerant) --------------------------
// Every keyword is its own token but also a `Word`, so a keyword may still act as
// an unquoted label piece. `longer_alt: Identifier` means a longer word that only
// starts with the keyword (e.g. `starter`) lexes as an identifier, not the keyword.

const kw = (name: string, pattern: RegExp) =>
  createToken({ name, pattern, longer_alt: Identifier, categories: Word });

export const Bpmn = kw('BPMN', /bpmn(?:-beta)?/i);

export const DirLR = kw('DIR_LR', /lr/i);
export const DirRL = kw('DIR_RL', /rl/i);
export const DirTB = kw('DIR_TB', /tb|td/i);
export const DirBT = kw('DIR_BT', /bt/i);

// Events
export const KwStart = kw('START', /start(?:event)?|begin/i);
export const KwIntermediate = kw('INTERMEDIATE', /intermediate/i);
export const KwEnd = kw('END', /end(?:event)?|stop/i);
export const KwMessage = kw('MESSAGE', /message|msg/i);
export const KwTimer = kw('TIMER', /timer|time|clock/i);

// Activities — combined-word synonyms MUST precede the bare `task` keyword.
export const KwUserTask = kw('USER_TASK', /user[ _-]?task/i);
export const KwServiceTask = kw('SERVICE_TASK', /service[ _-]?task/i);
export const KwScriptTask = kw('SCRIPT_TASK', /script[ _-]?task/i);
export const KwTask = kw('TASK', /task|activity|step/i);

// Gateways
export const KwXor = kw('XOR', /xor|exclusive(?:gateway)?|decision/i);
export const KwAnd = kw('AND', /and|parallel(?:gateway)?/i);
export const KwOr = kw('OR', /or|inclusive(?:gateway)?/i);
export const KwEvent = kw('EVENT', /event(?:-?based)?(?:gateway)?/i);

// Containers & data
export const KwPool = kw('POOL', /pool|participant/i);
export const KwLane = kw('LANE', /lane|swimlane/i);
export const KwDataStore = kw('DATASTORE', /datastore|data[ _-]?store/i);
export const KwData = kw('DATA', /data/i);

export const KwDefault = kw('DEFAULT', /default/i);

// ---- flow operators ---------------------------------------------------------
// Longer patterns are matched first at any given offset (Chevrotain longest-match);
// where two patterns tie, declaration order in the mode array decides.
export const SeqArrow = createToken({ name: 'SEQ_ARROW', pattern: /-+>|→/ });
export const MessageArrow = createToken({ name: 'MSG_ARROW', pattern: /=+>|~+>/ });
export const Association = createToken({ name: 'ASSOCIATION', pattern: /-\.-|\.{3}/ });
export const DashStart = createToken({ name: 'DASH_START', pattern: /-{2,}/ });
export const Pipe = createToken({ name: 'PIPE', pattern: /\|/ });
export const Colon = createToken({ name: 'COLON', pattern: /:/ });

export const bpmnDefaultTokens = [
  WhiteSpace,
  Comment,
  NewLine,
  PlainString,
  // multi-char operators before their single-char / prefix cousins
  MessageArrow,
  SeqArrow,
  Association,
  DashStart,
  Pipe,
  Colon,
  // keywords before IDENTIFIER
  Bpmn,
  DirLR,
  DirRL,
  DirTB,
  DirBT,
  KwStart,
  KwIntermediate,
  KwEnd,
  KwMessage,
  KwTimer,
  KwUserTask,
  KwServiceTask,
  KwScriptTask,
  KwTask,
  KwXor,
  KwAnd,
  KwOr,
  KwEvent,
  KwPool,
  KwLane,
  KwDataStore,
  KwData,
  KwDefault,
  Identifier,
  NumberLiteral,
  // NA categories are never matched directly; listed for completeness
] as const;

export const bpmnTokens: TokenType[] = [LabelText, Word, ...bpmnDefaultTokens];

export const bpmnLexerModes = {
  defaultMode: 'defaultMode',
  modes: {
    defaultMode: [...bpmnDefaultTokens],
  },
};
