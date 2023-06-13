# Sankey diagrams syntax proposal

Circular graphs are not supported by d3. There are some alternatives for that.
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

We also need graph and node attributes like this:

```
.nodeSort(null)
.linkSort(null)
.nodeWidth(4)
.nodePadding(20)
.extent([[0, 5], [width, height - 5]]) // margin?
```

Also needed:
* coloring strategy (source, target, transition)
* graph alignment (left, right, width)

Proposed syntax:
```
a -> 30 -> b
a -> 40 -> c

a -> {
    30 -> b
    40 -> c
}

{
    a -> 30
    b -> 40
} -> c


a -> {
    30
    40
} -> b

a -> 30 -> {
    b
    c
}

a -> {
    30
    40
} -> {
    b
    c
}
```
