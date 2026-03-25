/**
 * TreeView grammar for Langium
 *
 * Supports both quoted labels ("my file") and bare labels (index.js).
 * NODE_CONTENT captures the entire rest-of-line content; detailed parsing
 * of annotations (:::class, icon(), ## description) happens in parser.ts.
 *
 * The ML_COMMENT and NL hidden terminals handle whitespace, comments, and newlines
 * before the treeView keyword, allowing for empty lines and comments before the
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
    // indent is converted to a length value by valueConverter
    indent=INDENTATION?
    // Captures rest-of-line: name + optional :::class, icon(), ## description
    // Detailed parsing of annotations happens in parser.ts
    nodeContent=NODE_CONTENT
;

// Matches from the first non-whitespace character to end of line.
// Must be declared AFTER ML_COMMENT so that %% comment lines take priority.
terminal NODE_CONTENT: /[^ \t\n\r][^\n\r]*/;
