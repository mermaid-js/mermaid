grammar Pie
import "../common/common";

entry Pie:
  NEWLINE*
  "pie" showData?="showData"?
  (
    TitleAndAccessibilities 
    | sections+=PieSection
    | NEWLINE
  )*
;

PieSection:
  label=STRING ":" value=POSITIVE_NUMBER EOL
;
