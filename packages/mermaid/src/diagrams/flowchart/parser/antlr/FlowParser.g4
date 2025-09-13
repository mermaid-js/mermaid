parser grammar FlowParser;

options {
    tokenVocab = FlowLexer;
}

// Entry point - matches Jison's "start: graphConfig document"
start: graphConfig document EOF_TOKEN;

// Document structure - matches Jison's document rule
document: 
    /* empty */ 
    | document line
    ;

// Line structure - matches Jison's line rule
line:
    statement
    | SEMI
    | NEWLINE
    | WS
    | EOF_TOKEN
    ;

// Graph configuration - matches Jison's graphConfig rule
graphConfig:
    WS graphConfig
    | NEWLINE graphConfig
    | GRAPH NODIR                           // Default TB direction
    | GRAPH DIR firstStmtSeparator          // Explicit direction
    ;

// Statement types - matches Jison's statement rule
statement:
    vertexStatement separator
    | styleStatement separator
    | linkStyleStatement separator
    | classDefStatement separator
    | classStatement separator
    | clickStatement separator
    | subgraphStatement separator
    | direction
    | accTitle
    | accDescr
    ;

// Separators
separator: NEWLINE | SEMI | EOF_TOKEN;
firstStmtSeparator: SEMI | NEWLINE | spaceList NEWLINE;
spaceList: WS spaceList | WS;

// Vertex statement - matches Jison's vertexStatement rule
vertexStatement:
    vertexStatement link node shapeData     // Chain with shape data
    | vertexStatement link node             // Chain without shape data
    | vertexStatement link node spaceList  // Chain with trailing space
    | node spaceList                        // Single node with space
    | node shapeData                        // Single node with shape data
    | node                                  // Single node
    ;

// Node definition - matches Jison's node rule
node:
    styledVertex
    | node shapeData spaceList AMP spaceList styledVertex
    | node spaceList AMP spaceList styledVertex
    ;

// Styled vertex - matches Jison's styledVertex rule
styledVertex:
    vertex
    | vertex STYLE_SEPARATOR idString
    ;

// Vertex shapes - matches Jison's vertex rule
vertex:
    idString SQS text SQE                                           // Square: [text]
    | idString DOUBLECIRCLE_START text DOUBLECIRCLEEND             // Double circle: (((text)))
    | idString PS PS text PE PE                                     // Circle: ((text))
    | idString ELLIPSE_START text ELLIPSE_END_TOKEN                // Ellipse: (-text-)
    | idString STADIUM_START text STADIUMEND                       // Stadium: ([text])
    | idString SUBROUTINE_START text SUBROUTINEEND                 // Subroutine: [[text]]
    | idString VERTEX_WITH_PROPS_START NODE_STRING COLON NODE_STRING PIPE text SQE  // Props: [|field:value|text]
    | idString CYLINDER_START text CYLINDEREND                     // Cylinder: [(text)]
    | idString PS text PE                                          // Round: (text)
    | idString DIAMOND_START text DIAMOND_STOP                     // Diamond: {text}
    | idString DIAMOND_START DIAMOND_START text DIAMOND_STOP DIAMOND_STOP  // Hexagon: {{text}}
    | idString TAGEND text SQE                                     // Odd: >text]
    | idString TRAP_START text TRAPEND                             // Trapezoid: [/text\]
    | idString INVTRAP_START text INVTRAPEND                       // Inv trapezoid: [\text/]
    | idString TRAP_START text INVTRAPEND                          // Lean right: [/text/]
    | idString INVTRAP_START text TRAPEND                          // Lean left: [\text\]
    | idString                                                     // Plain node
    ;

// Link definition - matches Jison's link rule
link:
    linkStatement arrowText
    | linkStatement
    | START_LINK_NORMAL edgeText LINK_NORMAL
    | START_LINK_THICK edgeText LINK_THICK
    | START_LINK_DOTTED edgeText LINK_DOTTED
    | LINK_ID START_LINK_NORMAL edgeText LINK_NORMAL
    | LINK_ID START_LINK_THICK edgeText LINK_THICK
    | LINK_ID START_LINK_DOTTED edgeText LINK_DOTTED
    ;

// Link statement - matches Jison's linkStatement rule
linkStatement:
    LINK_NORMAL
    | LINK_THICK
    | LINK_DOTTED
    | LINK_INVISIBLE
    | LINK_ID LINK_NORMAL
    | LINK_ID LINK_THICK
    | LINK_ID LINK_DOTTED
    | LINK_ID LINK_INVISIBLE
    ;

// Edge text - matches Jison's edgeText rule
edgeText:
    edgeTextToken
    | edgeText edgeTextToken
    | STR
    | MD_STR
    ;

