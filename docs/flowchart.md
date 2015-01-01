---
title: Flowchart Basic Syntax
order: 2
---

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
%% Example code
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
id1
```
```
graph LR
    id1
```
Note that the id is what is displayed in the box.

### A node with text
It is also possible to set text in the box that differs from the id. If this is done several times, it is the last text
found for the node that will be used. Also if you define edges for the node later on, you can omit text definitions. The
one previously defined will be used when rendering the box.

```
id1[This is the text in the box]
```

```
graph LR
    id1[This is the text in the box]
```


### A node with round edges
```
id1(This is the text in the box);
```

```
graph LR
    id1(This is the text in the box)
```

### A node in the form of a circle
```
    id1((This is the text in the circle));
```

```
graph LR
    id1((This is the text in the circle))
```

### A node in an asymetric shape
```
    id1>This is the text in the box]
```

```
graph LR
    id1>This is the text in the box]
```

### A node (rhombus)
```
    id1{This is the text in the box}
```

```
graph LR
    id1{This is the text in the box}
```

## Links between nodes

Nodes can be connected with links/edges. It is possible to have different types of links or attach a text string to a link.

### A link with arrow head
```
A-->B
```
```
graph LR;
    A-->B
```

### An open link

```
A --- B
```

```
graph LR;
    A --- B
```

### Text on links

```
A-- This is the text -- B
```
or
```
A---|This is the text|B;
```

```
graph LR;
   A---|This is the text|B;
```

## Interaction

It is possible to bind a click event to a node:

```
click nodeId callback
```

* nodeId is the id of the node
* callback is the name of a javascript function defined on the page displaying the graph, the function will be called with the nodeId as parameter.
## Styling and classes

### Styling links
It is possible to style links, for instance you might want to style a link that is going backwards in the flow. As links
has no ids in the same way as nodes, some other way of deciding what link the style should be attached to is required.
Instead of ids the order number of when the link was defined in the graph is used. In the example below the style
defined in the linkStyle statement will belong to the fourth link in the graph:

```
linkStyle 3 stroke:#ff3,stroke-width:4px;
```

### Styling a node
It is possible to apply specific styles such as a thicker border or a different background color to a node.

```
%% Example code
graph LR
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px;
    style id2 fill:#ccf,stroke:#f66,stroke-width:2px,stroke-dasharray: 5, 5;
```
```
graph LR
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px
    style id2 fill:#ccf,stroke:#f66,stroke-width:2px,stroke-dasharray: 5, 5
```

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

## Graph declarations with spaces between vertices and link and without semicolon

* In graph declarations, the statements can now end without a semicolon also. After release 0.2.16, ending a graph statement with semicolon is just optional. So the below graph declaration is also valid along with the old declarations of the graph.

* A single space is allowed between a vertices and the link. However there should not be any space between a vertex and its text and a link and its text. The old syntax of graph declaration will also work and hence this new feature is optional and is introduce to improve readability.

Below is the new declaration of the graph which is also valid along with the old declaration of the graph as described in the graph example on the home wiki page.

```
graph LR
    A[Hard edge] -->|Link text| B(Round edge)
    B --> C{Decision}
    C -->|One| D[Result one]
    C -->|Two| E[Result two]
```
