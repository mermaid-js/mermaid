grammar Info
import "../common/common";

entry Info:
  NEWLINE*
  "info"
  (
    NEWLINE* TitleAndAccessibilities
    | NEWLINE*
  )
;
