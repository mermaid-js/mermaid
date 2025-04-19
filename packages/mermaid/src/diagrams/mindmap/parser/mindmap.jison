/**
 * Mindmap grammar for Langium
 * Converted from mermaid's jison grammar
 */
grammar Mindmap

// Entry rule - equivalent to the 'start' rule in jison
entry MindmapDocument:
    // The document starts with the 'mindmap' keyword
    (spaceLines+=SPACELINE)*
    'mindmap' (NL)?
    (documentContent=DocumentContent)?;

// Document contains multiple statements separated by newlines
DocumentContent:
    statements+=Statement (stop+=Stop statements+=Statement)* (stop+=Stop)?;

// A stop is a newline, EOF, or a spaceline - used to separate statements
Stop:
    NL | EOF | SPACELINE;

// Statements can be nodes, icons, classes, or empty lines
Statement:
    // The whitespace prefix determines nesting level in the mindmap
    (indent=INDENT)? (
        node=Node |         // A node in the mindmap
        icon=IconDecoration | // Icon decoration for a node
        cssClass=ClassDecoration // CSS class for a node
    ) |
    SPACELINE; // Empty or comment lines

// A node can be either simple (just ID) or complex (with description)
Node:
    SimpleNode | ComplexNode;

// Simple node is just an identifier
SimpleNode:
    id=NODE_ID;

// Complex node has a description enclosed in brackets, parentheses, etc.
ComplexNode:
    // Optional ID followed by a description with delimiters
    (id=NODE_ID)? start=NODE_DSTART description=NODE_DESCR end=NODE_DEND;

// Icon decoration for nodes
IconDecoration:
    '::icon(' name=ICON ')';

// CSS class decoration for nodes
ClassDecoration:
    ':::' name=CLASS;

// Hidden terminal rules (comments, whitespace that should be ignored during parsing)
hidden terminal WS: /[ \t]+/;

// Terminal rules (lexer rules)
terminal INDENT: /[ \t]+/;
terminal SPACELINE: /\s*\%\%.*|[ \t]+\n/;
terminal NL: /\n+/;
terminal EOF: /$/;

// Node related terminals with refined regex patterns to match the jison lexer
terminal NODE_ID: /[^\(\[\n\)\{\}]+/;
terminal NODE_DSTART: /\(\(|\{\{|\(|\[|\-\)|\(\-|\)\)|\)/;
terminal NODE_DEND: /\)\)|\}\}|\)|\]|\(\-|\-\)|\(\(/;
terminal NODE_DESCR: /[^"\)`\]]+/;
terminal ICON: /[^\)]+/;
terminal CLASS: /[^\n]+/;

// We also need to implement these semantic actions from the jison grammar:
// - addNode(level, id, description, type)
// - decorateNode({icon: iconName})
// - decorateNode({class: className})
// - getType(startDelimiter, endDelimiter)

/**
 * Interface for a MindmapNode.
 * This represents the AST node for a mindmap node.
 */
interface MindmapNode {
    id: string;
    description?: string;
    type: NodeType;
    level: number;  // Indentation level (derived from the INDENT token)
    icon?: string;
    cssClass?: string;
    children?: MindmapNode[];
}

/**
 * The different node types in mindmap based on delimiters.
 * This corresponds to the yy.getType() function in the jison grammar.
 */
type NodeType = 'DEFAULT' | 'CIRCLE' | 'CLOUD' | 'BANG' | 'HEXAGON' | 'ROUND';
