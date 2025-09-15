lexer grammar FlowLexer;

// Virtual tokens for parser
tokens {
    NODIR, DIR, PIPE, PE, SQE, DIAMOND_STOP, STADIUMEND, SUBROUTINEEND, CYLINDEREND, DOUBLECIRCLEEND,
    ELLIPSE_END_TOKEN, TRAPEND, INVTRAPEND, PS, SQS, TEXT, CIRCLEEND, STR, CALLBACKARGS
}

// Lexer modes to match Jison's state-based lexing
// Based on Jison: %x string, md_string, acc_title, acc_descr, acc_descr_multiline, dir, vertex, text, etc.

// Shape data tokens - MUST be defined FIRST for absolute precedence over LINK_ID
// Match exactly "@{" like Jison does (no whitespace allowed between @ and {)
SHAPE_DATA_START: '@{' -> pushMode(SHAPE_DATA_MODE);

// Accessibility tokens
ACC_TITLE: 'accTitle' WS* ':' WS* -> pushMode(ACC_TITLE_MODE);
ACC_DESCR: 'accDescr' WS* ':' WS* -> pushMode(ACC_DESCR_MODE);
ACC_DESCR_MULTI: 'accDescr' WS* '{' WS* -> pushMode(ACC_DESCR_MULTILINE_MODE);

// Interactivity tokens
CALL: 'call' WS+ -> pushMode(CALLBACKNAME_MODE);
HREF: 'href' WS;
// CLICK token - matches 'click' + whitespace + node ID (like Jison)
CLICK: 'click' WS+ [A-Za-z0-9_]+ -> pushMode(CLICK_MODE);

// Graph declaration tokens - these trigger direction mode
GRAPH: ('flowchart-elk' | 'graph' | 'flowchart') -> pushMode(DIR_MODE);
SUBGRAPH: 'subgraph';
END: 'end';

// Link targets
LINK_TARGET: ('_self' | '_blank' | '_parent' | '_top');

// Style and class tokens
STYLE: 'style';
DEFAULT: 'default';
LINKSTYLE: 'linkStyle';
INTERPOLATE: 'interpolate';
CLASSDEF: 'classDef';
CLASS: 'class';

// String tokens - must come early to avoid conflicts with QUOTE
MD_STRING_START: '"`' -> pushMode(MD_STRING_MODE);

// Direction tokens - matches Jison's direction_tb, direction_bt, etc.
// These handle "direction TB", "direction BT", etc. statements within subgraphs
DIRECTION_TB: 'direction' WS+ 'TB' ~[\n]*;
DIRECTION_BT: 'direction' WS+ 'BT' ~[\n]*;
DIRECTION_RL: 'direction' WS+ 'RL' ~[\n]*;
DIRECTION_LR: 'direction' WS+ 'LR' ~[\n]*;

// ELLIPSE_START must come very early to avoid conflicts with PAREN_START
ELLIPSE_START: '(-' -> pushMode(ELLIPSE_TEXT_MODE);

