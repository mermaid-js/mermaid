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
    | alignments+=Alignment
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
    lhsId=EdgeId lhsGroup?=ARROW_GROUP? Arrow rhsId=EdgeId rhsGroup?=ARROW_GROUP? EOL
;

// An edge endpoint can be a single direction letter (e.g. `T:R -- L:a`), so it
// also accepts an ARROW_DIRECTION token as its id.
EdgeId returns string: ID | ARROW_DIRECTION;

Alignment:
    'align' direction=('row' | 'column') members+=ID (members+=ID)+ EOL
;

// A direction letter is only meaningful next to the ':' of a port, so the
// terminal only matches there; otherwise 'L', 'R', 'T' and 'B' must stay part
// of the surrounding identifier (e.g. `service TH(disk)` or `L:Backend`).
// Whitespace may separate the letter from its colon (e.g. `a: B -- T :b`).
terminal ARROW_DIRECTION: /[LRTB](?=[ \t]*:)|(?<=:[ \t]*)[LRTB](?!\w|-(?![-\[]))/;
terminal ARROW_GROUP: /\{group\}/;
terminal ARROW_INTO: /<|>/;
