/**
 * ANTLR4 Grammar for Mermaid Flowchart
 * 
 * This grammar combines the working lexer from FlowLexer.g4 with parser rules
 * extracted from the Jison flow.jison grammar to create a complete ANTLR parser.
 * 
 * Strategy:
 * 1. Import proven lexer rules from FlowLexer.g4
 * 2. Convert Jison parser productions to ANTLR parser rules
 * 3. Maintain semantic compatibility with existing Jison parser
 */

grammar Flow;

// ============================================================================
// PARSER RULES (converted from Jison productions)
// ============================================================================

// Start rule - entry point for parsing
start
    : graphConfig document EOF
    ;

// Document structure
document
    : /* empty */                           # EmptyDocument
    | document line                         # DocumentWithLine
    ;

// Line types
line
    : statement                             # StatementLine
    | SEMI                                  # SemicolonLine
    | NEWLINE                               # NewlineLine
    | SPACE                                 # SpaceLine
    ;

// Graph configuration
graphConfig
    : SPACE graphConfig                     # SpaceGraphConfig
    | NEWLINE graphConfig                   # NewlineGraphConfig
    | GRAPH_GRAPH NODIR                     # GraphNoDirection
    | GRAPH_GRAPH SPACE direction firstStmtSeparator  # GraphWithDirection
    | GRAPH_GRAPH SPACE direction           # GraphWithDirectionNoSeparator
    ;

// Direction tokens
direction
    : DIRECTION_TD                          # DirectionTD
    | DIRECTION_LR                          # DirectionLR
    | DIRECTION_RL                          # DirectionRL
    | DIRECTION_BT                          # DirectionBT
    | DIRECTION_TB                          # DirectionTB
    | TEXT                                  # DirectionText
    ;

// Statement types
statement
    : vertexStatement separator             # VertexStmt
    | styleStatement separator              # StyleStmt
    | linkStyleStatement separator          # LinkStyleStmt
    | classDefStatement separator           # ClassDefStmt
    | classStatement separator              # ClassStmt
    | clickStatement separator              # ClickStmt
    | subgraphStatement separator           # SubgraphStmt
    | direction                             # DirectionStmt
    | accessibilityStatement               # AccessibilityStmt
    ;

// Vertex statement (nodes and connections)
vertexStatement
    : vertexStatement link node shapeData   # VertexWithShapeData
    | vertexStatement link node             # VertexWithLink
    | vertexStatement link node spaceList   # VertexWithLinkAndSpace
    | node spaceList                        # NodeWithSpace
    | node shapeData                        # NodeWithShapeData
    | node                                  # SingleNode
    ;

// Node definition
node
    : styledVertex                          # SingleStyledVertex
    | node shapeData spaceList AMP spaceList styledVertex  # NodeWithShapeDataAndAmp
    | node spaceList AMP spaceList styledVertex            # NodeWithAmp
    ;

// Styled vertex
styledVertex
    : vertex                                # PlainVertex
    | vertex STYLE_SEPARATOR idString       # StyledVertexWithClass
    ;

// Vertex shapes
vertex
    : idString SQS text SQE                 # SquareVertex
    | idString DOUBLECIRCLESTART text DOUBLECIRCLEEND  # DoubleCircleVertex
    | idString PS PS text PE PE             # CircleVertex
    | idString ELLIPSE_START text ELLIPSE_END           # EllipseVertex
    | idString STADIUM_START text STADIUM_END           # StadiumVertex
    | idString SUBROUTINE_START text SUBROUTINE_END     # SubroutineVertex
    | idString CYLINDER_START text CYLINDER_END         # CylinderVertex
    | idString PS text PE                   # RoundVertex
    | idString DIAMOND_START text DIAMOND_STOP          # DiamondVertex
    | idString DIAMOND_START DIAMOND_START text DIAMOND_STOP DIAMOND_STOP  # HexagonVertex
    | idString TAGEND text SQE              # OddVertex
    | idString TRAPEZOID_START text TRAPEZOID_END       # TrapezoidVertex
    | idString INV_TRAPEZOID_START text INV_TRAPEZOID_END  # InvTrapezoidVertex
    | idString                              # PlainIdVertex
    ;

// Link/Edge definition
link
    : linkStatement arrowText               # LinkWithArrowText
    | linkStatement                         # PlainLink
    | START_LINK_REGULAR edgeText LINK_REGULAR     # StartLinkWithText
    ;

// Link statement
linkStatement
    : ARROW_REGULAR                         # RegularArrow
    | ARROW_SIMPLE                          # SimpleArrow
    | ARROW_BIDIRECTIONAL                   # BidirectionalArrow
    | LINK_REGULAR                          # RegularLink
    | LINK_THICK                            # ThickLink
    | LINK_DOTTED                           # DottedLink
    | LINK_INVISIBLE                        # InvisibleLink
    ;

// Text and identifiers
text
    : textToken                             # SingleTextToken
    | text textToken                        # MultipleTextTokens
    ;

textToken
    : TEXT                                  # PlainText
    | STR                                   # StringText
    | MD_STR                                # MarkdownText
    | NODE_STRING                           # NodeStringText
    ;

idString
    : TEXT                                  # TextId
    | NODE_STRING                           # NodeStringId
    ;

// Edge text
edgeText
    : edgeTextToken                         # SingleEdgeTextToken
    | edgeText edgeTextToken                # MultipleEdgeTextTokens
    | STR                                   # StringEdgeText
    | MD_STR                                # MarkdownEdgeText
    ;

edgeTextToken
    : TEXT                                  # PlainEdgeText
    | NODE_STRING                           # NodeStringEdgeText
    ;

