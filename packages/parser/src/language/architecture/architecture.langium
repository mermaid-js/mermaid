grammar ArchitectureGrammar
import "../common/common";
import "arch";

entry Architecture:
    NEWLINE*
    "architecture-beta"
    (
        NEWLINE
        | TitleAndAccessibilities
        | Statement
    )*
;

fragment Statement:
    groups+=Group
    | services+=Service
    | junctions+=Junction
    | edges+=Edge
;

fragment LeftPort:
    ':'lhsDir=ARROW_DIRECTION
;

fragment RightPort:
    rhsDir=ARROW_DIRECTION':'
;

fragment Arrow:
    LeftPort lhsInto?=ARROW_INTO? ('--' | '-' title=ARCH_TITLE '-') rhsInto?=ARROW_INTO? RightPort
;

Group:
    'group' id=ID icon=ARCH_ICON? title=ARCH_TITLE? ('in' in=ID)? EOL
;

Service:
    'service' id=ID (iconText=STRING | icon=ARCH_ICON)? title=ARCH_TITLE? ('in' in=ID)? EOL
;

Junction:
    'junction' id=ID ('in' in=ID)? EOL
;

Edge:
    lhsId=ID lhsGroup?=ARROW_GROUP? Arrow rhsId=ID rhsGroup?=ARROW_GROUP? EOL
;

terminal ARROW_DIRECTION: 'L' | 'R' | 'T' | 'B';
terminal ARROW_GROUP: /\{group\}/;
terminal ARROW_INTO: /<|>/;
