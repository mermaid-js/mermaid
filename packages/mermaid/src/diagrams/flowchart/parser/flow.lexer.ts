import { Lexer } from 'chevrotain';
import * as t from './flow.tokens.js';

/**
 * Multi-mode Chevrotain lexer for the flowchart parser.
 *
 * Mirrors the 18 active jison start-conditions. jison's lexer is **first-match-in-rule-order** (not
 * longest-match), which Chevrotain matches natively — so longer / more-specific patterns are listed
 * first within each mode, keywords carry a trailing `\b`, and single-char punctuation that is also a
 * NODE_STRING char (`#`,`&`,`*`) precedes NODE_STRING. Verified token-for-token against the jison
 * lexer by `flow.lexer.spec.ts`.
 */

// jison `<*>` openers — available in every label-bearing mode (default + text + ellipse + trap).
// NOTE: `@{` (shape data), `[|` (vertex-with-props) and `>` (odd shape) are NOT `<*>` in jison —
// they are INITIAL-only, so they live only in the default mode below.
const universalOpeners = [
  t.MdStringStart, // "`
  t.StringStart, // "
  t.DoubleCircleStart, // (((  — multi-char `(` openers before single `(`
  t.StadiumStart, // ([
  t.EllipseStart, // (-
  t.CylinderStart, // [(  — multi-char `[` openers before single `[`
  t.SubroutineStart, // [[
  t.TrapStart, // [/
  t.InvTrapStart, // [\
  t.LinkInvisible, // <*> ~~~
  t.ParenStart, // (
  t.SquareStart, // [
  t.DiamondStart, // {
];

export const flowLexer = new Lexer({
  defaultMode: 'default',
  modes: {
    default: [
      // accessibility / titles (whole-line; must precede identifiers)
      t.AccDescrMultiline,
      t.AccDescr,
      t.AccTitle,
      // direction statements (.*direction XX — whole line, beats NODE_STRING/SPACE)
      t.DirectionTB,
      t.DirectionBT,
      t.DirectionRL,
      t.DirectionLR,
      t.DirectionTD,
      // strings (quote is in the NODE_STRING class, so these must precede NODE_STRING)
      t.MdStringStart,
      t.StringStart,
      // cspell:ignore grapher
      // keywords (before NODE_STRING; trailing `\b` defers `grapher`/`styles` to NODE_STRING)
      t.ClassDef, // before Class (prefix)
      t.Class,
      t.Style,
      t.Default,
      t.LinkStyle,
      t.Interpolate,
      t.Href,
      t.Call, // skipped + push callbackname
      t.ClickStart, // skipped + push click
      t.Graph, // + push dir
      t.Subgraph,
      t.End,
      t.LinkTarget,
      t.Down, // lone `v` -> DOWN (before NODE_STRING)
      // link ids + links (links absorb surrounding whitespace incl. newlines -> before NEWLINE)
      t.LinkId,
      t.LinkNormal,
      t.LinkThick,
      t.LinkDotted,
      t.LinkInvisible,
      t.StartLinkNormal,
      t.StartLinkThick,
      t.StartLinkDotted,
      // single-char punctuation that is ALSO a NODE_STRING char — must precede NODE_STRING so a
      // *leading* #/&/* tokenizes as BRKT/AMP/MULT, while mid/trailing ones stay in NODE_STRING.
      t.Amp,
      t.Brkt,
      t.Mult,
      // numbers / identifiers
      t.Num,
      t.NodeString,
      t.UnicodeText,
      // shape openers (default-only ones first, then the universal set)
      t.ShapeDataStart, // @{  (INITIAL-only)
      t.VertexWithPropsStart, // [|  (INITIAL-only)
      t.DoubleCircleStart,
      t.StadiumStart,
      t.EllipseStart,
      t.CylinderStart,
      t.SubroutineStart,
      t.TrapStart,
      t.InvTrapStart,
      t.ParenStart,
      t.SquareStart,
      t.DiamondStart,
      // punctuation
      t.StyleSeparator, // ::: before :
      t.Colon,
      t.Comma,
      t.TagEnd, // > (push text) — INITIAL-only
      t.TagStart, // <
      t.Up, // ^
      t.PipeOpen, // | (push text) — jison returns PIPE (SEP is dead)
      t.Minus,
      // trailing whitespace / separators (after links so links win leading ws)
      t.Semi,
      t.Space,
      t.NewLine,
    ],

    // string / markdown string content
    string: [t.StringEnd, t.StringContent],
    md_string: [t.MdStringEnd, t.MdString],

    // graph header direction
    dir: [t.Dir, t.NoDir],

    // label text inside shapes
    text: [
      // multi-char closers before openers / single-char closers
      t.DoubleCircleEnd, // )))
      t.CylinderEnd, // )]
      t.StadiumEnd, // ])
      t.SubroutineEnd, // ]]
      ...universalOpeners,
      // single-char closers (pop)
      t.PipeClose, // |
      t.ParenEnd, // )
      t.SquareEnd, // ]
      t.DiamondStop, // }
      // catch-all text
      t.TextContent,
    ],

    // ellipse / trapezoid content (universal openers are active here too — jison `<*>`)
    ellipseText: [t.EllipseEnd, ...universalOpeners, t.EllipseText],
    trapText: [t.TrapEnd, t.InvTrapEnd, ...universalOpeners, t.TrapText],

    // edge label text (closing link pops; strings allowed)
    edgeText: [t.LinkNormalClose, t.MdStringStart, t.StringStart, t.EdgeTextDash],
    thickEdgeText: [t.LinkThickClose, t.MdStringStart, t.StringStart, t.EdgeTextEq],
    dottedEdgeText: [t.LinkDottedClose, t.MdStringStart, t.StringStart, t.EdgeTextDot],

    // interactivity
    click: [t.ClickEnd, t.Click],
    callbackname: [t.CallbackNameEmptyArgs, t.CallbackArgsStart, t.CallbackName],
    callbackargs: [t.CallbackArgsEnd, t.CallbackArgs],

    // shape data @{ ... }
    shapeData: [t.ShapeDataStringStart, t.ShapeDataEnd, t.ShapeDataContent],
    shapeDataStr: [t.ShapeDataStringEnd, t.ShapeDataStringContent],
  },
});
