grammar EventModel
import "../common/common";

entry EventModel:
  NEWLINE*
  "eventModel-beta" EOL
  TitleAndAccessibilities? 
  blocks+=Block*
;

Block:(Pattern|Trigger|Query|Command|System|EdgeSet)EOL;

Pattern:
    "pattern" name=Name "{" EOL
    roles+=Role*
    "}" EOL
;
Role:
    "role" name=Name "{" EOL
    triggers+=Trigger*
    "}" EOL
;
Trigger:"trigger" name=Name EOL;

Query:"query" name=Name EOL;
Command:"command" name=Name EOL;

System:
    "system" name=Name "{" EOL
        facts+=Fact*
    "}" EOL
;
Fact:NEWLINE* "fact" name=Name EOL NEWLINE*;

EdgeSet: (
  (from=Targets "-->" to=Targets)
  | (to=Targets "<--" from=Targets)
  ) EOL;

Targets:targets+=UNQUOTED("&" targets +=UNQUOTED)*;

Name: name=UNQUOTED("["(displayName=STRING|UNQUOTED)"]")?;

terminal STRING: /"[^"]*"|'[^']*'/;
terminal UNQUOTED: /[a-zA-Z0-9]+/;
