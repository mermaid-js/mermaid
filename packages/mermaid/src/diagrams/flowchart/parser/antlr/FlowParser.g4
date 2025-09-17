parser grammar FlowParser;

options {
    tokenVocab = FlowLexer;
}

// Entry point - matches Jison's "start: graphConfig document"
start: graphConfig document;

// Document structure - matches Jison's document rule
document:
    line*
    ;

// Line structure - matches Jison's line rule
line:
    statement
    | SEMI
    | NEWLINE
    | WS
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
    | standaloneVertex separator           // For edge property statements like e1@{curve: basis}
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
separator: NEWLINE | SEMI | EOF;
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

// Standalone vertex - for edge property statements like e1@{curve: basis}
standaloneVertex:
    NODE_STRING shapeData
    | LINK_ID shapeData                     // For edge IDs like e1@{curve: basis}
    ;

// Node definition - matches Jison's node rule
node:
    styledVertex
    | node spaceList AMP spaceList styledVertex
    ;

// Styled vertex - matches Jison's styledVertex rule
styledVertex:
    vertex shapeData
    | vertex
    | vertex STYLE_SEPARATOR idString
    ;

// Vertex shapes - matches Jison's vertex rule
vertex:
    idString SQS text SQE                                           // Square: [text]
    | idString DOUBLECIRCLE_START text DOUBLECIRCLEEND             // Double circle: (((text)))
    | idString CIRCLE_START text CIRCLEEND                         // Circle: ((text))
    | idString ELLIPSE_COMPLETE                                    // Ellipse: (-text-) - complete token
    | idString ELLIPSE_START text ELLIPSE_END_TOKEN                // Ellipse: (-text-) - mode-based
    | idString STADIUM_START text STADIUMEND                       // Stadium: ([text])
    | idString SUBROUTINE_START text SUBROUTINEEND                 // Subroutine: [[text]]
    | idString VERTEX_WITH_PROPS_START NODE_STRING COLON NODE_STRING PIPE text SQE  // Props: [|field:value|text]
    | idString CYLINDER_START text CYLINDEREND                     // Cylinder: [(text)]
    | idString PS text PE                                          // Round: (text)
    | idString DIAMOND_START text DIAMOND_STOP                     // Diamond: {text}
    | idString DIAMOND_START DIAMOND_START text DIAMOND_STOP DIAMOND_STOP  // Hexagon: {{text}}
    | idString TAGEND text SQE                                     // Odd: >text]
    | idString                                                     // Simple node ID without shape - default to squareRect
    | idString TRAP_START text TRAPEND                             // Trapezoid: [/text\]
    | idString INVTRAP_START text INVTRAPEND                       // Inv trapezoid: [\text/]
    | idString TRAP_START text INVTRAPEND                          // Lean right: [/text/]
    | idString INVTRAP_START text TRAPEND                          // Lean left: [\text\]
    | idString                                                     // Plain node
    ;

// Link definition - matches Jison's link rule
link:
    linkStatement arrowText spaceList?
    | linkStatement
    | START_LINK_NORMAL edgeText LINK_NORMAL
    | START_LINK_NORMAL_NOSPACE edgeText LINK_NORMAL
    | START_LINK_THICK edgeText LINK_THICK
    | START_LINK_DOTTED edgeText LINK_DOTTED
    | LINK_ID START_LINK_NORMAL edgeText LINK_NORMAL
    | LINK_ID START_LINK_NORMAL_NOSPACE edgeText LINK_NORMAL
    | LINK_ID START_LINK_THICK edgeText LINK_THICK
    | LINK_ID START_LINK_DOTTED edgeText LINK_DOTTED
    ;

// Link statement - matches Jison's linkStatement rule
linkStatement:
    LINK_NORMAL
    | LINK_THICK
    | LINK_DOTTED
    | LINK_INVISIBLE
    | LINK_STATEMENT_NORMAL
    | LINK_STATEMENT_DOTTED
    | LINK_ID LINK_NORMAL
    | LINK_ID LINK_THICK
    | LINK_ID LINK_DOTTED
    | LINK_ID LINK_INVISIBLE
    | LINK_ID LINK_STATEMENT_NORMAL
    | LINK_ID LINK_STATEMENT_THICK
    ;

