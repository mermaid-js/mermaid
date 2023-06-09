grammar Pie
import "./common";

entry Pie:
  NEWLINE*
  PIE showData?=SHOWDATA? NEWLINE*
  TitleAndAccessibilities?
  (sections+=PieSection NEWLINE+)*
;

PieSection:
  label=PIE_SECTION_LABEL ":" value=NUMBER
;

terminal PIE: /pie(?!\S)/;
terminal SHOWDATA: /showData(?!\S)/;
terminal PIE_SECTION_LABEL: /"[^"]+"/;
