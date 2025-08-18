# Jison Lexer Analysis for ANTLR Migration

## Overview
This document analyzes the Jison lexer structure from `flow.jison` to guide the creation of the equivalent ANTLR lexer grammar.

## Lexer Modes (Start Conditions)
The Jison lexer uses 18 different modes (%x declarations):

1. **string** - String literal parsing
2. **md_string** - Markdown string parsing (backtick-quote delimited)
3. **acc_title** - Accessibility title parsing
4. **acc_descr** - Accessibility description parsing
5. **acc_descr_multiline** - Multiline accessibility description
6. **dir** - Direction parsing after graph declaration
7. **vertex** - Vertex parsing (unused in current grammar)
8. **text** - General text parsing within shapes
9. **ellipseText** - Text within ellipse shapes
10. **trapText** - Text within trapezoid shapes
11. **edgeText** - Text on regular edges
12. **thickEdgeText** - Text on thick edges
13. **dottedEdgeText** - Text on dotted edges
14. **click** - Click command parsing
15. **href** - Href command parsing
16. **callbackname** - Callback name parsing
17. **callbackargs** - Callback arguments parsing
18. **shapeData** - Shape data parsing (@{...})
19. **shapeDataStr** - String content within shape data
20. **shapeDataEndBracket** - End bracket for shape data (declared but unused)

## Token Categories

### Keywords and Commands
- **Graph Types**: `graph`, `flowchart`, `flowchart-elk`, `subgraph`, `end`
- **Styling**: `style`, `default`, `linkStyle`, `interpolate`, `classDef`, `class`
- **Interactivity**: `click`, `href`, `call`
- **Accessibility**: `accTitle`, `accDescr`
- **Directions**: `LR`, `RL`, `TB`, `BT`, `TD`, `BR`, `<`, `>`, `^`, `v`
- **Link Targets**: `_self`, `_blank`, `_parent`, `_top`

### Operators and Symbols
- **Basic**: `:`, `;`, `,`, `*`, `#`, `&`, `|`, `-`, `^`, `v`, `<`, `>`
- **Special**: `:::` (style separator), `@{` (shape data start)
- **Quotes**: `"` (string delimiter), `` ` `` (markdown delimiter)

### Shape Delimiters
- **Parentheses**: `(`, `)` - Round shapes, grouping
- **Brackets**: `[`, `]` - Square shapes
- **Braces**: `{`, `}` - Diamond shapes
- **Special Shapes**:
  - `(-`, `-)` - Ellipse
  - `([`, `])` - Stadium
  - `[[`, `]]` - Subroutine
  - `[|` - Vertex with properties
  - `[(`, `)]` - Cylinder
  - `(((`, `)))` - Double circle
  - `[/`, `/]`, `[\`, `\]` - Trapezoids

### Edge Types
- **Regular**: `--`, `-->`, `---`, etc.
- **Thick**: `==`, `==>`, `===`, etc.
- **Dotted**: `-.`, `-.->`, `-.-`, etc.
- **Invisible**: `~~~`

### Text and Identifiers
- **NODE_STRING**: Complex regex for node identifiers
- **UNICODE_TEXT**: Extensive Unicode character ranges
- **TEXT**: General text within shapes
- **STR**: String literals
- **MD_STR**: Markdown strings
- **NUM**: Numeric literals

### Whitespace and Control
- **NEWLINE**: Line breaks `(\r?\n)+`
- **SPACE**: Whitespace `\s`
- **EOF**: End of file

## Critical Lexer Behaviors

### Mode Transitions
1. **String Handling**: `"` pushes to string mode, `"` pops back
2. **Markdown Strings**: `"` + `` ` `` enters md_string mode
3. **Shape Text**: Various shape delimiters push to text mode
4. **Edge Text**: Edge patterns push to specific edge text modes
5. **Commands**: `click`, `call`, `href` trigger command-specific modes

### Greedy vs Non-Greedy Matching
- Edge patterns use lookahead to prevent over-matching
- Text patterns carefully avoid consuming delimiters
- Unicode text has complex character class definitions

### State Management
- Extensive use of `pushState()` and `popState()`
- Some modes like `dir` auto-pop after matching
- Complex interaction between INITIAL and specific modes

## ANTLR Migration Challenges

### Mode Complexity
- ANTLR lexer modes are similar but syntax differs
- Need to carefully map Jison state transitions to ANTLR mode commands

### Regex Patterns
- Some Jison patterns use negative lookahead/lookbehind
- ANTLR has different regex capabilities and syntax

### Unicode Support
- Massive Unicode character class needs conversion
- ANTLR Unicode syntax differs from Jison

### Edge Cases
- Complex edge text parsing with multiple modes
- Shape data parsing with nested string handling
- Direction parsing with conditional mode entry

## Next Steps
1. Create initial FlowLexer.g4 with basic structure
2. Map all modes to ANTLR lexer modes
3. Convert regex patterns to ANTLR syntax
4. Handle Unicode character classes
5. Implement state transition logic
6. Test against existing flowchart inputs
