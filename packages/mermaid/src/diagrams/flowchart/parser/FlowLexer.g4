lexer grammar FlowLexer;

// ============================================================================
// ANTLR Lexer Grammar for Mermaid Flowchart
// Migrated from flow.jison lexer section
// ============================================================================

// ============================================================================
// DEFAULT MODE (INITIAL) TOKENS
// ============================================================================

// Accessibility commands
ACC_TITLE_START: 'accTitle' WS* ':' WS*;
ACC_DESCR_START: 'accDescr' WS* ':' WS*;
ACC_DESCR_MULTILINE_START: 'accDescr' WS* '{' WS*;

// Shape data
SHAPE_DATA_START: '@{';

// Interactivity commands
CALL_START: 'call' WS+;
HREF_KEYWORD: 'href' WS;
CLICK_START: 'click' WS+;

// String handling
STRING_START: '"';
MD_STRING_START: '"' '`';

// Keywords
STYLE: 'style';
DEFAULT: 'default';
LINKSTYLE: 'linkStyle';
INTERPOLATE: 'interpolate';
CLASSDEF: 'classDef';
CLASS: 'class';

// Graph types
GRAPH_FLOWCHART_ELK: 'flowchart-elk';
GRAPH_GRAPH: 'graph';
GRAPH_FLOWCHART: 'flowchart';
SUBGRAPH: 'subgraph';
END: 'end' [\r\n\t ]*;

// Link targets
LINK_TARGET: '_self' | '_blank' | '_parent' | '_top';

// Direction patterns (global)
DIRECTION_TB: .*? 'direction' WS+ 'TB' ~[\n]*;
DIRECTION_BT: .*? 'direction' WS+ 'BT' ~[\n]*;
DIRECTION_RL: .*? 'direction' WS+ 'RL' ~[\n]*;
DIRECTION_LR: .*? 'direction' WS+ 'LR' ~[\n]*;

// Link ID
LINK_ID: ~[" \t\n\r]+ '@';

// Numbers
NUM: [0-9]+;

// Basic symbols
BRKT: '#';
STYLE_SEPARATOR: ':::';
COLON: ':';
AMP: '&';
SEMI: ';';
COMMA: ',';
MULT: '*';

// Edge patterns - comprehensive patterns with proper precedence
// These need to come BEFORE NODE_STRING to avoid greedy matching

// Regular arrows (highest precedence)
ARROW_REGULAR: '-->';
ARROW_SIMPLE: '->';
ARROW_BIDIRECTIONAL: '<-->';
ARROW_BIDIRECTIONAL_SIMPLE: '<->';

// Regular edges with optional decorations
LINK_REGULAR: WS* [xo<]? '--'+ [-xo>] WS*;
START_LINK_REGULAR: WS* [xo<]? '--' WS*;

// Thick edges
LINK_THICK: WS* [xo<]? '=='+ [=xo>] WS*;
START_LINK_THICK: WS* [xo<]? '==' WS*;

// Dotted edges
LINK_DOTTED: WS* [xo<]? '-'? '.'+ '-' [xo>]? WS*;
START_LINK_DOTTED: WS* [xo<]? '-.' WS*;

// Invisible edges
LINK_INVISIBLE: WS* '~~' '~'+ WS*;

// Shape delimiters
ELLIPSE_START: '(-';
STADIUM_START: '([';
SUBROUTINE_START: '[[';
VERTEX_WITH_PROPS_START: '[|';
TAGEND_PUSH: '>';
CYLINDER_START: '[(';
DOUBLECIRCLE_START: '(((';
TRAPEZOID_START: '[/';
INV_TRAPEZOID_START: '[\\';

// Basic shape delimiters
TAGSTART: '<';
UP: '^';
SEP: '|';
DOWN: 'v';
MINUS: '-';

// Unicode text - simplified for now, will expand
UNICODE_TEXT: [\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6]+;

// Parentheses and brackets
PS: '(';
PE: ')';
SQS: '[';
SQE: ']';
DIAMOND_START: '{';
DIAMOND_STOP: '}';

// Basic tokens
NEWLINE: ('\r'? '\n')+;
SPACE: WS;
EOF_TOKEN: EOF;

// Additional basic tokens for simplified version
STR: '"' ~["]* '"';
MD_STR: '"' '`' ~[`]* '`' '"';
TEXT: [a-zA-Z0-9_]+;

// Node string - moved to end for proper precedence (lowest priority)
// Removed dash (-) to prevent conflicts with arrow patterns
NODE_STRING: [A-Za-z0-9!"#$%&'*+.`?\\/_=]+;

// ============================================================================
// FRAGMENTS AND UTILITIES
// ============================================================================

fragment WS: [ \t\r\n];
