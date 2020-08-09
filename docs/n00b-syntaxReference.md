## Diagram syntax
**Edit this Page** [![N|Solid](./img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/n00b-syntaxReference.md)

If you are new to mermaid, read the [Getting Started](n00b-gettingStarted.md) and [Overview](n00b-overview.md) sections, to learn the basics of mermaid. 
Video Tutorials can be found at the bottom of the Overview Section. 

This section is a list of diagram types supported by mermaid. Below is a list of links to aricles that explain the syntax of the diagrams or charts that 0can be called. 

They also  detail how diagrams can be defined, or described in the manner with which the diagram is to be rendered by the renderer. 

### The benefits of text based diagramming are its speed and modifiability. mermaid allows for easy maintenance and modification of diagrams. This means your diagrams will always be up to date and closely follow your code and improve your documentation.  

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
## mermaid Live Editor
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
