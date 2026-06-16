import { Lexer } from 'chevrotain';
import * as t from './state.tokens.js';

/**
 * Multi-mode state-diagram lexer. `default` is the top level; `struct_mode` is a composite body
 * `{ … }` (adds `--`/`}`); `state_mode` follows the `state` keyword; the `note_*` modes capture a
 * note's position / id / free-form text. Acc/classDef/class/style/scale are whole-line tokens in the
 * top modes (no mode needed).
 */
const topModeTokens = [
  t.NL,
  t.WhiteSpace,
  t.HashComment,
  t.PercentComment,
  t.DirectionTB,
  t.DirectionBT,
  t.DirectionRL,
  t.DirectionLR,
  t.StateDiagram,
  t.HideEmpty,
  t.Scale,
  t.AccTitle,
  t.AccDescr,
  t.ClassDef,
  t.ClassStmt,
  t.StyleStmt,
  t.State,
  t.Note,
  t.Click,
  t.Href,
  t.DefaultTok,
  t.StringTok,
  t.EdgeState,
  t.Arrow,
  t.StyleSeparator,
];

export const stateLexer = new Lexer({
  defaultMode: 'default',
  modes: {
    default: [...topModeTokens, t.StructStart, t.Descr, t.Id],
    struct_mode: [...topModeTokens, t.StructStop, t.StructStart, t.Concurrent, t.Descr, t.Id],
    state_mode: [
      t.WhiteSpace,
      t.HashComment,
      t.PercentComment,
      t.Fork,
      t.Join,
      t.Choice,
      t.StateString,
      t.As,
      t.StateStructStart,
      t.StateNL,
      t.CompositState,
    ],
    note_mode: [t.WhiteSpace, t.FloatingNote, t.LeftOf, t.RightOf],
    note_id_mode: [t.WhiteSpace, t.NoteId],
    note_text_mode: [t.NoteTextInline, t.NoteTextMultiline],
  },
});
