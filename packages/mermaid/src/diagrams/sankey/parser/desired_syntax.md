# Sankey diagrams syntax proposal

## What is used now

**Circular graphs are not supported by d3. There are some alternatives for that.**
**Dropped flows are not supported by d3**

This is example of data for Sakey diagrams from d3 author (simple csv):

```csv
Berlin,Job Applications,102
Barcelona,Job Applications,39
Madrid,Job Applications,35
Amsterdam,Job Applications,15
Paris,Job Applications,14
London,Job Applications,6
Munich,Job Applications,5
Brussels,Job Applications,4
Dubai,Job Applications,3
Dublin,Job Applications,3
Other Cities,Job Applications,12
Job Applications,No Response,189
Job Applications,Responded,49,orange
Responded,Rejected,38
Responded,Interviewed,11,orange
Interviewed,No Offer,8
Interviewed,Declined Offer,2
Interviewed,Accepted Offer,1,orange
```

GoJS uses similar approach:

```json
{
"nodeDataArray": [
{"key":"Coal reserves", "text":"Coal reserves", "color":"#9d75c2"},
{"key":"Coal imports", "text":"Coal imports", "color":"#9d75c2"},
{"key":"Oil reserves", "text":"Oil\nreserves", "color":"#9d75c2"},
{"key":"Oil imports", "text":"Oil imports", "color":"#9d75c2"}
],
"linkDataArray": [
{"from":"Coal reserves", "to":"Coal", "width":31},
{"from":"Coal imports", "to":"Coal", "width":86},
{"from":"Oil reserves", "to":"Oil", "width":244}
}
```

## What do we need

Mainly we need:

- collection of nodes
- collection of links

We also need graph and node attributes like this:

- link sort
- node sort
- coloring strategy for links (source, target, transition)
- graph alignment (left, right, width)
- node color
- node title
- node width
- node padding
- graph margin

## Desired syntax

Graph is a list of flows (or links).
Flow is a sequence `node -> value -> node -> value...`

```
a -> 30 -> b
a -> 40 -> b
```

2 separate streams between 2 nodes they can be grouped as well:

```
a -> {
    30
    40
} -> b
```

All outflows from the node can be grouped:

```
a -> {
    30 -> b
    40 -> c
}
```

All inflows to the node can be grouped too:

```
{
    a -> 30
    b -> 40
} -> c
```

Chaining example:

```
a -> {
    30
    40
} -> b -> {
    20 -> d -> 11
    50 -> e -> 11
} -> f -> 30
```

**Probably ambiguous!**

Does the sample below mean that total outflow from "a" is 60?

```
a -> 30 -> {
    b
    c
}
```

Or does this one mean that total outflow must be 140 (70 to "b" and "c" respectively)?

```
a -> {
    30
    40
} -> {
    b
    c
}
```

**Overcomplicated**

Nested:

```
{
    {
        a -> 30
        b -> 40
    } -> c -> 12
    {
        d -> 10
        e -> 20
    } -> f -> 43
} -> g
```
