grammar Flowchart
import "../common/common";

entry Flowchart:
  NEWLINE*
  FlowchartType FlowchartDirection?
  DELIMITER
  ((nodes+=FlowchartNode | edges+=FlowchartEdge) DELIMITER)*
;

FlowchartDirection:
  dir=("LR" | "TD" | "DT" | "RL");

FlowchartType:
  type=("flowchart-elk" | "graph" | "flowchart");

FlowchartNode:
  FlowchartNodeSquare | FlowchartNodeRound;

FlowchartNodeSquare:
  id=ID ("["label=ID"]")? shape="square";

FlowchartNodeRound:
  id=ID "("label=ID")" shape="round";

FlowchartEdge:
  start=FlowchartNode "-->" end=FlowchartNode;

// terminal SPACES: /\s/;
terminal ID: /\w+/;

fragment DELIMITER returns string:
  ";" NEWLINE* | NEWLINE+ | EOF
;
