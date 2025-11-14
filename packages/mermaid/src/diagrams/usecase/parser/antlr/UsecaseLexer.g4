lexer grammar UsecaseLexer;

// Keywords
ACTOR: 'actor';
SYSTEM_BOUNDARY: 'systemBoundary';
END: 'end';
DIRECTION: 'direction';
CLASS_DEF: 'classDef';
CLASS: 'class';
STYLE: 'style';
USECASE: 'usecase';

// Direction keywords
TB: 'TB';
TD: 'TD';
BT: 'BT';
RL: 'RL';
LR: 'LR';

// System boundary types
PACKAGE: 'package';
RECT: 'rect';
TYPE: 'type';

// Arrow types (order matters - longer patterns first)
SOLID_ARROW: '-->';
BACK_ARROW: '<--';
CIRCLE_ARROW: '--o';
CIRCLE_ARROW_REVERSED: 'o--';
CROSS_ARROW: '--x';
CROSS_ARROW_REVERSED: 'x--';
LINE_SOLID: '--';

// Symbols
COMMA: ',';
AT: '@';
LBRACE: '{';
RBRACE: '}';
COLON: ':';
LPAREN: '(';
RPAREN: ')';
CLASS_SEPARATOR: ':::';

// Hash color (must come before HASH to avoid conflicts)
HASH_COLOR: '#' [a-fA-F0-9]+;

// Number with optional unit
NUMBER: [0-9]+ ('.' [0-9]+)? ([a-zA-Z]+)?;

// Identifier
IDENTIFIER: [a-zA-Z_][a-zA-Z0-9_]*;

// String literals
STRING: '"' (~["\r\n])* '"' | '\'' (~['\r\n])* '\'';

// These tokens are defined last so they have lowest priority
// This ensures arrow tokens like '-->' are matched before DASH
DASH: '-';
DOT: '.';
PERCENT: '%';

// Whitespace and newlines
NEWLINE: [\r\n]+;
WS: [ \t]+ -> skip;

