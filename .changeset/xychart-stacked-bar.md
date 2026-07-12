---
'mermaid': minor
---

feat(xychart): add grouped and stacked bar charts

Group bar series into one side-by-side slot with a matplotlib-style object, where
each key is a series that stacks within the group:

    bar "Product A" {"online": [10, 20, 30], "store": [5, 10, 15]}
    bar "Product B" {"online": [8, 16, 24], "store": [4, 8, 12]}

Every `bar` line is one group; groups render side-by-side and the series inside
`{ }` stack. A plain `bar [values]` still works and can be mixed in as its own
group. Series that share a name keep a consistent color and a single legend row.
