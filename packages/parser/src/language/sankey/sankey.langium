grammar Sankey
import "../common/common";

interface Sankey extends Common {
  links: SankeyLink[];
  nodes: string[];
}

entry Sankey returns Sankey:
  NEWLINE*
  "sankey-beta"
  (
    NEWLINE* TitleAndAccessibilities links+=SankeyLink+
    | NEWLINE+ links+=SankeyLink+
  )
;

SankeyLink:
  source=SANKEY_LINK_NODE SANKEY_LINK_COMMA target=SANKEY_LINK_NODE SANKEY_LINK_COMMA value=SANKEY_LINK_VALUE NEWLINE+
;

terminal SANKEY_LINK_COMMA: /,/;
terminal SANKEY_LINK_VALUE returns number: /"(0|[1-9][0-9]*)(\.[0-9]+)?"|[\t ]*(0|[1-9][0-9]*)(\.[0-9]+)?/;
terminal SANKEY_LINK_NODE: /sankey-link-node/;
