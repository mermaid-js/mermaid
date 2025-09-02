grammar Usecase;

// Parser rules
usecaseDiagram
    : USECASE_START NEWLINE* statement* EOF
    ;

statement
    : actor NEWLINE*
    | systemBoundary NEWLINE*
    | systemBoundaryMetadata NEWLINE*
    | useCase NEWLINE*
    | relationship NEWLINE*
    | actorRelationship NEWLINE*
    | NEWLINE
    ;

relationship
    : actorName ARROW target
    | actorName LABELED_ARROW target
    ;

actorRelationship
    : ACTOR actorName ARROW target
    | ACTOR actorName LABELED_ARROW target
    ;

target
    : useCaseName
    | nodeDefinition
    ;

nodeDefinition
    : nodeId LPAREN nodeLabel RPAREN
    ;

nodeId
    : IDENTIFIER
    ;

nodeLabel
    : IDENTIFIER (WS IDENTIFIER)*
    | STRING
    ;

actorName
    : IDENTIFIER
    ;

systemBoundary
    : SYSTEM_BOUNDARY boundaryName LBRACE NEWLINE* boundaryContent* RBRACE
    | SYSTEM_BOUNDARY boundaryName NEWLINE* boundaryContent* END
    ;

systemBoundaryMetadata
    : boundaryName AT LBRACE metadataContent RBRACE
    ;

boundaryContent
    : useCase NEWLINE*
    | NEWLINE
    ;

useCase
    : useCaseName
    ;

boundaryName
    : IDENTIFIER
    ;

useCaseName
    : IDENTIFIER
    ;

actor
    : ACTOR actorList
    ;

actorList
    : actorDefinition (COMMA actorDefinition)*
    ;

actorDefinition
    : actorName metadata?
    ;

metadata
    : AT LBRACE metadataContent RBRACE
    ;

metadataContent
    : metadataPair (COMMA metadataPair)*
    |
    ;

metadataPair
    : metadataKey COLON metadataValue
    ;

metadataKey
    : IDENTIFIER
    ;

metadataValue
    : STRING
    | IDENTIFIER
    ;

// Lexer rules
USECASE_START
    : 'usecase'
    ;

ACTOR
    : 'actor'
    ;

SYSTEM_BOUNDARY
    : 'systemBoundary'
    ;

END
    : 'end'
    ;

ARROW
    : '-->'
    | '->'
    ;

LABELED_ARROW
    : '--' IDENTIFIER '-->'
    | '--' IDENTIFIER '->'
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

LPAREN
    : '('
    ;

RPAREN
    : ')'
    ;

COMMA
    : ','
    ;

COLON
    : ':'
    ;

STRING
    : '"' (~["\r\n])* '"'
    | '\'' (~['\r\n])* '\''
    ;

IDENTIFIER
    : [a-zA-Z_][a-zA-Z0-9_]*
    ;

NEWLINE
    : [\r\n]+
    ;

WS
    : [ \t]+ -> skip
    ;

COMMENT
    : '%' ~[\r\n]* -> skip
    ;
