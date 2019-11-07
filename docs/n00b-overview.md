# Overview for n00bs

As a sysadmin I frequently have to document things, including drawing stuff.

Using mermaid I can type this as a comment in a script:

```
graph TD
A[Client] --> B[Load Balancer]
B --> C[Server01]
B --> D[Server02]
```

And end up getting this in the documentation on a web page:

![Flowchart](./img/n00b-firstFlow.png)

Most of the stuff I need to visualize can be done, using a varitety of different symbols and chart types.

Compared to Visio and other similar applications, mermaid is a really easy way to create visualizations when writing documentation.

Since the diagram source can be part of scripts (and other pieces of code), less time needs be spent documenting as a separate task.

However, a lot of the mermaid documentation is geared to professional developers and presumes a skill set which I don't have.

I need a really simple and basic instruction.
