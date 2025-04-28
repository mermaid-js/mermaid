/**
 * Mindmap grammar for Langium
 * Converted from mermaid's jison grammar
 */
grammar Mindmap

entry MindmapDoc:
    MINDMAP_KEYWORD (newline=NL)?
    (MindmapRows+=MindmapRow)*;

MindmapRow:
    // indent=(INDENTATION | '0') item=Item (terminator=NL)?;
        (indent=INDENTATION)? item=Item (terminator=NL)?;


Item:
    Node | IconDecoration | ClassDecoration;

// Use a special rule order to handle the parsing precedence
Node:
    SquareNode | RoundedNode | CircleNode | BangNode | CloudNode | HexagonNode | SimpleNode;

// Specifically handle double parentheses case - highest priority
CircleNode:
    (id=ID)? desc=(CIRCLE_STR|CIRCLE_QSTR);
BangNode:
    (id=ID)? desc=(BANG_STR|BANG_QSTR);

RoundedNode:
    (id=ID)? desc=(ROUNDED_STR|ROUNDED_QSTR);

SquareNode:
    (id=ID)? desc=(SQUARE_STR|SQUARE_QSTR);

CloudNode:
    (id=ID)? desc=(CLOUD_STR|CLOUD_QSTR);

HexagonNode:
    (id=ID)? desc=(HEXAGON_STR|HEXAGON_QSTR);

// Handle other complex node variants
OtherComplex:
    id=ID
    (
        ('[' '[' desc=(ID | STRING) ']' ']') |
        ('{' '{' desc=(ID | STRING) '}' '}') |
        ('(-' desc=(ID | STRING) '-)') |
        ('(' desc=(ID | STRING) ')')
    );

// Simple node as fallback
SimpleNode:
    id=ID;

IconDecoration:
    content=(ICON);

ClassDecoration:
    content=(CLASS);

// This should be processed before whitespace is ignored
terminal INDENTATION: /[ \t]{2,}/;  // Two or more spaces/tabs for indentation

// Keywords with fixed text patterns
terminal MINDMAP_KEYWORD: 'mindmap\n';
// terminal ICON_KEYWORD: '::icon(';
// terminal CLASS_KEYWORD: ':::';

// Basic token types
terminal CIRCLE_QSTR:  "((\"" -> "\"))";
terminal CIRCLE_STR:  "((" -> "))";
terminal BANG_QSTR:  "))\"" -> "\"((";
terminal BANG_STR:  "))" -> "((";
terminal CLOUD_QSTR:  ")\"" -> "\"(";
terminal CLOUD_STR:  ")" -> "(";
terminal HEXAGON_QSTR:  "{{\"" -> "\"}}";
terminal HEXAGON_STR:  "{{" -> "}}";
terminal ROUNDED_QSTR:  "(\"" -> "\")";
terminal ROUNDED_STR:   "(" -> ")";
terminal SQUARE_QSTR:  /\[\"([\s\S]*?)\"\]/;
terminal SQUARE_STR:  /\[([\s\S]*?)\]/;

terminal ICON: "::icon(" -> ")";
terminal CLASS: /:::([^\n:])*/;

terminal ID: /[a-zA-Z0-9_\-\.\/]+/;

// Modified indentation rule to have higher priority than WS

terminal NL: /\r?\n/;

// Hidden tokens
terminal WS: /[ \t]/;  // Single space or tab for hidden whitespace
hidden terminal ML_COMMENT: /\%\%[^\n]*/;

// Type definition for node types
type NodeType = 'DEFAULT' | 'CIRCLE' | 'CLOUD' | 'BANG' | 'HEXAGON' | 'ROUND';
