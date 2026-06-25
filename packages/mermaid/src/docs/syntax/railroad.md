# Railroad Diagrams (v11.16.0+)

> Railroad diagrams (also known as syntax diagrams or grammar diagrams) are a visual representation of context-free grammars. They provide a graphical way to understand and document language syntax, making complex grammar rules easier to comprehend.

Railroad diagrams were first popularized by Niklaus Wirth in his "Pascal User Manual" (1974) and remain widely used today, notably on [JSON.org](https://www.json.org/) for documenting the JSON syntax.

Mermaid can render railroad diagrams from several grammar notations. Pick the keyword that matches the notation you want to write in:

| Diagram type    | Keyword              | Notation                                                                         |
| --------------- | -------------------- | -------------------------------------------------------------------------------- |
| EBNF            | `railroad-ebnf-beta` | Extended Backus–Naur Form (W3C and ISO 14977 styles)                             |
| ABNF            | `railroad-abnf-beta` | Augmented Backus–Naur Form (RFC 5234)                                            |
| PEG             | `railroad-peg-beta`  | Parsing Expression Grammar                                                       |
| IR (primitives) | `railroad-beta`      | Mermaid's railroad intermediate representation, written as explicit constructors |

```mermaid-example
railroad-ebnf-beta
title "Digit Definition"

digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

## Common Structure

All four diagram types share the same outer structure:

- Start with the diagram-type keyword on the first line (for example `railroad-ebnf-beta`).
- Optionally add a `title` followed by a string.
- Optionally add `accTitle:` and `accDescr:` for accessibility metadata.
- Define one grammar rule per statement; each rule ends with a semicolon (`;`).

The rule assignment operator and the operators used inside a definition depend on the notation, and are described per type below.

## EBNF (`railroad-ebnf-beta`)

EBNF (Extended Backus-Naur Form) is the most common notation. Mermaid supports both W3C and ISO 14977 EBNF styles. Rules are written as `rule_name = definition ;` (the `::=` assignment operator is also accepted).

### Terminals and Non-terminals

Terminals are literal strings enclosed in quotes; non-terminals are identifiers that reference other rules:

- `"text"` or `'text'` - terminal (literal string)
- `identifier` - non-terminal (rule reference)

```mermaid-example
railroad-ebnf-beta
letter = "a" | "b" | "c" ;
identifier = letter ;
```

### Sequence (Concatenation)

Elements appearing one after another define a sequence:

- W3C notation: `A B C`
- ISO 14977 notation: `A , B , C`

```mermaid-example
railroad-ebnf-beta
greeting = "Hello" " " "World" ;
```

### Choice (Alternation)

The pipe symbol (`|`) indicates alternatives:

```mermaid-example
railroad-ebnf-beta
sign = "+" | "-" ;
```

### Optional Elements

Optional elements can appear zero or one time:

- W3C notation: `A?`
- ISO 14977 notation: `[ A ]`

```mermaid-example
railroad-ebnf-beta
title "Optional Sign"

sign = "+" | "-" ;
number = sign? digit+ ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

### Repetition

Zero or more repetitions:

- W3C notation: `A*`
- ISO 14977 notation: `{ A }`

One or more repetitions:

- W3C notation: `A+`

```mermaid-example
railroad-ebnf-beta
title "Identifier with Repetition"

identifier = letter ( letter | digit | "_" )* ;
letter = "a" | "b" | "c" | "d" | "e" ;
digit = "0" | "1" | "2" ;
```

### Grouping

Parentheses group elements together:

```mermaid-example
railroad-ebnf-beta
expression = term ( ( "+" | "-" ) term )* ;
term = "number" ;
```

### Comments

Comments can be added using either style and are ignored during parsing:

- W3C notation: `/* comment */`
- ISO 14977 notation: `(* comment *)`

### Special Sequences

Special sequences (ISO 14977 only) describe elements that cannot be easily expressed in EBNF:

- `? description ?`

### Exception

The minus operator excludes certain alternatives:

- `A - B` (match A but not B)

### EBNF Notation Reference

| Feature         | W3C Notation         | ISO 14977 Notation   | Description      |
| --------------- | -------------------- | -------------------- | ---------------- |
| Terminal        | `"text"` or `'text'` | `"text"` or `'text'` | Literal string   |
| Non-terminal    | `identifier`         | `identifier`         | Rule reference   |
| Sequence        | `A B`                | `A , B`              | Concatenation    |
| Choice          | `A \| B`             | `A \| B`             | Alternative      |
| Optional        | `A?`                 | `[ A ]`              | Zero or one      |
| Repetition (0+) | `A*`                 | `{ A }`              | Zero or more     |
| Repetition (1+) | `A+`                 | -                    | One or more      |
| Grouping        | `( A B )`            | `( A B )`            | Group elements   |
| Comment         | `/* text */`         | `(* text *)`         | Comment          |
| Special         | -                    | `? text ?`           | Special sequence |
| Exception       | `A - B`              | `A - B`              | Exclusion        |

### EBNF Examples

```mermaid-example
railroad-ebnf-beta
title "Arithmetic Expression Grammar"

expression = term ( ( "+" | "-" ) term )* ;
term = factor ( ( "*" | "/" ) factor )* ;
factor = number | "(" expression ")" ;
number = digit+ ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

```mermaid-example
railroad-ebnf-beta
title "JSON Grammar"

json = element ;
element = object | array | string | number | "true" | "false" | "null" ;
object = "{" [ member ( "," member )* ] "}" ;
array = "[" [ element ( "," element )* ] "]" ;
member = string ":" element ;
```

## ABNF (`railroad-abnf-beta`)

ABNF (Augmented Backus-Naur Form, [RFC 5234](https://datatracker.ietf.org/doc/html/rfc5234)) is widely used in IETF specifications. Rules are written as `name = definition ;`.

- Alternation uses `/` (instead of `|`): `A / B`
- Concatenation is whitespace-separated: `A B`
- Repetition uses a prefix: `*A` (zero or more), `1*A` (one or more), `2*4A` (between 2 and 4), `3A` (exactly 3)
- Grouping uses parentheses: `( A B )`
- Optional groups use brackets: `[ A ]`
- Terminals can be quoted strings (`"text"`) or numeric values (`%x41`, `%d65`, `%b1000001`, including ranges like `%x30-39`)
- Comments start with `;` and run to the end of the line

```mermaid-example
railroad-abnf-beta
title "Email Address"

address = local-part "@" domain ;
local-part = 1*( ALPHA / DIGIT / "." / "-" ) ;
domain = label *( "." label ) ;
label = 1*( ALPHA / DIGIT / "-" ) ;
```

```mermaid-example
railroad-abnf-beta
title "Phone Number"

phone = [ "+" country-code ] subscriber ;
country-code = 1*DIGIT ;
subscriber = 1*( DIGIT / "-" / " " ) ;
```

## PEG (`railroad-peg-beta`)

PEG (Parsing Expression Grammar) describes recursive-descent parsers with ordered choice. Rules are written as `Name <- definition ;`.

- Ordered choice uses `/`: `A / B` (tries `A` first, then `B`)
- Sequence is whitespace-separated: `A B`
- Suffix operators: `A?` (optional), `A*` (zero or more), `A+` (one or more)
- Prefix predicates: `&A` (and-predicate, lookahead), `!A` (not-predicate, negative lookahead)
- Grouping uses parentheses: `( A B )`
- `.` matches any single character
- Terminals are quoted strings (`"text"` or `'text'`)
- Comments start with `#` and run to the end of the line

```mermaid-example
railroad-peg-beta
title "Calculator Grammar"

Expression <- Term (("+" / "-") Term)* ;
Term <- Factor (("*" / "/") Factor)* ;
Factor <- Number / "(" Expression ")" ;
Number <- Digit+ ;
Digit <- "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" ;
```

```mermaid-example
railroad-peg-beta
title "Identifiers (keywords excluded)"

Identifier <- !Keyword Letter Letter* ;
Keyword <- "if" / "else" / "while" ;
Letter <- "a" / "b" / "c" / "_" ;
```

## IR Primitives (`railroad-beta`)

The `railroad-beta` keyword uses Mermaid's railroad intermediate representation directly. Instead of a grammar notation, each construct is written as an explicit constructor. This gives you direct control over the rendered structure and is useful when you want a layout that does not map cleanly onto a single grammar notation. Rules are written as `rule_name = expression ;`.

| Constructor           | Meaning                       |
| --------------------- | ----------------------------- |
| `terminal("text")`    | Terminal (literal string)     |
| `nonterminal("name")` | Non-terminal (rule reference) |
| `sequence(a, b, ...)` | Elements in sequence          |
| `choice(a, b, ...)`   | Alternatives                  |
| `optional(a)`         | Zero or one                   |
| `zeroOrMore(a)`       | Zero or more                  |
| `oneOrMore(a)`        | One or more                   |
| `special("text")`     | Special sequence              |

```mermaid-example
railroad-beta
title Expression Grammar

expression = sequence(
    nonterminal("term"),
    zeroOrMore(sequence(
        choice(terminal("+"), terminal("-")),
        nonterminal("term")
    ))
) ;
term = sequence(
    nonterminal("factor"),
    zeroOrMore(sequence(
        choice(terminal("*"), terminal("/")),
        nonterminal("factor")
    ))
) ;
factor = choice(
    nonterminal("number"),
    sequence(terminal("("), nonterminal("expression"), terminal(")"))
) ;
number = oneOrMore(nonterminal("digit")) ;
digit = choice(terminal("0"), terminal("1"), terminal("2"), terminal("3"), terminal("4"), terminal("5"), terminal("6"), terminal("7"), terminal("8"), terminal("9")) ;
```

## Visual Elements

Railroad diagrams use distinct visual elements to represent different grammar constructs:

- Terminals: Rounded rectangles that inherit the active Mermaid theme
- Non-terminals: Regular rectangles that inherit the active Mermaid theme
- Lines and Arrows: Theme-aware paths connecting elements
- Start/End Markers: Small circles at the beginning and end of rules
- Branches: Curved paths for choices
- Loops: Backward paths for repetition

## Theme Integration

Railroad diagrams inherit colors and typography from the active Mermaid theme by default. You can still override individual railroad styles through the `railroad` config block when you need diagram-specific adjustments.

## Limitations

- The hand-drawn look (`look: handDrawn`) is not currently supported for railroad diagrams.

## Best Practices

1. Keep rules simple: Break complex rules into smaller, reusable components
2. Use meaningful names: Choose descriptive names for non-terminals
3. Add titles: Use the `title` keyword to provide context for the grammar
4. Group related rules: Define related grammar rules together
5. Use consistent notation: Stick to one notation (and its matching keyword) throughout your diagram

## References

- [ISO/IEC 14977:1996 - EBNF Standard](https://www.cl.cam.ac.uk/~mgk25/iso-14977.pdf)
- [W3C EBNF Notation](https://www.w3.org/TR/xml/#sec-notation)
- [RFC 5234 - Augmented BNF for Syntax Specifications (ABNF)](https://datatracker.ietf.org/doc/html/rfc5234)
- [Parsing Expression Grammars (Bryan Ford, 2004)](https://bford.info/pub/lang/peg.pdf)
- [Wikipedia: Extended Backus-Naur Form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form)
- [Wikipedia: Syntax Diagram](https://en.wikipedia.org/wiki/Syntax_diagram)
