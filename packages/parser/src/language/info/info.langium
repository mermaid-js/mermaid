grammar Info
import "../common/common";

interface Info extends Common {
  version?: string;
}

entry Info returns Info:
  NEWLINE*
  "info" NEWLINE*
  TitleAndAccessibilities?
;
