grammar TreeView

entry TreeView:
    SPACELIST?
    "treeView-beta"
    TitleAndAccessibilities?
    nodes+=TreeNode*
    SPACELIST?
;

TreeNode: 
    indent=SPACELIST name=TEXT
;

interface Common {
  accDescr?: string;
  accTitle?: string;
  title?: string;
}

fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE))+
;

hidden terminal EOL: /\s*(\r?\n)+/;
terminal SPACELIST: /\s+/;
terminal TEXT: /\S+/;
terminal ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;
terminal ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;




