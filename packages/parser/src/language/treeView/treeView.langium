grammar TreeViewGrammar

terminal ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;
terminal ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;

interface TreeView {
    nodes: TreeNode[]
    title?: string
    accTitle?: string
    accDescr?: string
}

entry TreeView returns TreeView:
    "treeView-beta"
    TitleAndAccessibilities?
    nodes+=TreeNode*
    ;

fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE))+
;

hidden terminal WS: /[ \t]+/;  // One or more spaces or tabs for hidden whitespace
hidden terminal NL: /\r?\n/;

TreeNode: 
    // actually contains the indent, but is converted to a length value by valueConverter
    indent=INDENTATION?
    name=TEXT
;

// This should be processed before whitespace is ignored
terminal INDENTATION: /[ \t]{1,}/;  // One or more spaces/tabs for indentation

terminal TEXT: /\S+/;