// Link ID token - matches edge IDs like "e1@" when followed by link patterns
// Uses a negative lookahead pattern to match the Jison lookahead (?=[^\{\"])
// This prevents LINK_ID from matching "e1@{" and allows SHAPE_DATA_START to match "@{" correctly
// The pattern matches any non-whitespace followed by @ but only when NOT followed by { or "
LINK_ID: ~[ \t\r\n"]+ '@' {this.inputStream.LA(1) != '{'.charCodeAt(0) && this.inputStream.LA(1) != '"'.charCodeAt(0)}?;

NUM: [0-9]+;
BRKT: '#';
STYLE_SEPARATOR: ':::';
COLON: ':';
AMP: '&';
SEMI: ';';
COMMA: ',';
MULT: '*';

// Edge patterns - these are complex in Jison, need careful translation
// Normal edges without text: A-->B (matches Jison: \s*[xo<]?\-\-+[-xo>]\s*) - must come first to avoid conflicts
LINK_NORMAL: WS* [xo<]? '--' '-'* [-xo>] WS*;
// Normal edges with text: A-- text ---B (matches Jison: <INITIAL>\s*[xo<]?\-\-\s* -> START_LINK)
START_LINK_NORMAL: WS* [xo<]? '--' WS+ -> pushMode(EDGE_TEXT_MODE);
// Normal edges with text (no space): A--text---B - match -- followed by any non-dash character
START_LINK_NORMAL_NOSPACE: WS* [xo<]? '--' -> pushMode(EDGE_TEXT_MODE);
// Pipe-delimited edge text: A--x| (linkStatement for arrowText) - matches Jison linkStatement pattern
LINK_STATEMENT_NORMAL: WS* [xo<]? '--' '-'* [xo<]?;

// Thick edges with text: A== text ===B (matches Jison: <INITIAL>\s*[xo<]?\=\=\s* -> START_LINK)
START_LINK_THICK: WS* [xo<]? '==' WS+ -> pushMode(THICK_EDGE_TEXT_MODE);
// Thick edges without text: A==>B (matches Jison: \s*[xo<]?\=\=+[=xo>]\s*)
LINK_THICK: WS* [xo<]? '==' '='* [=xo>] WS*;
LINK_STATEMENT_THICK: WS* [xo<]? '==' '='* [xo<]?;

// Dotted edges with text: A-. text .->B (matches Jison: <INITIAL>\s*[xo<]?\-\.\s* -> START_LINK)
START_LINK_DOTTED: WS* [xo<]? '-.' WS* -> pushMode(DOTTED_EDGE_TEXT_MODE);
// Dotted edges without text: A-.->B (matches Jison: \s*[xo<]?\-?\.+\-[xo>]?\s*)
LINK_DOTTED: WS* [xo<]? '-' '.'+ '-' [xo>]? WS*;
LINK_STATEMENT_DOTTED: WS* [xo<]? '-' '.'+ [xo<]?;

// Special link
LINK_INVISIBLE: WS* '~~' '~'+ WS*;

// PIPE handling: push to TEXT_MODE to handle content between pipes
// Put this AFTER link patterns to avoid interference with edge parsing
PIPE: '|' -> pushMode(TEXT_MODE);

// Vertex shape tokens - MUST come first (longer patterns before shorter ones)
DOUBLECIRCLE_START: '(((' -> pushMode(TEXT_MODE);
CIRCLE_START: '((' -> pushMode(TEXT_MODE);
// ELLIPSE_START moved to top of file for precedence

// Basic shape tokens - shorter patterns after longer ones
SQUARE_START: '[' -> pushMode(TEXT_MODE), type(SQS);
// PAREN_START must come AFTER ELLIPSE_START to avoid consuming '(' before '(-' can match
PAREN_START: '(' -> pushMode(TEXT_MODE), type(PS);
DIAMOND_START: '{' -> pushMode(TEXT_MODE);
// PIPE_START removed - conflicts with PIPE token. Context-sensitive pipe handling in TEXT_MODE
STADIUM_START: '([' -> pushMode(TEXT_MODE);
SUBROUTINE_START: '[[' -> pushMode(TEXT_MODE);
VERTEX_WITH_PROPS_START: '[|';
CYLINDER_START: '[(' -> pushMode(TEXT_MODE);
TRAP_START: '[/' -> pushMode(TRAP_TEXT_MODE);
INVTRAP_START: '[\\' -> pushMode(TRAP_TEXT_MODE);

// Other basic shape tokens
TAGSTART: '<';
TAGEND: '>' -> pushMode(TEXT_MODE);
UP: '^';
DOWN: 'v';
MINUS: '-';

// Node string - allow dashes with lookahead to prevent conflicts with links (matches Jison pattern)
// Pattern: ([A-Za-z0-9!"\#$%&'*+\.`?\\_\/]|\-(?=[^\>\-\.])|=(?!=))+
// Fixed: Use positive lookahead instead of consuming the following character
NODE_STRING: ([A-Za-z0-9!"#$%&'*+.`?\\/_] | '-' {this.inputStream.LA(1) != '>'.charCodeAt(0) && this.inputStream.LA(1) != '-'.charCodeAt(0) && this.inputStream.LA(1) != '.'.charCodeAt(0)}? | '=' ~'=')+;

// Unicode text support (simplified from Jison's extensive Unicode ranges)
UNICODE_TEXT: [\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE]+;

// String handling - matches Jison's <*>["] behavior (any mode can enter string mode)
QUOTE: '"' -> pushMode(STRING_MODE), skip;

NEWLINE: ('\r'? '\n')+;
WS: [ \t]+;

// Lexer modes
mode ACC_TITLE_MODE;
ACC_TITLE_VALUE: (~[\n;#])* -> popMode;

mode ACC_DESCR_MODE;
ACC_DESCR_VALUE: (~[\n;#])* -> popMode;

mode ACC_DESCR_MULTILINE_MODE;
ACC_DESCR_MULTILINE_END: '}' -> popMode;
ACC_DESCR_MULTILINE_VALUE: (~[}])*;

mode SHAPE_DATA_MODE;
SHAPE_DATA_STRING_START: '"' -> pushMode(SHAPE_DATA_STRING_MODE);
SHAPE_DATA_CONTENT: (~[}"]+);
SHAPE_DATA_END: '}' -> popMode;

mode SHAPE_DATA_STRING_MODE;
SHAPE_DATA_STRING_END: '"' -> popMode;
SHAPE_DATA_STRING_CONTENT: (~["]+);

mode CALLBACKNAME_MODE;
// Simplified approach: match the entire callback with arguments as one token
CALLBACKNAME_WITH_ARGS: [A-Za-z0-9_]+ '(' (~[)])* ')' -> popMode, type(CALLBACKARGS);
CALLBACKNAME_PAREN_EMPTY: '(' WS* ')' -> popMode, type(CALLBACKARGS);
CALLBACKNAME: [A-Za-z0-9_]+;

mode CLICK_MODE;
CLICK_NEWLINE: ('\r'? '\n')+ -> popMode, type(NEWLINE);
CLICK_WS: WS -> skip;
CLICK_CALL: 'call' WS+ -> type(CALL), pushMode(CALLBACKNAME_MODE);
CLICK_HREF: 'href' -> type(HREF);
CLICK_STR: '"' (~["])* '"' -> type(STR);
CLICK_LINK_TARGET: ('_self' | '_blank' | '_parent' | '_top') -> type(LINK_TARGET);
CLICK_CALLBACKNAME: [A-Za-z0-9_]+ -> type(CALLBACKNAME);



mode DIR_MODE;
DIR_NEWLINE: ('\r'? '\n')* WS* '\n' -> popMode, type(NODIR);
DIR_LR: WS* 'LR' -> popMode, type(DIR);
DIR_RL: WS* 'RL' -> popMode, type(DIR);
DIR_TB: WS* 'TB' -> popMode, type(DIR);
DIR_BT: WS* 'BT' -> popMode, type(DIR);
DIR_TD: WS* 'TD' -> popMode, type(DIR);
DIR_BR: WS* 'BR' -> popMode, type(DIR);
DIR_LEFT: WS* '<' -> popMode, type(DIR);
DIR_RIGHT: WS* '>' -> popMode, type(DIR);
DIR_UP: WS* '^' -> popMode, type(DIR);
DIR_DOWN: WS* 'v' -> popMode, type(DIR);

mode STRING_MODE;
STRING_END: '"' -> popMode, skip;
STR: (~["]+);

mode MD_STRING_MODE;
MD_STRING_END: '`"' -> popMode;
MD_STR: (~[`"])+;

mode TEXT_MODE;
// Allow nested diamond starts (for hexagon nodes)
TEXT_DIAMOND_START: '{' -> pushMode(TEXT_MODE), type(DIAMOND_START);

// Handle nested parentheses and brackets like Jison
TEXT_PAREN_START: '(' -> pushMode(TEXT_MODE), type(PS);
TEXT_SQUARE_START: '[' -> pushMode(TEXT_MODE), type(SQS);

// Handle quoted strings in text mode - matches Jison's <*>["] behavior
// Skip the opening quote token, just push to STRING_MODE like Jison does
TEXT_STRING_START: '"' -> pushMode(STRING_MODE), skip;

// Handle closing pipe in text mode - pop back to default mode
TEXT_PIPE_END: '|' -> popMode, type(PIPE);

TEXT_PAREN_END: ')' -> popMode, type(PE);
TEXT_SQUARE_END: ']' -> popMode, type(SQE);
TEXT_DIAMOND_END: '}' -> popMode, type(DIAMOND_STOP);
TEXT_STADIUM_END: '])' -> popMode, type(STADIUMEND);
TEXT_SUBROUTINE_END: ']]' -> popMode, type(SUBROUTINEEND);
TEXT_CYLINDER_END: ')]' -> popMode, type(CYLINDEREND);
TEXT_DOUBLECIRCLE_END: ')))' -> popMode, type(DOUBLECIRCLEEND);
TEXT_CIRCLE_END: '))' -> popMode, type(CIRCLEEND);
// Now allow all characters except the specific end tokens for this mode
TEXT_CONTENT: (~[(){}|\]"])+;

mode ELLIPSE_TEXT_MODE;
ELLIPSE_END: '-)' -> popMode, type(ELLIPSE_END_TOKEN);
ELLIPSE_TEXT: (~[-)])+;

mode TRAP_TEXT_MODE;
TRAP_END_BRACKET: '\\]' -> popMode, type(TRAPEND);
INVTRAP_END_BRACKET: '/]' -> popMode, type(INVTRAPEND);
TRAP_TEXT: (~[\\/\]])+;

mode EDGE_TEXT_MODE;
// Handle space-delimited pattern: A-- text ----B or A-- text -->B (matches Jison: [^-]|\-(?!\-)+)
// Must handle both cases: extra dashes without arrow (----) and dashes with arrow (-->)
EDGE_TEXT_LINK_END: WS* '--' '-'* [-xo>]? WS* -> popMode, type(LINK_NORMAL);
// Match any character including spaces and single dashes, but not double dashes
EDGE_TEXT: (~[-] | '-' ~[-])+;

mode THICK_EDGE_TEXT_MODE;
// Handle thick edge patterns: A== text ====B or A== text ==>B
THICK_EDGE_TEXT_LINK_END: WS* '==' '='* [=xo>]? WS* -> popMode, type(LINK_THICK);
THICK_EDGE_TEXT: (~[=] | '=' ~[=])+;

mode DOTTED_EDGE_TEXT_MODE;
// Handle dotted edge patterns: A-. text ...-B or A-. text .->B
DOTTED_EDGE_TEXT_LINK_END: WS* '.'+ '-' [xo>]? WS* -> popMode, type(LINK_DOTTED);
DOTTED_EDGE_TEXT: ~[.]+;


