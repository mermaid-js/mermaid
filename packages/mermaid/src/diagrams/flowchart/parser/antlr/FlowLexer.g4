lexer grammar FlowLexer;

// Lexer modes to match Jison's state-based lexing
// Based on Jison: %x string, md_string, acc_title, acc_descr, acc_descr_multiline, dir, vertex, text, etc.

// Accessibility tokens
ACC_TITLE: 'accTitle' WS* ':' WS* -> pushMode(ACC_TITLE_MODE);
ACC_DESCR: 'accDescr' WS* ':' WS* -> pushMode(ACC_DESCR_MODE);
ACC_DESCR_MULTI: 'accDescr' WS* '{' WS* -> pushMode(ACC_DESCR_MULTILINE_MODE);

// Shape data tokens
SHAPE_DATA_START: '@{' -> pushMode(SHAPE_DATA_MODE);

// Interactivity tokens
CALL: 'call' WS+ -> pushMode(CALLBACKNAME_MODE);
HREF: 'href' WS;
CLICK: 'click' WS+ -> pushMode(CLICK_MODE);

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

// String tokens
STRING_START: '"' -> pushMode(STRING_MODE);
MD_STRING_START: '"`' -> pushMode(MD_STRING_MODE);

// Direction tokens (handled in direction mode)
DIRECTION_TB: '.*direction' WS+ 'TB' ~[\n]*;
DIRECTION_BT: '.*direction' WS+ 'BT' ~[\n]*;
DIRECTION_RL: '.*direction' WS+ 'RL' ~[\n]*;
DIRECTION_LR: '.*direction' WS+ 'LR' ~[\n]*;

