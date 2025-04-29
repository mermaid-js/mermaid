grammar UseCase
import "../common/common";

entry UseCaseDiagram:
    NEWLINE*
    "use-case-beta"
    (
    NEWLINE* TitleAndAccessibilities
    | NEWLINE* Statement*
    | NEWLINE*
    )
;

fragment Statement:
    actors+=Actor 
  | useCases+=UseCase
  | edges+=Edge
  | system=System
;

fragment LeftPort:
    ':'lhsDir=ARROW_DIRECTION
;

fragment RightPort:
    rhsDir=ARROW_DIRECTION':'
;

fragment Arrow:
    LeftPort? lhsInto?=ARROW_INTO?
    (
        dashed?=DASHED_ARROW                // use the terminal we defined
      | ('--' | '-' title=UC_TITLE '-')      // solid variants
    )
    rhsInto?=ARROW_INTO? RightPort?;

Actor:
    'actor' id=UC_ID ('position'? position=('left' | 'right'))? EOL
;

UseCase:
    '(' name=UC_LABEL ')' EOL
;

System:
    'system' id=UC_ID '{'
        (NEWLINE* useCases+=UseCase)*
    '}' EOL
;

Edge:
  lhsId=(UC_ID | UC_LABEL) lhsGroup?=ARROW_GROUP? Arrow rhsId=(UC_ID | UC_LABEL) rhsGroup?=ARROW_GROUP? EOL;




terminal ARROW_DIRECTION: 'L' | 'R' | 'T' | 'B';
terminal ARROW_INTO: /<|>/;
terminal UC_TITLE: /\[[\w \-]+\]/;
terminal UC_LABEL: /"[^"]+"/;
terminal DASHED_ARROW : /-\.\->/;   
terminal UC_ID: /[\w]+/; 
terminal ARROW_GROUP: /\{group\}/;