/**
 * TreeView grammar for Langium
 * Converted from treemap grammar
 *
 * The ML_COMMENT and NL hidden terminals handle whitespace, comments, and newlines
 * before the treemap keyword, allowing for empty lines and comments before the
 * treeView declaration.
 */
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

// This should be processed before whitespace is ignored
terminal INDENTATION: /[ \t]{1,}/;  // One or more spaces/tabs for indentation

hidden terminal WS: /[ \t]+/;  // One or more spaces or tabs for hidden whitespace
hidden terminal ML_COMMENT: /\%\%[^\n]*/;
hidden terminal NL: /\r?\n/;

TreeNode: 
    // actually contains the indent, but is converted to a length value by valueConverter
    indent=INDENTATION?
    name=STRING2
;

terminal STRING2: /"[^"]*"|'[^']*'/;
