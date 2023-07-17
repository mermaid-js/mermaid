grammar Info
import "../common/common";

entry Info:
  NEWLINE*
  info=INFO_KEYWORD
  NEWLINE*
;

terminal INFO_KEYWORD: /info/;
