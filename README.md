mermaid [![Build Status](https://travis-ci.org/knsv/mermaid.svg?branch=master)](https://travis-ci.org/knsv/mermaid)
=======

Generation of diagrams and flowcharts from text in a similar manner as markdown.

Ever wanted to simplify documentation and avoid heavy tools like Visio when explaining your code?

This is why mermaid was born, a simple markdown-like script language for generating charts from text via javascript.

The code below would render the following image

```
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

would render this lovely chart:

![Example 1](http://www.sveido.com/mermaid/img/ex1.png)

A page with a live example can be seen [here](http://www.sveido.com/mermaid/demo/html/web.html). You can also look at mermaid in action using [jsbin](http://jsbin.com/faxunexeku/1/edit?html,output).
#Installation

Either use the bower package manager as per below:

```
bower install mermaid --save-dev
```

Or download javascript files:

* [mermaid including dependencies](http://www.sveido.com/mermaid/dist/mermaid.full.min.js)

This file bundles mermaid with d3 and dagre-d3.

* [mermaid without dependencies](http://www.sveido.com/mermaid/dist/mermaid.slim.min.js)

With this file you will need to include d3 and dagre-d3 yourself.

# Usage

Include mermaid on your web page:

```
<script src="mermaid.full.min.js"></script>
```

Further down on your page mermaid will look for tags with ```class="mermaid"```. From these tags mermaid will try to
read the chart definiton which will be replaced with the svg chart.


A chart defined like this:
```
<div class="mermaid">
    CHART DEFINITION GOES HERE
</div>
```

Would end up like this:
```
<div class="mermaid" id="mermaidChart0">
    <svg>
        Chart ends up here
    </svg>
</div>
```
An id is also added to mermaid tags without id.


# A graph example

```
graph LR;
    A[Hard edge]-->|Link text|B(Round edge);
    B-->C{Decision};
    C-->|One|D[Result one];
    C-->|Two|E[Result two];
```

![Example 2](http://www.sveido.com/mermaid/img/ex2.png)


#Syntax
## Graph
This statement declares a new graph and the direction of the graph layout.

```
graph TD
```

This declares a graph oriented from top to bottom.

![Example 3](http://www.sveido.com/mermaid/img/ex3.png)

```
graph LR
```

This declares a graph oriented from left to right.

Possible directions are:

* TB - top bottom
* BT - bottom top
* RL - right left
* LR - left right
* TD - same as TB

![Example 4](http://www.sveido.com/mermaid/img/ex4.png)

## Nodes

### A node (default)
```
id1;
```

![Single node](http://www.sveido.com/mermaid/img/ex5.png)

Note that the id is what is displayed in the box.

### A node with text
It is also possible to set text in the box that differs from the id. If this is done several times, it is the last text
found for the node that will be used. Also if you define edges for the node later on, you can omit text definitions. The
one previously defined will be used when rendering the box.

```
id1[This is the text in the box];
```

![Text in node](http://www.sveido.com/mermaid/img/ex6.png)


### A node with round edges
```
id1(This is the text in the box);
```

![Node with round edges](http://www.sveido.com/mermaid/img/ex7.png)

### A node in the form of a circle
```
id1((This is the text in the box));
```

![Node with round edges](http://www.sveido.com/mermaid/img/ex12.png)

### A node in an asymetric shape
```
id1>This is the text in the box];
```

![Node with round edges](http://www.sveido.com/mermaid/img/ex13.png)


### A node (rhombus)
```
id1{This is the text in the box};
```

![Decision box](http://www.sveido.com/mermaid/img/ex8.png)

### Styling a node
It is possible to apply specific styles such as a thicker border or a different background color to a node.

```
graph LR;
    id1(Start)-->id2(Stop);
    style id1 fill:#f9f,stroke:#333,stroke-width:4px;
    style id2 fill:#ccf,stroke:#f66,stroke-width:2px,stroke-dasharray: 5, 5;
```

![Node with styles](http://www.sveido.com/mermaid/img/ex9.png)

#### Classes
More convenient then defining the style everytime is to define a class of styles and attach this class to the nodes that
should have a different look.

a class definition looks like the example below:

```
    classDef className fill:#f9f,stroke:#333,stroke-width:4px;
```

Attachment of a  class to a node is done as per below:

```
    class nodeId1 className;
```

It is also possible to attach a class to a list of nodes in one statement:

```
    class nodeId1,nodeId2 className;
```

#### Default class

If a class is named default it will be assigned to all classes without specific class definitions.

```
    classDef default fill:#f9f,stroke:#333,stroke-width:4px;
```


## Links between nodes

Nodes can be connected with links/edges. It is possible to have different types of links or attach a text string to a link.

### A link with arrow head
```
A-->B;
```

![Link with arrowhead](http://www.sveido.com/mermaid/img/ex4.png)

### An open link

```
A---B;
```

![Open link](http://www.sveido.com/mermaid/img/ex10.png)

### Text on links

```
A---|This is the text|B;
```

![Text on links](http://www.sveido.com/mermaid/img/ex11.png)

### Styling links
It is possible to style links for instance a link that is going back in the flow. This is done by the linkStyle statement as in the example below:

```
linkStyle 3 stroke:#ff3,stroke-width:4px;
```

## Interaction

It is possible to bind a click event to a node:

```
click nodeId callback
```

* nodeId is the id of the node
* callback is the name of a javascript function defined on the page displaying the graph, the function will be called with the nodeId as parameter.

## Usage of the parser as a seperate module

### Setup
```
var graph = require('./graphDb');
var flow = require('./parser/flow');
flow.parser.yy = graph;
```

### Parsing

```
flow.parser.parse(text);
```

### Data extraction
```
graph.getDirection();
graph.getVertices();
graph.getEdges();
```

The parser is also exposed in the mermaid api by calling:
```
var parser = mermaid.getParser();
```
Note that the parse needs a graph object to store the data as per:
```
flow.parser.yy = graph;
```

Look at graphDb.js for more details on that object.
# Credits
Many thanks to the [d3](http://d3js.org/) and [dagre-d3](https://github.com/cpettitt/dagre-d3) projects for providing the graphical layout and drawing libraries! Thanks also to the [js-sequence-diagram](http://bramp.github.io/js-sequence-diagrams) project for usage of the grammar for the sequence diagrams.
