grammar Flowchart

// from common
// fragment EOL returns string:
//   NEWLINE+ | EOF
// ;
// terminal NEWLINE: /\r?\n/;
// hidden terminal WHITESPACE: /[\t ]+/;
import "../common/common";

entry Flowchart:
  NEWLINE*
  FlowchartType FlowchartDirection?
  DELIMITER
  ((nodes+=FlowchartNode | edges+=FlowchartEdge | subgraphs+=FlowchartSubgraph | styles+=FlowchartStyle | interactions+=FlowchartInteraction) DELIMITER)*
;

fragment FlowchartDirection:
  dir=("TD" | "TB"| "v" | "BT" | "^" | "LR" | ">" | "RL" | "<");

fragment FlowchartType:
  type=("flowchart-elk" | "graph" | "flowchart");

FlowchartSubgraph:
  "subgraph" id=ID DELIMITER
    ("direction" FlowchartDirection DELIMITER)?
    ((nodes+=FlowchartNode | edges+=FlowchartEdge | subgraphs+=FlowchartSubgraph) DELIMITER)*
  "end";

terminal EllipseLabel: "(-" -> "-)";
FlowchartNodeEllipse:
  id=ID label=EllipseLabel (":::" class=ID)?;

terminal StadiumLabel: "([" -> "])";
FlowchartNodeStadium:
  id=ID label=StadiumLabel (":::" class=ID)?;

terminal OddLabel: ">" -> "]";
FlowchartNodeOdd:
  id=ID label=OddLabel (":::" class=ID)?;

terminal CylinderLabel: "[(" -> ")]";
FlowchartNodeCylinder:
  id=ID label=CylinderLabel (":::" class=ID)?;

terminal DoublecircleLabel: "(((" -> ")))";
FlowchartNodeDoublecircle:
  id=ID label=DoublecircleLabel (":::" class=ID)?;

terminal TrapezoidLabel: "[/" -> "\\]";
FlowchartNodeTrapezoid:
  id=ID label=TrapezoidLabel (":::" class=ID)?;

terminal InvTrapezoidLabel: "[\\" -> "/]";
FlowchartNodeInvTrapezoid:
  id=ID label=InvTrapezoidLabel (":::" class=ID)?;

terminal LeanRightLabel: "[/" -> "/]";
FlowchartNodeLeanRight:
  id=ID label=LeanRightLabel (":::" class=ID)?;

terminal LeanLeftLabel: "[\\" -> "\\]";
FlowchartNodeLeanLeft:
  id=ID label=LeanLeftLabel (":::" class=ID)?;

terminal SubroutineLabel: "[[" -> "]]";
FlowchartNodeSubroutine:
  id=ID label=SubroutineLabel (":::" class=ID)?;

terminal HexagonLabel: "{{" -> "}}";
FlowchartNodeHexagon:
  id=ID label=HexagonLabel (":::" class=ID)?;

terminal SquareLabel: "[" -> "]";
FlowchartNodeSquare:
  id=ID (label=SquareLabel)? (":::" class=ID)?;

terminal RoundLabel: "(" -> ")";
FlowchartNodeRound:
  id=ID label=RoundLabel (":::" class=ID)?;

terminal DiamondLabel: "{" -> "}";
FlowchartNodeDiamond:
  id=ID label=DiamondLabel (":::" class=ID)?;

FlowchartNode:
  FlowchartNodeSquare | 
  FlowchartNodeRound | 
  FlowchartNodeDiamond | 
  FlowchartNodeEllipse |
  FlowchartNodeStadium |
  FlowchartNodeOdd |
  FlowchartNodeCylinder |
  FlowchartNodeDoublecircle |
  FlowchartNodeTrapezoid |
  FlowchartNodeInvTrapezoid |
  FlowchartNodeLeanRight |
  FlowchartNodeLeanLeft |
  FlowchartNodeSubroutine |
  FlowchartNodeHexagon;

terminal fragment ArrowStart: "<" | "x" | "o";
terminal fragment ArrowEnd: ">" | "x" | "o";
terminal fragment DottedArrowEnd:  "."* ".-" ArrowEnd?;

terminal DottedArrowWithLabel: ArrowStart? "-." -> DottedArrowEnd;
terminal DottedArrow: ArrowStart? "-"? DottedArrowEnd;

terminal RegularArrowWithLabel: ArrowStart? "--" -> "-" "-"+ ('-' |ArrowEnd);
terminal RegularArrow: (ArrowStart "-" "-"+ ArrowEnd?) | ("-" "-"+ ('-' |ArrowEnd));

terminal ThickArrowWithLabel: ArrowStart? "==" -> "=" "="+ ("=" | ArrowEnd);
terminal ThickArrow: (ArrowStart "=" "="+ ArrowEnd?) | ("=" "="+ ("=" | ArrowEnd));

terminal InvisibleArrow: "~~" "~"+;

terminal EdgeLabel: "|" -> "|";

FlowchartEdge:
  FlowchartEdgeRegular | FlowchartEdgeDotted | FlowchartEdgeThick | FlowchartEdgeInvisible;

FlowchartEdgeDotted:
  (start=FlowchartNode arrow=DottedArrow (label=EdgeLabel)? end=FlowchartNode) |
  (start=FlowchartNode arrow=DottedArrowWithLabel end=FlowchartNode);

FlowchartEdgeRegular:
  (start=FlowchartNode arrow=RegularArrow (label=EdgeLabel)? end=FlowchartNode) |
  (start=FlowchartNode arrow=RegularArrowWithLabel end=FlowchartNode);

FlowchartEdgeThick:
  (start=FlowchartNode arrow=ThickArrow (label=EdgeLabel)? end=FlowchartNode) |
  (start=FlowchartNode arrow=ThickArrowWithLabel end=FlowchartNode);

FlowchartEdgeInvisible:
  start=FlowchartNode arrow=(InvisibleArrow) (label=EdgeLabel)? end=FlowchartNode;

FlowchartStyle:
  "style" id=ID items+=FlowchartStylePair ("," items+=FlowchartStylePair)*;

FlowchartStylePair:
  key=ID ":" (value+=ID)+;

terminal Target: "_self" | "_blank" | "_parent" | "_top";
terminal String: "\"" -> "\"";

fragment FlowchartInteractionLink:
  "href"? href=String (tooltip=String)? (targe=Target)?;

fragment FlowchartInteractionFunction:
  callback=ID (tooltip=String)?;

fragment FlowchartInteractionCall:
  // RoundLabel is a temp solution
  "call" callback=ID arguments=RoundLabel (tooltip=String)?;

FlowchartInteraction:
  "click" id=ID (FlowchartInteractionLink | FlowchartInteractionFunction | FlowchartInteractionCall);

terminal ID: /[_\-\w#]+/;

fragment DELIMITER returns string:
  ";" NEWLINE* | EOL
;
