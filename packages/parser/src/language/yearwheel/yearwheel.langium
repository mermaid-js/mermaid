grammar YearwheelGrammar
import "../common/common";

entry Yearwheel:
  NEWLINE*
  "yearwheel" ';'?
  NEWLINE*
  baseDate=YearwheelBaseDate?
  (
    TitleAndAccessibilities
    | events+=YearwheelEvent
    | NEWLINE
  )*
;

YearwheelBaseDate:
  "baseDate" (useNow?="now" | date=YEARWHEEL_DATE) EOL
;

YearwheelEvent:
  id=ID "(" label=STRING "," cron=STRING ")" EOL
;

terminal YEARWHEEL_DATE returns string: /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/;
