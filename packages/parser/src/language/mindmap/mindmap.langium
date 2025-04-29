/**
 * Mindmap grammar for Langium
 * Converted from mermaid's jison grammar
 */
grammar Mindmap

entry MindmapDoc:
    (PREDOC)? MINDMAP_KEYWORD
    (MindmapRows+=MindmapRow)*;


PREDOC:
    pre=(ML_COMMENT | WS)+;

MindmapRow:
    (indent=INDENTATION)|(indent=INDENTATION)? (item=Item);

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

// Simple node as fallback
SimpleNode:
    id=ID;

IconDecoration:
    content=(ICON);

ClassDecoration:
    content=(CLASS);

// This should be processed before whitespace is ignored
terminal INDENTATION: /[ \t]{1,}/;  // Two or more spaces/tabs for indentation

// Keywords with fixed text patterns
terminal MINDMAP_KEYWORD:  'mindmap';

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
terminal STRING: /"[^"]*"|'[^']*'/;
// Modified indentation rule to have higher priority than WS

hidden terminal ML_COMMENT: /\s*\%\%[^\n]*/;
hidden terminal NL: /\r?\n/;

// Hidden tokens
terminal WS: /[ \t]/;  // Single space or tab for hidden whitespace

// Type definition for node types
type NodeType = 'DEFAULT' | 'CIRCLE' | 'CLOUD' | 'BANG' | 'HEXAGON' | 'ROUND';
