lexer grammar sequenceLexer;
channels {
  COMMENT_CHANNEL,
  MODIFIER_CHANNEL
}

WS: [ \t] -> channel(HIDDEN);

// variable modifiers
CONSTANT:   'const' -> channel(MODIFIER_CHANNEL);
READONLY:   'readonly' -> channel(MODIFIER_CHANNEL);
STATIC:     'static' -> channel(MODIFIER_CHANNEL);

// method modifiers
AWAIT:      'await' -> channel(MODIFIER_CHANNEL);

TITLE
 : 'title' -> pushMode(TITLE_MODE)
 ;

COL
 : ':' -> pushMode(EVENT)
 ;

SOPEN
 : '<<'
 ;

SCLOSE
 : '>>'
 ;

ARROW
 : '->'
 ;

// Tokens
fragment HEX
    : [0-9a-fA-F]
    ;

COLOR
 : '#' HEX+
 ;

OR : '||';
AND : '&&';
EQ : '==';
NEQ : '!=';
GT : '>';
LT : '<';
GTEQ : '>=';
LTEQ : '<=';
PLUS : '+';
MINUS : '-';
MULT : '*';
DIV : '/';
MOD : '%';
POW : '^';
NOT : '!';

SCOL : ';';
COMMA : ',';
ASSIGN : '=';
OPAR : '(';
CPAR : ')';
OBRACE : '{';
CBRACE : '}';

TRUE:       'true';
FALSE:      'false';
NIL:        'nil' | 'null';
IF:         'if';
ELSE:       'else';
WHILE:      'while' | 'for' | 'foreach' | 'forEach' | 'loop';
RETURN:     'return';
NEW:        'new';
PAR :       'par';
GROUP:      'group';
OPT:        'opt';
AS:         'as';
TRY:        'try';
CATCH:      'catch';
FINALLY:    'finally';
IN:         'in';

STARTER_LXR:        '@Starter' | '@starter';
ANNOTATION_RET:     '@Return' | '@return' | '@Reply' | '@reply';
ANNOTATION:         '@'[a-zA-Z_0-9]*;

DOT
 : '.'
 ;

ID
 : [a-zA-Z_] [a-zA-Z_0-9]*
 ;

INT
 : [0-9]+
 ;

FLOAT
 : [0-9]+ '.' [0-9]*
 | '.' [0-9]+
 ;

// As long as the text starts with double quotes, we treat it as a string before a closing double quote or change line
// This is to allow the user to keep typing - A as "a long string before closing it with quote
// Note that most of our editors will auto-complete the double quote anyway.
STRING
 : '"' (~["\r\n] | '""')* ('"'|[\r\n])?
 ;

CR
 : [\r\n] -> channel(HIDDEN)
 ;

COMMENT
 : '//' .*? '\n' -> channel(COMMENT_CHANNEL)
 ;
OTHER
 : .
 ;

// https://stackoverflow.com/a/74752939/529187 for semantic predicates
// Divider notes can be characters other than changeline.
// So it must not be tokenized by other Lexer rules.
// Thus this is not suitable for the parser to parse.
DIVIDER: {this.column === 0}? WS* '==' ~[\r\n]*;

mode EVENT;
EVENT_PAYLOAD_LXR
 : ~[\r\n]+
 ;

EVENT_END
 : [\r\n] -> popMode
 ;

mode TITLE_MODE;
TITLE_CONTENT
 : ~[\r\n]+
 ;

TITLE_END
 : [\r\n] -> popMode
 ;