// Link and edge tokens
LINK_ID: [^\s"]+? '@' {!(_input.LA(1) == '{' || _input.LA(1) == '"')}?;
NUM: [0-9]+;
BRKT: '#';
STYLE_SEPARATOR: ':::';
COLON: ':';
AMP: '&';
SEMI: ';';
COMMA: ',';
MULT: '*';

// Edge patterns - these are complex in Jison, need careful translation
// Normal edges: -->
LINK_NORMAL: WS* [xo<]? '--'+ [-xo>] WS*;
START_LINK_NORMAL: WS* [xo<]? '--' WS* -> pushMode(EDGE_TEXT_MODE);

// Thick edges: ==>
LINK_THICK: WS* [xo<]? '=='+ [=xo>] WS*;
START_LINK_THICK: WS* [xo<]? '==' WS* -> pushMode(THICK_EDGE_TEXT_MODE);

// Dotted edges: -.->
LINK_DOTTED: WS* [xo<]? '-'? '.'+ '-' [xo>]? WS*;
START_LINK_DOTTED: WS* [xo<]? '-.' WS* -> pushMode(DOTTED_EDGE_TEXT_MODE);

// Special link
LINK_INVISIBLE: WS* '~~' '~'+ WS*;

// Vertex shape tokens
ELLIPSE_START: '(-' -> pushMode(ELLIPSE_TEXT_MODE);
STADIUM_START: '([' -> pushMode(TEXT_MODE);
SUBROUTINE_START: '[[' -> pushMode(TEXT_MODE);
VERTEX_WITH_PROPS_START: '[|';
CYLINDER_START: '[(' -> pushMode(TEXT_MODE);
DOUBLECIRCLE_START: '(((' -> pushMode(TEXT_MODE);
TRAP_START: '[/' -> pushMode(TRAP_TEXT_MODE);
INVTRAP_START: '[\\' -> pushMode(TRAP_TEXT_MODE);

// Basic shape tokens
TAGSTART: '<';
TAGEND: '>' -> pushMode(TEXT_MODE);
UP: '^';
SEP: '|';
DOWN: 'v';
MINUS: '-';

// Node string - this is the most important token from Jison
// Pattern: ([A-Za-z0-9!"\#$%&'*+\.`?\\_\/]|\-(?=[^\>\-\.])|=(?!=))+
NODE_STRING: ([A-Za-z0-9!"#$%&'*+.`?\\/_] | '-' {_input.LA(1) != '>' && _input.LA(1) != '-' && _input.LA(1) != '.'}? | '=' {_input.LA(1) != '='}?)+;

// Unicode text support (simplified from Jison's extensive Unicode ranges)
UNICODE_TEXT: [\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE]+;

// Basic tokens
PIPE_START: '|' -> pushMode(TEXT_MODE);
PAREN_START: '(' -> pushMode(TEXT_MODE);
SQUARE_START: '[' -> pushMode(TEXT_MODE);
DIAMOND_START: '{' -> pushMode(TEXT_MODE);

QUOTE: '"';
NEWLINE: ('\r'? '\n')+;
WS: [ \t]+;
EOF_TOKEN: EOF;

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
CALLBACKNAME_PAREN_EMPTY: '(' WS* ')' -> popMode;
CALLBACKNAME_PAREN_START: '(' -> popMode, pushMode(CALLBACKARGS_MODE);
CALLBACKNAME: (~[(])*;

mode CALLBACKARGS_MODE;
CALLBACKARGS_END: ')' -> popMode;
CALLBACKARGS: (~[)])*;

mode CLICK_MODE;
CLICK_WS: [ \t\n] -> popMode;
CLICK_ID: (~[ \t\n])*;

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

// Virtual tokens for parser
tokens { NODIR, DIR }

mode STRING_MODE;
STRING_END: '"' -> popMode;
STR: (~["]+);

mode MD_STRING_MODE;
MD_STRING_END: '`"' -> popMode;
MD_STR: (~[`"])+;

mode TEXT_MODE;
TEXT_PIPE_END: '|' -> popMode, type(PIPE);
TEXT_PAREN_END: ')' -> popMode, type(PE);
TEXT_SQUARE_END: ']' -> popMode, type(SQE);
TEXT_DIAMOND_END: '}' -> popMode, type(DIAMOND_STOP);
TEXT_STADIUM_END: '])' -> popMode, type(STADIUMEND);
TEXT_SUBROUTINE_END: ']]' -> popMode, type(SUBROUTINEEND);
TEXT_CYLINDER_END: ')]' -> popMode, type(CYLINDEREND);
TEXT_DOUBLECIRCLE_END: ')))' -> popMode, type(DOUBLECIRCLEEND);
TEXT_CONTENT: (~[\[\](){}|"]+);

mode ELLIPSE_TEXT_MODE;
ELLIPSE_END: '-)' -> popMode, type(ELLIPSE_END_TOKEN);
ELLIPSE_TEXT: (~[()])+;

mode TRAP_TEXT_MODE;
TRAP_END_BRACKET: '\\]' -> popMode, type(TRAPEND);
INVTRAP_END_BRACKET: '/]' -> popMode, type(INVTRAPEND);
TRAP_TEXT: (~[\\\/\[\](){}]+);

mode EDGE_TEXT_MODE;
EDGE_TEXT_LINK_END: '--'+ [-xo>] WS* -> popMode, type(LINK_NORMAL);
EDGE_TEXT_CONTENT: (~[-])+;

mode THICK_EDGE_TEXT_MODE;
THICK_EDGE_TEXT_LINK_END: '=='+ [=xo>] WS* -> popMode, type(LINK_THICK);
THICK_EDGE_TEXT_CONTENT: (~[=])+;

mode DOTTED_EDGE_TEXT_MODE;
DOTTED_EDGE_TEXT_LINK_END: '.'+ '-' [xo>]? WS* -> popMode, type(LINK_DOTTED);
DOTTED_EDGE_TEXT_CONTENT: (~[.])+;

// Virtual tokens for parser
tokens { 
    PIPE, PE, SQE, DIAMOND_STOP, STADIUMEND, SUBROUTINEEND, CYLINDEREND, DOUBLECIRCLEEND,
    ELLIPSE_END_TOKEN, TRAPEND, INVTRAPEND, PS, SQS, TEXT
}
