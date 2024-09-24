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
  id=ID ("["label=ID"]")?;

FlowchartNodeRound:
  id=ID "("label=ID")";

FlowchartEdge:
  start=FlowchartNode "-->" end=FlowchartNode;

terminal ID: /[a-zA-Z0-9]+/;

fragment DELIMITER returns string:
  ";" NEWLINE* | EOL
;
