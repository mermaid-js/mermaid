# Railroad Diagram (vNext)

## Introduction

Railroad diagrams visualize parser or grammar rules as connected tracks. Each rule is defined by a name and an expression built from a small set of combinators.

## Syntax

Start the diagram with `railroad-beta`, then define one or more rules using `:=`:

```mermaid-example
railroad-beta
select := sequence(textBox("SELECT", "terminal"), textBox("table", "nonterminal"))
```

## Expressions

### `textBox(text, kind)`

A single token box. `kind` is either `"terminal"` (rounded rectangle) or `"nonterminal"` (rectangle with dashed border).

```mermaid-example
railroad-beta
digit := textBox("0..9", "terminal")
```

### `sequence(expr, ...)`

Items that must appear in order, connected left-to-right.

```mermaid-example
railroad-beta
add := sequence(textBox("term", "nonterminal"), textBox("+", "terminal"), textBox("term", "nonterminal"))
```

### `stack(expr, ...)`

Alternatives — only one branch is taken.

```mermaid-example
railroad-beta
sign := stack(textBox("+", "terminal"), textBox("-", "terminal"))
```

### `bypass(expr)`

An optional element — the upper rail allows skipping it entirely.

```mermaid-example
railroad-beta
optSign := bypass(stack(textBox("+", "terminal"), textBox("-", "terminal")))
```

### `loop(expr)`

A repeatable element — the upper rail allows looping back.

```mermaid-example
railroad-beta
digits := loop(textBox("0..9", "terminal"))
```

## Multiple rules

A diagram can define several rules, one per `:=` assignment. Expressions may span multiple lines.

```mermaid-example
railroad-beta
term := sequence(
  textBox("factor", "nonterminal"),
  bypass(sequence(
    stack(textBox("*", "terminal"), textBox("/", "terminal")),
    textBox("factor", "nonterminal")
  ))
)
factor := stack(textBox("number", "terminal"), textBox("ident", "nonterminal"))
```
