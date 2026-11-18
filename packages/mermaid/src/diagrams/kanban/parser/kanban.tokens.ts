// cspell:ignore nstr
/**
 * Token definitions for the kanban diagram.
 *
 * These mirror the terminals of the legacy `kanban.jison` grammar one-for-one — same patterns,
 * same ordering, same lexer-state transitions — so that the token stream is identical and the
 * grammar below can stay a direct port of the legacy rules. Chevrotain, like jison with
 * `%options flex` disabled, picks the *first* matching token in declaration order (not the
 * longest), so the order of every mode array is load bearing.
 *
 * The legacy lexer is case-insensitive (`%options case-insensitive`), which only affects the two
 * literal keywords; the character classes are unaffected.
 */
import { createToken, Lexer } from 'chevrotain';

/**
 * `.` in the legacy patterns — every character except a line terminator.
 */
const NOT_LINE_TERMINATOR = /[^\n\r\u2028\u2029]+/;

/**
 * Group for delimiters that only open or close a lexer mode and emit no token of their own --
 * the legacy lexer's `this.begin(...)` / `this.popState()` rules with no `return`.
 *
 * They are routed to a group rather than dropped outright so that {@link modeStackDepth} can tell
 * whether the lexer finished back in its default mode. That matters for parity: the legacy
 * `<<EOF>>` rule exists only in the `INITIAL` state, so an input that runs out inside `@{ ... }`,
 * `::icon(` or a quoted string is a parse error there rather than a terminated statement.
 */
export const MODE_CHANGE_GROUP = 'modeChange';

/* -------------------------------------------------------------------------------------------- */
/* Categories                                                                                     */
/* -------------------------------------------------------------------------------------------- */

/**
 * The legacy lexer returns `NODE_DESCR` from four different rules (plain text, the fallback,
 * inside a quoted string and inside a markdown string). Each needs its own mode transition, so
 * they are separate
 * tokens sharing one category that the grammar consumes.
 */
export const NodeDescr = createToken({ name: 'NodeDescr', pattern: Lexer.NA });

/** Likewise `SHAPE_DATA`, emitted from both the `@{ … }` body and the quoted string inside it. */
export const ShapeData = createToken({ name: 'ShapeData', pattern: Lexer.NA });

/** Likewise `SPACELINE`, emitted both for comments and for blank/whitespace-only lines. */
export const SpaceLine = createToken({ name: 'SpaceLine', pattern: Lexer.NA });

/* -------------------------------------------------------------------------------------------- */
/* Default mode                                                                                   */
/* -------------------------------------------------------------------------------------------- */

/**
 * `@{` — opens the metadata block. The legacy rule clears `yytext` and returns an empty-image
 * `SHAPE_DATA`; Chevrotain forbids empty-image tokens, so this keeps its `@{` image and the
 * visitor simply does not contribute it to the metadata string (concatenating `''` is a no-op).
 */
