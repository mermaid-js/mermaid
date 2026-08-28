---
'mermaid': minor
---

feat(themes): class boxes and flowchart subgraph containers now pick up the per-item colour palette under the `redux-color` and `redux-dark-color` themes.

Previously only ER, sequence, git and requirement diagrams read `borderColorArray` / `bkgColorArray`. Each class now gets its own border and fill, cycling every 12 as ER entities do; namespaces and notes stay outside the cycle. Each flowchart subgraph container gets its own colour — including collapsed ones, which keep the slot they would have had expanded — while nodes inside stay uniform, since node colour is already how `classDef` / `style` carry meaning.

Explicit user styling still wins: `classDef` and `style` become inline `style` attributes and none of the new rules are `!important`.
