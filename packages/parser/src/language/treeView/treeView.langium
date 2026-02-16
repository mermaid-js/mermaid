grammar TreeView

fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE))+
;

terminal ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;
terminal ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;

terminal INT returns number: /0|[1-9][0-9]*(?!\.)/;
terminal TEXT: /\S+/;


entry TreeView returns TreeView:
    "treeView-beta"
    (
        TitleAndAccessibilities
        | nodes+=TreeNode
    )*;

TreeNode: 
    indent=INT name=TEXT
;

interface TreeView {
  accDescr?: string;
  accTitle?: string;
  title?: string;
  nodes: TreeNode[];
}



