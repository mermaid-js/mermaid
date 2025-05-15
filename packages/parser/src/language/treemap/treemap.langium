/**
 * Treemap grammar for Langium
 * Converted from mindmap grammar
 *
 * The ML_COMMENT and NL hidden terminals handle whitespace, comments, and newlines
 * before the treemap keyword, allowing for empty lines and comments before the
 * treemap declaration.
 */
grammar Treemap
import "../common/common";

// Interface declarations for data types
interface Item {
    name: string
    classSelector?: string // For ::: class
}
interface Section extends Item {
}
interface Leaf extends Item {
    value: number
}
interface ClassDefStatement {
    className: string
    styleText: string // Optional style text
}
interface TreemapDoc {
    TreemapRows: TreemapRow[]
    title?: string
    accTitle?: string
    accDescr?: string
}

entry TreemapDoc returns TreemapDoc:
    NEWLINE*
    TREEMAP_KEYWORD
    (
        TitleAndAccessibilities
        | TreemapRows+=TreemapRow
        | NEWLINE
    )*;

terminal CLASS_DEF: /classDef\s+([a-zA-Z_][a-zA-Z0-9_]+)(?:\s+([^;\r\n]*))?(?:;)?/;
terminal STYLE_SEPARATOR: ':::';
terminal SEPARATOR: ':';
terminal COMMA: ',';

hidden terminal WS: /[ \t]+/;  // One or more spaces or tabs for hidden whitespace
hidden terminal ML_COMMENT: /\%\%[^\n]*/;

TreemapRow:
    indent=INDENTATION? (item=Item | ClassDef);

// Class definition statement handled by the value converter
ClassDef returns string:
    CLASS_DEF;

Item returns Item:
    Leaf | Section;

// Use a special rule order to handle the parsing precedence
Section returns Section:
    name=STRING (STYLE_SEPARATOR classSelector=ID)?;

Leaf returns Leaf:
    name=STRING INDENTATION? (SEPARATOR | COMMA) INDENTATION? value=MyNumber (STYLE_SEPARATOR classSelector=ID)?;

// This should be processed before whitespace is ignored
terminal INDENTATION: /[ \t]{1,}/;  // One or more spaces/tabs for indentation

// Keywords with fixed text patterns
terminal TREEMAP_KEYWORD:  'treemap';

// Then create a data type rule that uses it
MyNumber returns number: NUMBER;
// Modified indentation rule to have higher priority than WS
