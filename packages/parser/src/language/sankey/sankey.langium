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
  source=SANKEY_LINK_NODE "," target=SANKEY_LINK_NODE "," value=SANKEY_LINK_VALUE EOL
;

terminal SANKEY_LINK_VALUE returns number: /"(0|[1-9][0-9]*)(\.[0-9]+)?"|[\t ]*(0|[1-9][0-9]*)(\.[0-9]+)?/;
terminal SANKEY_LINK_NODE: /sankey-link-node/;
