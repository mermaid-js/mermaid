---
sort: 1
title: Diagram syntax intro
---

## Diagram syntax

If you are new to mermaid, read the [Getting Started](../getting-started/n00b-gettingStarted.md) and [Overview](../overview/n00b-overview.md) sections, to learn the basics of mermaid.
Video Tutorials can be found at the bottom of the Overview Section.

This section is a list of diagram types supported by mermaid. Below is a list of links to aricles that explain the syntax of the diagrams or charts that can be called.

They also detail how diagrams can be defined, or described in the manner with which the diagram is to be rendered by the renderer.

### The benefits of text based diagramming are its speed and modifiability. mermaid allows for easy maintenance and modification of diagrams. This means your diagrams will always be up to date and closely follow your code and improve your documentation.  

## mermaid tag:
These Diagram Definitions can be entered within a \<div class=mermaid> tag.
like so :
```html
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


{% include list.liquid %}