export const MetadataStart = createToken({
  name: 'MetadataStart',
  pattern: /@{/,
  push_mode: 'shape_data',
});

/**
 * A `%%` comment, together with any whitespace — newlines included — that precedes it.
 * The legacy rule returns this as a `SPACELINE`, i.e. a statement terminator.
 */
export const CommentLine = createToken({
  name: 'CommentLine',
  pattern: /\s*%%[^\n\r\u2028\u2029]*/,
  line_breaks: true,
  categories: [SpaceLine],
});

export const Kanban = createToken({ name: 'Kanban', pattern: /kanban\b/i });

/** `:::` — opens a css-class assignment, which runs to the end of the line. */
export const ClassStart = createToken({
  name: 'ClassStart',
  pattern: /:::/,
  push_mode: 'class_value',
  group: MODE_CHANGE_GROUP,
});

/** `::icon(` — opens an icon reference, which runs to the closing paren. */
export const IconStart = createToken({
  name: 'IconStart',
  pattern: /::icon\(/i,
  push_mode: 'icon_value',
  group: MODE_CHANGE_GROUP,
});

/**
 * A run of whitespace that ends in a newline — a blank (or whitespace-only) line.
 * Declared before {@link NewLine} and {@link SpaceList}, matching the legacy rule order.
 */
export const BlankLine = createToken({
  name: 'BlankLine',
  pattern: /\s+\n/,
  line_breaks: true,
  categories: [SpaceLine],
});

export const NewLine = createToken({ name: 'NewLine', pattern: /\n+/, line_breaks: true });

/**
 * The opening delimiter of a node shape. The alternation order reproduces the legacy rule order,
 * which matters for the two-character forms: `))` must be tried before `)`, and `((` before `(`.
 */
export const NodeDStart = createToken({
  name: 'NodeDStart',
  pattern: /-\)|\(-|\)\)|\)|\(\(|{{|\(|\[/,
  push_mode: 'node',
});

/** Indentation. Its length is the node's level, so the image is significant. */
export const SpaceList = createToken({ name: 'SpaceList', pattern: /\s+/, line_breaks: true });

/**
 * A bare node id. Note that the legacy class excludes neither spaces nor `%`, so an id runs to
 * the end of the line and swallows any trailing `%%` comment — reproduced here deliberately.
 */
export const NodeId = createToken({ name: 'NodeId', pattern: /[^\n()@[{}]+/ });

/* -------------------------------------------------------------------------------------------- */
/* `node` mode — between a shape's opening and closing delimiter                                  */
/* -------------------------------------------------------------------------------------------- */

/** A double quote followed by a backtick, opening a markdown string. Emits nothing itself. */
export const MarkdownStringStart = createToken({
  name: 'MarkdownStringStart',
  pattern: /"`/,
  push_mode: 'markdown_string',
  group: MODE_CHANGE_GROUP,
});

/** `"` — opens a quoted string. Emits nothing; the text inside is the description. */
export const StringStart = createToken({
  name: 'StringStart',
  pattern: /"/,
  push_mode: 'string',
  group: MODE_CHANGE_GROUP,
});

/** The closing delimiter of a node shape. Alternation order mirrors the legacy rule order. */
export const NodeDEnd = createToken({
  name: 'NodeDEnd',
  pattern: /\)\)|\)|]|}}|\(-|-\)|\(\(|\(/,
  pop_mode: true,
});

/** An unquoted description. May span lines — the legacy class does not exclude newlines. */
export const NodeDescrPlain = createToken({
  name: 'NodeDescrPlain',
  pattern: /[^()\]}]+/,
  line_breaks: true,
  categories: [NodeDescr],
});

/**
 * The legacy `.+(?!\(\()` fallback. Only reachable for text starting with a lone `}`, which
 * {@link NodeDescrPlain} excludes and no closing delimiter matches.
 */
export const NodeDescrFallback = createToken({
  name: 'NodeDescrFallback',
  pattern: NOT_LINE_TERMINATOR,
  categories: [NodeDescr],
});

/* -------------------------------------------------------------------------------------------- */
/* `markdown_string` / `string` modes — inside a node description                                 */
/* -------------------------------------------------------------------------------------------- */

export const NodeDescrMarkdown = createToken({
  name: 'NodeDescrMarkdown',
  pattern: /[^"`]+/,
  line_breaks: true,
  categories: [NodeDescr],
});

export const MarkdownStringEnd = createToken({
  name: 'MarkdownStringEnd',
  pattern: /`"/,
  pop_mode: true,
  group: MODE_CHANGE_GROUP,
});

export const NodeDescrString = createToken({
  name: 'NodeDescrString',
  pattern: /[^"]+/,
  line_breaks: true,
  categories: [NodeDescr],
});

export const StringEnd = createToken({
  name: 'StringEnd',
  pattern: /"/,
  pop_mode: true,
  group: MODE_CHANGE_GROUP,
});

/* -------------------------------------------------------------------------------------------- */
/* `shape_data` modes — inside `@{ … }`                                                           */
/* -------------------------------------------------------------------------------------------- */

/** The `"` that opens a quoted value. The legacy lexer emits it as part of the metadata text. */
export const ShapeDataQuoteOpen = createToken({
  name: 'ShapeDataQuoteOpen',
  pattern: /"/,
  push_mode: 'shape_data_string',
  categories: [ShapeData],
});

/** Metadata text. `^` is excluded because the legacy character class lists it. */
export const ShapeDataText = createToken({
  name: 'ShapeDataText',
  pattern: /[^"^}]+/,
  line_breaks: true,
  categories: [ShapeData],
});

/** `}` — closes the metadata block. The legacy rule emits nothing. */
export const ShapeDataEnd = createToken({
  name: 'ShapeDataEnd',
  pattern: /}/,
  pop_mode: true,
  group: MODE_CHANGE_GROUP,
});

/** The `"` that closes a quoted value, also emitted as part of the metadata text. */
export const ShapeDataQuoteClose = createToken({
  name: 'ShapeDataQuoteClose',
  pattern: /"/,
  pop_mode: true,
  categories: [ShapeData],
});

/**
 * The body of a quoted metadata value. The legacy rule rewrites `\n\s*` to `<br/>` before
 * returning it; that rewrite lives in the visitor here — see `normalizeShapeDataString`.
 */
export const ShapeDataStringText = createToken({
  name: 'ShapeDataStringText',
  pattern: /[^"]+/,
  line_breaks: true,
  categories: [ShapeData],
});

/* -------------------------------------------------------------------------------------------- */
/* `class_value` / `icon_value` modes                                                             */
/* -------------------------------------------------------------------------------------------- */

export const Class = createToken({
  name: 'Class',
  pattern: NOT_LINE_TERMINATOR,
  pop_mode: true,
});

/** A `:::` immediately followed by a newline assigns nothing and emits nothing. */
export const ClassEnd = createToken({
  name: 'ClassEnd',
  pattern: /\n/,
  line_breaks: true,
  pop_mode: true,
  group: MODE_CHANGE_GROUP,
});

export const Icon = createToken({ name: 'Icon', pattern: /[^)]+/, line_breaks: true });

export const IconEnd = createToken({
  name: 'IconEnd',
  pattern: /\)/,
  pop_mode: true,
  group: MODE_CHANGE_GROUP,
});

/* -------------------------------------------------------------------------------------------- */
/* Modes                                                                                          */
/* -------------------------------------------------------------------------------------------- */

export const kanbanLexerModes = {
  modes: {
    kanban: [
      MetadataStart,
      CommentLine,
      Kanban,
      ClassStart,
      IconStart,
      BlankLine,
      NewLine,
      NodeDStart,
      SpaceList,
      NodeId,
    ],
    node: [MarkdownStringStart, StringStart, NodeDEnd, NodeDescrPlain, NodeDescrFallback],
    markdown_string: [NodeDescrMarkdown, MarkdownStringEnd],
    string: [NodeDescrString, StringEnd],
    shape_data: [ShapeDataQuoteOpen, ShapeDataText, ShapeDataEnd],
    shape_data_string: [ShapeDataQuoteClose, ShapeDataStringText],
    class_value: [Class, ClassEnd],
    icon_value: [Icon, IconEnd],
  },
  defaultMode: 'kanban',
};

/** Every token, including the `Lexer.NA` categories the grammar consumes. */
export const allTokens = [
  NodeDescr,
  ShapeData,
  SpaceLine,
  ...Object.values(kanbanLexerModes.modes).flat(),
];
