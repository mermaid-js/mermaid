import { createToken, Lexer } from 'chevrotain';

/**
 * Chevrotain token definitions for the flowchart parser.
 *
 * These are a faithful 1:1 port of the terminals emitted by `flow.jison`'s lexer. The goal is that
 * the Chevrotain lexer produces the *same token stream* (terminal name + image) as the legacy jison
 * lexer, so the grammar can be a near mechanical port of the jison grammar rules. This is verified by
 * `flow.lexer.spec.ts`, which drives the jison lexer as an oracle.
 *
 * Notes on the port:
 * - Each token's `name` matches the jison terminal name (see `parser.terminals_`) so the grammar and
 *   debug output read 1:1 with the legacy grammar.
 * - Where jison emits one terminal from several lexer rules (LINK, START_LINK, EDGE_TEXT, TEXT,
 *   SHAPE_DATA, PIPE), we use a Chevrotain **token category** (an `NA` parent token) so the grammar
 *   still consumes the single terminal while the concrete tokens carry mode transitions / patterns.
 * - jison's `popState` on a shared rule (e.g. `<INITIAL,edgeText>` LINK) can't be expressed as a
 *   single Chevrotain token (a token's `pop_mode` is fixed), so closing variants get their own token
 *   (e.g. `LinkNormalClose`) that share the category.
 * - **Whitespace is significant** in flowcharts: `SPACE` and `NEWLINE` are real grammar tokens, so
 *   (unlike pie/state) the lexer does NOT skip whitespace.
 */

// ---------------------------------------------------------------------------
// Categories (NA parent tokens — never matched directly, only via children)
// ---------------------------------------------------------------------------

export const Link = createToken({ name: 'LINK', pattern: Lexer.NA });
export const StartLink = createToken({ name: 'START_LINK', pattern: Lexer.NA });
export const EdgeText = createToken({ name: 'EDGE_TEXT', pattern: Lexer.NA });
export const TextToken = createToken({ name: 'TEXT', pattern: Lexer.NA });
export const Pipe = createToken({ name: 'PIPE', pattern: Lexer.NA });
export const ShapeData = createToken({ name: 'SHAPE_DATA', pattern: Lexer.NA });

// ---------------------------------------------------------------------------
// NODE_STRING / UNICODE_TEXT. jison is first-match-in-order (NOT longest-match),
// which Chevrotain matches natively: keywords precede NODE_STRING and use a
// trailing `\b` so longer identifiers (`grapher`) stay NODE_STRING.
// ---------------------------------------------------------------------------

