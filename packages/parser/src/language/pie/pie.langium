grammar PieGrammar
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
  label=STRING ":" value=NUMBER_PIE EOL
;

terminal FLOAT_PIE returns number: /-?[0-9]+\.[0-9]+(?!\.)/;
terminal INT_PIE returns number: /-?(0|[1-9][0-9]*)(?!\.)/;
terminal NUMBER_PIE returns number: FLOAT_PIE |  INT_PIE;
