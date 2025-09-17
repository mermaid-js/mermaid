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
    | NEWLINE
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
    : IDENTIFIER
    | STRING
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
    : IDENTIFIER
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
    | labeledArrow
    ;

labeledArrow
    : LINE_SOLID edgeLabel SOLID_ARROW
    | BACK_ARROW edgeLabel LINE_SOLID
    | LINE_SOLID edgeLabel LINE_SOLID
    ;

edgeLabel
    : IDENTIFIER
    | STRING
    ;

// Lexer rules
SOLID_ARROW
    : '-->'
    ;

BACK_ARROW
    : '<--'
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

IDENTIFIER
    : [a-zA-Z_][a-zA-Z0-9_]*
    ;

STRING
    : '"' (~["\r\n])* '"'
    | '\'' (~['\r\n])* '\''
    ;

NEWLINE
    : [\r\n]+
    ;

WS
    : [ \t]+ -> skip
    ;
