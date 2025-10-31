grammar Usecase;

// Parser rules
usecaseDiagram
    : 'usecase' NEWLINE* statement* EOF
    ;

statement
    : actorStatement
    | relationshipStatement
    | systemBoundaryStatement
    | systemBoundaryTypeStatement
    | directionStatement
    | classDefStatement
    | classStatement
    | styleStatement
    | usecaseStatement
    | NEWLINE
    ;

usecaseStatement
    : entityName NEWLINE*
    ;

actorStatement
    : 'actor' actorList NEWLINE*
    ;

actorList
    : actorName (',' actorName)*
    ;

actorName
    : (IDENTIFIER | STRING) metadata?
    ;

metadata
    : '@' '{' metadataContent '}'
    ;

metadataContent
    : metadataProperty (',' metadataProperty)*
    ;

metadataProperty
    : STRING ':' STRING
    ;



relationshipStatement
    : entityName arrow entityName NEWLINE*
    | actorDeclaration arrow entityName NEWLINE*
    ;

systemBoundaryStatement
    : 'systemBoundary' systemBoundaryName NEWLINE* systemBoundaryContent* 'end' NEWLINE*
    ;

systemBoundaryName
    : IDENTIFIER
    | STRING
    ;

systemBoundaryContent
    : usecaseInBoundary NEWLINE*
    | NEWLINE
    ;

usecaseInBoundary
    : usecaseWithClass
    | IDENTIFIER
    | STRING
    ;

usecaseWithClass
    : IDENTIFIER CLASS_SEPARATOR IDENTIFIER
    | STRING CLASS_SEPARATOR IDENTIFIER
    ;

systemBoundaryTypeStatement
    : systemBoundaryName '@' '{' systemBoundaryTypeContent '}' NEWLINE*
    ;

systemBoundaryTypeContent
    : systemBoundaryTypeProperty (',' systemBoundaryTypeProperty)*
    ;

systemBoundaryTypeProperty
    : 'type' ':' systemBoundaryType
    ;

systemBoundaryType
    : 'package'
    | 'rect'
    ;

entityName
    : IDENTIFIER CLASS_SEPARATOR IDENTIFIER
    | STRING CLASS_SEPARATOR IDENTIFIER
    | IDENTIFIER
    | STRING
    | nodeIdWithLabel
    ;

actorDeclaration
    : 'actor' actorName
    ;

nodeIdWithLabel
    : IDENTIFIER '(' nodeLabel ')'
    ;

nodeLabel
    : IDENTIFIER
    | STRING
    | nodeLabel IDENTIFIER
    | nodeLabel STRING
    ;

arrow
    : SOLID_ARROW
    | BACK_ARROW
    | LINE_SOLID
    | CIRCLE_ARROW
    | CROSS_ARROW
    | CIRCLE_ARROW_REVERSED
    | CROSS_ARROW_REVERSED
    | labeledArrow
    ;

labeledArrow
    : LINE_SOLID edgeLabel SOLID_ARROW
    | BACK_ARROW edgeLabel LINE_SOLID
    | LINE_SOLID edgeLabel LINE_SOLID
    | LINE_SOLID edgeLabel CIRCLE_ARROW
    | LINE_SOLID edgeLabel CROSS_ARROW
    | CIRCLE_ARROW_REVERSED edgeLabel LINE_SOLID
    | CROSS_ARROW_REVERSED edgeLabel LINE_SOLID
    ;

edgeLabel
    : IDENTIFIER
    | STRING
    ;

directionStatement
    : 'direction' direction NEWLINE*
    ;

direction
    : 'TB'
    | 'TD'
    | 'BT'
    | 'RL'
    | 'LR'
    ;

classDefStatement
    : 'classDef' IDENTIFIER stylesOpt NEWLINE*
    ;

stylesOpt
    : style
    | stylesOpt COMMA style
    ;

style
    : styleComponent
    | style styleComponent
    ;

styleComponent
    : IDENTIFIER
    | NUMBER
    | HASH_COLOR
    | COLON
    | STRING
    | DASH
    | DOT
    | PERCENT
    ;

classStatement
    : 'class' nodeList IDENTIFIER NEWLINE*
    ;

styleStatement
    : 'style' IDENTIFIER stylesOpt NEWLINE*
    ;

nodeList
    : IDENTIFIER (',' IDENTIFIER)*
    ;

// Lexer rules
SOLID_ARROW
    : '-->'
    ;

BACK_ARROW
    : '<--'
    ;

CIRCLE_ARROW
    : '--o'
    ;
CIRCLE_ARROW_REVERSED
    : 'o--'
    ;

CROSS_ARROW
    : '--x'
    ;
    
CROSS_ARROW_REVERSED
    : 'x--'
    ;

LINE_SOLID
    : '--'
    ;

COMMA
    : ','
    ;

AT
    : '@'
    ;

LBRACE
    : '{'
    ;

RBRACE
    : '}'
    ;

COLON
    : ':'
    ;

CLASS_SEPARATOR
    : ':::'
    ;

IDENTIFIER
    : [a-zA-Z_][a-zA-Z0-9_]*
    ;

STRING
    : '"' (~["\r\n])* '"'
    | '\'' (~['\r\n])* '\''
    ;

HASH_COLOR
    : '#' [a-fA-F0-9]+
    ;

NUMBER
    : [0-9]+ ('.' [0-9]+)? ([a-zA-Z]+)?
    ;

// These tokens are defined last so they have lowest priority
// This ensures arrow tokens like '-->' are matched before DASH
DASH
    : '-'
    ;

DOT
    : '.'
    ;

PERCENT
    : '%'
    ;

NEWLINE
    : [\r\n]+
    ;

WS
    : [ \t]+ -> skip
    ;
