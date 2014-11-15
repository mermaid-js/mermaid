mermaid
=======

Generation of diagram and flowchart from text in a similar manner as markdown.

Ever wanted to simplify documentation and avoid heavy tools like visio when explaining your code?

This is why mermaid was born, a simple markdown-like script language for generating charts from text via javascript.

The code below would render to the image

```
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

would render this lovely chart:
 €€€ IMG €€€

 Format:

#Installation and usage

# A graph example

<pre>
graph LR
    A[Hard edge]-->|Link text|B(Round edge)
    B-->C{Decision}
    C-->D[Result 1]|Option 1
    C-->E[Result 2]|Option 2
</pre>


#Syntax
## Graph
This statement declares a new graph and the direction of the graph layout.

```
graph TD
```
Would declare a graph oriented from top to bottom.

```
graph LR
```

Would declare a graph oriented from left to right.

## Nodes

### A node (default)
```
id1
```


### A node with text
```
id1[This is the text in the box]
```

### A node with round edges
```
id1[This is the text in the box]
```

### A node (rhombus)
```
id1{This is the text in the box}
```

### Styling a node

## Links between nodes

### A link with arrow head
```
A-->B
```

### An open link

```
A---B
```

### Text on links

```
A---B|This is the text
```


# Credits
 Many thanks to the d3 and dagre-d3 projects that is used to graph layout and drawing.