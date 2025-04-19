grammar Architecture
import "../common/common";

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
    ':'? lhsDir=ARROW_DIRECTION
;

fragment RightPort:
    rhsDir=ARROW_DIRECTION ':'?
;

fragment Arrow:
    LeftPort lhsInto?=ARROW_INTO? ('--' | '-' Label '-') rhsInto?=ARROW_INTO? RightPort
;

fragment Icon:
    '(' icon = STRING ')'
;

Group:
    'group' id=ID Icon? Label? ('in' in=ID)?
;

Service:
    'service' id=ID (iconText=STRING | Icon)? Label? ('in' in=ID)?
;

Junction:
    'junction' id=ID ('in' in=ID)?
;

Edge:
    lhsId=ID lhsGroup?=ARROW_GROUP? Arrow rhsId=ID rhsGroup?=ARROW_GROUP?
;

terminal ARROW_DIRECTION: 'L' | 'R' | 'T' | 'B';
terminal ARROW_GROUP: /\{group\}/;
terminal ARROW_INTO: /<|>/;
