# Overview for n00bs

As a sysadmin I frequently have to document things, including drawing stuff.

Using mermaid I can type this as a comment in a script:

```
graph TD
A[Client] --> B[Load Balancer]
B --> C[Server01]
B --> D[Server02]
```

And end up with this in the documentation:

![Flowchart](./img/n00b-firstFlow.png)

Most of the stuff I need to visualize can be scripted like this, with a varitety of different symbols and chart types. Since the diagram source is text based, it can be part of production scripts (and other pieces of code). So less time needs be spent on documenting as a separate task.

Comparing with Visio and similar applications, mermaid is a really fast and simple way to create good visualizations. This is especially apparent when a complex visualisation needs to be edited, which could take me hours in a desktop application.

With mermaid I can spend a fraction of that time automating the diagram generation and end up saving even more time. I love it!


However, a lot of the mermaid documentation is geared to professional developers and presumes a skill set which I do not have.

I needed a really simple and basic instruction, and here it is.
