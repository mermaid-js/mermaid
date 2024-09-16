grammar Architecture
import "../common/common";

entry Architecture:
    NEWLINE*
    "architecture-beta"
    (
    NEWLINE* TitleAndAccessibilities
    | NEWLINE* Statement*
    | NEWLINE*
    )
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
    'group' id=ARCH_ID icon=ARCH_ICON? title=ARCH_TITLE? ('in' in=ARCH_ID)? EOL
;

Service:
    'service' id=ARCH_ID (iconText=ARCH_TEXT_ICON | icon=ARCH_ICON)? title=ARCH_TITLE? ('in' in=ARCH_ID)? EOL
;

Junction:
    'junction' id=ARCH_ID ('in' in=ARCH_ID)? EOL
;

Edge:
    lhsId=ARCH_ID lhsGroup?=ARROW_GROUP? Arrow rhsId=ARCH_ID rhsGroup?=ARROW_GROUP? EOL
;

terminal ARROW_DIRECTION: 'L' | 'R' | 'T' | 'B';
terminal ARCH_ID: /[\w]+/;
terminal ARCH_TEXT_ICON: /\("[^"]+"\)/;
terminal ARCH_ICON: /\([\w-:]+\)/;
terminal ARCH_TITLE: /\[[\w ]+\]/;
terminal ARROW_GROUP: /\{group\}/;
terminal ARROW_INTO: /<|>/;
