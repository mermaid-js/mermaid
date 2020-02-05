# Flowcharts - Basic Syntax

## Graph

This statement declares a new graph and the direction of the graph layout.

This declares a graph oriented from top to bottom (`TD` or `TB`).

```
graph TD
    Start --> Stop
```
```mermaid
graph TD
    Start --> Stop
```

This declares a graph oriented from left to right (`LR`).

```
graph LR
    Start --> Stop
```
```mermaid
graph LR
    Start --> Stop
```

Possible directions are:

* TB - top bottom
* BT - bottom top
* RL - right left
* LR - left right

* TD - same as TB


## Nodes & shapes

### A node (default)

```
graph LR
    id
```

```mermaid
graph LR
    id
```
Note that the id is what is displayed in the box.

### A node with text

It is also possible to set text in the box that differs from the id. If this is done several times, it is the last text
found for the node that will be used. Also if you define edges for the node later on, you can omit text definitions. The
one previously defined will be used when rendering the box.

```
graph LR
    id1[This is the text in the box]
```
```mermaid
graph LR
    id1[This is the text in the box]
```


### A node with round edges

```
graph LR
    id1(This is the text in the box)
```
```mermaid
graph LR
    id1(This is the text in the box)
```

### A stadium-shaped node

```
graph LR
    id1([This is the text in the box])
```
```mermaid
graph LR
    id1([This is the text in the box])
```

### A node in a cylindrical shape

```
graph LR
    id1[(Database)]
```
```mermaid
graph LR
    id1[(Database)]
```

### A node in the form of a circle

```
graph LR
    id1((This is the text in the circle))
```
```mermaid
graph LR
    id1((This is the text in the circle))
```

### A node in an asymetric shape

```
graph LR
    id1>This is the text in the box]
```
```mermaid
graph LR
    id1>This is the text in the box]
```
Currently only the shape above is possible and not its mirror. *This might change with future releases.*

### A node (rhombus)

```
graph LR
    id1{This is the text in the box}
```
```mermaid
graph LR
    id1{This is the text in the box}
```

### A hexagon node

```
graph LR
    id1{{This is the text in the box}}
```
```mermaid
graph LR
    id1{{This is the text in the box}}
```

### Parallelogram

```
graph TD
    id1[/This is the text in the box/]
```
```mermaid
graph TD
    id1[/This is the text in the box/]
```

### Parallelogram alt

```
graph TD
    id1[\This is the text in the box\]
```
```mermaid
graph TD
    id1[\This is the text in the box\]
```

### Trapezoid

```
graph TD
    A[/Christmas\]
```
```mermaid
graph TD
    A[/Christmas\]
```
### Trapezoid alt

```
graph TD
    B[\Go shopping/]
```
```mermaid
graph TD
    B[\Go shopping/]
```

## Links between nodes

Nodes can be connected with links/edges. It is possible to have different types of links or attach a text string to a link.

### A link with arrow head

```
graph LR
    A-->B
```
```mermaid
graph LR
    A-->B
```

### An open link

```
graph LR
    A --- B
```
```mermaid
graph LR
    A --- B
```

### Text on links

```
graph LR
    A-- This is the text ---B
```
```mermaid
graph LR
    A-- This is the text ---B
```

or

```
graph LR
    A---|This is the text|B
```
```mermaid
graph LR
    A---|This is the text|B
```

### A link with arrow head and text

```
graph LR
    A-->|text|B
```
```mermaid
graph LR
    A-->|text|B
```

or

```
graph LR
    A-- text -->B
```
```mermaid
graph LR
    A-- text -->B
```

### Dotted link

```
graph LR;
   A-.->B;
```
```mermaid
graph LR;
   A-.->B;
```

### Dotted link with text

```
graph LR
   A-. text .-> B
```
```mermaid
graph LR
   A-. text .-> B
```

### Thick link

```
graph LR
   A ==> B
```
```mermaid
graph LR
   A ==> B
```

