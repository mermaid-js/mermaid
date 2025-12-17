# Railroad Diagrams (v<MERMAID_RELEASE_VERSION>+)

> Railroad diagrams (also known as syntax diagrams or grammar diagrams) are a visual representation of context-free grammars using EBNF (Extended Backus-Naur Form) notation. They provide a graphical way to understand and document language syntax, making complex grammar rules easier to comprehend.

Railroad diagrams were first popularized by Niklaus Wirth in his "Pascal User Manual" (1974) and remain widely used today, notably on [JSON.org](https://www.json.org/) for documenting the JSON syntax.

Mermaid can render Railroad diagram visualizations from EBNF notation.

```mermaid-example
railroad-diagram
title "Digit Definition"

digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

## Syntax

Railroad diagrams use EBNF (Extended Backus-Naur Form) notation to define grammar rules. Mermaid supports both W3C and ISO 14977 EBNF notation styles.

### Basic Structure

- Start with `railroad-diagram` keyword to begin the diagram
- Optionally add a `title` followed by a quoted string
- Define grammar rules using the format: `rule_name = definition ;`
- Each rule must end with a semicolon (`;`)

### EBNF Notation

#### Terminals and Non-terminals

Terminals are literal strings enclosed in quotes:
- `"text"` - double quotes
- `'text'` - single quotes

Non-terminals are identifiers that reference other rules:
- `identifier` - references another rule

```mermaid-example
railroad-diagram
letter = "a" | "b" | "c" ;
identifier = letter ;
```

#### Sequence (Concatenation)

Elements appearing one after another define a sequence:
- W3C notation: `A B C`
- ISO 14977 notation: `A , B , C`

```mermaid-example
railroad-diagram
greeting = "Hello" " " "World" ;
```

#### Choice (Alternation)

The pipe symbol (`|`) indicates alternatives:

```mermaid-example
railroad-diagram
sign = "+" | "-" ;
```

#### Optional Elements

Optional elements can appear zero or one time:
- W3C notation: `A?`
- ISO 14977 notation: `[ A ]`

```mermaid-example
railroad-diagram
title "Optional Sign"

sign = "+" | "-" ;
number = sign? digit+ ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

#### Repetition

Zero or more repetitions:
- W3C notation: `A*`
- ISO 14977 notation: `{ A }`

One or more repetitions:
- W3C notation: `A+`

```mermaid-example
railroad-diagram
title "Identifier with Repetition"

identifier = letter ( letter | digit | "_" )* ;
letter = "a" | "b" | "c" | "d" | "e" ;
digit = "0" | "1" | "2" ;
```

#### Grouping

Parentheses group elements together:
- `( A B )`

```mermaid-example
railroad-diagram
expression = term ( ( "+" | "-" ) term )* ;
term = "number" ;
```

#### Comments

Comments can be added using either style:
- W3C notation: `/* comment */`
- ISO 14977 notation: `(* comment *)`

Comments are ignored during parsing and do not appear in the rendered diagram.

#### Special Sequences

Special sequences (ISO 14977 only) describe elements that cannot be easily expressed in EBNF:
- `? description ?`

#### Exception

The minus operator excludes certain alternatives:
- `A - B` (match A but not B)

## Examples

### Simple Number Grammar

```mermaid-example
railroad-diagram
title "Number Grammar"

sign = "+" | "-" ;
number = sign? digit+ ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

### Expression Grammar

```mermaid-example
railroad-diagram
title "Arithmetic Expression Grammar"

expression = term ( ( "+" | "-" ) term )* ;
term = factor ( ( "*" | "/" ) factor )* ;
factor = number | "(" expression ")" ;
number = digit+ ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

### JSON Grammar (Simplified)

```mermaid-example
railroad-diagram
title "JSON Grammar"

json = element ;
element = object | array | string | number | "true" | "false" | "null" ;
object = "{" [ member ( "," member )* ] "}" ;
array = "[" [ element ( "," element )* ] "]" ;
member = string ":" element ;
```

### URL Grammar

```mermaid-example
railroad-diagram
title "URL Grammar"

url = protocol "://" domain path? ;
protocol = "http" | "https" | "ftp" ;
domain = label ( "." label )* ;
label = letter ( letter | digit | "-" )* ;
path = "/" segment ( "/" segment )* ;
letter = "a" | "b" | "c" ;
digit = "0" | "1" | "2" ;
segment = letter+ ;
```

## Visual Elements

Railroad diagrams use distinct visual elements to represent different grammar constructs:

- Terminals: Rounded rectangles with pale yellow background
- Non-terminals: Regular rectangles with white background
- Lines and Arrows: Black paths connecting elements
- Start/End Markers: Small circles at the beginning and end of rules
- Branches: Curved paths for choices
- Loops: Backward paths for repetition

## Notation Reference

| Feature | W3C Notation | ISO 14977 Notation | Description |
|---------|-------------|-------------------|-------------|
| Terminal | `"text"` or `'text'` | `"text"` or `'text'` | Literal string |
| Non-terminal | `identifier` | `identifier` | Rule reference |
| Sequence | `A B` | `A , B` | Concatenation |
| Choice | `A \| B` | `A \| B` | Alternative |
| Optional | `A?` | `[ A ]` | Zero or one |
| Repetition (0+) | `A*` | `{ A }` | Zero or more |
| Repetition (1+) | `A+` | - | One or more |
| Grouping | `( A B )` | `( A B )` | Group elements |
| Comment | `/* text */` | `(* text *)` | Comment |
| Special | - | `? text ?` | Special sequence |
| Exception | `A - B` | `A - B` | Exclusion |

## Best Practices

1. Keep rules simple: Break complex rules into smaller, reusable components
2. Use meaningful names: Choose descriptive names for non-terminals
3. Add titles: Use the `title` keyword to provide context for the grammar
4. Group related rules: Define related grammar rules together
5. Use consistent notation: Stick to either W3C or ISO 14977 notation style throughout your diagram

## References

- [ISO/IEC 14977:1996 - EBNF Standard](https://www.cl.cam.ac.uk/~mgk25/iso-14977.pdf)
- [W3C EBNF Notation](https://www.w3.org/TR/xml/#sec-notation)
- [Wikipedia: Extended Backus-Naur Form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form)
- [Wikipedia: Syntax Diagram](https://en.wikipedia.org/wiki/Syntax_diagram)
