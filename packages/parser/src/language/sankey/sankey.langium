grammar Sankey

// common stuff in ../common/common.langium
// can't import directly because of SANKEY_LINK_SOURCE parse rule
fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) NEWLINE+)+
;

terminal NEWLINE: /\r?\n/;
terminal ACC_DESCR: /[\t ]*(?:accDescr(?:[\t ]*:[\t ]*[^\n\r]*?(?=%%)|\s*{[^}]*})|accDescr(?:[\t ]*:[\t ]*[^\n\r]*|\s*{[^}]*}))/;
terminal ACC_TITLE: /[\t ]*(?:accTitle[\t ]*:[\t ]*[^\n\r]*?(?=%%)|accTitle[\t ]*:[\t ]*[^\n\r]*)/;
terminal TITLE: /[\t ]*(?:title(?:[\t ]+[^\n\r]*?|)(?=%%)|title(?:[\t ]+[^\n\r]*|))/;
hidden terminal WHITESPACE: /[\t ]+/;
hidden terminal YAML: /---[\t ]*\r?\n[\s\S]*?---[\t ]*(?!.)/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\s\S]*?}%%\s*/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*(\r?\n)*/;

interface Sankey {
  accDescr?: string;
  accTitle?: string
  title?: string
  links: SankeyLink[]
  nodes: string[]
}

// actual grammar
entry Sankey returns Sankey:
  NEWLINE*
  "sankey-beta"
  (
    NEWLINE* TitleAndAccessibilities links+=SankeyLink+
    | NEWLINE+ links+=SankeyLink+
  )
;

SankeyLink:
  source=SANKEY_LINK_SOURCE target=SANKEY_LINK_TARGET value=SANKEY_LINK_VALUE NEWLINE+
;

terminal SANKEY_LINK_VALUE returns number: /,[\t ]*(0|[1-9][0-9]*)(\.[0-9]+)?/;
terminal SANKEY_LINK_TARGET: /,[\t ]*("[^\n\r"]+"|[^\n\r,]+)/;
terminal SANKEY_LINK_SOURCE: /sankey-link-source/;
