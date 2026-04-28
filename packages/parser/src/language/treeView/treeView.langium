/**
 * TreeView grammar for Langium
 *
 * Supports both quoted labels ("my file") and bare labels (index.js).
 * Annotations (:::class, icon(), ## description) are parsed directly into
 * AST fields by the grammar. Value conversion for stripping quotes, extracting
 * class names, icon names, and description text happens in valueConverter.ts.
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

// Annotation terminals with leading whitespace MUST be declared before INDENTATION
// so the lexer tries them first. When the lexer sees " :::highlight", the annotation
// terminal matches the full string (14 chars) vs INDENTATION matching just " " (1 char).
// Chevrotain uses declaration order for priority, so these must come first.
terminal CLASS_ANNOTATION: /[ \t]+:::[ \t]*[A-Za-z_][\w-]*/;
terminal ICON_ANNOTATION: /[ \t]+icon\([\w-]*\)/;
terminal DESC_ANNOTATION: /[ \t]+##[^\n\r]*/;

// This should be processed before whitespace is ignored
terminal INDENTATION: /[ \t]{1,}/;  // One or more spaces/tabs for indentation

// Name terminals
terminal QUOTED_NAME: /"[^"]*"|'[^']*'/;

hidden terminal WS: /[ \t]+/;  // One or more spaces or tabs for hidden whitespace
hidden terminal ML_COMMENT: /\%\%[^\n]*/;
hidden terminal NL: /\r?\n/;

// Bare name: starts with non-whitespace/non-quote, stops before annotation markers.
// Must be declared AFTER ML_COMMENT so that %% comment lines take priority.
terminal BARE_NAME: /(?!:::|icon\(|##)[^ \t\n\r"'](?:(?![ \t]+:::[ \t]*[A-Za-z_]|[ \t]+icon\(|[ \t]+##)[^\n\r])*/;

TreeNode:
    // indent is converted to a length value by valueConverter
    indent=INDENTATION?
    (name=QUOTED_NAME | name=BARE_NAME)
    (classAnnotation=CLASS_ANNOTATION | iconAnnotation=ICON_ANNOTATION | descAnnotation=DESC_ANNOTATION)*
;
