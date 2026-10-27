# Org Chart Diagram (v<MERMAID_RELEASE_VERSION>+)

> An org chart shows who reports to whom. Start a diagram with the `orgchart-beta` keyword and describe the organization with indentation. Mermaid decides where everything goes.

```warning
This is a new diagram type in Mermaid. Its syntax may evolve in future versions.
```

An org chart is not just a tree. It has two kinds of relationships:

- **Reporting children** form the primary hierarchy. They can have reports of their own.
- **Staff nodes** (for example Finance, HR or Legal) are attached to a manager but do not form a branch of the hierarchy. They are drawn beside the vertical line below the manager, and never have reports of their own.

## Syntax

```mermaid-example
orgchart-beta
    CEO "Anna Andersson"
        staff CFO "Bo Berg"
        staff HR "Carina Carlson"
        Engineering "David Dahl"
            Development "Eva Ek"
            Systems "Fred Ford"
        Sales "Greta Gran"
            Europe "Helena Holm"
```

Each line is one node:

```text
[staff] <primary label> ["secondary label"]
```

- The **primary label** is the role or unit. It is either quoted, or plain text up to an optional quoted label (`Chief Executive Officer`).
- The optional **secondary label** is a quoted string, typically a person's name.
- Indentation defines the hierarchy: a node belongs to the nearest preceding node with less indentation. Any depth is allowed. Use spaces or tabs consistently (a tab counts as four columns).
- A line starting with the word `staff` makes the node a staff node of its parent. To use the word `staff` as a label, quote it: `"staff"`.
- There must be exactly one root, and it cannot be a staff node.
- `%%` comments and blank lines are ignored.
- An optional `title` line sets the visible chart title. Use `accTitle:` and
  `accDescr:` (or a braced, multiline `accDescr`) to provide accessible SVG
  title and description text. Frontmatter `title` is preserved.

## Staff nodes

Staff nodes hang off the vertical stem under their manager, alternating left and right in source order. Additional staff are stacked in further rows. They never affect which nodes are the manager's reports.
Reporting nodes at the same hierarchy depth share a horizontal level. Mermaid reserves
enough vertical space for the largest staff group on that level, so cousins remain aligned
even when their managers have different numbers of staff nodes.

```mermaid-example
orgchart-beta
title Company reporting structure
accTitle: Company reporting structure
accDescr {
  The CEO manages Engineering.
  Finance and Human Resources provide staff support.
}
  CEO "Anna Andersson"
    staff Finance
    staff Human Resources
    Engineering
```

```mermaid-example
orgchart-beta
    CEO "Anna Andersson"
        staff Finance
        staff HR
        staff Legal
        Engineering
            staff Quality "Ida Ives"
            Platform
            Product
        Sales
```

## Explicit ids

Ids are optional and generated when omitted. To give a node a stable id, write `id[Primary label]`. Ids must be unique.

```mermaid-example
orgchart-beta
    ceo[CEO] "Anna Andersson"
        staff cfo[CFO] "Bo Berg"
        eng[Engineering] "David Dahl"
```

## Theming

Org charts use the standard Mermaid themes.

```mermaid-example
%%{init: {'theme': 'forest'}}%%
orgchart-beta
    CEO "Anna Andersson"
        staff CFO "Bo Berg"
        Engineering "David Dahl"
        Sales "Greta Gran"
```

## Hand-drawn look

Set `look: handDrawn` to draw sketch-style boxes and connectors. The hierarchy,
staff placement, labels, and theme colors are the same as in the classic look.
Set a nonzero `handDrawnSeed` for repeatable sketches.

```mermaid-example
---
config:
  look: handDrawn
  handDrawnSeed: 42
---
orgchart-beta
    CEO "Anna Andersson"
        staff Finance
        staff HR
        Engineering
            Development
            Systems
        Sales
```

## Limitations

This first version intentionally leaves out images, multiple managers (matrix reporting), dotted-line or other cross-links, alternative layouts, and org-chart-specific layout options.
