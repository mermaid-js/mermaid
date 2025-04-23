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
    CircleNode | OtherComplex | SimpleNode | RoundedNode;

// Specifically handle double parentheses case - highest priority
CircleNode:
    (id=ID)? desc=(CIRCLE_STR);
    // id=ID '((' desc=(CIRCLE_STR) '))';
    // id=ID '((' desc=(ID|STRING) '))';

RoundedNode:
    (id=ID)? desc=(ROUNDED_STR);

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
    ICON_KEYWORD content=(ID|STRING) ')';

ClassDecoration:
    CLASS_KEYWORD content=(ID|STRING);

// This should be processed before whitespace is ignored
terminal INDENTATION: /[ \t]{2,}/;  // Two or more spaces/tabs for indentation

// Keywords with fixed text patterns
terminal MINDMAP_KEYWORD: 'mindmap\n';
terminal ICON_KEYWORD: '::icon(';
terminal CLASS_KEYWORD: ':::';

// Basic token types
terminal ID: /[a-zA-Z0-9_\-\.\/]+/;
// terminal CIRCLE_STR: /[\s\S]*?\)\)/;
terminal CIRCLE_STR:  /\(\(([\s\S]*?)\)\)/;
terminal ROUNDED_STR:  /\(([\s\S]*?)\)/;
// terminal CIRCLE_STR:  /(?!\(\()[\s\S]+?(?!\(\()/;
terminal STRING: /"[^"]*"|'[^']*'/;

// Modified indentation rule to have higher priority than WS

terminal NL: /\r?\n/;

// Hidden tokens
terminal WS: /[ \t]/;  // Single space or tab for hidden whitespace
hidden terminal ML_COMMENT: /\%\%[^\n]*/;

// Type definition for node types
type NodeType = 'DEFAULT' | 'CIRCLE' | 'CLOUD' | 'BANG' | 'HEXAGON' | 'ROUND';
