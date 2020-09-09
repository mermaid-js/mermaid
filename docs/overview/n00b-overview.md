---
sort: 1
title: Overview
---

# Overview for Beginners

## There is no explanation like a Good Diagram 	

A picture is worth a thousand words, a good diagram would be worth more. There is no disputing that they are indeed very useful. Yet very few people use them, even fewer still do so, for documentation.

mermaid aims to change that.

## Creating and Maintaining Diagrams should not be an expensive and frustrating process.

Anyone who has used Visio, or (God Forbid) Excel to make a Gantt Chart, knows how hard it is to make, edit and maintain good visualizations.

In an environment of constantly changing information , diagrams/charts become obsolete/inaccurate very fast. This hobbles the information transfer and productivity in teams.

# Doc Rot kills Diagrams

The fast setting Doc-Rot in diagrams makes it quite hard to rationalize taking hours in a desktop application, to produce a diagram that you would need to recreate again the following week in order to account for updates and changes in the app you are documenting. Yet that is often the reality for diagrams and charts and the people who make them.

mermaid seeks to change that. mermaid is a javascript based tool that utilizes a markdown inspired syntax to generate documentation, which is actually quicker, less complicated and more convenient than most traditional diagramming software. This is a relatively straightforward solution to a major hurdle in software teams.  

# :blue_book: Definition of Terms/ Dictionary

**Mermaid definitions**

>These are the instrunctions for how the diagram is to rendered, written in mermaid, which is based on Markdown. These can be found inside `<div>` tags, with the `class=mermaid`.

```html
 <div class="mermaid">
    graph TD
    A[Client] --> B[Load Balancer]
    B --> C[Server01]
    B --> D[Server02]
  </div>
```

**render**

>This is the core function of Mermaid and its API, it is a function that is called to read all the `Mermaid Definitions` and returns an SVG file, based on the definitions.


**Nodes**

>These are the boxes that contain text or otherwise discrete pieces of each diagram, separated generally by arrows, except for Gantt Charts and User Journey Diagrams. They will be refered to often in the instructions. For Diagram Specific Syntax and Instructions, refer to

## Advantages of Using Mermaid

- Ease of generate, modify and render diagrams, when you make
- The number of integrations and plugins it has.
- It can be added to your or your company's website.
- Diagrams can be created through comments like this in a script:

## The catch-22 of Diagrams and Charts:

**Diagramming and charting is a gigantic waste of developer time, but not having diagrams ruins productivity.**

mermaid solves this by cutting the time, effort and tooling that is required to create diagrams and charts.

Because, the text base for  diagrams allows for it to be updated easily, it can also be made part of production scripts (and other pieces of code). So less time needs be spent on documenting, as a separate task.


## mermaid helps Documentation catch up with Development, in quickly changing projects.

Being based on markdown, mermaid can be used, not only by accomplished front-end developers, but by most computer savvy people to render simple diagrams, at much faster speeds.
In fact one can pick up the syntax for it quite easily from the examples given and there are many tutorials in the internet.

## mermaid is for everyone.
Video [Tutorials](./Tutorials.md) are also available for the mermaid [live editor](https://mermaid-js.github.io/mermaid-live-editor/).

For information on how to use mermaid, click [here](https://mermaid-js.github.io/mermaid/#/n00b-gettingStarted).
Alternatively, you could also view the [integrations and uses](https://mermaid-js.github.io/mermaid/#/./integrations), to see how mermaid is used.
