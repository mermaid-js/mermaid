# JISON Token Analysis for Lezer Migration

## Overview
This document analyzes all token patterns from the JISON flowchart parser (`flow.jison`) to facilitate migration to Lezer. The analysis includes lexer modes, token patterns, and their semantic meanings.

## Lexer Modes (States)
JISON uses multiple lexer states to handle context-sensitive tokenization:

```
%x string              - String literal parsing
%x md_string           - Markdown string parsing  
%x acc_title           - Accessibility title
%x acc_descr           - Accessibility description
%x acc_descr_multiline - Multi-line accessibility description
%x dir                 - Direction parsing after graph keyword
%x vertex              - Vertex/node parsing
%x text                - Text content within shapes
%x ellipseText         - Text within ellipse shapes
%x trapText            - Text within trapezoid shapes
%x edgeText            - Text on edges (arrows)
%x thickEdgeText       - Text on thick edges
%x dottedEdgeText      - Text on dotted edges
%x click               - Click interaction parsing
%x href                - Href interaction parsing
%x callbackname        - Callback function name
%x callbackargs        - Callback function arguments
%x shapeData           - Shape data parsing (@{...})
%x shapeDataStr        - String within shape data
%x shapeDataEndBracket - End bracket for shape data
```

## Core Token Patterns

### Keywords and Directives
```javascript
// Graph types
"flowchart-elk"     -> GRAPH
"graph"             -> GRAPH  
"flowchart"         -> GRAPH
"subgraph"          -> subgraph
"end"               -> end

// Styling
"style"             -> STYLE
"default"           -> DEFAULT
"linkStyle"         -> LINKSTYLE
"interpolate"       -> INTERPOLATE
"classDef"          -> CLASSDEF
"class"             -> CLASS

// Interactions
"click"             -> CLICK (enters click mode)
"href"              -> HREF
"call"              -> CALLBACKNAME (enters callbackname mode)

// Link targets
"_self"             -> LINK_TARGET
"_blank"            -> LINK_TARGET
"_parent"           -> LINK_TARGET
"_top"              -> LINK_TARGET
```

### Direction Tokens (in dir mode)
```javascript
<dir>\s*"LR"        -> DIR
<dir>\s*"RL"        -> DIR
<dir>\s*"TB"        -> DIR
<dir>\s*"BT"        -> DIR
<dir>\s*"TD"        -> DIR
<dir>\s*"BR"        -> DIR
<dir>\s*"<"         -> DIR
<dir>\s*">"         -> DIR
<dir>\s*"^"         -> DIR
<dir>\s*"v"         -> DIR
<dir>(\r?\n)*\s*\n  -> NODIR
```

### Legacy Direction Patterns
```javascript
.*direction\s+TB[^\n]*  -> direction_tb
.*direction\s+BT[^\n]*  -> direction_bt
.*direction\s+RL[^\n]*  -> direction_rl
.*direction\s+LR[^\n]*  -> direction_lr
```

### Punctuation and Operators
```javascript
[0-9]+              -> NUM
\#                  -> BRKT
":::"               -> STYLE_SEPARATOR
":"                 -> COLON
"&"                 -> AMP
";"                 -> SEMI
","                 -> COMMA
"*"                 -> MULT
"-"                 -> MINUS
"<"                 -> TAGSTART
">"                 -> TAGEND
"^"                 -> UP
"\|"                -> SEP
"v"                 -> DOWN
"\""                -> QUOTE
```

### Link and Arrow Patterns
```javascript
// Regular arrows
<INITIAL,edgeText>\s*[xo<]?\-\-+[-xo>]\s*     -> LINK
<INITIAL>\s*[xo<]?\-\-\s*                     -> START_LINK
<edgeText>[^-]|\-(?!\-)+                      -> EDGE_TEXT

// Thick arrows  
<INITIAL,thickEdgeText>\s*[xo<]?\=\=+[=xo>]\s* -> LINK
<INITIAL>\s*[xo<]?\=\=\s*                      -> START_LINK
<thickEdgeText>[^=]|\=(?!=)                    -> EDGE_TEXT

// Dotted arrows
<INITIAL,dottedEdgeText>\s*[xo<]?\-?\.+\-[xo>]?\s* -> LINK
<INITIAL>\s*[xo<]?\-\.\s*                          -> START_LINK
<dottedEdgeText>[^\.]|\.(?!-)                      -> EDGE_TEXT

// Invisible links
<*>\s*\~\~[\~]+\s*                            -> LINK
```

