grammar NetworkGrammar
import "../common/common";

entry Network:
  NEWLINE*
  ("network" | "networkDiagram")
  (
    TitleAndAccessibilities
    | nodes+=NetworkNode
    | links+=NetworkLink
    | subnets+=NetworkSubnet
    | NEWLINE
  )*
;

NetworkNode:
  'node' id=ID (':' nodeType=ID)? (label=STRING)? (meta+=NetworkNodeMeta)* EOL
;

NetworkNodeMeta:
  key=ID '=' value=STRING
;

NetworkLink:
  source=ID arrow=NETWORK_LINK_ARROW target=ID (':' label=STRING)? EOL
;

NetworkSubnet:
  'subnet' id=ID (label=STRING)? '{'
  (
    nodes+=NetworkNode
    | links+=NetworkLink
    | NEWLINE
  )*
  '}'
  EOL
;

terminal NETWORK_LINK_ARROW returns string: /<-->|<--|-->|---|--/;