// Arrow text
arrowText
    : SEP text SEP                          # PipedArrowText
    ;

// Subgraph statement
subgraphStatement
    : SUBGRAPH SPACE textNoTags SQS text SQE separator document END  # SubgraphWithTitle
    | SUBGRAPH SPACE textNoTags separator document END              # SubgraphWithTextNoTags
    | SUBGRAPH separator document END                               # PlainSubgraph
    ;

// Accessibility statements (simplified for now)
accessibilityStatement
    : ACC_TITLE COLON text                  # AccTitleStmt
    | ACC_DESCR COLON text                  # AccDescrStmt
    ;

// Style statements (simplified for now)
styleStatement
    : STYLE idString styleDefinition        # StyleRule
    ;

linkStyleStatement
    : LINKSTYLE idString styleDefinition    # LinkStyleRule
    ;

classDefStatement
    : CLASSDEF idString styleDefinition     # ClassDefRule
    ;

classStatement
    : CLASS idString idString               # ClassRule
    ;

clickStatement
    : CLICK idString callbackName                                           # ClickCallbackRule
    | CLICK idString callbackName STR                                       # ClickCallbackTooltipRule
    | CLICK idString callbackName callbackArgs                              # ClickCallbackArgsRule
    | CLICK idString callbackName callbackArgs STR                          # ClickCallbackArgsTooltipRule
    | CLICK idString HREF_KEYWORD STR                                       # ClickHrefRule
    | CLICK idString HREF_KEYWORD STR STR                                   # ClickHrefTooltipRule
    | CLICK idString HREF_KEYWORD STR LINK_TARGET                           # ClickHrefTargetRule
    | CLICK idString HREF_KEYWORD STR STR LINK_TARGET                       # ClickHrefTooltipTargetRule
    | CLICK idString STR                                                    # ClickLinkRule
    | CLICK idString STR STR                                                # ClickLinkTooltipRule
    | CLICK idString STR LINK_TARGET                                        # ClickLinkTargetRule
    | CLICK idString STR STR LINK_TARGET                                    # ClickLinkTooltipTargetRule
    ;

// Utility rules
separator
    : NEWLINE | SEMI | /* empty */
    ;

firstStmtSeparator
    : SEMI | NEWLINE | spaceList NEWLINE | /* empty */
    ;

spaceList
    : SPACE spaceList                       # MultipleSpaces
    | SPACE                                 # SingleSpace
    ;

textNoTags
    : TEXT                                  # PlainTextNoTags
    | NODE_STRING                           # NodeStringTextNoTags
    ;

shapeData
    : shapeData SHAPE_DATA                  # MultipleShapeData
    | SHAPE_DATA                            # SingleShapeData
    ;

styleDefinition
    : TEXT                                  # PlainStyleDefinition
    ;

callbackName
    : TEXT                                  # PlainCallbackName
    | NODE_STRING                           # NodeStringCallbackName
    ;

callbackArgs
    : '(' TEXT ')'                          # PlainCallbackArgs
    | '(' ')'                               # EmptyCallbackArgs
    ;

// ============================================================================
// LEXER RULES (imported from working FlowLexer.g4)
// ============================================================================

// Graph keywords
GRAPH_GRAPH: 'graph';
FLOWCHART: 'flowchart';
FLOWCHART_ELK: 'flowchart-elk';

// Direction keywords
NODIR: 'NODIR';

// Interaction keywords
HREF_KEYWORD: 'href';
CALL_KEYWORD: 'call';

// Subgraph keywords
SUBGRAPH: 'subgraph';
END: 'end';

// Style keywords
STYLE: 'style';
LINKSTYLE: 'linkStyle';
CLASSDEF: 'classDef';
CLASS: 'class';
CLICK: 'click';

// Accessibility keywords (moved to end to avoid greedy matching)
ACC_TITLE: 'accTitle';
ACC_DESCR: 'accDescr';

// Shape data
SHAPE_DATA: '@{' ~[}]* '}';

// Ampersand for node concatenation
AMP: '&';

// Style separator
STYLE_SEPARATOR: ':::';

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
DOUBLECIRCLESTART: '(((';
DOUBLECIRCLEEND: ')))';
TRAPEZOID_START: '[/';
INV_TRAPEZOID_START: '[\\';
ELLIPSE_END: '-)';
STADIUM_END: ')]';
SUBROUTINE_END: ']]';
TRAPEZOID_END: '/]';
INV_TRAPEZOID_END: '\\]';

// Basic shape delimiters
TAGSTART: '<';
UP: '^';
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
SEMI: ';';
COLON: ':';

// Link targets
LINK_TARGET: '_self' | '_blank' | '_parent' | '_top';

// Additional basic tokens for simplified version
STR: '"' ~["]* '"';
MD_STR: '"' '`' ~[`]* '`' '"';

// Direction tokens (specific patterns first)
DIRECTION_TD: 'TD';
DIRECTION_LR: 'LR';
DIRECTION_RL: 'RL';
DIRECTION_BT: 'BT';
DIRECTION_TB: 'TB';

// Generic text token (lower precedence)
TEXT: [a-zA-Z0-9_]+;

// Node string - moved to end for proper precedence (lowest priority)
// Removed dash (-) to prevent conflicts with arrow patterns
NODE_STRING: [A-Za-z0-9!"#$%&'*+.`?\\/_=]+;

// Accessibility value patterns - removed for now to avoid conflicts
// These should be handled in lexer modes or parser rules instead

// Whitespace definition
fragment WS: [ \t]+;
