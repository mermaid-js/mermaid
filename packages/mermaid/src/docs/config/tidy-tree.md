# Tidy-tree Layout

The **tidy-tree** layout arranges nodes in a hierarchical, tree-like structure. It is especially useful for diagrams where parent-child relationships are important, such as mindmaps.

## Features

- Organizes nodes in a tidy, non-overlapping tree
- Ideal for mindmaps and hierarchical data
- Automatically adjusts spacing for readability

## Example Usage

```mermaid-example
---
config:
  layout: tidy-tree
---
mindmap
root((mindmap is a long thing))
  A
  B
  C
  D
```

```mermaid-example
---
config:
  layout: tidy-tree
---
mindmap
root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
```

## Note

- Currently, tidy-tree is primarily supported for mindmap diagrams.
