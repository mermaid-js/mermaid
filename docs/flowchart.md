#Flowcharts - Basic Syntax
## Graph
This statement declares a new graph and the direction of the graph layout.

```
%% Example code
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
%% Example code
graph LR;
    id1(Start)-->id2(Stop);
    style id1 fill:#f9f,stroke:#333,stroke-width:4px;
    style id2 fill:#ccf,stroke:#f66,stroke-width:2px,stroke-dasharray: 5, 5;
```

![Node with styles](http://www.sveido.com/mermaid/img/ex9.png)

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


## Interaction

It is possible to bind a click event to a node:

```
click nodeId callback
```

* nodeId is the id of the node
* callback is the name of a javascript function defined on the page displaying the graph, the function will be called with the nodeId as parameter.

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
