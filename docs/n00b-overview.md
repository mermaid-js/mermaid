# Overview for Beginners

## Explaining with a Diagram

A picture is worth a thousand words, a good diagram is certainly worth more. 

## Creating and Maintaining Diagrams

Anyone who has used Visio, or (God Forbid) Excel to make a Gantt Chart, knows how hard it is to make, edit and maintain good visualizations.

 Diagrams/Charts are both very important but also become obsolete/inaccurate very fast. This catch-22 hobbles the productivity of teams.

# Doc Rot in Diagrams

Doc-Rot kills diagrams as quickly as it does text, but it takes hours in a desktop application to produce a diagram. 

mermaid seeks to change that. mermaid creates diagrams using  markdown inspired syntax. The process is quicker, less complicated and more convenient way of going from concept to visualization

This is a relatively straightforward solution to a major hurdle in software teams.

# Definition of Terms/ Dictionary

**Mermaid definitions**

>These are the Mermaid diagram deffinitions inside `<div>` tags, with the `class=mermaid`.

```html
 <div class="mermaid">
    graph TD
    A[Client] --> B[Load Balancer]
    B --> C[Server01]
    B --> D[Server02]
  </div>
```

**render**

>This is the core function of the Mermaid API, it reads all the `Mermaid Definitions` inside `div` tags and returns an SVG file, based on the definitions.


**Nodes**

>These are the boxes that contain text or otherwise discrete pieces of each diagram, separated generally by arrows, except for Gantt Charts and User Journey Diagrams. They will be referred to often in the instructions. Read for Diagram Specific [Syntax](./n00b-syntaxReference)

## Advantages of Using Mermaid

- Ease of generate, modify and render diagrams, when you make
- The number of integrations and plugins it has.
- It can be added to your or your company's website.
- Diagrams can be created through comments like this in a script:

## The catch-22 of Diagrams and Charts:

**Diagramming and charting is a gigantic waste of developer time, but not having diagrams ruins productivity.**

mermaid solves this by cutting the time, effort and tooling that is required to create diagrams and charts.

Because, the text base for  diagrams allows for it to be updated easily, it can also be made part of production scripts (and other pieces of code). So less time needs be spent on documenting, as a separate task.


## Catching up with Development

Being based on markdown, mermaid can be used, not only by accomplished front-end developers, but by most computer savvy people to render diagrams, at much faster speeds.
In fact one can pick up the syntax for it quite easily from the examples given and there are many tutorials in the internet.

## Mermaid is for everyone.
Video [Tutorials](https://mermaid-js.github.io/mermaid/#/./Tutorials) are also available for the mermaid [live editor](https://mermaid-js.github.io/mermaid-live-editor/).

Alternatively you can use Mermaid [Plug-Ins](https://mermaid-js.github.io/mermaid/#/./integrations), with tools you already use, like Google Docs. 
