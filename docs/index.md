---
title: Home
order: 0
---
mermaid
=======
![Alt text](img/header.png)

Generation of diagrams and flowcharts from text in a similar manner as markdown.

Ever wanted to simplify documentation and avoid heavy tools like Visio when explaining your code?

This is why mermaid was born, a simple markdown-like script language for generating charts from text via javascript. [Try it using our editor](http://knsv.github.io/mermaid/live_editor).



Code examples below: 
```
%% An example of a flowchart
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

```
%% An example of a sequence diagram
sequenceDiagram
    participant Alice
    participant Bob
    Alice->John: Hello John, how are you?
    loop Healthcheck
        John->John: Fight against hypochondria
    end
    Note right of John: Rational thoughts &lt;br/>prevail...
    John-->Alice: Great!
    John->Bob: How about you?
    Bob-->John: Jolly good!
```


```
%% Example of a Gannt diagram
        gantt
        dateFormat  YYYY-MM-DD
        title Adding GANTT diagram functionality to mermaid
        section A section
        Completed task            :done,    des1, 2014-01-06,2014-01-08
        Active task               :active,  des2, 2014-01-09, 3d
        Future task               :         des3, after des2, 5d
        Future task2               :         des4, after des3, 5d
        section Critical tasks
        Completed task in the critical line :crit, done, 2014-01-06,24h
        Implement parser and jison          :crit, done, after des1, 2d
        Create tests for parser             :crit, active, 3d
        Future task in critical line        :crit, 5d
        Create tests for renderer           :2d
        Add to mermaid                      :1d
```

Play with mermaid using this [editor](http://danielmschmidt.github.io/mermaid-demo/) or this [live editor](live_editor). You can also look at mermaid in action using [jsbin](http://jsbin.com/faxunexeku/1/edit?html,output).

## Further reading

* [Usage](http://knsv.github.io/mermaid/usage.html)
* [Flowchart syntax](http://knsv.github.io/mermaid/flowchart.html)
* [Sequence diagram syntax](http://knsv.github.io/mermaid/sequenceDiagram.html)
* [Gantt chart syntax](http://knsv.github.io/mermaid/gantt.html)
* [Mermaid client](http://knsv.github.io/mermaid/mermaidCLI.html)
* [Editor](http://knsv.github.io/mermaid/live_editor)

# Credits
Many thanks to the [d3](http://d3js.org/) and [dagre-d3](https://github.com/cpettitt/dagre-d3) projects for providing
the graphical layout and drawing libraries! Thanks also to the
[js-sequence-diagram](http://bramp.github.io/js-sequence-diagrams) project for usage of the grammar for the
sequence diagrams.

*Mermaid was created by Knut Sveidqvist for easier documentation.*

Knut has not done all work by himself, here is the full list of the projects [contributors](https://github.com/knsv/mermaid/graphs/contributors).
