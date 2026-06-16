import { createToken, Lexer } from 'chevrotain';
import { AccDescr, AccTitle } from '../../common/parser/commonTokens.js';
// cspell:ignore Composit — mirrors the legacy jison COMPOSIT_STATE token name

/**
 * Chevrotain multi-mode lexer tokens for the state diagram, ported from `stateDiagram.jison`.
 *
 * Design (iteration 2): only constructs that are genuinely context-sensitive use a mode —
 * `state_mode` (after the `state` keyword), `struct_mode` (a composite body `{ … }`), and the note
 * modes. Free-form trailing text (acc/classDef/class/style/scale) is captured as a whole-line token
 * and parsed in the visitor; the accessibility tokens reuse `common/parser` (Chevrotain forbids
 * empty-matching patterns, which the per-value modes would have needed). `%options case-insensitive`
 * → keyword patterns use `/i`.
 */

export { AccDescr, AccTitle };

// ── newlines / whitespace / comments ──
export const NL = createToken({ name: 'NL', pattern: /\n+/, line_breaks: true });
export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[^\S\n]+/,
  group: Lexer.SKIPPED,
});
export const HashComment = createToken({
  name: 'HashComment',
  pattern: /#[^\n]*/,
  group: Lexer.SKIPPED,
});
export const PercentComment = createToken({
  name: 'PercentComment',
  pattern: /%%(?!{)[^\n]*/,
  group: Lexer.SKIPPED,
});

// ── directions (a whole line containing `direction XX`) ──
export const DirectionTB = createToken({
  name: 'DirectionTB',
  pattern: /[^\n]*direction[\t ]+tb[^\n]*/i,
});
export const DirectionBT = createToken({
  name: 'DirectionBT',
  pattern: /[^\n]*direction[\t ]+bt[^\n]*/i,
});
export const DirectionRL = createToken({
  name: 'DirectionRL',
  pattern: /[^\n]*direction[\t ]+rl[^\n]*/i,
});
export const DirectionLR = createToken({
  name: 'DirectionLR',
  pattern: /[^\n]*direction[\t ]+lr[^\n]*/i,
});

// ── diagram header / whole-line statements ──
export const StateDiagram = createToken({
  name: 'StateDiagram',
  pattern: /statediagram(?:-v2)?\s+/i,
  line_breaks: true,
});
export const HideEmpty = createToken({ name: 'HideEmpty', pattern: /hide empty description/i });
export const Scale = createToken({ name: 'Scale', pattern: /scale[\t ]+\d+(?:[\t ]+width)?/i });
export const ClassDef = createToken({
  name: 'ClassDef',
  pattern: /classdef[\t ]+\w+(?:[\t ]+[^\n]*)?/i,
});
export const ClassStmt = createToken({
  name: 'ClassStmt',
  pattern: /class[\t ]+\w+(?:[\t ]*,[\t ]*\w+)*(?:[\t ]+[^\n]*)?/i,
});
export const StyleStmt = createToken({
  name: 'StyleStmt',
  pattern: /style[\t ]+[\w,]+(?:[\t ]+[^\n]*)?/i,
});

// ── keywords entering a mode ──
export const State = createToken({
  name: 'State',
  pattern: /state[\t ]+/i,
  push_mode: 'state_mode',
});
export const Note = createToken({ name: 'Note', pattern: /note[\t ]+/i, push_mode: 'note_mode' });

// ── default-mode keywords / structure ──
export const Click = createToken({ name: 'Click', pattern: /click\b/i });
export const Href = createToken({ name: 'Href', pattern: /href\b/i });
export const DefaultTok = createToken({ name: 'DefaultTok', pattern: /default\b/i });
export const StringTok = createToken({ name: 'StringTok', pattern: /"[^"]*"/ });
export const EdgeState = createToken({ name: 'EdgeState', pattern: /\[\*]/ });
export const Arrow = createToken({ name: 'Arrow', pattern: /-->/ });
export const StyleSeparator = createToken({ name: 'StyleSeparator', pattern: /:::/ });
export const StructStart = createToken({
  name: 'StructStart',
  pattern: /{/,
  push_mode: 'struct_mode',
});
export const Descr = createToken({ name: 'Descr', pattern: /:(?:[^\n:;]|:[^\n:;])+/ });
export const Id = createToken({ name: 'Id', pattern: /[^\s:{-]+/ });

// ── struct_mode only ──
export const StructStop = createToken({ name: 'StructStop', pattern: /}/, pop_mode: true });
export const Concurrent = createToken({ name: 'Concurrent', pattern: /--/ });

// ── state_mode (after `state `) ──
export const Fork = createToken({
  name: 'Fork',
  pattern: /[^\n]*(?:<<fork>>|\[\[fork]])/,
  pop_mode: true,
});
export const Join = createToken({
  name: 'Join',
  pattern: /[^\n]*(?:<<join>>|\[\[join]])/,
  pop_mode: true,
});
export const Choice = createToken({
  name: 'Choice',
  pattern: /[^\n]*(?:<<choice>>|\[\[choice]])/,
  pop_mode: true,
});
export const StateString = createToken({ name: 'StateString', pattern: /"[^"]*"/ });
export const As = createToken({ name: 'As', pattern: /as[\t ]+/i });
export const StateStructStart = createToken({
  name: 'StateStructStart',
  pattern: /{/,
  pop_mode: true,
  push_mode: 'struct_mode',
});
export const StateNL = createToken({
  name: 'StateNL',
  pattern: /\n/,
  pop_mode: true,
  group: Lexer.SKIPPED,
});
export const CompositState = createToken({ name: 'CompositState', pattern: /[^\s{]+/ });

// ── note modes ──
// `note "text" as Id` — a floating note (a no-op in the legacy grammar).
export const FloatingNote = createToken({
  name: 'FloatingNote',
  pattern: /"[^"]*"[\t ]*as[\t ]+[^\n]+/i,
  pop_mode: true,
});
export const LeftOf = createToken({
  name: 'LeftOf',
  pattern: /left of/i,
  pop_mode: true,
  push_mode: 'note_id_mode',
});
export const RightOf = createToken({
  name: 'RightOf',
  pattern: /right of/i,
  pop_mode: true,
  push_mode: 'note_id_mode',
});
export const NoteId = createToken({
  name: 'NoteId',
  pattern: /[^\s:-]+/,
  pop_mode: true,
  push_mode: 'note_text_mode',
});
// Single-line `: text`.
export const NoteTextInline = createToken({
  name: 'NoteTextInline',
  pattern: /[\t ]*:[^\n:;]+/,
  pop_mode: true,
});
// Multiline text up to a line starting with `end note` — `\n` before `end note` is required, so
// `end note` / `send note` appearing mid-text don't terminate it (issue #7089).
export const NoteTextMultiline = createToken({
  name: 'NoteTextMultiline',
  pattern: /[\S\s]*?\n[\t ]*end note/i,
  pop_mode: true,
  line_breaks: true,
});

/** Flat vocabulary for the CstParser (the parser consumes the multi-mode lexer's token stream). */
export const allStateTokens = [
  NL,
  WhiteSpace,
  HashComment,
  PercentComment,
  DirectionTB,
  DirectionBT,
  DirectionRL,
  DirectionLR,
  StateDiagram,
  HideEmpty,
  Scale,
  AccTitle,
  AccDescr,
  ClassDef,
  ClassStmt,
  StyleStmt,
  State,
  Note,
  Click,
  Href,
  DefaultTok,
  StringTok,
  EdgeState,
  Arrow,
  StyleSeparator,
  StructStart,
  StructStop,
  Concurrent,
  Descr,
  Id,
  Fork,
  Join,
  Choice,
  StateString,
  As,
  StateStructStart,
  StateNL,
  CompositState,
  FloatingNote,
  LeftOf,
  RightOf,
  NoteId,
  NoteTextInline,
  NoteTextMultiline,
];