### Thick link with text

```
graph LR
   A == text ==> B
```
```mermaid
graph LR
   A == text ==> B
```

### Chaining of links

It is possible declare many links in the same line as per below:
```
graph LR
   A -- text --> B -- text2 --> C
```
```mermaid
graph LR
   A -- text --> B -- text2 --> C
```

It is also possible to declare multiple nodes links in the same line as per below:
```
graph LR
   a --> b & c--> d
```
```mermaid
graph LR
   a --> b & c--> d
```

You can then describe dependencies in a very expressive way. Like the onliner below:
```
graph TB
    A & B--> C & D
```
```mermaid
graph TB
    A & B--> C & D
```
If you describe the same diagram using the the basic syntax, it will take four lines. A
word of warning, one could go overboard with this making the graph harder to read in
markdown form. The Swedish word `lagom` comes to mind. It means, not to much and not to little.
This goes for expressive syntaxes as well.
```
graph TB
    A --> C
    A --> D
    B --> C
    B --> D
```


## Special characters that break syntax

It is possible to put text within quotes in order to render more troublesome characters. As in the example below:

```
graph LR
    id1["This is the (text) in the box"]
```
```mermaid
graph LR
    id1["This is the (text) in the box"]
```

### Entity codes to escape characters

It is possible to escape characters using the syntax examplified here.

```
    graph LR
        A["A double quote:#quot;"] -->B["A dec char:#9829;"]
```
```mermaid
    graph LR
        A["A double quote:#quot;"] -->B["A dec char:#9829;"]
```

## Subgraphs

```
subgraph title
    graph definition
end
```

An example below:

```
graph TB
    c1-->a2
    subgraph one
    a1-->a2
    end
    subgraph two
    b1-->b2
    end
    subgraph three
    c1-->c2
    end
 ```
```mermaid
graph TB
    c1-->a2
    subgraph one
    a1-->a2
    end
    subgraph two
    b1-->b2
    end
    subgraph three
    c1-->c2
    end
 ```


## Interaction

It is possible to bind a click event to a node, the click can lead to either a javascript callback or to a link which will be opened in a new browser tab. **Note**: This functionality is disabled when using `securityLevel='strict'` and enabled when using `securityLevel='loose'`.

```
click nodeId callback
```

* nodeId is the id of the node
* callback is the name of a javascript function defined on the page displaying the graph, the function will be called with the nodeId as parameter.

Examples of tooltip usage below:

```
<script>
    var callback = function(){
        alert('A callback was triggered');
    }
<script>
```

```
graph LR;
    A-->B;
    click A callback "Tooltip for a callback"
    click B "http://www.github.com" "This is a tooltip for a link"
```

The tooltip text is surrounded in double quotes. The styles of the tooltip are set by the class .mermaidTooltip.

```mermaid
graph LR;
    A-->B;
    click A callback "Tooltip"
    click B "http://www.github.com" "This is a link"
```
> **Success** The tooltip functionality and the ability to link to urls are available from version 0.5.2.

Beginners tip, a full example using interactive links in a html context:
```
<body>
  <div class="mermaid">
    graph LR;
    	A-->B;
    	click A callback "Tooltip"
    	click B "http://www.github.com" "This is a link"
  </div>

  <script>
  	var callback = function(){
        alert('A callback was triggered');
    }
    var config = {
      startOnLoad:true,
      flowchart:{
        useMaxWidth:true,
        htmlLabels:true,
        curve:'cardinal',
      },
      securityLevel:'loose',
    };

    mermaid.initialize(config);
  </script>
</body>
```

### Comments

Comments can be entered within a flow diagram, which will be ignored by the parser.  Comments need to be on their own line, and must be prefaced with `%%` (double percent signs). Any text after the start of the comment to the next newline will be treated as a comment, including any flow syntax

```
graph LR
%% this is a comment A -- text --> B{node}
   A -- text --> B -- text2 --> C
```

