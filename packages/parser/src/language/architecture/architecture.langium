grammar Architecture
import "../common/common";

entry Architecture:
    NEWLINE*
    "architecture"
    (
    NEWLINE* TitleAndAccessibilities
    | NEWLINE* Statement*
    | NEWLINE*
    )
;

fragment Statement:
    groups+=Group
    | services+=Service
    | edges+=Edge
;

fragment Arrow:
    lhsInto?=ARROW_INTO? lhsDir=ARROW_DIRECTION ('--' | '-' title=ARCH_TITLE '-') rhsDir=ARROW_DIRECTION rhsInto?=ARROW_INTO?
;

Group:
    'group' id=ARCH_ID icon=ARCH_ICON? title=ARCH_TITLE? ('in' in=ARCH_ID)? EOL
;

Service:
    'service' id=ARCH_ID icon=ARCH_ICON? title=ARCH_TITLE? ('in' in=ARCH_ID)? EOL
;

Edge:
    lhsId=ARCH_ID Arrow rhsId=ARCH_ID EOL
;

terminal ARROW_DIRECTION: 'L' | 'R' | 'T' | 'B';
terminal ARCH_ID: /[\w]+/;
terminal ARCH_ICON: /\([\w]+\)/;
terminal ARCH_TITLE: /\[[\w ]+\]/;
terminal ARROW_INTO: /\(|\)/;