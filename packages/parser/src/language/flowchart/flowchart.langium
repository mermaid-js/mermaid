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
  ((nodes+=FlowchartNode | edges+=FlowchartEdge | subgraphs+=FlowchartSubgraph) DELIMITER)*
;

FlowchartDirection:
  dir=("TD" | "TB"| "v" | "BT" | "^" | "LR" | ">" | "RL" | "<");

FlowchartType:
  type=("flowchart-elk" | "graph" | "flowchart");

FlowchartSubgraph:
  "subgraph" label=ID DELIMITER
    ("direction" FlowchartDirection DELIMITER)?
    ((nodes+=FlowchartNode | edges+=FlowchartEdge) DELIMITER)*
  "end";

terminal EllipseLabel: "(-" -> "-)";
FlowchartNodeEllipse:
  id=ID label=EllipseLabel;

terminal StadiumLabel: "([" -> "])";
FlowchartNodeStadium:
  id=ID label=StadiumLabel;

terminal OddLabel: ">" -> "]";
FlowchartNodeOdd:
  id=ID label=OddLabel;

terminal CylinderLabel: "[(" -> ")]";
FlowchartNodeCylinder:
  id=ID label=CylinderLabel;

terminal DoublecircleLabel: "(((" -> ")))";
FlowchartNodeDoublecircle:
  id=ID label=DoublecircleLabel;

terminal TrapezoidLabel: "[/" -> "\\]";
FlowchartNodeTrapezoid:
  id=ID label=TrapezoidLabel;

terminal InvTrapezoidLabel: "[\\" -> "/]";
FlowchartNodeInvTrapezoid:
  id=ID label=InvTrapezoidLabel;

terminal LeanRightLabel: "[/" -> "/]";
FlowchartNodeLeanRight:
  id=ID label=LeanRightLabel;

terminal LeanLeftLabel: "[\\" -> "\\]";
FlowchartNodeLeanLeft:
  id=ID label=LeanLeftLabel;

terminal SubroutineLabel: "[[" -> "]]";
FlowchartNodeSubroutine:
  id=ID label=SubroutineLabel;

terminal HexagonLabel: "{{" -> "}}";
FlowchartNodeHexagon:
  id=ID label=HexagonLabel;

terminal SquareLabel: "[" -> "]";
FlowchartNodeSquare:
  id=ID (label=SquareLabel)?;

terminal RoundLabel: "(" -> ")";
FlowchartNodeRound:
  id=ID label=RoundLabel;

terminal DiamondLabel: "{" -> "}";
FlowchartNodeDiamond:
  id=ID label=DiamondLabel;

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
terminal DottedArrow: ArrowStart? "-" DottedArrowEnd;

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

terminal ID: /[a-zA-Z0-9]+/;

fragment DELIMITER returns string:
  ";" NEWLINE* | EOL
;
