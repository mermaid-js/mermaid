## Diagram syntax
**Edit this Page** [![N|Solid](./img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/n00b-syntaxReference.md)

If you are new to mermaid, read [Getting Started](n00b-gettingStarted.md) and [Overview](n00b-overview.md) sections, to learn the basics about the basics.

This section is a list of diagram types supported by mermaid, each one explains the syntax with which a diagram or chart can be called. 
These are called Diagram Definitions, since they describe the manner with which the diagram is to be rendered by the renderer. 

## mermaid tag:
These Diagram Definitions can be entered within a \<div class=mermaid> tag.
like so : 
```
<div class="mermaid">
     graph LR
      A --- B
      B-->C[fa:fa-ban forbidden]
      B-->D(fa:fa-spinner);
</div>
```
## live ediotr
These definitions can also be entered into the [mermaid live editor](https://mermaid-js.github.io/mermaid-live-editor), to render them immediately.
This would then offer


- [Flowchart](flowchart.md)
- [Sequence diagram](sequenceDiagram.md)
- [Class Diagram](classDiagram.md)
- [State Diagram](stateDiagram.md)
- [Gantt](gantt.md)
- [Pie Chart](pie.md)
- [Entity Relationship Diagram](entityRelationshipDiagram.md)
- [User Journey Diagram](user-journey.md)
- [Directives](directives.md)
