grammar GitGraph

interface Common {
  accDescr?: string;
  accTitle?: string;
  title?: string;
}

fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE) EOL)+
;

fragment EOL returns string:
  NEWLINE+ | EOF
;

terminal NEWLINE: /\r?\n/;
terminal ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;
terminal ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;

hidden terminal WHITESPACE: /[\t ]+/;
hidden terminal YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/;
hidden terminal DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/;
hidden terminal SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/;

entry GitGraph:
  NEWLINE*
  ('gitGraph' | 'gitGraph' ':' | 'gitGraph:' | ('gitGraph' Direction ':'))
  NEWLINE*
  (
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
    'branch' name=(ID|STRING)
    ('order:' order=INT)?
    EOL;

Merge:
    'merge' branch=(ID|STRING)
    (
        'id:' id=STRING
        |'tag:' tags+=STRING
        |'type:' type=('NORMAL' | 'REVERSE' | 'HIGHLIGHT')
    )* EOL;

Checkout:
    ('checkout'|'switch') branch=(ID|STRING) EOL;

CherryPicking:
    'cherry-pick' 
    (
        'id:' id=STRING
        |'tag:' tags+=STRING
        |'parent:' parent=STRING
    )* EOL;



terminal INT returns number: /[0-9]+(?=\s)/;
terminal ID returns string: /\w([-\./\w]*[-\w])?/;
terminal STRING: /"[^"]*"|'[^']*'/;