// Edge text - matches Jison's edgeText rule
edgeText:
    edgeTextToken
    | edgeText edgeTextToken
    | stringLiteral
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
    | stringLiteral
    | MD_STR
    | NODE_STRING
    | TEXT_CONTENT
    | ELLIPSE_TEXT
    | TRAP_TEXT
    ;

// Shape data - matches Jison's shapeData rule
shapeData:
    SHAPE_DATA_START shapeDataContent SHAPE_DATA_END
    ;

shapeDataContent:
    shapeDataContent SHAPE_DATA_CONTENT
    | shapeDataContent SHAPE_DATA_STRING_START SHAPE_DATA_STRING_CONTENT SHAPE_DATA_STRING_END
    | SHAPE_DATA_CONTENT
    | SHAPE_DATA_STRING_START SHAPE_DATA_STRING_CONTENT SHAPE_DATA_STRING_END
    |
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

// String rule to handle STR patterns
stringLiteral:
    STR
    ;

// Click statement - matches Jison's clickStatement rule
// CLICK token now contains both 'click' and node ID (like Jison)
clickStatement:
    CLICK CALLBACKNAME
    | CLICK CALLBACKNAME stringLiteral
    | CLICK CALLBACKNAME CALLBACKARGS
    | CLICK CALLBACKNAME CALLBACKARGS stringLiteral
    | CLICK CALL CALLBACKNAME
    | CLICK CALL CALLBACKNAME stringLiteral
    | CLICK CALL CALLBACKNAME CALLBACKARGS
    | CLICK CALL CALLBACKNAME CALLBACKARGS stringLiteral
    | CLICK CALL CALLBACKARGS                                // CLICK CALL callback() - call with args only
    | CLICK CALL CALLBACKARGS stringLiteral                  // CLICK CALL callback() "tooltip" - call with args and tooltip
    | CLICK HREF stringLiteral
    | CLICK HREF stringLiteral stringLiteral
    | CLICK HREF stringLiteral LINK_TARGET
    | CLICK HREF stringLiteral stringLiteral LINK_TARGET
    | CLICK stringLiteral                                    // CLICK STR - direct click with URL
    | CLICK stringLiteral stringLiteral                      // CLICK STR STR - click with URL and tooltip
    | CLICK stringLiteral LINK_TARGET                        // CLICK STR LINK_TARGET - click with URL and target
    | CLICK stringLiteral stringLiteral LINK_TARGET          // CLICK STR STR LINK_TARGET - click with URL, tooltip, and target
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
styleComponent: NUM | NODE_STRING | COLON | WS | BRKT | STYLE | MULT | MINUS;

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
    | stringLiteral
    | MD_STR
    ;

// Token types - matches Jison's token definitions
idStringToken: NUM | NODE_STRING | DOWN | MINUS | DEFAULT | COMMA | COLON | AMP | BRKT | MULT | UNICODE_TEXT;
textToken: TEXT_CONTENT | TAGSTART | TAGEND | UNICODE_TEXT | NODE_STRING | WS;
textNoTagsToken: NUM | NODE_STRING | WS | MINUS | AMP | UNICODE_TEXT | COLON | MULT | BRKT | keywords | START_LINK_NORMAL;
edgeTextToken: EDGE_TEXT | THICK_EDGE_TEXT | DOTTED_EDGE_TEXT | UNICODE_TEXT;
alphaNumToken: NUM | UNICODE_TEXT | NODE_STRING | DIR | DOWN | MINUS | COMMA | COLON | AMP | BRKT | MULT;

// Keywords - matches Jison's keywords rule
keywords: STYLE | LINKSTYLE | CLASSDEF | CLASS | CLICK | GRAPH | DIR | SUBGRAPH | END | DOWN | UP;