### Shape Delimiters
```javascript
// Basic shapes
<*>"("              -> PS (pushes text mode)
<text>")"           -> PE (pops text mode)
<*>"["              -> SQS (pushes text mode)
<text>"]"           -> SQE (pops text mode)
<*>"{"              -> DIAMOND_START (pushes text mode)
<text>(\})          -> DIAMOND_STOP (pops text mode)
<*>"|"              -> PIPE (pushes text mode)
<text>"|"           -> PIPE (pops text mode)

// Special shapes
<*>"(["             -> STADIUMSTART
<text>"])"          -> STADIUMEND
<*>"[["             -> SUBROUTINESTART
<text>"]]"          -> SUBROUTINEEND
<*>"[("             -> CYLINDERSTART
<text>")]"          -> CYLINDEREND
<*>"((("            -> DOUBLECIRCLESTART
<text>")))"         -> DOUBLECIRCLEEND
<*>"(-"             -> (- (ellipse start)
<ellipseText>[-/\)][\)] -> -) (ellipse end)
<*>"[/"             -> TRAPSTART
<trapText>[\\(?=\])][\]] -> TRAPEND
<*>"[\\"            -> INVTRAPSTART
<trapText>\/(?=\])\] -> INVTRAPEND

// Vertex with properties
"[|"                -> VERTEX_WITH_PROPS_START
```

### String and Text Patterns
```javascript
// Regular strings
<*>["]              -> (pushes string mode)
<string>[^"]+       -> STR
<string>["]         -> (pops string mode)

// Markdown strings
<*>["][`]           -> (pushes md_string mode)
<md_string>[^`"]+   -> MD_STR
<md_string>[`]["]   -> (pops md_string mode)

// Text within shapes
<text>[^\[\]\(\)\{\}\|\"]+  -> TEXT
<ellipseText>[^\(\)\[\]\{\}]|-\!\)+ -> TEXT
<trapText>\/(?!\])|\\(?!\])|[^\\\[\]\(\)\{\}\/]+ -> TEXT
```

### Node Identifiers
```javascript
// Complex node string pattern
([A-Za-z0-9!"\#$%&'*+\.`?\\_\/]|\-(?=[^\>\-\.])|=(?!=))+ -> NODE_STRING

// Unicode text support (extensive Unicode ranges)
[\u00AA\u00B5\u00BA\u00C0-\u00D6...] -> UNICODE_TEXT

// Link IDs
[^\s\"]+\@(?=[^\{\"])  -> LINK_ID
```

### Accessibility Patterns
```javascript
accTitle\s*":"\s*                    -> acc_title (enters acc_title mode)
<acc_title>(?!\n|;|#)*[^\n]*         -> acc_title_value (pops mode)
accDescr\s*":"\s*                    -> acc_descr (enters acc_descr mode)
<acc_descr>(?!\n|;|#)*[^\n]*         -> acc_descr_value (pops mode)
accDescr\s*"{"\s*                    -> (enters acc_descr_multiline mode)
<acc_descr_multiline>[^\}]*          -> acc_descr_multiline_value
<acc_descr_multiline>[\}]            -> (pops mode)
```

### Shape Data Patterns
```javascript
\@\{                                 -> SHAPE_DATA (enters shapeData mode)
<shapeData>["]                       -> SHAPE_DATA (enters shapeDataStr mode)
<shapeDataStr>[^\"]+                 -> SHAPE_DATA
<shapeDataStr>["]                    -> SHAPE_DATA (pops shapeDataStr mode)
<shapeData>[^}^"]+                   -> SHAPE_DATA
<shapeData>"}"                       -> (pops shapeData mode)
```

### Interaction Patterns
```javascript
"click"[\s]+                         -> (enters click mode)
<click>[^\s\n]*                      -> CLICK
<click>[\s\n]                        -> (pops click mode)

"call"[\s]+                          -> (enters callbackname mode)
<callbackname>[^(]*                  -> CALLBACKNAME
<callbackname>\([\s]*\)              -> (pops callbackname mode)
<callbackname>\(                     -> (pops callbackname, enters callbackargs)
<callbackargs>[^)]*                  -> CALLBACKARGS
<callbackargs>\)                     -> (pops callbackargs mode)

"href"[\s]                           -> HREF
```

### Whitespace and Control
```javascript
(\r?\n)+            -> NEWLINE
\s                  -> SPACE
<<EOF>>             -> EOF
```

## Key Challenges for Lezer Migration

1. **Mode-based Lexing**: JISON uses extensive lexer modes for context-sensitive parsing
2. **Complex Node String Pattern**: The NODE_STRING regex is very complex
3. **Unicode Support**: Extensive Unicode character ranges for international text
4. **Shape Context**: Different text parsing rules within different shape types
5. **Arrow Variations**: Multiple arrow types with different text handling
6. **Interaction States**: Complex state management for click/href/call interactions

## Next Steps

1. Map these patterns to Lezer token definitions
2. Handle mode-based lexing with Lezer's context system
3. Create external tokenizers for complex patterns if needed
4. Test tokenization compatibility with existing test cases
