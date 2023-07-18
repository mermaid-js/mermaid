grammar Info
import "../common/common";

entry Info:
  NEWLINE*
  INFO_KEYWORD
  (
    NEWLINE* TitleAndAccessibilities
    | NEWLINE*
  )
;

terminal INFO_KEYWORD: /info(?!\S)/;