## Styling and classes

### Styling links

It is possible to style links. For instance you might want to style a link that is going backwards in the flow. As links
have no ids in the same way as nodes, some other way of deciding what style the links should be attached to is required.
Instead of ids, the order number of when the link was defined in the graph is used. In the example below the style
defined in the linkStyle statement will belong to the fourth link in the graph:

```
linkStyle 3 stroke:#ff3,stroke-width:4px,color:red;
```


### Styling a node

It is possible to apply specific styles such as a thicker border or a different background color to a node.

```
graph LR
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px
    style id2 fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5, 5
```
```mermaid
graph LR
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px
    style id2 fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5, 5
```


#### Classes

More convenient then defining the style every time is to define a class of styles and attach this class to the nodes that
should have a different look.

a class definition looks like the example below:


```
    classDef className fill:#f9f,stroke:#333,stroke-width:4px;
```

Attachment of a class to a node is done as per below:

```
    class nodeId1 className;
```

It is also possible to attach a class to a list of nodes in one statement:

```
    class nodeId1,nodeId2 className;
```

A shorter form of adding a class is to attach the classname to the node using the `:::`operator as per below:

```
graph LR
    A:::someclass --> B
    classDef someclass fill:#f96;
```
```mermaid
graph LR
    A:::someclass --> B
    classDef someclass fill:#f96;
```


### Css classes

It is also possible to predefine classes in css styles that can be applied from the graph definition as in the example
below:

**Example style**

```html
<style>
    .cssClass > rect{
        fill:#FF0000;
        stroke:#FFFF00;
        stroke-width:4px;
    }
</style>
```

**Example definition**

```
graph LR;
    A-->B[AAA<span>BBB</span>];
    B-->D;
    class A cssClass;
```
```mermaid
graph LR;
    A-->B[AAA<span>BBB</span>];
    B-->D;
    class A cssClass;
```


### Default class

If a class is named default it will be assigned to all classes without specific class definitions.

```
    classDef default fill:#f9f,stroke:#333,stroke-width:4px;
```


## Basic support for fontawesome

It is possible to add icons from fontawesome.

The icons are acessed via the syntax fa:#icon class name#.

```
graph TD
    B["fa:fa-twitter for peace"]
    B-->C[fa:fa-ban forbidden]
    B-->D(fa:fa-spinner);
    B-->E(A fa:fa-camera-retro perhaps?);
```
```mermaid
graph TD
    B["fa:fa-twitter for peace"]
    B-->C[fa:fa-ban forbidden]
    B-->D(fa:fa-spinner);
    B-->E(A fa:fa-camera-retro perhaps?);
```


## Graph declarations with spaces between vertices and link and without semicolon

* In graph declarations, the statements also can now end without a semicolon. After release 0.2.16, ending a graph statement with semicolon is just optional. So the below graph declaration is also valid along with the old declarations of the graph.

* A single space is allowed between vertices and the link. However there should not be any space between a vertex and its text and a link and its text. The old syntax of graph declaration will also work and hence this new feature is optional and is introduce to improve readability.

Below is the new declaration of the graph edges which is also valid along with the old declaration of the graph edges.

```
graph LR
    A[Hard edge] -->|Link text| B(Round edge)
    B --> C{Decision}
    C -->|One| D[Result one]
    C -->|Two| E[Result two]
```

```mermaid
graph LR
    A[Hard edge] -->|Link text| B(Round edge)
    B --> C{Decision}
    C -->|One| D[Result one]
    C -->|Two| E[Result two]
```


## Configuration...

Is it possible to adjust the width of the rendered flowchart.

This is done by defining **mermaid.flowchartConfig** or by the CLI to use a json file with the configuration. How to use
the CLI is described in the mermaidCLI page.
mermaid.flowchartConfig can be set to a JSON string with config parameters or the corresponding object.

```javascript
mermaid.flowchartConfig = {
    width: 100%
}
```
