# Overview for n00bs

mermaid is a tool that aims to make diagrams and flowcharts for documentation, easier. 

with mermaid, diagrams can be created through comments like this in a script:

```
graph TD
A[Client] --> B[Load Balancer]
B --> C[Server01]
B --> D[Server02]
```

And they are rendered into this and made part of the documentation:

![Flowchart](./img/n00b-firstFlow.png)

Most of the similar visuals that you might need to create can be scripted in a similar way, with a varitety of different symbols and chart types available. 
Since the diagram source is text based, it can be part of production scripts (and other pieces of code). So less time needs be spent on documenting as a separate task.

Comparing with Visio and similar applications, mermaid is a really fast way to create good visualizations. This is especially apparent when editing a complex visualisations, a process that usually takes hours in a desktop application, but only takes minutes (or even less if generation has been scripted) with mermaid.

mermaid can potentially cut down the amount of time and effort spent on the process of creating diagrams, to a fraction of what you usually put in.  

However, a lot of the mermaid documentation is geared to professional frontend developers, presuming a skill set which I simply do not have.

If you need some basic instructions and introductions, here are a few good places to start:

For information on how to use mermaid, click [here](https://mermaid-js.github.io/mermaid/#/n00b-gettingStarted), or you can try out the mermaid [live editor](https://mermaid-js.github.io/mermaid-live-editor/), alternatively, you could also view the [integrations and uses](https://github.com/mermaid-js/mermaid/blob/develop/docs/integrations.md) for mermaid. 
