grammar InfoGrammar
import "../common/common";

entry Info:
  NEWLINE*
  "info" NEWLINE*
  ("showInfo" NEWLINE*)?
  TitleAndAccessibilities?
;
