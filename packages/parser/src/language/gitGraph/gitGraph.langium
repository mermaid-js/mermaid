grammar GitGraph
import "../common/common";
import "reference";

entry GitGraph:
  NEWLINE*
  ('gitGraph' | 'gitGraph' ':' | 'gitGraph:' | ('gitGraph' Direction ':'))
  (
    NEWLINE
    | TitleAndAccessibilities
    | statements+=Statement
  )*
;

Statement
: Commit
| Branch
| Merge 
| Checkout 
| CherryPicking
| Click
;

Direction:
    dir=('LR' | 'TB' | 'BT');

Commit:
    'commit' 
    (
        'id:' id=STRING 
        |'msg:'? message=STRING
        |'tag:' tags+=STRING
        |'type:' type=('NORMAL' | 'REVERSE' | 'HIGHLIGHT')
    )* EOL;
Branch:
    'branch' name=(REFERENCE|STRING)
    ('order:' order=INT)?
    EOL;

Merge:
    'merge' branch=(REFERENCE|STRING)
    (
        'id:' id=STRING
        |'tag:' tags+=STRING
        |'type:' type=('NORMAL' | 'REVERSE' | 'HIGHLIGHT')
    )* EOL;

Checkout:
    ('checkout'|'switch') branch=(REFERENCE|STRING) EOL;

CherryPicking:
    'cherry-pick' 
    (
        'id:' id=STRING
        |'tag:' tags+=STRING
        |'parent:' parent=STRING
    )* EOL;

Click:
    'click' id=(STRING|REFERENCE) href=STRING (tooltip=STRING)? (target=('_blank' | '_self' | '_parent' | '_top'))? EOL;
