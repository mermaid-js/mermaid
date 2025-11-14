parser grammar UsecaseParser;

options {
    tokenVocab = UsecaseLexer;
}

// Entry point
start: USECASE NEWLINE* statement* EOF;

// Statement types
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

// Usecase statement (standalone entity)
usecaseStatement
    : entityName NEWLINE*
    ;

// Actor statement
actorStatement
    : ACTOR actorList NEWLINE*
    ;

actorList
    : actorName (COMMA actorName)*
    ;

actorName
    : (IDENTIFIER | STRING) metadata?
    ;

metadata
    : AT LBRACE metadataContent RBRACE
    ;

metadataContent
    : metadataProperty (COMMA metadataProperty)*
    ;

metadataProperty
    : STRING COLON STRING
    ;

// Relationship statement
relationshipStatement
    : entityName arrow entityName NEWLINE*
    | actorDeclaration arrow entityName NEWLINE*
    ;

// System boundary statement
systemBoundaryStatement
    : SYSTEM_BOUNDARY systemBoundaryName NEWLINE* systemBoundaryContent* END NEWLINE*
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

// System boundary type statement
systemBoundaryTypeStatement
    : systemBoundaryName AT LBRACE systemBoundaryTypeContent RBRACE NEWLINE*
    ;

systemBoundaryTypeContent
    : systemBoundaryTypeProperty (COMMA systemBoundaryTypeProperty)*
    ;

systemBoundaryTypeProperty
    : TYPE COLON systemBoundaryType
    ;

systemBoundaryType
    : PACKAGE
    | RECT
    ;

// Entity name (node reference)
entityName
    : IDENTIFIER CLASS_SEPARATOR IDENTIFIER
    | STRING CLASS_SEPARATOR IDENTIFIER
    | IDENTIFIER
    | STRING
    | nodeIdWithLabel
    ;

// Actor declaration (inline)
actorDeclaration
    : ACTOR actorName
    ;

// Node with label
nodeIdWithLabel
    : IDENTIFIER LPAREN nodeLabel RPAREN
    ;

nodeLabel
    : IDENTIFIER
    | STRING
    | nodeLabel IDENTIFIER
    | nodeLabel STRING
    ;

// Arrow types
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

// Direction statement
directionStatement
    : DIRECTION direction NEWLINE*
    ;

direction
    : TB
    | TD
    | BT
    | RL
    | LR
    ;

// Class definition statement
classDefStatement
    : CLASS_DEF IDENTIFIER stylesOpt NEWLINE*
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

// Class statement
classStatement
    : CLASS nodeList IDENTIFIER NEWLINE*
    ;

// Style statement
styleStatement
    : STYLE IDENTIFIER stylesOpt NEWLINE*
    ;

// Node list
nodeList
    : IDENTIFIER (COMMA IDENTIFIER)*
    ;