// ([A-Za-z0-9!"#$%&'*+.`?\_/] | -(?=[^>\-.]) | =(?!=))+
export const NodeString = createToken({
  name: 'NODE_STRING',
  pattern: /(?:[\w!"#$%&'*+./?\\`]|-(?=[^.>-])|=(?!=))+/,
});

// The giant Unicode letter range from flow.jison (international node ids / labels).
export const UnicodeText = createToken({
  name: 'UNICODE_TEXT',
  pattern:
    /[ªµºÀ-ÖØ-ö]|[ø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷ]|[ͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵ]|[Ϸ-ҁҊ-ԧԱ-Ֆՙա-ևא-ת]|[װ-ײؠ-يٮٯٱ-ۓەۥۦۮ]|[ۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪ]|[ߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠ]|[ࢢ-ࢬऄ-हऽॐक़-ॡॱ-ॷ]|[ॹ-ॿঅ-ঌএঐও-নপ-রল]|[শ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊ]|[ਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹ]|[ਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-ન]|[પ-રલળવ-હઽૐૠૡଅ-ଌ]|[ଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼]|[ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கங]|[சஜஞடணதந-பம-ஹௐ]|[అ-ఌఎ-ఐఒ-నప-ళవ-హఽ]|[ౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳ]|[ವ-ಹಽೞೠೡೱೲഅ-ഌഎ-ഐ]|[ഒ-ഺഽൎൠൡൺ-ൿඅ-ඖක-න]|[ඳ-රලව-ෆก-ะาำเ-ๆກ]|[ຂຄງຈຊຍດ-ທນ-ຟມ-ຣ]|[ລວສຫອ-ະາຳຽເ-ໄໆ]|[ໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪ]|[ဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁ]|[ႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍ]|[ቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰ]|[ኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐ]|[ጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬ]|[ᙯ-ᙿᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑ]|[ᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗ]|[ៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜ]|[ᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖ]|[ᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯ]|[ᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬ]|[ᳮ-ᳱᳵᳶᴀ-ᶿḀ-ἕἘ-Ἕ]|[ἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώ]|[ᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐ]|[ῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿ]|[ₐ-ₜℂℇℊ-ℓℕℙ-ℝℤΩℨ]|[K-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃↄ]|[Ⰰ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲⳳ]|[ⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦ]|[ⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎ]|[ⷐ-ⷖⷘ-ⷞⸯ々〆〱-〵〻〼]|[ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭ]|[ㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌]|[ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫ]|[Ꙁ-ꙮꙿ-ꚗꚠ-ꛥꜗ-ꜟꜢ-ꞈ]|[Ꞌ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠁꠃ-ꠅ]|[ꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻ]|[ꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨ]|[ꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵ]|[ꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴ]|[ꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮ]|[ꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘]|[並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּ]|[טּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽ]|[ﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼ]|[Ａ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏ]|[ￒ-ￗￚ-ￜ]/,
});

// ---------------------------------------------------------------------------
// Whitespace / line structure (significant — not skipped)
// ---------------------------------------------------------------------------

export const NewLine = createToken({ name: 'NEWLINE', pattern: /(?:\r?\n)+/, line_breaks: true });
// jison's SPACE is `\s` (a single whitespace char); we match any RUN of non-newline whitespace —
// incl. unicode spaces like U+00A0 / U+3000 — while letting NEWLINE handle line breaks.
//
// PERF: the pattern is a RUN (`+`), not a single char. A single-char SPACE is O(whitespace) — a
// deeply-indented file (huge3.mmd has 1.6k-space lines) emits hundreds of thousands of SPACE tokens
// and the lexer (`matchLength`) dominates parse time. The run form took huge3's Diagram.fromText
// from ~2900ms to ~30ms with an IDENTICAL parse result: the grammar only uses SPACE as a separator
// (MANY/AT_LEAST_ONE/OPTION), so collapsing runs is parse-equivalent (flow.db-parity.spec.ts and
// flow.parser.spec.ts stay green). flow.lexer.spec.ts collapses consecutive SPACE tokens in BOTH
// streams before its token-for-token comparison with jison (which emits one SPACE per char).
export const Space = createToken({ name: 'SPACE', pattern: /[^\S\n\r]+/ });
export const Semi = createToken({ name: 'SEMI', pattern: /;/ });

// ---------------------------------------------------------------------------
// Accessibility / title — whole-line tokens (reused from common infra).
// NOTE: jison emits these as two terminals (`acc_title` + `acc_title_value`) via a lexer mode whose
// value rule can match the empty string. Chevrotain forbids empty-match tokens, so we capture the
// whole line and split the value in the visitor (a sanctioned deviation; the value granularity does
// not affect the structural grammar). These lines are handled with tolerance in the parity gate.
// ---------------------------------------------------------------------------

export const AccTitle = createToken({
  name: 'acc_title',
  pattern: /accTitle[\t ]*:[\t ]*[^\n\r]*/,
});
export const AccDescr = createToken({
  name: 'acc_descr',
  pattern: /accDescr[\t ]*:[\t ]*[^\n\r]*/,
});
export const AccDescrMultiline = createToken({
  name: 'acc_descr_multiline_value',
  pattern: /accDescr[\t ]*{[^}]*}/,
  line_breaks: true,
});

// ---------------------------------------------------------------------------
// Strings (mode: string) and markdown strings (mode: md_string)
// ---------------------------------------------------------------------------

// <*>["][`]  -> push md_string (no token emitted by jison)
export const MdStringStart = createToken({
  name: 'MD_STRING_START',
  pattern: /"`/,
  push_mode: 'md_string',
  group: Lexer.SKIPPED,
});
// <md_string>[^`"]+
export const MdString = createToken({ name: 'MD_STR', pattern: /[^"`]+/, line_breaks: true });
// <md_string>[`]["]  -> pop (no token emitted by jison)
export const MdStringEnd = createToken({
  name: 'MD_STRING_END',
  pattern: /`"/,
  pop_mode: true,
  group: Lexer.SKIPPED,
});

// <*>["]  -> push string (no token emitted by jison)
export const StringStart = createToken({
  name: 'QUOTE_START',
  pattern: /"/,
  push_mode: 'string',
  group: Lexer.SKIPPED,
});
// <string>[^"]+
export const StringContent = createToken({ name: 'STR', pattern: /[^"]+/, line_breaks: true });
// <string>["]  -> pop (no token emitted by jison)
export const StringEnd = createToken({
  name: 'QUOTE_END',
  pattern: /"/,
  pop_mode: true,
  group: Lexer.SKIPPED,
});

// ---------------------------------------------------------------------------
// Keywords
// ---------------------------------------------------------------------------

// cspell:ignore grapher endx
// jison compiles keyword literals with a trailing `\b` (e.g. `^(?:graph\b)`); the lexer is
// first-match-in-order, so keywords sit before NODE_STRING and a word boundary (not `longer_alt`)
// keeps `grapher`/`styles`/`endx` as NODE_STRING while not over-extending through class chars (`.`).
export const Style = createToken({ name: 'STYLE', pattern: /style\b/ });
export const Default = createToken({ name: 'DEFAULT', pattern: /default\b/ });
export const LinkStyle = createToken({ name: 'LINKSTYLE', pattern: /linkStyle\b/ });
export const Interpolate = createToken({ name: 'INTERPOLATE', pattern: /interpolate\b/ });
export const ClassDef = createToken({ name: 'CLASSDEF', pattern: /classDef\b/ });
export const Class = createToken({ name: 'CLASS', pattern: /class\b/ });

// "href"[\s]
export const Href = createToken({ name: 'HREF', pattern: /href\s/ });

// "call"[\s]+  -> push callbackname (no token emitted by jison; Chevrotain SKIPs it)
export const Call = createToken({
  name: 'CALL',
  pattern: /call\s+/,
  push_mode: 'callbackname',
  group: Lexer.SKIPPED,
  line_breaks: true,
});
// <callbackname>\([\s]*\)  -> pop (empty args, no token)
export const CallbackNameEmptyArgs = createToken({
  name: 'CALLBACKNAME_EMPTY',
  pattern: /\(\s*\)/,
  pop_mode: true,
  group: Lexer.SKIPPED,
  line_breaks: true,
});
// <callbackname>\(  ->  popState (callbackname) then begin callbackargs. jison *replaces* the mode;
// Chevrotain applies pop_mode before push_mode, giving the same net stack (default -> callbackargs),
// so after the closing `)` we are back in `default` (not stuck in `callbackname`).
export const CallbackArgsStart = createToken({
  name: 'CALLBACKARGS_START',
  pattern: /\(/,
  pop_mode: true,
  push_mode: 'callbackargs',
  group: Lexer.SKIPPED,
});
// <callbackname>[^(]*
export const CallbackName = createToken({
  name: 'CALLBACKNAME',
  pattern: /[^(]+/,
  line_breaks: true,
});
// <callbackargs>\)  -> pop
export const CallbackArgsEnd = createToken({
  name: 'CALLBACKARGS_END',
  pattern: /\)/,
  pop_mode: true,
  group: Lexer.SKIPPED,
});
// <callbackargs>[^)]*
export const CallbackArgs = createToken({
  name: 'CALLBACKARGS',
  pattern: /[^)]+/,
  line_breaks: true,
});

// "click"[\s]+  -> push click
export const ClickStart = createToken({
  name: 'CLICK_START',
  pattern: /click\s+/,
  push_mode: 'click',
  group: Lexer.SKIPPED,
  line_breaks: true,
});
// <click>[\s\n]  -> pop (no token)
export const ClickEnd = createToken({
  name: 'CLICK_END',
  pattern: /\s/,
  pop_mode: true,
  group: Lexer.SKIPPED,
  line_breaks: true,
});
// <click>[^\s\n]*  (jison uses *, but Chevrotain needs >=1; click ids are non-empty)
export const Click = createToken({ name: 'CLICK', pattern: /\S+/ });

// graph / flowchart / flowchart-elk / swimlane  -> GRAPH (+ push dir)
export const Graph = createToken({
  name: 'GRAPH',
  pattern: /(?:flowchart-elk|flowchart|swimlane|graph)\b/,
  push_mode: 'dir',
});
export const Subgraph = createToken({ name: 'subgraph', pattern: /subgraph\b/ });
// "end"\b\s*
export const End = createToken({
  name: 'end',
  pattern: /end\b\s*/,
  line_breaks: true,
});

export const LinkTarget = createToken({
  name: 'LINK_TARGET',
  pattern: /(?:_self|_blank|_parent|_top)\b/,
});

// ---------------------------------------------------------------------------
// dir mode (direction after a graph header)
// ---------------------------------------------------------------------------

// <dir>\s*("LR"|"RL"|"TB"|"BT"|"TD"|"BR"|"<"|">"|"^"|"v")
export const Dir = createToken({
  name: 'DIR',
  pattern: /\s*(?:LR|RL|TB|BT|TD|BR|<|>|\^|v)/,
  pop_mode: true,
  line_breaks: true,
});
// <dir>(\r?\n)*\s*\n
export const NoDir = createToken({
  name: 'NODIR',
  pattern: /(?:\r?\n)*[\t ]*\n/,
  pop_mode: true,
  line_breaks: true,
});

// ---------------------------------------------------------------------------
// direction statements (whole-line tokens) — .*direction\s+XX[^\n]*
// ---------------------------------------------------------------------------

export const DirectionTB = createToken({
  name: 'direction_tb',
  pattern: /[^\n]*direction[\t ]+TB[^\n]*/,
});
export const DirectionBT = createToken({
  name: 'direction_bt',
  pattern: /[^\n]*direction[\t ]+BT[^\n]*/,
});
export const DirectionRL = createToken({
  name: 'direction_rl',
  pattern: /[^\n]*direction[\t ]+RL[^\n]*/,
});
export const DirectionLR = createToken({
  name: 'direction_lr',
  pattern: /[^\n]*direction[\t ]+LR[^\n]*/,
});
export const DirectionTD = createToken({
  name: 'direction_td',
  pattern: /[^\n]*direction[\t ]+TD[^\n]*/,
});

// ---------------------------------------------------------------------------
// Identifiers / numbers / punctuation
// ---------------------------------------------------------------------------

// [^\s"]+\@(?=[^{"])
export const LinkId = createToken({ name: 'LINK_ID', pattern: /[^\s"]+@(?=[^"{])/ });

export const Num = createToken({ name: 'NUM', pattern: /\d+/ });
export const StyleSeparator = createToken({ name: 'STYLE_SEPARATOR', pattern: /:::/ });
export const Colon = createToken({ name: 'COLON', pattern: /:/ });
export const Amp = createToken({ name: 'AMP', pattern: /&/ });
export const Comma = createToken({ name: 'COMMA', pattern: /,/ });
export const Mult = createToken({ name: 'MULT', pattern: /\*/ });
export const Brkt = createToken({ name: 'BRKT', pattern: /#/ });

// ---------------------------------------------------------------------------
// Links — full link tokens (LINK) and edge-text starters (START_LINK)
// ---------------------------------------------------------------------------

// <INITIAL,edgeText>\s*[xo<]?\-\-+[-xo>]\s*  (leading/trailing \s* absorbs newlines, jison-faithful)
export const LinkNormal = createToken({
  name: 'LINK_NORMAL',
  pattern: /\s*[<ox]?-{2,}[>ox-]\s*/,
  categories: [Link],
  line_breaks: true,
});
export const LinkNormalClose = createToken({
  name: 'LINK_NORMAL_CLOSE',
  pattern: /\s*[<ox]?-{2,}[>ox-]\s*/,
  categories: [Link],
  pop_mode: true,
  line_breaks: true,
});
// <INITIAL,thickEdgeText>\s*[xo<]?\=\=+[=xo>]\s*
export const LinkThick = createToken({
  name: 'LINK_THICK',
  pattern: /\s*[<ox]?={2,}[=>ox]\s*/,
  categories: [Link],
  line_breaks: true,
});
export const LinkThickClose = createToken({
  name: 'LINK_THICK_CLOSE',
  pattern: /\s*[<ox]?={2,}[=>ox]\s*/,
  categories: [Link],
  pop_mode: true,
  line_breaks: true,
});
// <INITIAL,dottedEdgeText>\s*[xo<]?\-?\.+\-[xo>]?\s*
export const LinkDotted = createToken({
  name: 'LINK_DOTTED',
  pattern: /\s*[<ox]?-?\.+-[>ox]?\s*/,
  categories: [Link],
  line_breaks: true,
});
export const LinkDottedClose = createToken({
  name: 'LINK_DOTTED_CLOSE',
  pattern: /\s*[<ox]?-?\.+-[>ox]?\s*/,
  categories: [Link],
  pop_mode: true,
  line_breaks: true,
});
// <*>\s*\~\~[\~]+\s*
export const LinkInvisible = createToken({
  name: 'LINK_INVISIBLE',
  pattern: /\s*~{3,}\s*/,
  categories: [Link],
  line_breaks: true,
});

// <INITIAL>\s*[xo<]?\-\-\s*  -> push edgeText
export const StartLinkNormal = createToken({
  name: 'START_LINK_NORMAL',
  pattern: /\s*[<ox]?--\s*/,
  categories: [StartLink],
  push_mode: 'edgeText',
  line_breaks: true,
});
// <INITIAL>\s*[xo<]?\=\=\s*  -> push thickEdgeText
export const StartLinkThick = createToken({
  name: 'START_LINK_THICK',
  pattern: /\s*[<ox]?==\s*/,
  categories: [StartLink],
  push_mode: 'thickEdgeText',
  line_breaks: true,
});
// <INITIAL>\s*[xo<]?\-\.\s*  -> push dottedEdgeText
export const StartLinkDotted = createToken({
  name: 'START_LINK_DOTTED',
  pattern: /\s*[<ox]?-\.\s*/,
  categories: [StartLink],
  push_mode: 'dottedEdgeText',
  line_breaks: true,
});

// Edge text (one char at a time, matching jison's char-wise edge text rules)
// <edgeText>[^-]|\-(?!\-)
export const EdgeTextDash = createToken({
  name: 'EDGE_TEXT_DASH',
  pattern: /[^-]|-(?!-)/,
  categories: [EdgeText],
  line_breaks: true,
});
// <thickEdgeText>[^=]|\=(?!=)
export const EdgeTextEq = createToken({
  name: 'EDGE_TEXT_EQ',
  pattern: /[^=]|=(?!=)/,
  categories: [EdgeText],
  line_breaks: true,
});
// <dottedEdgeText>[^.]|\.(?!-)
export const EdgeTextDot = createToken({
  name: 'EDGE_TEXT_DOT',
  pattern: /[^.]|\.(?!-)/,
  categories: [EdgeText],
  line_breaks: true,
});

// ---------------------------------------------------------------------------
// Shape delimiters. Multi-char openers/closers must precede single-char ones.
// Openers are jison `<*>` (available in default + text); closers are `<text>` (pop).
// ---------------------------------------------------------------------------

// (((  ->  push text
export const DoubleCircleStart = createToken({
  name: 'DOUBLECIRCLESTART',
  pattern: /\({3}/,
  push_mode: 'text',
});
// <text>)))  -> pop
export const DoubleCircleEnd = createToken({
  name: 'DOUBLECIRCLEEND',
  pattern: /\){3}/,
  pop_mode: true,
});
// ([  -> push text
export const StadiumStart = createToken({
  name: 'STADIUMSTART',
  pattern: /\(\[/,
  push_mode: 'text',
});
// <text>])  -> pop
export const StadiumEnd = createToken({ name: 'STADIUMEND', pattern: /]\)/, pop_mode: true });
// [[  -> push text
export const SubroutineStart = createToken({
  name: 'SUBROUTINESTART',
  pattern: /\[\[/,
  push_mode: 'text',
});
// <text>]]  -> pop
export const SubroutineEnd = createToken({ name: 'SUBROUTINEEND', pattern: /]]/, pop_mode: true });
// [(  -> push text
export const CylinderStart = createToken({
  name: 'CYLINDERSTART',
  pattern: /\[\(/,
  push_mode: 'text',
});
// <text>)]  -> pop
export const CylinderEnd = createToken({ name: 'CYLINDEREND', pattern: /\)]/, pop_mode: true });
// [|
export const VertexWithPropsStart = createToken({
  name: 'VERTEX_WITH_PROPS_START',
  pattern: /\[\|/,
});
// [/  -> push trapText
export const TrapStart = createToken({ name: 'TRAPSTART', pattern: /\[\//, push_mode: 'trapText' });
// [\  -> push trapText
export const InvTrapStart = createToken({
  name: 'INVTRAPSTART',
  pattern: /\[\\/,
  push_mode: 'trapText',
});
// <trapText>[\](?=\])]  -> pop  (jison: [\\(?=\])][\]] => a backslash before ], then ])
export const TrapEnd = createToken({ name: 'TRAPEND', pattern: /\\]/, pop_mode: true });
// <trapText>\/(?=\])\]  -> pop
export const InvTrapEnd = createToken({ name: 'INVTRAPEND', pattern: /\/]/, pop_mode: true });
// <trapText>\/(?!\])|\\(?!\])|[^\\\[\]\(\)\{\}\/]+
export const TrapText = createToken({
  name: 'TRAP_TEXT',
  pattern: /\/(?!])|\\(?!])|[^()/[\\\]{}]+/,
  categories: [TextToken],
});

// (-  -> push ellipseText  (jison terminal name is the literal `(-`)
export const EllipseStart = createToken({ name: '(-', pattern: /\(-/, push_mode: 'ellipseText' });
// <ellipseText>[-/\)][\)]  -> pop  (jison terminal name is the literal `-)`)
export const EllipseEnd = createToken({ name: '-)', pattern: /[)/-]\)/, pop_mode: true });
// <ellipseText>[^\(\)\[\]\{\}]|-\!\)+
export const EllipseText = createToken({
  name: 'ELLIPSE_TEXT',
  pattern: /[^()[\]{}]|-!\)+/,
  categories: [TextToken],
});

// >  -> push text (odd shape: idString TAGEND text SQE)
export const TagEnd = createToken({ name: 'TAGEND', pattern: />/, push_mode: 'text' });
export const TagStart = createToken({ name: 'TAGSTART', pattern: /</ });

export const Up = createToken({ name: 'UP', pattern: /\^/ });
export const Down = createToken({ name: 'DOWN', pattern: /v\b/ });

export const Minus = createToken({ name: 'MINUS', pattern: /-/ });

// PIPE — open (push text) in default, close (pop) in text. Same terminal (category Pipe).
export const PipeOpen = createToken({
  name: 'PIPE_OPEN',
  pattern: /\|/,
  categories: [Pipe],
  push_mode: 'text',
});
export const PipeClose = createToken({
  name: 'PIPE_CLOSE',
  pattern: /\|/,
  categories: [Pipe],
  pop_mode: true,
});

// ( -> PS push text ; <text>) -> PE pop
export const ParenStart = createToken({ name: 'PS', pattern: /\(/, push_mode: 'text' });
export const ParenEnd = createToken({ name: 'PE', pattern: /\)/, pop_mode: true });
// [ -> SQS push text ; <text>] -> SQE pop
export const SquareStart = createToken({ name: 'SQS', pattern: /\[/, push_mode: 'text' });
export const SquareEnd = createToken({ name: 'SQE', pattern: /]/, pop_mode: true });
// { -> DIAMOND_START push text ; <text>} -> DIAMOND_STOP pop
export const DiamondStart = createToken({ name: 'DIAMOND_START', pattern: /{/, push_mode: 'text' });
export const DiamondStop = createToken({ name: 'DIAMOND_STOP', pattern: /}/, pop_mode: true });

// <text>[^\[\]\(\)\{\}\|\"]+
export const TextContent = createToken({
  name: 'TEXT_CONTENT',
  pattern: /[^"()[\]{|}]+/,
  categories: [TextToken],
  line_breaks: true,
});

// ---------------------------------------------------------------------------
// shapeData (mode: shapeData / shapeDataStr) — @{ ... }
// ---------------------------------------------------------------------------

// \@\{  -> push shapeData. jison returns SHAPE_DATA with yytext="" (empty image); Chevrotain can't
// emit an empty image, so this token carries the image "@{" and the visitor strips that opener when
// concatenating the SHAPE_DATA stream into the metadata. (The one shapeData lexer deviation, excluded
// from the strict lexer-parity corpus; db-parity covers the end result.)
export const ShapeDataStart = createToken({
  name: 'SHAPE_DATA_START',
  pattern: /@{/,
  push_mode: 'shapeData',
  categories: [ShapeData],
});
// <shapeData>["]  -> push shapeDataStr (returns SHAPE_DATA)
export const ShapeDataStringStart = createToken({
  name: 'SHAPE_DATA_STR_START',
  pattern: /"/,
  push_mode: 'shapeDataStr',
  categories: [ShapeData],
});
// <shapeDataStr>["]  -> pop (returns SHAPE_DATA)
export const ShapeDataStringEnd = createToken({
  name: 'SHAPE_DATA_STR_END',
  pattern: /"/,
  pop_mode: true,
  categories: [ShapeData],
});
// <shapeDataStr>[^"]+
export const ShapeDataStringContent = createToken({
  name: 'SHAPE_DATA_STR',
  pattern: /[^"]+/,
  categories: [ShapeData],
  line_breaks: true,
});
// <shapeData>[^}^"]+
export const ShapeDataContent = createToken({
  name: 'SHAPE_DATA_CONTENT',
  pattern: /[^"^}]+/,
  categories: [ShapeData],
  line_breaks: true,
});
// <shapeData>"}"  -> pop (no token)
export const ShapeDataEnd = createToken({
  name: 'SHAPE_DATA_END',
  pattern: /}/,
  pop_mode: true,
  group: Lexer.SKIPPED,
});

// ---------------------------------------------------------------------------
// Dead terminals — consumed by the grammar's `styleComponent` rule but never produced by the lexer
// (the jison `UNIT` / `PCT` style tokens). Declared with NA so the grammar port can mention them.
// ---------------------------------------------------------------------------

export const Unit = createToken({ name: 'UNIT', pattern: Lexer.NA });
export const Pct = createToken({ name: 'PCT', pattern: Lexer.NA });

/**
 * Flat vocabulary for the CstParser (every concrete + category token type). Order is irrelevant for
 * the parser; the per-mode match order lives in `flow.lexer.ts`.
 */
export const allFlowTokens = [
  // categories
  Link,
  StartLink,
  EdgeText,
  TextToken,
  Pipe,
  ShapeData,
  // identifiers
  NodeString,
  UnicodeText,
  // structure
  NewLine,
  Space,
  Semi,
  AccTitle,
  AccDescr,
  AccDescrMultiline,
  // strings
  MdStringStart,
  MdString,
  MdStringEnd,
  StringStart,
  StringContent,
  StringEnd,
  // keywords
  Style,
  Default,
  LinkStyle,
  Interpolate,
  ClassDef,
  Class,
  Href,
  Call,
  CallbackNameEmptyArgs,
  CallbackArgsStart,
  CallbackName,
  CallbackArgsEnd,
  CallbackArgs,
  ClickStart,
  ClickEnd,
  Click,
  Graph,
  Subgraph,
  End,
  LinkTarget,
  Dir,
  NoDir,
  DirectionTB,
  DirectionBT,
  DirectionRL,
  DirectionLR,
  DirectionTD,
  // punctuation / numbers
  LinkId,
  Num,
  StyleSeparator,
  Colon,
  Amp,
  Comma,
  Mult,
  Brkt,
  // links
  LinkNormal,
  LinkNormalClose,
  LinkThick,
  LinkThickClose,
  LinkDotted,
  LinkDottedClose,
  LinkInvisible,
  StartLinkNormal,
  StartLinkThick,
  StartLinkDotted,
  EdgeTextDash,
  EdgeTextEq,
  EdgeTextDot,
  // shapes
  DoubleCircleStart,
  DoubleCircleEnd,
  StadiumStart,
  StadiumEnd,
  SubroutineStart,
  SubroutineEnd,
  CylinderStart,
  CylinderEnd,
  VertexWithPropsStart,
  TrapStart,
  InvTrapStart,
  TrapEnd,
  InvTrapEnd,
  TrapText,
  EllipseStart,
  EllipseEnd,
  EllipseText,
  TagEnd,
  TagStart,
  Up,
  Down,
  Minus,
  PipeOpen,
  PipeClose,
  ParenStart,
  ParenEnd,
  SquareStart,
  SquareEnd,
  DiamondStart,
  DiamondStop,
  TextContent,
  // shapeData
  ShapeDataStart,
  ShapeDataStringStart,
  ShapeDataStringEnd,
  ShapeDataStringContent,
  ShapeDataContent,
  ShapeDataEnd,
  // dead terminals (consumed by styleComponent, never lexed)
  Unit,
  Pct,
];