// Arrow text - matches Jison's arrowText rule
arrowText:
    PIPE text PIPE
    ;

// Text definition - matches Jison's text rule
text:
    textToken
    | text textToken
    | STR
    | MD_STR
    ;

// Shape data - matches Jison's shapeData rule
shapeData:
    shapeData SHAPE_DATA_CONTENT
    | SHAPE_DATA_CONTENT
    ;

// Style statement - matches Jison's styleStatement rule
styleStatement:
    STYLE WS idString WS stylesOpt
    ;

// Link style statement - matches Jison's linkStyleStatement rule
linkStyleStatement:
    LINKSTYLE WS DEFAULT WS stylesOpt
    | LINKSTYLE WS numList WS stylesOpt
    | LINKSTYLE WS DEFAULT WS INTERPOLATE WS alphaNum WS stylesOpt
    | LINKSTYLE WS numList WS INTERPOLATE WS alphaNum WS stylesOpt
    | LINKSTYLE WS DEFAULT WS INTERPOLATE WS alphaNum
    | LINKSTYLE WS numList WS INTERPOLATE WS alphaNum
    ;

// Class definition statement - matches Jison's classDefStatement rule
classDefStatement:
    CLASSDEF WS idString WS stylesOpt
    ;

// Class statement - matches Jison's classStatement rule
classStatement:
    CLASS WS idString WS idString
    ;

// Click statement - matches Jison's clickStatement rule
clickStatement:
    CLICK CALLBACKNAME
    | CLICK CALLBACKNAME WS STR
    | CLICK CALLBACKNAME CALLBACKARGS
    | CLICK CALLBACKNAME CALLBACKARGS WS STR
    | CLICK HREF STR
    | CLICK HREF STR WS STR
    | CLICK HREF STR WS LINK_TARGET
    | CLICK HREF STR WS STR WS LINK_TARGET
    | CLICK alphaNum
    | CLICK alphaNum WS STR
    | CLICK STR
    | CLICK STR WS STR
    | CLICK STR WS LINK_TARGET
    | CLICK STR WS STR WS LINK_TARGET
    ;

// Subgraph statement - matches Jison's subgraph rules
subgraphStatement:
    SUBGRAPH WS textNoTags SQS text SQE separator document END
    | SUBGRAPH WS textNoTags separator document END
    | SUBGRAPH separator document END
    ;

// Direction statement - matches Jison's direction rule
direction:
    DIRECTION_TB
    | DIRECTION_BT
    | DIRECTION_RL
    | DIRECTION_LR
    ;

// Accessibility statements
accTitle: ACC_TITLE ACC_TITLE_VALUE;
accDescr: ACC_DESCR ACC_DESCR_VALUE | ACC_DESCR_MULTI ACC_DESCR_MULTILINE_VALUE ACC_DESCR_MULTILINE_END;

// Number list - matches Jison's numList rule
numList:
    NUM
    | numList COMMA NUM
    ;

// Styles - matches Jison's stylesOpt rule
stylesOpt:
    style
    | stylesOpt COMMA style
    ;

// Style components - matches Jison's style rule
style:
    styleComponent
    | style styleComponent
    ;

// Style component - matches Jison's styleComponent rule
styleComponent: NUM | NODE_STRING | COLON | WS | BRKT | STYLE | MULT;

// Token definitions - matches Jison's token lists
idString:
    idStringToken
    | idString idStringToken
    ;

alphaNum:
    alphaNumToken
    | alphaNum alphaNumToken
    ;

textNoTags:
    textNoTagsToken
    | textNoTags textNoTagsToken
    | STR
    | MD_STR
    ;

// Token types - matches Jison's token definitions
idStringToken: NUM | NODE_STRING | DOWN | MINUS | DEFAULT | COMMA | COLON | AMP | BRKT | MULT | UNICODE_TEXT;
textToken: TEXT_CONTENT | TAGSTART | TAGEND | UNICODE_TEXT;
textNoTagsToken: NUM | NODE_STRING | WS | MINUS | AMP | UNICODE_TEXT | COLON | MULT | BRKT | keywords | START_LINK_NORMAL;
edgeTextToken: EDGE_TEXT_CONTENT | THICK_EDGE_TEXT_CONTENT | DOTTED_EDGE_TEXT_CONTENT | UNICODE_TEXT;
alphaNumToken: NUM | UNICODE_TEXT | NODE_STRING | DIR | DOWN | MINUS | COMMA | COLON | AMP | BRKT | MULT;

// Keywords - matches Jison's keywords rule
keywords: STYLE | LINKSTYLE | CLASSDEF | CLASS | CLICK | GRAPH | DIR | SUBGRAPH | END | DOWN | UP;
