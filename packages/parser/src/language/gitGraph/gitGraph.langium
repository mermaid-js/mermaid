grammar GitGraph

import "../common/common";

entry GitGraph:
  NEWLINE*
  'gitGraph' Direction? ':'?
  NEWLINE*
  (
    Options?
    NEWLINE*
    (TitleAndAccessibilities |
    statements+=Statement |
     NEWLINE)*
  )
;

Statement
: Commit
| Branch
| Merge 
| Checkout 
| CherryPicking
;


Direction:
    dir=('LR' | 'TB' | 'BT') EOL;

Options:
    'options' '{' rawOptions+=STRING* '}' EOL;

Commit:
    'commit' 
    (
        'id:' id=STRING 
        |'msg:'? message=STRING
        |'tag:' tags=STRING
        |'type:' name=('NORMAL' | 'REVERSE' | 'HIGHLIGHT')
    )* EOL;
Branch:
    'branch' name=(ID|STRING)
    ('order:' order=INT)?
    EOL;

Merge:
    'merge' branch=(ID|STRING)
    (
        'id:' id=STRING
        |'tag:' tags=STRING
        |'type:' name=('NORMAL' | 'REVERSE' | 'HIGHLIGHT')
    )* EOL;

Checkout:
    ('checkout'|'switch') branch=(ID|STRING) EOL;

CherryPicking:
    'cherry-pick' 
    (
        'id:' id=STRING
        |'tag:' tags=STRING
        |'parent:' id=STRING
    )* EOL;

terminal INT returns number: /[0-9]+(?=\s)/;
terminal ID returns string: /\w([-\./\w]*[-\w])?/;
terminal STRING: /"[^"]*"|'[^']*'/;

