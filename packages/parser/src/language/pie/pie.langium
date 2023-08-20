grammar Pie
import "../common/common";

entry Pie:
  NEWLINE*
  "pie" showData?="showData"?
  (
    NEWLINE* TitleAndAccessibilities sections+=PieSection*
    | NEWLINE+ sections+=PieSection+
    | NEWLINE*
  )
;

PieSection:
  label=PIE_SECTION_LABEL ":" value=PIE_SECTION_VALUE
  NEWLINE+
;

terminal PIE_SECTION_LABEL: /"[^"]+"/;
terminal PIE_SECTION_VALUE returns number: /(0|[1-9][0-9]*)(\.[0-9]+)?/;
