grammar Pie
import "./common";

entry Pie:
  NEWLINE*
  PIE showData?=SHOWDATA? NEWLINE*
  TitleAndAccessibilities?
  (sections+=PieSection NEWLINE+)*
;

PieSection:
  label=STRING ":" value=NUMBER
;

terminal PIE: /pie(?!\S)/;
terminal SHOWDATA: /showData(?!\S)/;
