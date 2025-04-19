/**
 * Mindmap grammar for Langium
 * Converted from mermaid's jison grammar
 */
grammar Mindmap

entry MindmapDoc:
    MINDMAP_KEYWORD (newline=NL)?
    (statements+=Statement)*;

Statement:
    (indent=INDENTATION)? element=Element (terminator=NL)?;

Element:
    Node | IconDecoration | ClassDecoration;

Node:
    ComplexNode | SimpleNode;

SimpleNode:
    id=ID
    // Ensure it does not match the structure of a ComplexNode
    (NL | INDENTATION)?;

ComplexNode:
    (id=ID)?
    start=(LPAREN|LBRACKET|LCURLY|START_CLOUD|DOUBLE_PAREN)
    desc=(ID|STRING)
    end=(RPAREN|RBRACKET|RCURLY|END_CLOUD|DOUBLE_PAREN);

IconDecoration:
    ICON_KEYWORD content=(ID|STRING) RPAREN;

ClassDecoration:
    CLASS_KEYWORD content=(ID|STRING);

// Keywords with fixed text patterns
terminal MINDMAP_KEYWORD: 'mindmap';
terminal ICON_KEYWORD: '::icon(';
terminal CLASS_KEYWORD: ':::';

// Delimiters - using unique string literals
terminal LPAREN: '(';
terminal RPAREN: ')';
terminal DOUBLE_PAREN: '((' | '))';  // Combined to avoid regex conflicts
terminal LBRACKET: '[';
terminal RBRACKET: ']';
terminal LCURLY: '{{';
terminal RCURLY: '}}';
terminal START_CLOUD: '(-';
terminal END_CLOUD: '-)';

// Basic token types
terminal ID: /[a-zA-Z0-9_\-\.\/]+/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal INDENTATION: /[ \t]{2,}/;  // Two or more spaces/tabs for indentation
terminal NL: /\r?\n/;

// Hidden tokens
hidden terminal WS: /[ \t]/;  // Single space or tab for hidden whitespace
hidden terminal ML_COMMENT: /\%\%[^\n]*/;

// Type definition for node types
type NodeType = 'DEFAULT' | 'CIRCLE' | 'CLOUD' | 'BANG' | 'HEXAGON' | 'ROUND';
