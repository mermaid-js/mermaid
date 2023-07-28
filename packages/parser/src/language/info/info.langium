grammar Info
import "../common/common";

entry Info returns Info:
  NEWLINE*
  "info" NEWLINE*
  TitleAndAccessibilities?
;

interface Info extends Common {
  version?: string;
}
