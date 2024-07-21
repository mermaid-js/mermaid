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


Options:
    'options' '{' rawOptions+=STRING* '}' EOL;

Direction:
    dir=('LR' | 'TB' | 'BT') EOL;

Commit:
    'commit' properties+=CommitProperty* EOL;

CommitProperty
: CommitId
| CommitMessage
| Tags
| CommitType
;

CommitId:
    'id:' id=STRING;

CommitMessage:
    'msg:'? message=STRING;

Tags:
    'tag:' tags=STRING;

CommitType:
    'type:' name=('NORMAL' | 'REVERSE' | 'HIGHLIGHT');

Branch:
    'branch' name=(ID|STRING) ('order:' order=INT)? EOL;

Merge:
    'merge' name=(ID|STRING) properties+=MergeProperties*  EOL;

MergeProperties
: CommitId
| Tags
| CommitType
;

Checkout:
    ('checkout'|'switch') id=(ID|STRING) EOL;

CherryPicking:
    'cherry-pick' properties+=CherryPickProperties* EOL;

CherryPickProperties
: CommitId
| Tags
| ParentCommit
;

ParentCommit:
    'parent:' id=STRING;

terminal INT returns number: /[0-9]+(?=\s)/;
terminal ID returns string: /\w([-\./\w]*[-\w])?/;
terminal STRING: /"[^"]*"|'[^']*'/;

