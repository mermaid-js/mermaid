/**
 * Treemap grammar for Langium
 * Converted from mindmap grammar
 *
 * The ML_COMMENT and NL hidden terminals handle whitespace, comments, and newlines
 * before the treemap keyword, allowing for empty lines and comments before the
 * treemap declaration.
 */
grammar TreemapGrammar



fragment TitleAndAccessibilities:
  ((accDescr=ACC_DESCR | accTitle=ACC_TITLE | title=TITLE))+
;

terminal BOOLEAN returns boolean: 'true' | 'false';

terminal ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/;
terminal ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/;
terminal TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/;

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
interface Treemap {
    TreemapRows: TreemapRow[]
    title?: string
    accTitle?: string
    accDescr?: string
}

entry Treemap returns Treemap:
    TREEMAP_KEYWORD
    (
        TitleAndAccessibilities
        | TreemapRows+=TreemapRow
    )*;
terminal TREEMAP_KEYWORD:  'treemap-beta' | 'treemap';

terminal CLASS_DEF: /classDef\s+([a-zA-Z_][a-zA-Z0-9_]+)(?:\s+([^;\r\n]*))?(?:;)?/;
terminal STYLE_SEPARATOR: ':::';
terminal SEPARATOR: ':';
terminal COMMA: ',';

// This should be processed before whitespace is ignored
terminal INDENTATION: /[ \t]{1,}/;  // One or more spaces/tabs for indentation

hidden terminal WS: /[ \t]+/;  // One or more spaces or tabs for hidden whitespace
hidden terminal ML_COMMENT: /\%\%[^\n]*/;
hidden terminal NL: /\r?\n/;

TreemapRow:
    indent=INDENTATION? (item=Item | ClassDef);

// Class definition statement handled by the value converter
ClassDef returns string:
    CLASS_DEF;

Item returns Item:
    Leaf | Section;

// Use a special rule order to handle the parsing precedence
Section returns Section:
    name=STRING2 (STYLE_SEPARATOR classSelector=ID2)?;

Leaf returns Leaf:
    name=STRING2 INDENTATION? (SEPARATOR | COMMA) INDENTATION? value=MyNumber (STYLE_SEPARATOR classSelector=ID2)?;

// Keywords with fixed text patterns
terminal ID2: /[a-zA-Z_][a-zA-Z0-9_]*/;
// Define as a terminal rule
terminal NUMBER2: /[0-9_\.\,]+/;

// Then create a data type rule that uses it
MyNumber returns number: NUMBER2;

terminal STRING2: /"[^"]*"|'[^']*'/;
// Modified indentation rule to have higher priority than WS
