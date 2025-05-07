/**
 * Treemap grammar for Langium
 * Converted from mindmap grammar
 *
 * The ML_COMMENT and NL hidden terminals handle whitespace, comments, and newlines
 * before the treemap keyword, allowing for empty lines and comments before the
 * treemap declaration.
 */
grammar Treemap

// Interface declarations for data types
interface Item {}
interface Section extends Item {
    name: string
}
interface Leaf extends Item {
    name: string
    value: number
}

entry TreemapDoc:
    TREEMAP_KEYWORD
    (TreemapRows+=TreemapRow)*;

terminal SEPARATOR: ':';
terminal COMMA: ',';

hidden terminal WS: /[ \t]+/;  // One or more spaces or tabs for hidden whitespace
hidden terminal ML_COMMENT: /\%\%[^\n]*/;
hidden terminal NL: /\r?\n/;

TreemapRow:
    indent=INDENTATION? item=Item;

Item returns Item:
    Leaf | Section;

// Use a special rule order to handle the parsing precedence
Section returns Section:
    name=STRING;

Leaf returns Leaf:
    name=STRING INDENTATION? (SEPARATOR | COMMA) INDENTATION? value=MyNumber;

// This should be processed before whitespace is ignored
terminal INDENTATION: /[ \t]{1,}/;  // One or more spaces/tabs for indentation

// Keywords with fixed text patterns
terminal TREEMAP_KEYWORD:  'treemap';

// Define as a terminal rule
terminal NUMBER: /[0-9_\.\,]+/;

// Then create a data type rule that uses it
MyNumber returns number: NUMBER;

terminal STRING: /"[^"]*"|'[^']*'/;
// Modified indentation rule to have higher priority than WS
